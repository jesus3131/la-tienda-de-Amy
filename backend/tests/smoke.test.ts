import { describe, it, expect } from 'vitest';
import { pool } from '../src/config/database';

describe('database', () => {
  it('connects and has core tables', async () => {
    const r = await pool.query("SELECT 1 as ok");
    expect(r.rows[0].ok).toBe(1);
    const t = await pool.query("SELECT count(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('products','sales','inventory','users')");
    expect(t.rows[0].c).toBe(4);
  });
});
