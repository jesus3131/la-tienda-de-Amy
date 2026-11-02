import { Pool } from 'pg';
import { env } from './env';
import { getTenantContext } from '../shared/utils/tenantContext';

const useSsl = env.DATABASE_URL.includes('sslmode=require') || env.NODE_ENV === 'production';
const sslConfig = useSsl
  ? {
      rejectUnauthorized: env.NODE_ENV === 'production' || Boolean(env.SUPABASE_CA),
      ...(env.SUPABASE_CA ? { ca: env.SUPABASE_CA } : {}),
    }
  : false;

class TenantAwarePool extends Pool {
  private async setContext(client: any) {
    const context = getTenantContext();
    await client.query(
      `SELECT set_config('app.current_business_id', $1, false),
              set_config('app.current_user_id', $2, false)`,
      [context?.businessId || '', context?.userId || ''],
    );
  }

  override async connect(): Promise<any> {
    const client = await super.connect();
    await this.setContext(client);
    return client;
  }

  override async query(...args: any[]): Promise<any> {
    const client = await super.connect();
    try {
      await this.setContext(client);
      return await (client.query as any)(...args);
    } finally {
      await client.query(
        `SELECT set_config('app.current_business_id', '', false),
                set_config('app.current_user_id', '', false)`,
      ).catch((error) => console.error('Failed to clear tenant context', error));
      client.release();
    }
  }
}

export const pool = new TenantAwarePool({
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
