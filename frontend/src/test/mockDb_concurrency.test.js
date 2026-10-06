/**
 * Verification test for Milestone 2: MockDb Concurrency & Integrity
 *
 * Verifies:
 * 1. mockDb.addToCart cumulative limit (existing + new <= stock)
 * 2. mockDb.cancelOrder idempotency (no double restock, dual ID lookup)
 * 3. mockDb.createOrder atomic inventory deduction and compensation rollback
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCart,
  addToCart,
  clearCart,
  cancelOrder,
  createOrder,
  resetMockDb,
} from '../services/mockDb.js';
import { products } from '../data/seed.js';

describe('MockDb Concurrency & Integrity', () => {
  beforeEach(async () => {
    resetMockDb();
    await clearCart();
  });

  describe('mockDb.addToCart cumulative limit', () => {
    it('allows adding within available stock, but rejects when cumulative quantity exceeds stock', async () => {
      const prod = products[0]; // e.g. Voltas AC
      const stock = prod.stock;
      expect(stock).toBeGreaterThan(2);

      // Add 2 units
      const cartAfterFirst = await addToCart(prod.id, 2);
      const itemAfterFirst = cartAfterFirst.items.find((i) => i.productId === prod.id);
      expect(itemAfterFirst.quantity).toBe(2);

      // Add remaining available stock minus 1
      const additional = stock - 2;
      const cartAfterSecond = await addToCart(prod.id, additional);
      const itemAfterSecond = cartAfterSecond.items.find((i) => i.productId === prod.id);
      expect(itemAfterSecond.quantity).toBe(stock);

      // Now cart has exactly `stock` units. Adding 1 more MUST be rejected with HTTP 400.
      let caughtErr = null;
      try {
        await addToCart(prod.id, 1);
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).not.toBeNull();
      expect(caughtErr.status).toBe(400);
      expect(caughtErr.response?.data?.error).toMatch(/Requested quantity exceeds available stock/i);
      expect(caughtErr.response?.data?.stock).toBe(stock);
      expect(caughtErr.response?.data?.currentInCart).toBe(stock);

      // Cart quantity must remain unchanged at `stock`
      const cartFinal = await getCart();
      const itemFinal = cartFinal.items.find((i) => i.productId === prod.id);
      expect(itemFinal.quantity).toBe(stock);
    });

    it('rejects invalid quantities (negative, zero, NaN)', async () => {
      const prod = products[0];
      await expect(addToCart(prod.id, 0)).rejects.toThrow(/Quantity must be a positive integer/i);
      await expect(addToCart(prod.id, -5)).rejects.toThrow(/Quantity must be a positive integer/i);
      await expect(addToCart(prod.id, 'abc')).rejects.toThrow(/Quantity must be a positive integer/i);
    });

    it('returns 404 for non-existent product', async () => {
      await expect(addToCart(999999, 1)).rejects.toThrow(/Product not found/i);
    });
  });

  describe('mockDb.cancelOrder idempotency & safety', () => {
    it('cancels order once and restocks inventory; consecutive cancel returns 400 without double restock', async () => {
      const prod = products[0];
      const initialStock = prod.stock;

      // Seed an order with 2 units of prod
      const orderRes = await createOrder({
        items: [{ productId: prod.id, quantity: 2, title: prod.name }],
      });
      const order = orderRes.order;
      const stockAfterOrder = prod.stock;
      expect(stockAfterOrder).toBe(initialStock - 2);

      // 1st Cancellation: must succeed and restore 2 units
      const cancelRes = await cancelOrder(order.id);
      expect(cancelRes.message).toMatch(/Order has been successfully cancelled/i);
      expect(cancelRes.order.order_status).toBe('CANCELLED');
      expect(prod.stock).toBe(initialStock); // Restocked once

      // 2nd Cancellation: must fail with 400 and MUST NOT restock inventory again!
      let caughtErr = null;
      try {
        await cancelOrder(order.id);
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).not.toBeNull();
      expect(caughtErr.status).toBe(400);
      expect(caughtErr.response?.data?.error).toMatch(/Cannot cancel an order that is already CANCELLED/i);

      // Critical check: stock is STILL initialStock, not initialStock + 2
      expect(prod.stock).toBe(initialStock);
    });

    it('supports alphanumeric order_number string lookup for cancellation', async () => {
      const prod = products[1];
      const initialStock = prod.stock;

      const orderRes = await createOrder({
        items: [{ productId: prod.id, quantity: 1, title: prod.name }],
      });
      const orderNumber = orderRes.order.order_number;
      expect(orderNumber).toMatch(/^ORD-/);

      // Cancel using order_number string
      const cancelRes = await cancelOrder(orderNumber);
      expect(cancelRes.order.order_status).toBe('CANCELLED');
      expect(prod.stock).toBe(initialStock);

      // Second cancel with string should also fail idempotently
      await expect(cancelOrder(orderNumber)).rejects.toThrow(/already CANCELLED/i);
      expect(prod.stock).toBe(initialStock);
    });

    it('returns 404 when cancelling non-existent order', async () => {
      await expect(cancelOrder(999999)).rejects.toThrow(/Order not found/i);
      await expect(cancelOrder('ORD-DOES-NOT-EXIST')).rejects.toThrow(/Order not found/i);
    });
  });

  describe('mockDb.createOrder atomic inventory deduction & rollback', () => {
    it('atomically deducts inventory when stock is sufficient', async () => {
      const prodA = products[0];
      const prodB = products[1];
      const stockA = prodA.stock;
      const stockB = prodB.stock;

      const res = await createOrder({
        items: [
          { productId: prodA.id, quantity: 2, title: prodA.name },
          { productId: prodB.id, quantity: 1, title: prodB.name },
        ],
      });

      expect(res.order).toBeDefined();
      expect(prodA.stock).toBe(stockA - 2);
      expect(prodB.stock).toBe(stockB - 1);
    });

    it('rolls back previously deducted items when a later item has insufficient stock', async () => {
      const prodA = products[2];
      const prodB = products[3];
      const originalStockA = prodA.stock;
      const originalStockB = prodB.stock;

      // Request available quantity for prodA, but impossible quantity for prodB
      const impossibleQty = originalStockB + 500;

      let caughtErr = null;
      try {
        await createOrder({
          items: [
            { productId: prodA.id, quantity: 2, title: prodA.name },
            { productId: prodB.id, quantity: impossibleQty, title: prodB.name },
          ],
        });
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).not.toBeNull();
      expect(caughtErr.status).toBe(400);
      expect(caughtErr.response?.data?.error).toMatch(/Insufficient stock/i);

      // INVARIANT: prodA stock must NOT remain decremented! It must be restored!
      expect(prodA.stock).toBe(originalStockA);
      expect(prodB.stock).toBe(originalStockB);
    });

    it('rejects order creation with empty items', async () => {
      await expect(createOrder({ items: [] })).rejects.toThrow(/Your cart is empty/i);
    });
  });
});
