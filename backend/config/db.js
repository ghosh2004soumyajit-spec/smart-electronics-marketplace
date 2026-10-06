import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const USE_EMBEDDED = (process.env.USE_EMBEDDED_PG ?? 'true') !== 'false';

let pgliteInstance = null;
let pgPool = null;

if (USE_EMBEDDED) {
  const dbDataDir = path.resolve(__dirname, '../../database/pgdata');
  pgliteInstance = new PGlite(dbDataDir);
  console.log(`⚡ Using Embedded PostgreSQL engine (Data directory: ${dbDataDir})`);
} else {
  const { Pool } = pg;
  const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'smart_electronics_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      };

  pgPool = new Pool(poolConfig);
  const targetHost = process.env.DATABASE_URL ? 'DATABASE_URL' : `${process.env.DB_HOST}:${process.env.DB_PORT}`;
  console.log(`🐘 Using external PostgreSQL server (${targetHost})`);
}

/**
 * Executes a SQL query across either Embedded PGlite or standard pg Pool
 */
export const query = async (text, params = []) => {
  if (USE_EMBEDDED) {
    try {
      const res = await pgliteInstance.query(text, params);
      const rowCount = res.rowCount ?? res.affectedRows ?? (res.rows ? res.rows.length : 0);
      return {
        ...res,
        rows: res.rows || [],
        rowCount,
        affectedRows: res.affectedRows ?? rowCount,
      };
    } catch (err) {
      console.error('PGlite query error:', err.message);
      throw err;
    }
  } else {
    return pgPool.query(text, params);
  }
};

/**
 * Executes raw multi-statement SQL strings (for schema and seed files)
 */
export const execRawSql = async (sqlString) => {
  if (USE_EMBEDDED) {
    return pgliteInstance.exec(sqlString);
  } else {
    return pgPool.query(sqlString);
  }
};

export default { query, execRawSql };
