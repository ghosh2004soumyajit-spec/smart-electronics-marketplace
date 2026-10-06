import { query } from '../config/db.js';

export const listCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(p.id)::int as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `);
    // map product_count → productCount for the frontend normalizer
    res.json(result.rows.map((r) => ({ ...r, productCount: r.product_count ?? 0 })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

export const listBrands = async (req, res) => {
  try {
    const result = await query('SELECT * FROM brands ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands.' });
  }
};

export const listProducts = async (req, res) => {
  try {
    const {
      q,
      cat,
      category,
      brand,
      brands: brandsParam,
      priceMin,
      priceMax,
      sort,
      featured,
      in_stock,
    } = req.query;

    // 1. Pagination: Honor limit alongside perPage, with safe integer parsing & bounds
    const rawLimit = req.query.limit ?? req.query.perPage ?? 12;
    const parsedLimit = parseInt(rawLimit, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 500) : 12;

    const rawPage = req.query.page ?? 1;
    const parsedPage = parseInt(rawPage, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const offset = (page - 1) * limit;

    const whereClauses = [];
    const values = [];

    // 2. Search query (title or description or model)
    if (q) {
      values.push(`%${q.trim()}%`);
      whereClauses.push(`(p.title ILIKE $${values.length} OR p.description ILIKE $${values.length} OR p.model_number ILIKE $${values.length})`);
    }

    // 3. Category filter — supports single slug OR comma-separated list via 'cat' or 'category'
    const catVal = cat || category;
    if (catVal) {
      const catSlugs = catVal.split(',').map((s) => s.trim()).filter(Boolean);
      if (catSlugs.length) {
        values.push(catSlugs);
        whereClauses.push(`c.slug = ANY($${values.length})`);
      }
    }

    // 4. Brand filter — supports 'brand' and 'brands' (comma list) params
    const brandVal = brandsParam || brand;
    if (brandVal) {
      const brandSlugs = brandVal.split(',').map((s) => s.trim()).filter(Boolean);
      if (brandSlugs.length) {
        values.push(brandSlugs);
        whereClauses.push(`b.slug = ANY($${values.length})`);
      }
    }

    // 5. Featured filter
    if (featured === 'true') {
      whereClauses.push(`p.is_featured = TRUE`);
    }

    // 6. Price filter harmonization: support priceMin/priceMax, price=min-max, and r_price=min-max
    let effectivePriceMin = priceMin ? parseFloat(priceMin) : null;
    let effectivePriceMax = priceMax ? parseFloat(priceMax) : null;

    const rawPriceRange = req.query.price || req.query.r_price;
    if (rawPriceRange && typeof rawPriceRange === 'string') {
      const [pMin, pMax] = rawPriceRange.split('-');
      if (pMin && !isNaN(Number(pMin)) && effectivePriceMin === null) {
        effectivePriceMin = parseFloat(pMin);
      }
      if (pMax && !isNaN(Number(pMax)) && effectivePriceMax === null) {
        effectivePriceMax = parseFloat(pMax);
      }
    }

    if (effectivePriceMin !== null && effectivePriceMax !== null) {
      if (effectivePriceMin > effectivePriceMax) {
        [effectivePriceMin, effectivePriceMax] = [effectivePriceMax, effectivePriceMin];
      }
      values.push(effectivePriceMin);
      const minIdx = values.length;
      values.push(effectivePriceMax);
      const maxIdx = values.length;
      whereClauses.push(`COALESCE(p.discount_price, p.base_price) BETWEEN $${minIdx} AND $${maxIdx}`);
    } else if (effectivePriceMin !== null) {
      values.push(effectivePriceMin);
      whereClauses.push(`COALESCE(p.discount_price, p.base_price) >= $${values.length}`);
    } else if (effectivePriceMax !== null) {
      values.push(effectivePriceMax);
      whereClauses.push(`COALESCE(p.discount_price, p.base_price) <= $${values.length}`);
    }

    // 7. In stock filter
    if (in_stock === 'true') {
      whereClauses.push(`COALESCE(i.stock_quantity, 0) > 0`);
    }

    // 8. Dynamic JSONB Facet Filters (f_key=val1,val2)
    for (const [key, val] of Object.entries(req.query)) {
      if (key.startsWith('f_') && val) {
        const specKey = key.slice(2);
        if (!/^[a-zA-Z0-9_]+$/.test(specKey) || specKey.length > 50) continue;
        const specVals = val.split(',').map((v) => v.trim()).filter(Boolean);
        if (specVals.length) {
          values.push(specKey);
          const keyIdx = values.length;
          values.push(specVals);
          const valIdx = values.length;
          whereClauses.push(`p.specs->>$${keyIdx} = ANY($${valIdx})`);
        }
      }
    }

    // 9. Dynamic JSONB Numeric Range Filters (r_key=min-max, r_key=min-, r_key=-max)
    for (const [key, val] of Object.entries(req.query)) {
      if (key.startsWith('r_') && key !== 'r_price' && val) {
        const specKey = key.slice(2);

        // SQL Injection Defense: Identifier check
        if (!/^[a-zA-Z0-9_]+$/.test(specKey) || specKey.length > 50) continue;

        const parts = String(val).split('-');
        const minStr = parts[0]?.trim();
        const maxStr = parts[1]?.trim();

        const hasMin = minStr !== '' && minStr !== undefined && !isNaN(Number(minStr));
        const hasMax = maxStr !== '' && maxStr !== undefined && !isNaN(Number(maxStr));

        if (!hasMin && !hasMax) continue;

        let minVal = hasMin ? parseFloat(minStr) : null;
        let maxVal = hasMax ? parseFloat(maxStr) : null;

        if (minVal !== null && maxVal !== null && minVal > maxVal) {
          [minVal, maxVal] = [maxVal, minVal];
        }

        // Parameterized spec key ($keyIdx)
        values.push(specKey);
        const keyIdx = values.length;

        // Guarded cast using CASE expression: guarantees non-numeric and missing values return NULL
        const numExpr = `(CASE WHEN (p.specs->>$${keyIdx}) ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (p.specs->>$${keyIdx})::numeric ELSE NULL END)`;

        if (minVal !== null && maxVal !== null) {
          values.push(minVal);
          const minIdx = values.length;
          values.push(maxVal);
          const maxIdx = values.length;
          whereClauses.push(`${numExpr} BETWEEN $${minIdx} AND $${maxIdx}`);
        } else if (minVal !== null) {
          values.push(minVal);
          const minIdx = values.length;
          whereClauses.push(`${numExpr} >= $${minIdx}`);
        } else if (maxVal !== null) {
          values.push(maxVal);
          const maxIdx = values.length;
          whereClauses.push(`${numExpr} <= $${maxIdx}`);
        }
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const joins = `
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN inventory i ON p.id = i.product_id
    `;

    // 10. Order By logic
    let orderBy = 'p.is_featured DESC, p.id DESC';
    if (sort === 'featured')    orderBy = 'p.is_featured DESC, p.id DESC';
    if (sort === 'price-asc')   orderBy = 'COALESCE(p.discount_price, p.base_price) ASC';
    if (sort === 'price-desc')  orderBy = 'COALESCE(p.discount_price, p.base_price) DESC';
    if (sort === 'newest')      orderBy = 'p.created_at DESC';
    if (sort === 'rating')      orderBy = 'avg_rating DESC NULLS LAST';
    if (sort === 'discount')    orderBy = '((p.base_price - COALESCE(p.discount_price, p.base_price)) / p.base_price) DESC';

    // 11. Count Total matching products
    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total ${joins} ${whereSql}`,
      values
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // 12. Fetch Products with Pagination
    const pageValues = [...values, limit, offset];
    const limitIdx = pageValues.length - 1;
    const offsetIdx = pageValues.length;

    const dataQuery = `
      SELECT
        p.id, p.title, p.slug, p.base_price, p.discount_price, p.is_featured, p.specs, p.model_number,
        c.name as category_name, c.slug as category_slug,
        b.name as brand_name, b.slug as brand_slug,
        pi.image_url as primary_image,
        COALESCE(i.stock_quantity, 0) as stock_quantity,
        COALESCE(AVG(r.rating), 0)::numeric(2,1) as avg_rating,
        COUNT(DISTINCT r.id)::int as review_count
      ${joins}
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN reviews r ON p.id = r.product_id
      ${whereSql}
      GROUP BY p.id, c.name, c.slug, b.name, b.slug, pi.image_url, i.stock_quantity
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const dataResult = await query(dataQuery, pageValues);

    // 13. Facet counts aggregation for matching result set
    const facetCountResult = await query(
      `SELECT b.slug as brand_slug, c.slug as cat_slug, COUNT(DISTINCT p.id)::int as cnt
       ${joins}
       LEFT JOIN inventory i2 ON p.id = i2.product_id
       ${whereSql}
       GROUP BY b.slug, c.slug`,
      values
    );

    const brandCounts = {};
    const categoryCounts = {};
    for (const row of facetCountResult.rows) {
      brandCounts[row.brand_slug] = (brandCounts[row.brand_slug] || 0) + row.cnt;
      categoryCounts[row.cat_slug] = (categoryCounts[row.cat_slug] || 0) + row.cnt;
    }

    // Spec facet counts for the current filtered result set
    const specRows = await query(
      `SELECT p.specs
       ${joins}
       LEFT JOIN reviews r2 ON p.id = r2.product_id
       ${whereSql}
       GROUP BY p.id, c.name, c.slug, b.name, b.slug, i.stock_quantity`,
      values
    );

    const facetCounts = {};
    for (const row of specRows.rows) {
      const specs = row.specs || {};
      for (const [k, v] of Object.entries(specs)) {
        if (v === null || v === undefined) continue;
        const strVal = String(v);
        if (!facetCounts[k]) facetCounts[k] = {};
        facetCounts[k][strVal] = (facetCounts[k][strVal] || 0) + 1;
      }
    }

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.json({
      items: dataResult.rows,
      total,
      page,
      perPage: limit,
      limit,
      pages: totalPages,
      totalPages,
      brandCounts,
      categoryCounts,
      facetCounts,
    });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ error: 'Failed to list products.' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = !isNaN(idOrSlug);

    const productQuery = `
      SELECT
        p.*,
        c.name as category_name, c.slug as category_slug,
        b.name as brand_name, b.slug as brand_slug,
        COALESCE(i.stock_quantity, 0) as stock_quantity,
        COALESCE(AVG(r.rating), 0)::numeric(2,1) as avg_rating,
        COUNT(r.id)::int as review_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE ${isId ? 'p.id = $1' : 'p.slug = $1'}
      GROUP BY p.id, c.name, c.slug, b.name, b.slug, i.stock_quantity
    `;

    const result = await query(productQuery, [idOrSlug]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = result.rows[0];

    // Fetch Images
    const imgResult = await query(
      'SELECT id, image_url, is_primary, display_order FROM product_images WHERE product_id = $1 ORDER BY display_order ASC',
      [product.id]
    );
    product.images = imgResult.rows;

    // Expose primary_image as a top-level field so the frontend normalizer picks it up
    const primaryImg = imgResult.rows.find((r) => r.is_primary) ?? imgResult.rows[0] ?? null;
    product.primary_image = primaryImg ? primaryImg.image_url : null;

    res.json(product);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Failed to fetch product details.' });
  }
};

export const searchSuggest = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    const result = await query(
      `SELECT p.id, p.title, p.slug, p.base_price, p.discount_price, pi.image_url
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
       WHERE p.title ILIKE $1 OR p.model_number ILIKE $1
       LIMIT 5`,
      [`%${q.trim()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Search suggestion error.' });
  }
};

export const listOffers = async (req, res) => {
  try {
    const result = await query('SELECT * FROM offers WHERE is_active = TRUE ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch offers.' });
  }
};
