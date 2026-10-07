import { query } from '../config/db.js';

const categoryImages = {
  1: '/images/products/ac-split.jpg',
  2: '/images/products/fridge-double-door.jpg',
  3: '/images/products/washer-front-load.jpg',
  4: '/images/products/tv-oled.jpg',
  5: '/images/products/phone-galaxy.jpg'
};

const productImages = {
  1: '/images/products/ac-split.jpg',
  2: '/images/products/ac-split.jpg',
  3: '/images/products/ac-split.jpg',
  4: '/images/products/ac-windfree.jpg',
  5: '/images/products/ac-split.jpg',
  6: '/images/products/ac-split.jpg',
  7: '/images/products/ac-window.jpg',
  8: '/images/products/fridge-double-door.jpg',
  9: '/images/products/fridge-double-door.jpg',
  10: '/images/products/fridge-single-door.jpg',
  11: '/images/products/fridge-single-door.jpg',
  12: '/images/products/fridge-bottom-mount.jpg',
  13: '/images/products/fridge-side-by-side.jpg',
  14: '/images/products/washer-front-load.jpg',
  15: '/images/products/washer-top-load.jpg',
  16: '/images/products/washer-front-load.jpg',
  17: '/images/products/washer-front-load.jpg',
  18: '/images/products/washer-top-load.jpg',
  19: '/images/products/washer-top-load.jpg',
  20: '/images/products/tv-qled.jpg',
  21: '/images/products/tv-qled.jpg',
  22: '/images/products/tv-oled.jpg',
  23: '/images/products/tv-qled.jpg',
  24: '/images/products/tv-qled.jpg',
  25: '/images/products/tv-qled.jpg',
  26: '/images/products/phone-galaxy.jpg',
  27: '/images/products/phone-android.jpg',
  28: '/images/products/phone-xiaomi.jpg',
  29: '/images/products/phone-android.jpg',
  30: '/images/products/phone-iphone.jpg',
  31: '/images/products/phone-xiaomi.jpg',
  32: '/images/products/ac-split.jpg',
  33: '/images/products/fridge-side-by-side.jpg',
  34: '/images/products/washer-front-load.jpg',
  35: '/images/products/tv-qled.jpg',
  36: '/images/products/tv-oled.jpg',
  37: '/images/products/phone-galaxy.jpg',
  38: '/images/products/phone-iphone.jpg',
  39: '/images/products/phone-android.jpg',
  40: '/images/products/phone-xiaomi.jpg'
};

async function updateAllImages() {
  console.log('🔄 Updating database category images...');
  for (const [id, url] of Object.entries(categoryImages)) {
    await query('UPDATE categories SET image_url = $1 WHERE id = $2', [url, id]);
  }
  console.log('✅ Categories updated.');

  console.log('🔄 Updating database product_images...');
  for (const [productId, url] of Object.entries(productImages)) {
    // Check if primary image row exists for this product
    const res = await query('SELECT id FROM product_images WHERE product_id = $1 AND is_primary = TRUE', [productId]);
    if (res.rows.length > 0) {
      await query('UPDATE product_images SET image_url = $1 WHERE product_id = $2 AND is_primary = TRUE', [url, productId]);
    } else {
      await query('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES ($1, $2, TRUE, 1)', [productId, url]);
    }
  }
  console.log('✅ All 40 product images updated in database!');

  // Verification query
  const check = await query(`
    SELECT p.id, p.title, c.name as category, pi.image_url 
    FROM products p 
    JOIN categories c ON c.id = p.category_id 
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE 
    WHERE p.id IN (1, 4, 7, 8, 12, 14, 15, 20, 22, 26, 30, 32)
    ORDER BY p.id
  `);
  console.log('\nSample verification results:');
  console.table(check.rows);

  process.exit(0);
}

updateAllImages().catch(err => {
  console.error('❌ Failed to update images:', err);
  process.exit(1);
});
