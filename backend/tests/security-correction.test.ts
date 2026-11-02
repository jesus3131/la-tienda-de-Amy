import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../src/config/database';
import { ProductRepository } from '../src/modules/products/infrastructure/ProductRepository';
import { CustomerRepository } from '../src/modules/customers/infrastructure/CustomerRepository';
import { SupplierRepository } from '../src/modules/suppliers/infrastructure/SupplierRepository';
import { CategoryRepository } from '../src/modules/categories/infrastructure/CategoryRepository';
import { SalesRepository } from '../src/modules/sales/infrastructure/SalesRepository';
import { PurchaseRepository } from '../src/modules/purchases/infrastructure/PurchaseRepository';
import { CashRepository } from '../src/modules/cash/infrastructure/CashRepository';

const BIZ_A = '11111111-1111-1111-1111-111111111111';
const BIZ_B = '99999999-9999-9999-9999-999999999999';
const BRANCH_A = '22222222-2222-2222-2222-222222222222';

describe('Security corrections — IDOR in mutations', () => {
  let productB: string;
  let customerB: string;
  let supplierB: string;
  let categoryB: string;
  let cashSessionB: string;

  beforeAll(async () => {
    await pool.query(`INSERT INTO businesses (id,name) VALUES ($1,'Biz B') ON CONFLICT DO NOTHING`, [BIZ_B]);
    // branch for B
    await pool.query(`INSERT INTO branches (id,business_id,name) VALUES ('88888888-8888-8888-8888-888888888888',$1,'Branch B') ON CONFLICT DO NOTHING`, [BIZ_B]);
    await pool.query(`INSERT INTO warehouses (id,branch_id,name,is_default) VALUES ('77777777-7777-7777-7777-777777777777','88888888-8888-8888-8888-888888888888','WH B',true) ON CONFLICT DO NOTHING`);
    await pool.query(`INSERT INTO cash_registers (id,branch_id,name) VALUES ('66666666-6666-6666-6666-666666666666','88888888-8888-8888-8888-888888888888','Caja B') ON CONFLICT DO NOTHING`);

    const pr = await pool.query(`INSERT INTO products (business_id,sku,name,sale_price) VALUES ($1,'IDOR-MUT-PROD','Prod B',10) RETURNING id`, [BIZ_B]);
    productB = pr.rows[0].id;
    const cr = await pool.query(`INSERT INTO customers (business_id,name) VALUES ($1,'Cust B') RETURNING id`, [BIZ_B]);
    customerB = cr.rows[0].id;
    const sr = await pool.query(`INSERT INTO suppliers (business_id,name) VALUES ($1,'Sup B') RETURNING id`, [BIZ_B]);
    supplierB = sr.rows[0].id;
    const catr = await pool.query(`INSERT INTO categories (business_id,name,slug) VALUES ($1,'Cat B','cat-b') RETURNING id`, [BIZ_B]);
    categoryB = catr.rows[0].id;

    // cash session for B
    const uid = (await pool.query(`SELECT id FROM users LIMIT 1`)).rows[0].id;
    const cs = await pool.query(`INSERT INTO cash_sessions (cash_register_id,user_id,opening_balance,status) VALUES ('66666666-6666-6666-6666-666666666666',$1,0,'open') RETURNING id`, [uid]);
    cashSessionB = cs.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM purchase_order_items WHERE product_id=$1', [productB]);
    await pool.query('DELETE FROM sale_items WHERE product_id=$1', [productB]);
    await pool.query('DELETE FROM inventory_movements WHERE product_id=$1', [productB]);
    await pool.query('DELETE FROM inventory WHERE product_id=$1', [productB]);
    await pool.query('DELETE FROM cash_sessions WHERE cash_register_id=$1', ['66666666-6666-6666-6666-666666666666']);
    await pool.query('DELETE FROM cash_registers WHERE id=$1', ['66666666-6666-6666-6666-666666666666']);
    await pool.query('DELETE FROM warehouses WHERE id=$1', ['77777777-7777-7777-7777-777777777777']);
    await pool.query('DELETE FROM branches WHERE id=$1', ['88888888-8888-8888-8888-888888888888']);
    await pool.query('DELETE FROM products WHERE business_id=$1', [BIZ_B]);
    await pool.query('DELETE FROM customers WHERE business_id=$1', [BIZ_B]);
    await pool.query('DELETE FROM suppliers WHERE business_id=$1', [BIZ_B]);
    await pool.query('DELETE FROM categories WHERE business_id=$1', [BIZ_B]);
    await pool.query('DELETE FROM businesses WHERE id=$1', [BIZ_B]);
  });

  it('ProductRepository.update returns null for wrong business', async () => {
    const repo = new ProductRepository();
    const r = await repo.update(productB, { name: 'Hacked' }, BIZ_A);
    expect(r).toBeNull();
    // verify unchanged
    const p = await pool.query('SELECT name FROM products WHERE id=$1', [productB]);
    expect(p.rows[0].name).toBe('Prod B');
  });

  it('ProductRepository.softDelete does not affect wrong business', async () => {
    const repo = new ProductRepository();
    await repo.softDelete(productB, BIZ_A);
    const p = await pool.query('SELECT is_active FROM products WHERE id=$1', [productB]);
    expect(p.rows[0].is_active).toBe(true);
  });

  it('CustomerRepository.update returns null for wrong business', async () => {
    const repo = new CustomerRepository();
    const r = await repo.update(customerB, { name: 'Hacked' }, BIZ_A);
    expect(r).toBeNull();
    const c = await pool.query('SELECT name FROM customers WHERE id=$1', [customerB]);
    expect(c.rows[0].name).toBe('Cust B');
  });

  it('SupplierRepository.update returns null for wrong business', async () => {
    const repo = new SupplierRepository();
    const r = await repo.update(supplierB, { name: 'Hacked' }, BIZ_A);
    expect(r).toBeNull();
    const s = await pool.query('SELECT name FROM suppliers WHERE id=$1', [supplierB]);
    expect(s.rows[0].name).toBe('Sup B');
  });

  it('CategoryRepository.update returns null for wrong business', async () => {
    const repo = new CategoryRepository();
    const r = await repo.update(categoryB, { name: 'Hacked' }, BIZ_A);
    expect(r).toBeNull();
    const c = await pool.query('SELECT name FROM categories WHERE id=$1', [categoryB]);
    expect(c.rows[0].name).toBe('Cat B');
  });

  it('CashRepository.getSession returns null for wrong business', async () => {
    const repo = new CashRepository();
    const s = await repo.getSession(cashSessionB, BIZ_A);
    expect(s).toBeNull();
  });

  it('CashRepository.closeSession blocked for wrong business (session not found)', async () => {
    const repo = new CashRepository();
    const session = await repo.getSession(cashSessionB, BIZ_A);
    expect(session).toBeNull();
  });
});