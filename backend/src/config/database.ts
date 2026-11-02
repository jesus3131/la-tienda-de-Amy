import { Pool } from 'pg';
import { env } from './env';

const useSsl = env.DATABASE_URL.includes('sslmode=require') || env.NODE_ENV === 'production';
const sslConfig = useSsl
  ? {
      rejectUnauthorized: env.NODE_ENV === 'production' || Boolean(env.SUPABASE_CA),
      ...(env.SUPABASE_CA ? { ca: env.SUPABASE_CA } : {}),
    }
  : false;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 5000,
  ssl: sslConfig,
});

// Retry helper for initial connection
export async function connectWithRetry(retries = 5, delay = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const c = await pool.connect();
      c.release();
      console.log('Database connected');
      return;
    } catch (e) {
      console.error(`DB connection attempt ${i + 1}/${retries} failed`, (e as Error).message);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Could not connect to database after retries');
}

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});
