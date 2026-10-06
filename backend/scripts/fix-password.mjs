import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixAdminPassword() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Password123!', salt);
  
  // 1. Update the database
  await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@electronics.com']);
  await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'john.doe@example.com']);
  console.log('Database updated with correct hash.');

  // 2. Update seed.sql
  const seedPath = path.join(__dirname, '../../database/seed.sql');
  let seedSql = fs.readFileSync(seedPath, 'utf8');
  
  // Replace the broken hashes with the new one
  seedSql = seedSql.replace(
    /\$2a\$10\$e8wF4rT67B3e\.5jGgX2J7eQ0w\.5G\.061M2G0c0vYd\/wH3\.j7P2V5f/g, 
    hash
  );
  fs.writeFileSync(seedPath, seedSql);
  console.log('seed.sql updated with correct hash.');

  process.exit(0);
}

fixAdminPassword().catch(console.error);
