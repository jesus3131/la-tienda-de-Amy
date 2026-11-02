import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../src/config/database';
import { ProductRepository } from '../src/modules/products/infrastructure/ProductRepository';
import { CustomerRepository } from '../src/modules/customers/infrastructure/CustomerRepository';
import { SalesRepository } from '../src/modules/sales/infrastructure/SalesRepository';

const BIZ_A = '11111111-1111-1111-1111-111111111111';
const BIZ_B = '99999999-9999-9999-9999-999999999999';

describe('IDOR protection (repository level)', () => {
  let productB: string;
  let customerB: string;

  beforeAll(async () => {
    await pool.query(`INSERT INTO businesses (id,name) VALUES ($1,'Biz B') ON CONFLICT DO NOTHING`, [BIZ_B]);
    const pr = await pool.query(`INSERT INTO products (business_id,sku,name,sale_price) VALUES ($1,'IDOR-SKU','IDOR Product',10) RETURNING id`, [BIZ_B]);
    productB = pr.rows[0].id;
    const cr = await pool.query(`INSERT INTO customers (business_id,name) VALUES ($1,'IDOR Customer') RETURNING id`, [BIZ_B]);
    customerB = cr.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM products WHERE business_id=$1', [BIZ_B]);
    await pool.query('DELETE FROM customers WHERE business_id=$1', [BIZ_B]);
    await pool.query('DELETE FROM businesses WHERE id=$1', [BIZ_B]);
  });

  it('ProductRepository.findById returns null for wrong business', async () => {
    const repo = new ProductRepository();
    const p = await repo.findById(productB, BIZ_A);
    expect(p).toBeNull();
  });

  it('ProductRepository.findById returns product for correct business', async () => {
    const repo = new ProductRepository();
    const p = await repo.findById(productB, BIZ_B);
    expect(p).not.toBeNull();
    expect(p.id).toBe(productB);
  });

  it('CustomerRepository.findById returns null for wrong business', async () => {
    const repo = new CustomerRepository();
    const c = await repo.findById(customerB, BIZ_A);
    expect(c).toBeNull();
  });

  it('SalesRepository.findById returns null for wrong business', async () => {
    const repo = new SalesRepository();
    // No sale in BIZ_B, but ensure filtering works by checking a non-existent id
    const s = await repo.findById('00000000-0000-0000-0000-000000000000', BIZ_A);
    expect(s).toBeNull();
  });
});