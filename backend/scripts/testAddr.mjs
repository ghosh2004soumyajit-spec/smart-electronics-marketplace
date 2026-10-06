// Clean up test data inserted by testAddr.mjs
import { query } from '../config/db.js';

setTimeout(async () => {
  const del = await query('DELETE FROM addresses WHERE user_id = $1', [2]);
  console.log('Cleaned up test address, rows deleted:', del.rowCount);
  process.exit(0);
}, 400);
