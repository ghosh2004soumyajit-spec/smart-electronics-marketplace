import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execRawSql } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('🔄 Initializing Smart Electronics Database...');

  try {
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../database/seed.sql');

    console.log('📜 Applying database/schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await execRawSql(schemaSql);
    console.log('✅ Schema applied successfully.');

    console.log('🌱 Applying database/seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await execRawSql(seedSql);
    console.log('✅ Seed data inserted successfully.');

    console.log('🚀 Database initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  }
}

initDatabase();
