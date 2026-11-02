import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:4000';

async function login(email: string, password: string) {
  const r = await fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return r.json();
}

describe('rbac (requires running server)', () => {
  it('admin can create product', async () => {
    const { token } = await login('admin@erp.local', 'admin123');
    const r = await fetch(`${BASE}/api/v1/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sku: 'RBAC-TEST-' + Date.now(), name: 'RBAC Product', salePrice: 10 }) });
    expect(r.status).toBe(201);
    const p = await r.json();
    // cleanup
    await fetch(`${BASE}/api/v1/products/${p.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  });

  it('cashier cannot create product (403)', async () => {
    const { token } = await login('cashier@erp.local', 'cashier123');
    const r = await fetch(`${BASE}/api/v1/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sku: 'RBAC-CASHIER', name: 'Nope', salePrice: 10 }) });
    expect(r.status).toBe(403);
  });

  it('unauthenticated request returns 401', async () => {
    const r = await fetch(`${BASE}/api/v1/products`);
    expect(r.status).toBe(401);
  });
});
