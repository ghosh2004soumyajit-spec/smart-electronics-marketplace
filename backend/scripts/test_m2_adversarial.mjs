import { query } from '../config/db.js';
import { addToCart, getCart, updateCartItem, removeCartItem } from '../controllers/cartController.js';
import { createOrder, cancelOrder, getOrderById } from '../controllers/orderController.js';

// Helper to create mock Express response object
function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

// User mocks
const userCustomer = { id: 2, role: 'CUSTOMER', email: 'john.doe@example.com' };
const userAdmin = { id: 1, role: 'ADMIN', email: 'admin@electronics.com' };

async function runAdversarialTests() {
  console.log('================================================================');
  console.log('  MILESTONE 2: ADVERSARIAL STRESS TEST HARNESS');
  console.log('  Target: Backend Concurrency, Inventory & Security Hardening');
  console.log('================================================================\n');

  let testCount = 0;
  let passCount = 0;
  let failCount = 0;
  const failures = [];

  function assert(condition, testName, details = '') {
    testCount++;
    if (condition) {
      passCount++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      failCount++;
      const msg = `❌ [FAIL] ${testName}${details ? ' - ' + details : ''}`;
      console.error(`  ${msg}`);
      failures.push(msg);
    }
  }

  try {
    // Clean up customer cart before starting
    const userCartRes = await query('SELECT id FROM carts WHERE user_id = $1', [userCustomer.id]);
    if (userCartRes.rowCount > 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1', [userCartRes.rows[0].id]);
    }

    // =========================================================================
    // GROUP 1: CART CUMULATIVE STOCK ADDITION
    // =========================================================================
    console.log('\n--- GROUP 1: CART CUMULATIVE STOCK ADDITION ---');

    // Pick a test product (Product ID 6: stock is 9 in seed)
    const p6Res = await query('SELECT stock_quantity FROM inventory WHERE product_id = 6');
    const p6Stock = p6Res.rows[0].stock_quantity;
    console.log(`Test Product ID 6 current stock: ${p6Stock}`);

    // 1.1 Add initial quantity (e.g. 5 <= p6Stock)
    {
      const req = { user: userCustomer, body: { productId: 6, quantity: 5 } };
      const res = mockRes();
      await addToCart(req, res);
      assert(res.statusCode === 200, '1.1 Add valid quantity (5 <= stock) succeeds with 200');
      const item = res.body?.items?.find(i => i.product_id === 6);
      assert(item?.quantity === 5, '1.1 Cart contains exactly 5 units', `Got: ${item?.quantity}`);
    }

    // 1.2 Attempt adding quantity that causes existing + new > stock (5 + 5 = 10 > 9)
    {
      const req = { user: userCustomer, body: { productId: 6, quantity: 5 } };
      const res = mockRes();
      await addToCart(req, res);
      assert(res.statusCode === 400, '1.2 Cumulative addition (5 + 5 > 9) rejected with HTTP 400', `Status: ${res.statusCode}`);
      assert(res.body?.error === 'Requested quantity exceeds available stock.', '1.2 Correct error message returned');
      assert(res.body?.stock === p6Stock, '1.2 Error payload includes accurate stock count');
      assert(res.body?.currentInCart === 5, '1.2 Error payload indicates currentInCart = 5');

      // Verify cart quantity was NOT modified
      const reqCheck = { user: userCustomer };
      const resCheck = mockRes();
      await getCart(reqCheck, resCheck);
      const item = resCheck.body?.items?.find(i => i.product_id === 6);
      assert(item?.quantity === 5, '1.2 Cart quantity remains unchanged at 5 after rejected addition');
    }

    // 1.3 Boundary case: Add exact remaining stock (9 - 5 = 4)
    {
      const req = { user: userCustomer, body: { productId: 6, quantity: p6Stock - 5 } };
      const res = mockRes();
      await addToCart(req, res);
      assert(res.statusCode === 200, '1.3 Add exact remaining stock (5 + 4 = 9) succeeds with 200');
      const item = res.body?.items?.find(i => i.product_id === 6);
      assert(item?.quantity === p6Stock, '1.3 Cart now contains maximum possible stock (9 units)');
    }

    // 1.4 Overflow on full cart: Add 1 more when cart is already at maximum stock (9 + 1 > 9)
    {
      const req = { user: userCustomer, body: { productId: 6, quantity: 1 } };
      const res = mockRes();
      await addToCart(req, res);
      assert(res.statusCode === 400, '1.4 Adding 1 unit to already full cart rejected with HTTP 400');
      assert(res.body?.currentInCart === p6Stock, '1.4 Rejection payload reports currentInCart = 9');
    }

    // 1.5 Invalid quantities: zero, negative, string
    {
      const reqZero = { user: userCustomer, body: { productId: 6, quantity: 0 } };
      const resZero = mockRes();
      await addToCart(reqZero, resZero);
      assert(resZero.statusCode === 400, '1.5a Adding quantity 0 rejected with HTTP 400');

      const reqNeg = { user: userCustomer, body: { productId: 6, quantity: -2 } };
      const resNeg = mockRes();
      await addToCart(reqNeg, resNeg);
      assert(resNeg.statusCode === 400, '1.5b Adding negative quantity rejected with HTTP 400');
    }

    // 1.6 Clean up cart for next tests
    {
      const reqDel = { user: userCustomer, params: { productId: 6 } };
      const resDel = mockRes();
      await removeCartItem(reqDel, resDel);
      assert(resDel.statusCode === 200, '1.6 Removed test item from cart cleanly');
    }

    // =========================================================================
    // GROUP 2: ORDER CANCELLATION IDEMPOTENCY & RESTOCK
    // =========================================================================
    console.log('\n--- GROUP 2: ORDER CANCELLATION IDEMPOTENCY & RESTOCK ---');

    // Pick test product 12 (stock in seed: 11)
    const p12Initial = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 12')).rows[0].stock_quantity;
    console.log(`Test Product ID 12 initial stock: ${p12Initial}`);

    // Create an order with product 12, qty = 3
    const orderQty = 3;
    await addToCart({ user: userCustomer, body: { productId: 12, quantity: orderQty } }, mockRes());

    const orderReq = {
      user: userCustomer,
      body: {
        shippingAddress: { city: 'Bengaluru', street: '123 MG Road', state: 'Karnataka' },
        pincode: '560001'
      }
    };
    const orderRes = mockRes();
    await createOrder(orderReq, orderRes);
    assert(orderRes.statusCode === 201, '2.1 Create order succeeds with HTTP 201');

    const createdOrder = orderRes.body?.order;
    const orderNum = createdOrder?.order_number;
    const orderId = createdOrder?.id;
    console.log(`Created Order ID: ${orderId}, Order Number: ${orderNum}`);

    // Verify stock was deducted: p12Initial - orderQty
    const p12AfterOrder = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 12')).rows[0].stock_quantity;
    assert(p12AfterOrder === p12Initial - orderQty, `2.2 Inventory deducted after order creation: ${p12AfterOrder} === ${p12Initial - orderQty}`);

    // 2.3 Cancel order FIRST time using alphanumeric order_number (e.g. ORD-...)
    {
      const cancelReq = { user: userCustomer, params: { id: orderNum } };
      const cancelRes = mockRes();
      await cancelOrder(cancelReq, cancelRes);
      assert(cancelRes.statusCode === 200, '2.3 First cancel via order_number string succeeds with HTTP 200');
      assert(cancelRes.body?.order?.order_status === 'CANCELLED', '2.3 Returned status is CANCELLED');

      // Verify stock was restocked: must be back to p12Initial
      const p12AfterFirstCancel = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 12')).rows[0].stock_quantity;
      assert(p12AfterFirstCancel === p12Initial, `2.3 Inventory restocked after first cancel: ${p12AfterFirstCancel} === ${p12Initial}`);
    }

    // 2.4 Cancel order SECOND time using alphanumeric order_number: MUST RETURN 400 AND NOT RESTOCK!
    {
      const cancelReq2 = { user: userCustomer, params: { id: orderNum } };
      const cancelRes2 = mockRes();
      await cancelOrder(cancelReq2, cancelRes2);
      assert(cancelRes2.statusCode === 400, '2.4 Second cancel via order_number rejected with HTTP 400', `Status: ${cancelRes2.statusCode}`);
      assert(cancelRes2.body?.error?.includes('already CANCELLED'), '2.4 Error message notes order is already CANCELLED');

      // Verify inventory was NOT restocked a second time!
      const p12AfterSecondCancel = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 12')).rows[0].stock_quantity;
      assert(p12AfterSecondCancel === p12Initial, `2.4 Inventory NOT restocked on second cancel: ${p12AfterSecondCancel} === ${p12Initial}`);
    }

    // 2.5 Cancel order THIRD time using numeric ID: MUST ALSO RETURN 400 AND NOT RESTOCK!
    {
      const cancelReq3 = { user: userCustomer, params: { id: String(orderId) } };
      const cancelRes3 = mockRes();
      await cancelOrder(cancelReq3, cancelRes3);
      assert(cancelRes3.statusCode === 400, '2.5 Third cancel via numeric ID rejected with HTTP 400');

      const p12AfterThirdCancel = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 12')).rows[0].stock_quantity;
      assert(p12AfterThirdCancel === p12Initial, `2.5 Inventory unchanged after third cancel attempt: ${p12AfterThirdCancel} === ${p12Initial}`);
    }

    // 2.6 Test cancelling a fresh order via numeric ID first, then numeric ID second
    {
      await addToCart({ user: userCustomer, body: { productId: 12, quantity: 2 } }, mockRes());
      const resO2 = mockRes();
      await createOrder(orderReq, resO2);
      const o2Id = resO2.body?.order?.id;

      // 1st cancel with numeric ID
      const resC1 = mockRes();
      await cancelOrder({ user: userCustomer, params: { id: String(o2Id) } }, resC1);
      assert(resC1.statusCode === 200, '2.6a First cancel via numeric ID succeeds with HTTP 200');

      // 2nd cancel with numeric ID
      const resC2 = mockRes();
      await cancelOrder({ user: userCustomer, params: { id: String(o2Id) } }, resC2);
      assert(resC2.statusCode === 400, '2.6b Second cancel via numeric ID rejected with HTTP 400');
    }

    // 2.7 Cancel non-existent order
    {
      const nonExistentReq = { user: userCustomer, params: { id: 'ORD-9999-NONEXISTENT' } };
      const nonExistentRes = mockRes();
      await cancelOrder(nonExistentReq, nonExistentRes);
      assert(nonExistentRes.statusCode === 404, '2.7 Cancelling non-existent order returns HTTP 404');
    }

    // =========================================================================
    // GROUP 3: CHECKOUT INVENTORY ATOMIC DEDUCTION & ROLLBACK
    // =========================================================================
    console.log('\n--- GROUP 3: CHECKOUT INVENTORY ATOMIC DEDUCTION & ROLLBACK ---');

    // 3.1 Sufficient stock checkout: Stock is deducted properly
    {
      const p13Initial = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 13')).rows[0].stock_quantity;
      console.log(`Product ID 13 initial stock: ${p13Initial}`);

      // Add 2 units
      await addToCart({ user: userCustomer, body: { productId: 13, quantity: 2 } }, mockRes());
      const coRes = mockRes();
      await createOrder({
        user: userCustomer,
        body: { shippingAddress: { city: 'Mumbai', street: 'Marine Lines', state: 'Maharashtra' }, pincode: '400001' }
      }, coRes);

      assert(coRes.statusCode === 201, '3.1 Sufficient stock checkout creates order (HTTP 201)');
      const p13After = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 13')).rows[0].stock_quantity;
      assert(p13After === p13Initial - 2, `3.1 Inventory properly deducted by 2 units: ${p13After} === ${p13Initial - 2}`);
    }

    // 3.2 Insufficient stock checkout (e.g. stock is reduced by direct DB or another transaction after adding to cart)
    {
      const p14Initial = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 14')).rows[0].stock_quantity;
      console.log(`Product ID 14 initial stock: ${p14Initial}`);

      // Add 2 units to cart
      await addToCart({ user: userCustomer, body: { productId: 14, quantity: 2 } }, mockRes());

      // Simulate a concurrent purchase: reduce stock in DB to 1
      await query('UPDATE inventory SET stock_quantity = 1 WHERE product_id = 14');

      // Now attempt checkout: user cart has 2, but stock is only 1
      const coRes = mockRes();
      await createOrder({
        user: userCustomer,
        body: { shippingAddress: { city: 'Bengaluru', street: 'Koramangala', state: 'Karnataka' }, pincode: '560001' }
      }, coRes);

      assert(coRes.statusCode === 400, '3.2 Checkout with quantity exceeding current stock rejected with HTTP 400', `Got status ${coRes.statusCode}`);
      assert(coRes.body?.error?.includes('Insufficient stock'), '3.2 Error response specifies Insufficient stock');

      // Verify stock was NOT deducted below zero or changed
      const p14AfterFail = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 14')).rows[0].stock_quantity;
      assert(p14AfterFail === 1, `3.2 Stock untouched on insufficient stock rejection: ${p14AfterFail} === 1`);

      // Restore product 14 stock and clean cart
      await query('UPDATE inventory SET stock_quantity = $1 WHERE product_id = 14', [p14Initial]);
      const cartIdRes = await query('SELECT id FROM carts WHERE user_id = $1', [userCustomer.id]);
      if (cartIdRes.rowCount > 0) {
        await query('DELETE FROM cart_items WHERE cart_id = $1', [cartIdRes.rows[0].id]);
      }
    }

    // 3.3 Multi-item checkout rollback: Item 1 has sufficient stock, Item 2 fails
    {
      console.log('\nTesting multi-item checkout rollback when Item 2 fails...');
      const p1StockInitial = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 1')).rows[0].stock_quantity;
      const p2StockInitial = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 2')).rows[0].stock_quantity;
      console.log(`Item 1 (product 1) initial stock: ${p1StockInitial}`);
      console.log(`Item 2 (product 2) initial stock: ${p2StockInitial}`);

      // Add Item 1 (qty = 2) to cart
      await addToCart({ user: userCustomer, body: { productId: 1, quantity: 2 } }, mockRes());

      // Add Item 2 (qty = 3) to cart
      await addToCart({ user: userCustomer, body: { productId: 2, quantity: 3 } }, mockRes());

      // Now simulate concurrent depletion of Item 2 stock to 1 (less than 3)
      await query('UPDATE inventory SET stock_quantity = 1 WHERE product_id = 2');

      // Attempt checkout
      const multiRes = mockRes();
      await createOrder({
        user: userCustomer,
        body: { shippingAddress: { city: 'Delhi', street: 'Connaught Place', state: 'Delhi' }, pincode: '110001' }
      }, multiRes);

      assert(multiRes.statusCode === 400, '3.3 Multi-item checkout rejected with HTTP 400 when Item 2 stock is insufficient');

      // CRITICAL VERIFICATION: Did Item 1 stock get rolled back to initial value?
      const p1StockAfter = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 1')).rows[0].stock_quantity;
      const p2StockAfter = (await query('SELECT stock_quantity FROM inventory WHERE product_id = 2')).rows[0].stock_quantity;

      assert(p1StockAfter === p1StockInitial, `3.3 Item 1 stock rolled back and restored: ${p1StockAfter} === ${p1StockInitial}`, `Current stock: ${p1StockAfter}, expected: ${p1StockInitial}`);
      assert(p2StockAfter === 1, `3.3 Item 2 stock remains untouched at 1: ${p2StockAfter} === 1`);

      // Restore Item 2 stock
      await query('UPDATE inventory SET stock_quantity = $1 WHERE product_id = 2', [p2StockInitial]);

      // Clean cart
      const cartIdRes = await query('SELECT id FROM carts WHERE user_id = $1', [userCustomer.id]);
      if (cartIdRes.rowCount > 0) {
        await query('DELETE FROM cart_items WHERE cart_id = $1', [cartIdRes.rows[0].id]);
      }
    }

  } catch (err) {
    console.error('Test execution threw an uncaught error:', err);
    failures.push(`Uncaught error: ${err.message}`);
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: Total: ${testCount} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('================================================================');

  if (failCount > 0) {
    console.error('\nFailures encountered:');
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runAdversarialTests();
