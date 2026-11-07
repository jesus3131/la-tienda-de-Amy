import { pool, connectWithRetry } from '../config/database';

async function main() {
  console.log('Testing PostgreSQL connection...');
  const start = Date.now();
  await connectWithRetry(3, 1000);
  console.log('Connected in', Date.now() - start, 'ms');
  const r = await pool.query('SELECT current_database() AS db, current_user AS usr, version() AS ver');
  console.log('Database:', r.rows[0].db);
  console.log('User:', r.rows[0].usr);
  console.log('Version:', r.rows[0].ver.split(' ')[0], r.rows[0].ver.split(' ')[1]);
  const t = await pool.query("SELECT count(*)::int AS c FROM information_schema.tables WHERE table_schema='public'");
  console.log('Tables:', t.rows[0].c);
  await pool.end();
  console.log('Connection test: OK');
}

main().catch((e) => { console.error('FAILED:', (e as Error).message); process.exit(1); });
