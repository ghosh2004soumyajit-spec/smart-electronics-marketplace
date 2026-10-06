import { query } from '../config/db.js';

export const getAdminStats = async (req, res) => {
  try {
    const productsCount = await query('SELECT COUNT(*) FROM products');
    const usersCount = await query("SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER'");
    const ordersCount = await query('SELECT COUNT(*) FROM orders');
    const revenueSum = await query("SELECT COALESCE(SUM(final_amount), 0) as total FROM orders WHERE payment_status = 'PAID'");
    const lowStockCount = await query('SELECT COUNT(*) FROM inventory WHERE stock_quantity <= 5');

    res.json({
      totalProducts: parseInt(productsCount.rows[0].count, 10),
      totalCustomers: parseInt(usersCount.rows[0].count, 10),
      totalOrders: parseInt(ordersCount.rows[0].count, 10),
      totalRevenue: parseFloat(revenueSum.rows[0].total),
      lowStockAlerts: parseInt(lowStockCount.rows[0].count, 10),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { title, slug, category_id, brand_id, model_number, base_price, discount_price, is_featured, specs, description, image_url, stock_quantity = 0 } = req.body;

    if (!title || !category_id || !brand_id || !base_price) {
      return res.status(400).json({ error: 'Title, category, brand, and base price are required.' });
    }

    const prodSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const result = await query(
      `INSERT INTO products (title, slug, category_id, brand_id, model_number, base_price, discount_price, is_featured, specs, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, prodSlug, category_id, brand_id, model_number || null, base_price, discount_price || null, is_featured || false, JSON.stringify(specs || {}), description || null]
    );

    const product = result.rows[0];

    // Insert primary image if provided
    if (image_url) {
      await query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, TRUE)', [product.id, image_url]);
    }

    // Insert inventory
    await query('INSERT INTO inventory (product_id, stock_quantity) VALUES ($1, $2) ON CONFLICT (product_id) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity', [product.id, stock_quantity]);

    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, base_price, discount_price, is_featured, specs, description } = req.body;

    const result = await query(
      `UPDATE products 
       SET title = COALESCE($1, title),
           base_price = COALESCE($2, base_price),
           discount_price = $3,
           is_featured = COALESCE($4, is_featured),
           specs = COALESCE($5, specs),
           description = COALESCE($6, description),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, base_price, discount_price, is_featured, specs ? JSON.stringify(specs) : null, description, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found.' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity == null || stock_quantity < 0) {
      return res.status(400).json({ error: 'Valid stock quantity is required.' });
    }

    const result = await query(
      `INSERT INTO inventory (product_id, stock_quantity)
       VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity, updated_at = NOW()
       RETURNING *`,
      [id, stock_quantity]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inventory.' });
  }
};

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT o.*, u.full_name as customer_name, u.email as customer_email,
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)::int as item_count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get all admin orders error:', err);
    res.status(500).json({ error: 'Failed to fetch all orders.' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({ error: 'Invalid order status value.' });
    }

    const result = await query('UPDATE orders SET order_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [
      order_status,
      id,
    ]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
};

export const getOffersAdmin = async (req, res) => {
  try {
    const result = await query('SELECT * FROM offers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch offers.' });
  }
};

export const createOfferAdmin = async (req, res) => {
  try {
    const { code, title, description, discount_percent, max_discount, min_order_amount } = req.body;

    if (!code || !title || !discount_percent) {
      return res.status(400).json({ error: 'Code, title, and discount percentage are required.' });
    }

    const result = await query(
      `INSERT INTO offers (code, title, description, discount_percent, max_discount, min_order_amount)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        code.trim().toUpperCase(),
        title.trim(),
        description || null,
        parseFloat(discount_percent),
        max_discount ? parseFloat(max_discount) : null,
        min_order_amount ? parseFloat(min_order_amount) : 0,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create offer error:', err);
    res.status(500).json({ error: 'Failed to create offer.' });
  }
};

export const updateOfferAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, title, discount_percent, max_discount, min_order_amount, description } = req.body;

    const result = await query(
      `UPDATE offers
       SET is_active = COALESCE($1, is_active),
           title = COALESCE($2, title),
           discount_percent = COALESCE($3, discount_percent),
           max_discount = COALESCE($4, max_discount),
           min_order_amount = COALESCE($5, min_order_amount),
           description = COALESCE($6, description)
       WHERE id = $7
       RETURNING *`,
      [is_active, title, discount_percent, max_discount, min_order_amount, description, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Offer not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update offer.' });
  }
};

export const deleteOfferAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM offers WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Offer not found.' });
    res.json({ message: 'Offer deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete offer.' });
  }
};

/* --- CATEGORIES CRUD --- */
export const getCategoriesAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id)::int as product_count
       FROM categories c
       ORDER BY c.display_order ASC, c.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

export const createCategoryAdmin = async (req, res) => {
  try {
    const { name, slug, description, image_url, display_order = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const result = await query(
      `INSERT INTO categories (name, slug, description, image_url, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), catSlug, description || null, image_url || null, parseInt(display_order || 0, 10)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

export const updateCategoryAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image_url, display_order } = req.body;
    const result = await query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           display_order = COALESCE($5, display_order)
       WHERE id = $6
       RETURNING *`,
      [name, slug, description, image_url, display_order, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Category not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

export const deleteCategoryAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const prodCount = await query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
    if (parseInt(prodCount.rows[0].count, 10) > 0) {
      return res.status(400).json({ error: 'Cannot delete category that contains products.' });
    }
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Category not found.' });
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

/* --- BRANDS CRUD --- */
export const getBrandsAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, (SELECT COUNT(*) FROM products WHERE brand_id = b.id)::int as product_count
       FROM brands b
       ORDER BY b.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands.' });
  }
};

export const createBrandAdmin = async (req, res) => {
  try {
    const { name, slug, logo_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Brand name is required.' });

    const brandSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const result = await query(
      `INSERT INTO brands (name, slug, logo_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), brandSlug, logo_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create brand error:', err);
    res.status(500).json({ error: 'Failed to create brand.' });
  }
};

export const updateBrandAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, logo_url } = req.body;
    const result = await query(
      `UPDATE brands
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           logo_url = COALESCE($3, logo_url)
       WHERE id = $4
       RETURNING *`,
      [name, slug, logo_url, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Brand not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update brand.' });
  }
};

export const deleteBrandAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const prodCount = await query('SELECT COUNT(*) FROM products WHERE brand_id = $1', [id]);
    if (parseInt(prodCount.rows[0].count, 10) > 0) {
      return res.status(400).json({ error: 'Cannot delete brand that contains products.' });
    }
    const result = await query('DELETE FROM brands WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Brand not found.' });
    res.json({ message: 'Brand deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete brand.' });
  }
};

/* --- CUSTOMERS / USERS MANAGEMENT --- */
export const getUsersAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.created_at,
              (SELECT COUNT(*) FROM orders WHERE user_id = u.id)::int as order_count,
              (SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE user_id = u.id)::float as total_spent
       FROM users u
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

export const getUserDetailsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await query('SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1', [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found.' });

    const ordersRes = await query(
      `SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)::int as item_count
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [id]
    );

    res.json({
      user: userRes.rows[0],
      orders: ordersRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user details.' });
  }
};

/* --- REVIEWS MODERATION --- */
export const getReviewsAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.created_at,
              p.title as product_title, p.slug as product_slug,
              u.full_name as reviewer_name, u.email as reviewer_email
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews for moderation.' });
  }
};

export const deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Review not found.' });
    res.json({ message: 'Review deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review.' });
  }
};

