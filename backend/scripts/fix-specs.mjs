import { query } from '../config/db.js';

async function fixSpecs() {
  console.log('Fixing specs mapping...');
  const res = await query('SELECT p.id, p.specs, c.slug as cat_slug FROM products p JOIN categories c ON p.category_id = c.id');
  
  for (const row of res.rows) {
    let specs = typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs;
    let modified = false;

    // Fix ACs
    if (row.cat_slug === 'air-conditioners') {
      if (specs.tonnage) {
        specs.tonnage = parseFloat(specs.tonnage).toString(); // '1.0' -> '1', '1.5' -> '1.5'
        modified = true;
      }
      if (specs.star_rating !== undefined) {
        specs.energy_rating = specs.star_rating.toString();
        delete specs.star_rating;
        modified = true;
      }
      if (specs.type) {
        specs.ac_type = specs.type;
        delete specs.type;
        modified = true;
      }
      if (specs.inverter !== undefined && typeof specs.inverter === 'boolean') {
        specs.inverter = specs.inverter ? 'Yes' : 'No';
        modified = true;
      }
    }

    // Fix Refrigerators
    if (row.cat_slug === 'refrigerators') {
      if (specs.star_rating !== undefined) {
        specs.energy_rating = specs.star_rating.toString();
        delete specs.star_rating;
        modified = true;
      }
      if (specs.capacity_l) {
        let cap = parseInt(specs.capacity_l);
        if (cap < 200) specs.capacity_bucket = 'Under 200 L';
        else if (cap <= 300) specs.capacity_bucket = '200–300 L';
        else if (cap <= 400) specs.capacity_bucket = '300–400 L';
        else specs.capacity_bucket = 'Above 400 L';
        modified = true;
      }
      // Assuming all fridge compressors with `inverter_compressor` field.
      if (specs.inverter_compressor !== undefined) {
         specs.inverter = specs.inverter_compressor ? 'Yes' : 'No';
         delete specs.inverter_compressor;
         modified = true;
      } else if (specs.inverter !== undefined && typeof specs.inverter === 'boolean') {
         specs.inverter = specs.inverter ? 'Yes' : 'No';
         modified = true;
      }
      if (specs.frost_free !== undefined) {
         specs.cooling = specs.frost_free ? 'Frost-Free' : 'Direct Cool';
         delete specs.frost_free;
         modified = true;
      }
    }

    // Fix Washers
    if (row.cat_slug === 'washing-machines') {
      if (specs.star_rating !== undefined) {
        specs.energy_rating = specs.star_rating.toString();
        delete specs.star_rating;
        modified = true;
      }
      if (specs.loading_type) {
        specs.load_type = specs.loading_type;
        delete specs.loading_type;
        modified = true;
      }
      if (specs.capacity_kg) {
         specs.capacity_kg = specs.capacity_kg.toString();
         modified = true;
      }
      if (specs.inverter_motor !== undefined) {
         specs.inverter = specs.inverter_motor ? 'Yes' : 'No';
         delete specs.inverter_motor;
         modified = true;
      }
    }

    // Fix TVs
    if (row.cat_slug === 'televisions') {
      if (specs.screen_size_inch) {
        let s = parseInt(specs.screen_size_inch);
        if (s <= 32) specs.screen_bucket = '32 inch';
        else if (s <= 43) specs.screen_bucket = '43 inch';
        else if (s <= 55) specs.screen_bucket = '50–55 inch';
        else specs.screen_bucket = '65 inch+';
        modified = true;
      }
      if (specs.display_tech) {
        specs.panel = specs.display_tech;
        delete specs.display_tech;
        modified = true;
      }
      if (specs.refresh_rate_hz) {
        specs.refresh_rate = specs.refresh_rate_hz.toString();
        delete specs.refresh_rate_hz;
        modified = true;
      }
      if (specs.resolution && specs.resolution === '4K') {
         specs.resolution = '4K Ultra HD';
         modified = true;
      }
    }

    // Fix Phones
    if (row.cat_slug === 'smartphones') {
      if (specs.storage_gb) {
        specs.storage_gb = specs.storage_gb.toString();
        modified = true;
      }
      if (specs.ram_gb) {
        specs.ram_gb = specs.ram_gb.toString();
        modified = true;
      }
      if (specs.battery_mah) {
        specs.battery_bucket = specs.battery_mah >= 5000 ? '5000 mAh+' : 'Under 5000 mAh';
        modified = true;
      }
      if (specs.display_hz) {
        specs.display_type = 'AMOLED';
        modified = true;
      }
    }

    if (modified) {
      await query('UPDATE products SET specs = $1 WHERE id = $2', [JSON.stringify(specs), row.id]);
    }
  }
  
  console.log('Specs fixed!');
  process.exit(0);
}

fixSpecs().catch(console.error);
