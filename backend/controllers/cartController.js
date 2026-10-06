import { query } from '../config/db.js';

// Helper to ensure user has a cart record
const getOrCreateCartId = async (userId) => {
  let res = await query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (res.rowCount === 0) {
    res = await query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
  }
  return res.rows[0].id;
};

export const getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCartId(req.user.id);
    const result = await query(
      `SELECT 
        ci.id as item_id,
        ci.quantity,
        p.id as product_id,
        p.title,
        p.slug,
        p.base_price,
        p.discount_price,
        COALESCE(p.discount_price, p.base_price) as price,
        pi.image_url as primary_image,
        i.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at ASC`,
      [cartId]
    );

    const items = result.rows;
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    res.json({ items, subtotal });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required.' });

    const addQty = parseInt(quantity, 10);
    if (!Number.isInteger(addQty) || addQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer.' });
    }

    const cartId = await getOrCreateCartId(req.user.id);

    // Check inventory stock
    const invRes = await query('SELECT stock_quantity FROM inventory WHERE product_id = $1', [productId]);
    if (invRes.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const stock = invRes.rows[0]?.stock_quantity || 0;

    // Query existing cart quantity
    const existingItemRes = await query(
      'SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );
    const existingQty = existingItemRes.rows[0]?.quantity || 0;

    if (existingQty + addQty > stock) {
      return res.status(400).json({
        error: 'Requested quantity exceeds available stock.',
        stock,
        currentInCart: existingQty,
      });
    }

    const upsertRes = await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       WHERE cart_items.quantity + EXCLUDED.quantity <= $4
       RETURNING id, quantity`,
      [cartId, productId, addQty, stock]
    );

    if (upsertRes.rowCount === 0) {
      return res.status(400).json({
        error: 'Requested quantity exceeds available stock.',
        stock,
        currentInCart: existingQty,
      });
    }

    return getCart(req, res);
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return removeCartItem(req, res);
    }

    const cartId = await getOrCreateCartId(req.user.id);

    // Check inventory stock
    const invRes = await query('SELECT stock_quantity FROM inventory WHERE product_id = $1', [productId]);
    const stock = invRes.rows[0]?.stock_quantity || 0;
    if (stock < parsedQty) {
      return res.status(400).json({ error: `Only ${stock} units available in stock.`, stock });
    }

    await query(
      'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
      [parsedQty, cartId, productId]
    );

    return getCart(req, res);
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: 'Failed to update cart item.' });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cartId = await getOrCreateCartId(req.user.id);

    await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);

    getCart(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item from cart.' });
  }
};
