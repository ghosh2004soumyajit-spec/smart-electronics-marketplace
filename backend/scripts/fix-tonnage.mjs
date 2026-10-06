import { query } from '../config/db.js';

async function fixTonnage() {
  const res = await query("SELECT id, specs FROM products WHERE specs->>'tonnage' IS NOT NULL");
  let count = 0;
  for (const row of res.rows) {
    let specs = typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs;
    if (specs.tonnage === '1') specs.tonnage = '1.0';
    if (specs.tonnage === '2') specs.tonnage = '2.0';
    await query('UPDATE products SET specs = $1 WHERE id = $2', [JSON.stringify(specs), row.id]);
    count++;
  }
  console.log(`Fixed tonnage for ${count} AC products.`);
  process.exit(0);
}

fixTonnage().catch(console.error);
