import { query } from '../config/db.js';

const getOrCreateWishlistId = async (userId) => {
  let res = await query('SELECT id FROM wishlists WHERE user_id = $1', [userId]);
  if (res.rowCount === 0) {
    res = await query('INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id', [userId]);
  }
  return res.rows[0].id;
};

export const getWishlist = async (req, res) => {
  try {
    const wishlistId = await getOrCreateWishlistId(req.user.id);
    const result = await query(
      `SELECT 
        wi.id as item_id,
        p.id as product_id,
        p.title,
        p.slug,
        p.base_price,
        p.discount_price,
        pi.image_url as primary_image,
        i.stock_quantity
       FROM wishlist_items wi
       JOIN products p ON wi.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE wi.wishlist_id = $1
       ORDER BY wi.created_at DESC`,
      [wishlistId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist.' });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required.' });

    const wishlistId = await getOrCreateWishlistId(req.user.id);

    await query(
      `INSERT INTO wishlist_items (wishlist_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (wishlist_id, product_id) DO NOTHING`,
      [wishlistId, productId]
    );

    getWishlist(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item to wishlist.' });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlistId = await getOrCreateWishlistId(req.user.id);

    await query('DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2', [wishlistId, productId]);

    getWishlist(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item from wishlist.' });
  }
};
