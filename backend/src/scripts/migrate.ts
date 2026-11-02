import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const sqlPath = path.resolve(__dirname, '../../migrations/000_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Running migration:', sqlPath);
  await pool.query(sql);
  console.log('Migration completed');
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
