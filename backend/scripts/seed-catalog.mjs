import { query } from '../config/db.js';

const newCategories = [
  { name: 'Smartphones', slug: 'smartphones', description: 'Latest iOS and Android flagship smartphones', image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80' },
  { name: 'Laptops', slug: 'laptops', description: 'High performance laptops for work, gaming, and creators', image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80' },
  { name: 'Audio', slug: 'audio', description: 'Premium headphones, TWS earbuds, and soundbars', image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80' }
];

const newBrands = [
  { name: 'Apple', slug: 'apple', logo_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&q=80' },
  { name: 'OnePlus', slug: 'oneplus', logo_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200&q=80' },
  { name: 'Dell', slug: 'dell', logo_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=200&q=80' },
  { name: 'HP', slug: 'hp', logo_url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=200&q=80' },
  { name: 'Lenovo', slug: 'lenovo', logo_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&q=80' },
  { name: 'Bose', slug: 'bose', logo_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&q=80' },
  { name: 'JBL', slug: 'jbl', logo_url: 'https://images.unsplash.com/photo-1613318585483-492723381a17?w=200&q=80' },
  { name: 'Daikin', slug: 'daikin', logo_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&q=80' },
  { name: 'Voltas', slug: 'voltas', logo_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&q=80' },
  { name: 'Bosch', slug: 'bosch', logo_url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=200&q=80' },
  { name: 'IFB', slug: 'ifb', logo_url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=200&q=80' },
  { name: 'TCL', slug: 'tcl', logo_url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200&q=80' },
  { name: 'Haier', slug: 'haier', logo_url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=200&q=80' },
];

const catalogs = {
  'Smartphones': {
    brands: ['Apple', 'Samsung', 'OnePlus'],
    baseImg: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    templates: [
      { name: 'Pro Max 5G', p: 130000, specs: { ram_gb: 12, storage_gb: 512, camera_mp: 48, battery_mah: 4500, display_hz: 120 } },
      { name: 'Ultra 5G', p: 110000, specs: { ram_gb: 12, storage_gb: 256, camera_mp: 200, battery_mah: 5000, display_hz: 120 } },
      { name: 'Base 5G', p: 70000, specs: { ram_gb: 8, storage_gb: 128, camera_mp: 50, battery_mah: 4000, display_hz: 60 } },
      { name: 'Lite 5G', p: 35000, specs: { ram_gb: 6, storage_gb: 128, camera_mp: 64, battery_mah: 5000, display_hz: 90 } },
      { name: 'Fold 5G', p: 150000, specs: { ram_gb: 16, storage_gb: 1024, camera_mp: 50, battery_mah: 4400, display_hz: 120 } },
      { name: 'Flip 5G', p: 90000, specs: { ram_gb: 8, storage_gb: 256, camera_mp: 12, battery_mah: 3700, display_hz: 120 } },
      { name: 'Neo 5G', p: 40000, specs: { ram_gb: 8, storage_gb: 256, camera_mp: 50, battery_mah: 5000, display_hz: 120 } },
      { name: 'Pro 5G', p: 85000, specs: { ram_gb: 12, storage_gb: 256, camera_mp: 50, battery_mah: 4700, display_hz: 120 } },
      { name: 'Mini 5G', p: 60000, specs: { ram_gb: 6, storage_gb: 128, camera_mp: 12, battery_mah: 3000, display_hz: 60 } },
    ]
  },
  'Laptops': {
    brands: ['Apple', 'Dell', 'HP', 'Lenovo'],
    baseImg: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
    templates: [
      { name: 'XPS 15 Creator', p: 180000, specs: { ram_gb: 32, storage_gb: 1024, processor: 'Core i9', screen_size_inch: 15.6, gpu: 'RTX 4070' } },
      { name: 'MacBook Air M2', p: 110000, specs: { ram_gb: 8, storage_gb: 256, processor: 'M2', screen_size_inch: 13.6, gpu: 'Integrated' } },
      { name: 'MacBook Pro 16 M3 Max', p: 350000, specs: { ram_gb: 64, storage_gb: 2048, processor: 'M3 Max', screen_size_inch: 16.2, gpu: 'Apple 40-core' } },
      { name: 'Spectre x360', p: 140000, specs: { ram_gb: 16, storage_gb: 512, processor: 'Core i7', screen_size_inch: 14, gpu: 'Iris Xe' } },
      { name: 'ThinkPad X1 Carbon', p: 165000, specs: { ram_gb: 16, storage_gb: 1024, processor: 'Core i7 vPro', screen_size_inch: 14, gpu: 'Integrated' } },
      { name: 'Pavilion Gaming', p: 65000, specs: { ram_gb: 8, storage_gb: 512, processor: 'Ryzen 5', screen_size_inch: 15.6, gpu: 'GTX 1650' } },
      { name: 'Legion 5 Pro', p: 145000, specs: { ram_gb: 16, storage_gb: 1024, processor: 'Ryzen 7', screen_size_inch: 16, gpu: 'RTX 4060' } },
      { name: 'Inspiron 14', p: 55000, specs: { ram_gb: 8, storage_gb: 512, processor: 'Core i5', screen_size_inch: 14, gpu: 'Integrated' } },
    ]
  },
  'Audio': {
    brands: ['Sony', 'Bose', 'JBL', 'Apple'],
    baseImg: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80',
    templates: [
      { name: 'WH-1000XM5 Noise Cancelling', p: 30000, specs: { form_factor: 'Over-ear', noise_cancelling: true, battery_hours: 30, wireless: true } },
      { name: 'QuietComfort Ultra', p: 35000, specs: { form_factor: 'Over-ear', noise_cancelling: true, battery_hours: 24, wireless: true } },
      { name: 'AirPods Pro 2nd Gen', p: 24000, specs: { form_factor: 'In-ear TWS', noise_cancelling: true, battery_hours: 6, wireless: true } },
      { name: 'Flip 6 Portable Bluetooth Speaker', p: 10000, specs: { form_factor: 'Speaker', waterproof: true, battery_hours: 12, wireless: true } },
      { name: 'WF-1000XM5 TWS', p: 25000, specs: { form_factor: 'In-ear TWS', noise_cancelling: true, battery_hours: 8, wireless: true } },
      { name: 'SoundLink Flex', p: 15000, specs: { form_factor: 'Speaker', waterproof: true, battery_hours: 12, wireless: true } },
      { name: 'AirPods Max', p: 59000, specs: { form_factor: 'Over-ear', noise_cancelling: true, battery_hours: 20, wireless: true } },
      { name: 'Charge 5 Bluetooth Speaker', p: 14000, specs: { form_factor: 'Speaker', waterproof: true, battery_hours: 20, wireless: true } },
    ]
  },
  'Air Conditioners': {
    brands: ['LG', 'Samsung', 'Daikin', 'Voltas'],
    baseImg: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80',
    templates: [
      { name: '1.5 Ton 5 Star Inverter Split AC', p: 45000, specs: { tonnage: '1.5', star_rating: 5, type: 'Split', inverter: true, copper_condenser: true } },
      { name: '1.0 Ton 3 Star Inverter Split AC', p: 32000, specs: { tonnage: '1.0', star_rating: 3, type: 'Split', inverter: true, copper_condenser: true } },
      { name: '2.0 Ton 4 Star Inverter Split AC', p: 55000, specs: { tonnage: '2.0', star_rating: 4, type: 'Split', inverter: true, copper_condenser: true } },
      { name: '1.5 Ton 3 Star Window AC', p: 28000, specs: { tonnage: '1.5', star_rating: 3, type: 'Window', inverter: false, copper_condenser: true } },
      { name: '1.5 Ton 4 Star Wi-Fi Inverter Split AC', p: 42000, specs: { tonnage: '1.5', star_rating: 4, type: 'Split', inverter: true, smart_wifi: true } },
      { name: '1.2 Ton 5 Star Inverter Split AC', p: 38000, specs: { tonnage: '1.2', star_rating: 5, type: 'Split', inverter: true, copper_condenser: true } },
      { name: '1.5 Ton 5 Star Window AC', p: 34000, specs: { tonnage: '1.5', star_rating: 5, type: 'Window', inverter: true, copper_condenser: true } },
      { name: '2.0 Ton 5 Star Hot & Cold Split AC', p: 65000, specs: { tonnage: '2.0', star_rating: 5, type: 'Split', inverter: true, hot_cold: true } },
    ]
  },
  'Refrigerators': {
    brands: ['Samsung', 'LG', 'Whirlpool', 'Haier'],
    baseImg: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80',
    templates: [
      { name: '265L 3 Star Frost Free Double Door', p: 26000, specs: { capacity_l: 265, door_type: 'Double Door', star_rating: 3, frost_free: true } },
      { name: '190L 4 Star Direct Cool Single Door', p: 16000, specs: { capacity_l: 190, door_type: 'Single Door', star_rating: 4, frost_free: false } },
      { name: '653L Side by Side Smart Refrigerator', p: 85000, specs: { capacity_l: 653, door_type: 'Side by Side', star_rating: 4, frost_free: true } },
      { name: '320L 2 Star Frost Free Double Door', p: 31000, specs: { capacity_l: 320, door_type: 'Double Door', star_rating: 2, frost_free: true } },
      { name: '400L 3 Star Frost Free Bottom Mount', p: 45000, specs: { capacity_l: 400, door_type: 'Bottom Mount', star_rating: 3, frost_free: true } },
      { name: '210L 5 Star Direct Cool Single Door', p: 19000, specs: { capacity_l: 210, door_type: 'Single Door', star_rating: 5, frost_free: false } },
      { name: '500L French Door Refrigerator', p: 75000, specs: { capacity_l: 500, door_type: 'French Door', star_rating: 4, frost_free: true } },
      { name: '240L 3 Star Frost Free Double Door', p: 24000, specs: { capacity_l: 240, door_type: 'Double Door', star_rating: 3, frost_free: true } },
    ]
  },
  'Washing Machines': {
    brands: ['LG', 'Samsung', 'Bosch', 'IFB'],
    baseImg: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80',
    templates: [
      { name: '8.0 Kg 5 Star Fully Automatic Front Load', p: 35000, specs: { capacity_kg: 8.0, loading_type: 'Front Load', star_rating: 5, rpm: 1200 } },
      { name: '6.5 Kg 5 Star Fully Automatic Top Load', p: 16000, specs: { capacity_kg: 6.5, loading_type: 'Top Load', star_rating: 5, rpm: 700 } },
      { name: '7.0 Kg 5 Star Semi-Automatic Top Load', p: 11000, specs: { capacity_kg: 7.0, loading_type: 'Semi Automatic', star_rating: 5, rpm: 1300 } },
      { name: '9.0 Kg 5 Star Fully Automatic Front Load', p: 42000, specs: { capacity_kg: 9.0, loading_type: 'Front Load', star_rating: 5, rpm: 1400 } },
      { name: '7.5 Kg 4 Star Fully Automatic Top Load', p: 19000, specs: { capacity_kg: 7.5, loading_type: 'Top Load', star_rating: 4, rpm: 720 } },
      { name: '6.0 Kg 5 Star Fully Automatic Front Load', p: 24000, specs: { capacity_kg: 6.0, loading_type: 'Front Load', star_rating: 5, rpm: 1000 } },
      { name: '10.0 Kg 5 Star Fully Automatic Top Load', p: 29000, specs: { capacity_kg: 10.0, loading_type: 'Top Load', star_rating: 5, rpm: 750 } },
      { name: '8.5 Kg 5 Star Semi-Automatic Top Load', p: 14000, specs: { capacity_kg: 8.5, loading_type: 'Semi Automatic', star_rating: 5, rpm: 1350 } },
    ]
  },
  'Televisions': {
    brands: ['Sony', 'Samsung', 'LG', 'TCL'],
    baseImg: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=80',
    templates: [
      { name: '55 Inch 4K Ultra HD Smart LED TV', p: 45000, specs: { screen_size_inch: 55, display_tech: 'LED', resolution: '4K', smart_tv: true, refresh_rate_hz: 60 } },
      { name: '65 Inch 4K Ultra HD Smart OLED TV', p: 150000, specs: { screen_size_inch: 65, display_tech: 'OLED', resolution: '4K', smart_tv: true, refresh_rate_hz: 120 } },
      { name: '43 Inch Full HD Smart LED TV', p: 25000, specs: { screen_size_inch: 43, display_tech: 'LED', resolution: 'Full HD', smart_tv: true, refresh_rate_hz: 60 } },
      { name: '50 Inch 4K Ultra HD QLED TV', p: 55000, specs: { screen_size_inch: 50, display_tech: 'QLED', resolution: '4K', smart_tv: true, refresh_rate_hz: 60 } },
      { name: '75 Inch 4K Ultra HD Smart QLED TV', p: 180000, specs: { screen_size_inch: 75, display_tech: 'QLED', resolution: '4K', smart_tv: true, refresh_rate_hz: 120 } },
      { name: '32 Inch HD Ready Smart LED TV', p: 13000, specs: { screen_size_inch: 32, display_tech: 'LED', resolution: 'HD Ready', smart_tv: true, refresh_rate_hz: 60 } },
      { name: '55 Inch 4K Ultra HD Smart Mini LED TV', p: 85000, specs: { screen_size_inch: 55, display_tech: 'Mini LED', resolution: '4K', smart_tv: true, refresh_rate_hz: 144 } },
      { name: '65 Inch 8K Ultra HD Smart Neo QLED TV', p: 350000, specs: { screen_size_inch: 65, display_tech: 'Neo QLED', resolution: '8K', smart_tv: true, refresh_rate_hz: 120 } },
    ]
  }
};

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

async function runSeed() {
  console.log('🌱 Starting Marketplace Bulk Catalog Seed...');
  try {
    // 1. Insert new categories
    console.log('Inserting new categories...');
    for (const cat of newCategories) {
      await query(
        `INSERT INTO categories (name, slug, description, image_url) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug, cat.description, cat.image_url]
      );
    }

    // 2. Insert new brands
    console.log('Inserting new brands...');
    for (const brand of newBrands) {
      await query(
        `INSERT INTO brands (name, slug, logo_url) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (slug) DO NOTHING`,
        [brand.name, brand.slug, brand.logo_url]
      );
    }

    // 3. Fetch ID maps
    const catMap = (await query('SELECT id, name FROM categories')).rows.reduce((acc, r) => ({ ...acc, [r.name]: r.id }), {});
    const brandMap = (await query('SELECT id, name FROM brands')).rows.reduce((acc, r) => ({ ...acc, [r.name]: r.id }), {});

    // 4. Generate and Insert Products
    console.log('Generating & inserting products...');
    let totalProducts = 0;

    for (const [catName, catData] of Object.entries(catalogs)) {
      const catId = catMap[catName];
      if (!catId) continue;

      for (let i = 0; i < catData.templates.length; i++) {
        const tpl = catData.templates[i];
        // Cycle through brands for variety
        const brandName = catData.brands[i % catData.brands.length];
        const brandId = brandMap[brandName];
        
        const title = `${brandName} ${tpl.name}`;
        const slug = slugify(title) + '-' + Math.floor(Math.random() * 10000);
        const basePrice = Math.floor(tpl.p * 1.25); // 25% markup for MRP
        const discountPrice = tpl.p;
        const specs = JSON.stringify(tpl.specs);
        const modelNumber = `${brandName.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const isFeatured = i < 2; // first 2 of each category are featured

        // Insert product
        const prodRes = await query(
          `INSERT INTO products (title, slug, category_id, brand_id, model_number, base_price, discount_price, is_featured, specs, description) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [title, slug, catId, brandId, modelNumber, basePrice, discountPrice, isFeatured, specs, `Experience the incredible ${title} from ${brandName}. Packed with industry-leading features for your everyday needs.`]
        );
        const productId = prodRes.rows[0].id;

        // Insert primary image
        await query(
          `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, TRUE)`,
          [productId, catData.baseImg]
        );

        // Insert inventory
        await query(
          `INSERT INTO inventory (product_id, stock_quantity) VALUES ($1, $2)`,
          [productId, 10 + Math.floor(Math.random() * 90)]
        );

        totalProducts++;
      }
    }

    console.log(`✅ Success! Seeded ${totalProducts} new products with inventory and images.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Bulk seed error:', err);
    process.exit(1);
  }
}

runSeed();
