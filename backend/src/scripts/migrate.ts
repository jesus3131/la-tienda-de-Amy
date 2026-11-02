import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const migrationDir = path.resolve(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationDir).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();

    for (const file of files) {
      const version = file.replace(/\.sql$/, '');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [738491]);
        const { rows } = await client.query('SELECT 1 FROM schema_migrations WHERE version=$1', [version]);
        if (rows.length === 0) {
          const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
          console.log('Running migration:', file);
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
          console.log('Migration completed:', file);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
