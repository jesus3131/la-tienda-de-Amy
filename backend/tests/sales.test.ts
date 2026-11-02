import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../src/config/database';
import { SalesRepository } from '../src/modules/sales/infrastructure/SalesRepository';
import { ProductRepository } from '../src/modules/products/infrastructure/ProductRepository';
import { InventoryRepository } from '../src/modules/inventory/infrastructure/InventoryRepository';

const BID = '11111111-1111-1111-1111-111111111111';
const WH = '33333333-3333-3333-3333-333333333333';
const BR = '22222222-2222-2222-2222-222222222222';

describe('sales', () => {
  let productId: string;

  beforeAll(async () => {
    const pr = new ProductRepository();
    const p = await pr.create({ businessId: BID, sku: 'TST-SALE-1', name: 'Test Sale Product', costPrice: 10, salePrice: 20, minStock: 0, isActive: true });
    productId = p.id;
    const inv = new InventoryRepository();
    await inv.adjust({ productId, warehouseId: WH, quantity: 10, type: 'entry', businessId: BID, branchId: BR });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM sale_items WHERE product_id=$1', [productId]);
    await pool.query('DELETE FROM sales WHERE business_id=$1', [BID]);
    await pool.query('DELETE FROM inventory_movements WHERE product_id=$1', [productId]);
    await pool.query('DELETE FROM inventory WHERE product_id=$1', [productId]);
    await pool.query('DELETE FROM products WHERE id=$1', [productId]);
  });

  it('registers sale and decrements stock', async () => {
    const repo = new SalesRepository();
    const sale = await repo.registerSale({
      businessId: BID, branchId: BR, warehouseId: WH, userId: null,
      items: [{ productId, quantity: 3, unitPrice: 20 }],
      payments: [{ method: 'cash', amount: 60 }],
    });
    expect(Number(sale.total)).toBe(60);
    const inv = new InventoryRepository();
    const stock = await inv.getStock(productId, WH);
    expect(stock).toBe(7);
  });

  it('prevents negative stock', async () => {
    const repo = new SalesRepository();
    await expect(repo.registerSale({
      businessId: BID, branchId: BR, warehouseId: WH, userId: null,
      items: [{ productId, quantity: 100, unitPrice: 20 }],
      payments: [{ method: 'cash', amount: 2000 }],
    })).rejects.toThrow();
  });

  it('idempotency returns same sale', async () => {
    const repo = new SalesRepository();
    const key = 'idem-test-' + Date.now();
    const s1 = await repo.registerSale({
      businessId: BID, branchId: BR, warehouseId: WH, userId: null,
      items: [{ productId, quantity: 1, unitPrice: 20 }],
      payments: [{ method: 'cash', amount: 20 }],
      idempotencyKey: key,
    });
    const s2 = await repo.registerSale({
      businessId: BID, branchId: BR, warehouseId: WH, userId: null,
      items: [{ productId, quantity: 1, unitPrice: 20 }],
      payments: [{ method: 'cash', amount: 20 }],
      idempotencyKey: key,
    });
    expect(s2.id).toBe(s1.id);
  });
});
