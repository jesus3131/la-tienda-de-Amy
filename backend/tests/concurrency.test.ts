import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../src/config/database';
import { SalesRepository } from '../src/modules/sales/infrastructure/SalesRepository';

const BIZ = '11111111-1111-1111-1111-111111111111';
const BRANCH = '22222222-2222-2222-2222-222222222222';
const WH = '33333333-3333-3333-3333-333333333333';

describe('Concurrency — two cashiers selling last unit', () => {
  let productId: string;

  beforeAll(async () => {
    const pr = await pool.query(`INSERT INTO products (business_id,sku,name,sale_price,cost_price,min_stock,is_active) VALUES ($1,'CONC-PROD','Conc Product',10,5,0,true) RETURNING id`, [BIZ]);
    productId = pr.rows[0].id;
    await pool.query(`INSERT INTO inventory (product_id,warehouse_id,quantity) VALUES ($1,$2,1) ON CONFLICT (product_id,warehouse_id) DO UPDATE SET quantity=1`, [productId, WH]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM sale_items WHERE product_id=$1', [productId]);
    await pool.query('DELETE FROM sales WHERE business_id=$1 AND id IN (SELECT id FROM sales WHERE business_id=$1)', [BIZ]);
    await pool.query('DELETE FROM inventory_movements WHERE product_id=$1', [productId]);
    await pool.query('DELETE FROM inventory WHERE product_id=$1', [productId]);
    await pool.query('DELETE FROM products WHERE id=$1', [productId]);
  });

  it('only one sale succeeds when stock is 1', async () => {
    const repo = new SalesRepository();
    const makeSale = () => repo.registerSale({
      businessId: BIZ, branchId: BRANCH, warehouseId: WH, userId: null,
      items: [{ productId, quantity: 1, unitPrice: 10 }],
      payments: [{ method: 'cash', amount: 10 }],
    });

    const results = await Promise.allSettled([makeSale(), makeSale()]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // stock should be 0
    const { rows } = await pool.query('SELECT quantity FROM inventory WHERE product_id=$1 AND warehouse_id=$2', [productId, WH]);
    expect(Number(rows[0].quantity)).toBe(0);

    // only one sale persisted
    const { rows: sales } = await pool.query('SELECT count(*)::int AS c FROM sales WHERE business_id=$1', [BIZ]);
    // at least the one from this test (may include others); check movements
    const { rows: movs } = await pool.query("SELECT count(*)::int AS c FROM inventory_movements WHERE product_id=$1 AND movement_type='sale'", [productId]);
    expect(movs[0].c).toBe(1);
  });

  it('idempotency prevents duplicate with same key', async () => {
    // reset stock
    await pool.query('UPDATE inventory SET quantity=5 WHERE product_id=$1 AND warehouse_id=$2', [productId, WH]);
    const repo = new SalesRepository();
    const key = `conc-idem-${Date.now()}`;
    const s1 = await repo.registerSale({
      businessId: BIZ, branchId: BRANCH, warehouseId: WH, userId: null,
      items: [{ productId, quantity: 1, unitPrice: 10 }],
      payments: [{ method: 'cash', amount: 10 }],
      idempotencyKey: key,
    });
    const s2 = await repo.registerSale({
      businessId: BIZ, branchId: BRANCH, warehouseId: WH, userId: null,
      items: [{ productId, quantity: 1, unitPrice: 10 }],
      payments: [{ method: 'cash', amount: 10 }],
      idempotencyKey: key,
    });
    expect(s2.id).toBe(s1.id);
    // stock decreased only once
    const { rows } = await pool.query('SELECT quantity FROM inventory WHERE product_id=$1 AND warehouse_id=$2', [productId, WH]);
    expect(Number(rows[0].quantity)).toBe(4);
  });
});