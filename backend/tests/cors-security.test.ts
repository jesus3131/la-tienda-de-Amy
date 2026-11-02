import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_JWT_SECRET = 'test-secret-with-at-least-32-characters';

function createCorsApp(frontendOrigin = '') {
  const app = express();
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || !frontendOrigin) {
          callback(null, false);
          return;
        }
        callback(null, requestOrigin === frontendOrigin);
      },
      credentials: true,
    }),
  );
  app.get('/public', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('CORS security contract', () => {
  it('does not authorize browser origins when FRONTEND_ORIGIN is missing', async () => {
    const response = await request(createCorsApp()).get('/public').set('Origin', 'https://any.example');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('authorizes only the exact configured HTTPS origin', async () => {
    const app = createCorsApp('https://store.example');
    const allowed = await request(app).get('/public').set('Origin', 'https://store.example');
    const different = await request(app).get('/public').set('Origin', 'https://other.example');

    expect(allowed.headers['access-control-allow-origin']).toBe('https://store.example');
    expect(different.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('does not authorize a different domain', async () => {
    const response = await request(createCorsApp('https://store.example'))
      .get('/public')
      .set('Origin', 'https://store.example.attacker.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects HTTP FRONTEND_ORIGIN in production configuration', async () => {
    vi.resetModules();
    vi.unmock('../src/config/env');
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      ENV_FILE: process.env.ENV_FILE,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
    };
    process.env.NODE_ENV = 'production';
    process.env.ENV_FILE = '__missing__.env';
    process.env.DATABASE_URL = 'postgresql://test.invalid/db';
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.FRONTEND_ORIGIN = 'http://store.example';

    try {
      await expect(import('../src/config/env')).rejects.toThrow('FRONTEND_ORIGIN must use HTTPS in production');
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

describe('authentication and authorization contract', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 401 without a JWT', async () => {
    vi.doMock('../src/config/env', () => ({ env: { JWT_SECRET: TEST_JWT_SECRET } }));
    vi.doMock('../src/config/database', () => ({ pool: { query: vi.fn() } }));
    const { authenticate } = await import('../src/shared/middleware/auth');
    const app = express();
    app.get('/protected', authenticate, (_req, res) => res.sendStatus(200));

    const response = await request(app).get('/protected');

    expect(response.status).toBe(401);
  });

  it('returns 403 when the authenticated user lacks the required role', async () => {
    vi.doMock('../src/config/env', () => ({ env: { JWT_SECRET: TEST_JWT_SECRET } }));
    vi.doMock('../src/config/database', () => ({
      pool: {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [{ id: 'session-1' }] })
          .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'test@example.com', business_id: 'business-1', role: 'cashier' }] })
          .mockResolvedValueOnce({ rows: [{ branch_id: 'branch-1' }] }),
      },
    }));
    const { authenticate, requireRole } = await import('../src/shared/middleware/auth');
    const app = express();
    app.get('/admin', authenticate, requireRole('admin'), (_req, res) => res.sendStatus(200));
    const token = jwt.sign({ userId: 'user-1' }, TEST_JWT_SECRET);

    const response = await request(app).get('/admin').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
