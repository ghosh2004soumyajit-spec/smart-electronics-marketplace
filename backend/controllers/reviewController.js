import { query } from '../config/db.js';

export const listProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    let targetProductId = parseInt(productId, 10);

    if (isNaN(targetProductId)) {
      const prodRes = await query('SELECT id FROM products WHERE slug = $1', [productId]);
      if (prodRes.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      targetProductId = prodRes.rows[0].id;
    }

    const result = await query(
      `SELECT r.*, u.full_name as reviewer_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [targetProductId]
    );

    const rows = result.rows || [];
    const total = rows.length;

    let sum = 0;
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const items = rows.map((r) => {
      const rating = Number(r.rating);
      sum += rating;
      if (rating >= 1 && rating <= 5) {
        counts[rating] = (counts[rating] || 0) + 1;
      }

      const userName = r.reviewer_name || r.user_name || 'Verified Buyer';
      const isVerified = r.verified !== undefined ? Boolean(r.verified) : true;

      return {
        id: r.id,
        productId: r.product_id,
        product_id: r.product_id,
        userId: r.user_id,
        user_id: r.user_id,
        userName,
        user_name: userName,
        reviewer_name: userName,
        rating,
        title: r.title || '',
        comment: r.comment || '',
        verified: isVerified,
        is_verified: isVerified,
        createdAt: r.created_at,
        created_at: r.created_at,
      };
    });

    const average = total > 0 ? parseFloat((sum / total).toFixed(1)) : 0;

    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: counts[stars] || 0,
      percentage: total > 0 ? Math.round(((counts[stars] || 0) / total) * 100) : 0,
    }));

    res.json({
      items,
      distribution,
      total,
      average,
    });
  } catch (err) {
    console.error('List reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};

export const getReviewsByProduct = listProductReviews;

export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    let targetProductId = parseInt(productId, 10);
    if (isNaN(targetProductId)) {
      const prodRes = await query('SELECT id FROM products WHERE slug = $1', [productId]);
      if (prodRes.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      targetProductId = prodRes.rows[0].id;
    }

    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    const numRating = parseInt(rating, 10);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const result = await query(
      `INSERT INTO reviews (product_id, user_id, rating, title, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (product_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, title = EXCLUDED.title, comment = EXCLUDED.comment, created_at = NOW()
       RETURNING *`,
      [targetProductId, userId, numRating, title || null, comment || null]
    );

    const row = result.rows[0];
    const userName = req.user?.full_name || 'Verified Buyer';

    res.status(201).json({
      id: row.id,
      productId: row.product_id,
      product_id: row.product_id,
      userId: row.user_id,
      user_id: row.user_id,
      userName,
      user_name: userName,
      rating: Number(row.rating),
      title: row.title || '',
      comment: row.comment || '',
      verified: true,
      is_verified: true,
      createdAt: row.created_at,
      created_at: row.created_at,
    });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to submit product review.' });
  }
};

