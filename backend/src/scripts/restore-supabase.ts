import fs from 'fs';
import { pool, connectWithRetry } from '../config/database';

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Usage: restore-supabase <file.sql>'); process.exit(1); }
  const sql = fs.readFileSync(file, 'utf8');
  await connectWithRetry();
  console.log('Restoring', file, '(', sql.length, 'chars)');
  await pool.query(sql);
  console.log('Restore completed');
  await pool.end();
}

main().catch((e) => { console.error('FAILED:', (e as Error).message); process.exit(1); });
