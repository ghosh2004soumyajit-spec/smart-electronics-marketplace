import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function checkAdmin() {
  const result = await query('SELECT * FROM users WHERE email = $1', ['admin@electronics.com']);
  if (result.rowCount === 0) {
    console.log('Admin user NOT FOUND in database!');
    return;
  }
  const user = result.rows[0];
  console.log('Admin found. Hash:', user.password_hash);
  const match = await bcrypt.compare('Password123!', user.password_hash);
  console.log('Password123! matches?', match);
  process.exit(0);
}

checkAdmin().catch(console.error);
