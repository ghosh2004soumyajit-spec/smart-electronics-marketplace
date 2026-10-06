import { query } from '../config/db.js';

export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, pincode, offerCode } = req.body;
    const userId = req.user.id;

    if (!shippingAddress || !pincode) {
      return res.status(400).json({ error: 'Shipping address and pincode are required.' });
    }

    // 1. Verify pincode serviceability — try exact match first, then 3-digit prefix fallback
    const pin = String(pincode).trim();
    let deliveryZone = null;

    // Exact match
    const exactRes = await query('SELECT * FROM delivery_zones WHERE pincode = $1', [pin]);
    if (exactRes.rows.length > 0 && exactRes.rows[0].is_serviceable) {
      deliveryZone = exactRes.rows[0];
    }

    // Prefix fallback: check if any zone starts with the same 3-digit area code
    if (!deliveryZone) {
      const prefix = pin.substring(0, 3);
      const prefixRes = await query(
        "SELECT * FROM delivery_zones WHERE pincode LIKE $1 AND is_serviceable = TRUE LIMIT 1",
        [`${prefix}%`]
      );
      if (prefixRes.rows.length > 0) {
        deliveryZone = prefixRes.rows[0];
      }
    }

    // If still not found, default to FREE delivery (don't block the order)
    if (!deliveryZone) {
      deliveryZone = { delivery_charge: '0.00', city: shippingAddress.city || '', state: shippingAddress.state || '', is_serviceable: true };
    }

    const deliveryCharge = parseFloat(deliveryZone.delivery_charge);

    // 2. Fetch User Cart Items
    const cartRes = await query(
      `SELECT ci.quantity, p.id as product_id, p.title, p.base_price, p.discount_price,
              COALESCE(p.discount_price, p.base_price) as unit_price, i.stock_quantity
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       JOIN products p ON ci.product_id = p.id
       JOIN inventory i ON p.id = i.product_id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (cartRes.rows.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Add products before placing an order.' });
    }

    const items = cartRes.rows;

    // 3. Verify stock for each item
    for (const item of items) {
      if (item.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${item.title}". Only ${item.stock_quantity} unit(s) available.`,
        });
      }
    }

    // 4. Calculate Totals
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.unit_price) * item.quantity, 0);

    // 5. Apply Offer Code if provided
    let discountAmount = 0;
    if (offerCode) {
      const offerRes = await query(
        'SELECT * FROM offers WHERE code = $1 AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())',
        [offerCode.trim().toUpperCase()]
      );
      if (offerRes.rows.length > 0) {
        const offer = offerRes.rows[0];
        if (subtotal >= parseFloat(offer.min_order_amount)) {
          const rawDiscount = (subtotal * parseFloat(offer.discount_percent)) / 100;
          discountAmount = offer.max_discount ? Math.min(rawDiscount, parseFloat(offer.max_discount)) : rawDiscount;
        }
      }
    }

    const finalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Deduct inventory atomically using UPDATE ... WHERE stock_quantity >= $1
    const deductedItems = [];
    let failedItem = null;

    for (const item of items) {
      const deductRes = await query(
        `UPDATE inventory
         SET stock_quantity = stock_quantity - $1, updated_at = NOW()
         WHERE product_id = $2 AND stock_quantity >= $1
         RETURNING stock_quantity`,
        [item.quantity, item.product_id]
      );

      if (deductRes.rowCount === 0) {
        failedItem = item;
        break;
      }

      deductedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        title: item.title,
      });
    }

    // If any item's deduction returns 0 rows (insufficient stock), rollback all previously deducted items and return HTTP 400
    if (failedItem) {
      for (const d of deductedItems) {
        await query(
          'UPDATE inventory SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE product_id = $2',
          [d.quantity, d.product_id]
        );
      }
      return res.status(400).json({
        error: `Insufficient stock for "${failedItem.title}". Inventory changed during checkout. Please review your cart.`,
      });
    }

    // 7. Create Order
    let orderRes;
    try {
      orderRes = await query(
        `INSERT INTO orders
          (order_number, user_id, shipping_address, total_amount, discount_amount, delivery_charge, final_amount, order_status, payment_status, pincode, offer_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', 'PAID', $8, $9)
         RETURNING *`,
        [
          orderNumber,
          userId,
          JSON.stringify(shippingAddress),
          subtotal,
          discountAmount,
          deliveryCharge,
          finalAmount,
          pin,
          offerCode || null,
        ]
      );
    } catch (orderInsertErr) {
      for (const d of deductedItems) {
        await query(
          'UPDATE inventory SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE product_id = $2',
          [d.quantity, d.product_id]
        );
      }
      throw orderInsertErr;
    }

    const order = orderRes.rows[0];

    // 8. Insert order items & clear cart
    try {
      for (const item of items) {
        await query(
          `INSERT INTO order_items (order_id, product_id, title, price, quantity) VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.title, item.unit_price, item.quantity]
        );
      }

      await query(
        `DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
        [userId]
      );
    } catch (itemsErr) {
      await query('DELETE FROM orders WHERE id = $1', [order.id]);
      for (const d of deductedItems) {
        await query(
          'UPDATE inventory SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE product_id = $2',
          [d.quantity, d.product_id]
        );
      }
      throw itemsErr;
    }

    res.status(201).json({
      message: 'Order placed successfully.',
      order,
    });
  } catch (err) {
    console.error('Create order error:', err.message || err);
    res.status(500).json({ error: 'Failed to process order.', detail: err.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)::int as item_count,
              (SELECT pi.image_url FROM order_items oi 
               JOIN product_images pi ON oi.product_id = pi.product_id AND pi.is_primary = TRUE 
               WHERE oi.order_id = o.id LIMIT 1) as first_item_image
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user orders.' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const isId = !isNaN(id);
    const orderRes = await query(
      `SELECT * FROM orders WHERE ${isId ? 'id = $1' : 'order_number = $1'} AND (user_id = $2 OR $3 = 'ADMIN')`,
      [id, userId, req.user.role]
    );

    if (orderRes.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    const itemsRes = await query(
      `SELECT oi.*, p.slug, pi.image_url as primary_image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
       WHERE oi.order_id = $1`,
      [order.id]
    );

    order.items = itemsRes.rows;
    res.json(order);
  } catch (err) {
    console.error('Get order by id error:', err);
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Detect integer ID vs order_number string
    const isId = /^\d+$/.test(String(id).trim());
    const queryParamId = isId ? parseInt(id, 10) : String(id).trim();

    // Atomically transition order status
    const updateRes = await query(
      `UPDATE orders
       SET order_status = 'CANCELLED', updated_at = NOW()
       WHERE (${isId ? 'id = $1' : 'order_number = $1'})
         AND (user_id = $2 OR $3 = 'ADMIN')
         AND order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING')
       RETURNING id, order_number, order_status`,
      [queryParamId, userId, userRole]
    );

    // If updateRes.rowCount === 0: check whether order doesn't exist (404) or is already cancelled / non-cancellable (400). DO NOT RESTOCK INVENTORY!
    if (updateRes.rowCount === 0) {
      const existingRes = await query(
        `SELECT id, order_number, order_status
         FROM orders
         WHERE (${isId ? 'id = $1' : 'order_number = $1'})
           AND (user_id = $2 OR $3 = 'ADMIN')`,
        [queryParamId, userId, userRole]
      );

      if (existingRes.rowCount === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      const currentStatus = existingRes.rows[0].order_status;
      return res.status(400).json({
        error: `Cannot cancel an order that is already ${currentStatus}.`,
        order_status: currentStatus,
        order_number: existingRes.rows[0].order_number,
      });
    }

    // Update succeeded: query order_items using canonical integer cancelledOrder.id, and restock each item
    const cancelledOrder = updateRes.rows[0];
    const itemsRes = await query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [cancelledOrder.id]
    );

    for (const item of itemsRes.rows) {
      await query(
        'UPDATE inventory SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    return res.json({
      message: 'Order has been successfully cancelled.',
      order: cancelledOrder,
    });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
};
