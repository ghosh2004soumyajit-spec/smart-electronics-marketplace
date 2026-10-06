import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function fixUser() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Password123!', salt);
  
  await query(
    `INSERT INTO users (email, password_hash, full_name, phone, role) 
     VALUES ($1, $2, 'System Administrator (Alias)', '+91 9876543210', 'ADMIN')`,
    ['adminmelectronics.com', hash]
  );
  console.log('Alias admin account created.');
  process.exit(0);
}

fixUser().catch(console.error);
