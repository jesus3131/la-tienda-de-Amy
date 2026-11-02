import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../src/config/database';
import { PurchaseRepository } from '../src/modules/purchases/infrastructure/PurchaseRepository';
import { SalesRepository } from '../src/modules/sales/infrastructure/SalesRepository';
import { InventoryRepository } from '../src/modules/inventory/infrastructure/InventoryRepository';

const BIZ_A = '11111111-1111-1111-1111-111111111111';
const BIZ_B = '99999999-9999-9999-9999-999999999999';
const BRANCH_B = '88888888-8888-8888-8888-888888888888';
const WH_B = '77777777-7777-7777-7777-777777777777';

describe('Security corrections — purchases and sales mutations', () => {
  let supplierB: string;
  let productB: string;
  let poId: string;
  let poiId: string;
  let saleId: string;
  let saleItemId: string;

  beforeAll(async () => {
    await pool.query(`INSERT INTO businesses (id,name) VALUES ($1,'Biz B') ON CONFLICT DO NOTHING`, [BIZ_B]);
    await pool.query(`INSERT INTO branches (id,business_id,name) VALUES ($1,$2,'Branch B') ON CONFLICT DO NOTHING`, [BRANCH_B, BIZ_B]);
    await pool.query(`INSERT INTO warehouses (id,branch_id,name,is_default) VALUES ($1,$2,'WH B',true) ON CONFLICT DO NOTHING`, [WH_B, BRANCH_B]);

    const sr = await pool.query(`INSERT INTO suppliers (business_id,name) VALUES ($1,'Sup B') RETURNING id`, [BIZ_B]);
    supplierB = sr.rows[0].id;
    const pr = await pool.query(`INSERT INTO products (business_id,sku,name,sale_price) VALUES ($1,'SEC-MUT-PROD','Prod B',10) RETURNING id`, [BIZ_B]);
    productB = pr.rows[0].id;
    await pool.query(`INSERT INTO inventory (product_id,warehouse_id,quantity) VALUES ($1,$2,10)`, [productB, WH_B]);

    const repo = new PurchaseRepository();
    const po = await repo.create({ businessId: BIZ_B, branchId: BRANCH_B, supplierId: supplierB, items: [{ productId: productB, quantity: 5, unitCost: 2 }] });
    poId = po.id;
    poiId = po.items[0].id;

    // sale in BIZ_B
    const salesRepo = new SalesRepository();
    const sale = await salesRepo.registerSale({ businessId: BIZ_B, branchId: BRANCH_B, warehouseId: WH_B, userId: null, items: [{ productId: productB, quantity: 2, unitPrice: 10 }], payments: [{ method: 'cash', amount: 20 }] });
    saleId = sale.id;
    saleItemId = sale.items[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM sale_items WHERE sale_id=$1', [saleId]);
    await pool.query('DELETE FROM sales WHERE id=$1', [saleId]);
    await pool.query('DELETE FROM purchase_order_items WHERE purchase_order_id=$1', [poId]);
    await pool.query('DELETE FROM purchase_orders WHERE id=$1', [poId]);
    await pool.query('DELETE FROM inventory_movements WHERE product_id=$1', [productB]);
    await pool.query('DELETE FROM inventory WHERE product_id=$1', [productB]);
    await pool.query('DELETE FROM products WHERE id=$1', [productB]);
    await pool.query('DELETE FROM suppliers WHERE id=$1', [supplierB]);
    await pool.query('DELETE FROM warehouses WHERE id=$1', [WH_B]);
    await pool.query('DELETE FROM branches WHERE id=$1', [BRANCH_B]);
    await pool.query('DELETE FROM businesses WHERE id=$1', [BIZ_B]);
  });

  it('PurchaseRepository.receive blocked for wrong business', async () => {
    const repo = new PurchaseRepository();
    await expect(repo.receive({ purchaseOrderId: poId, warehouseId: WH_B, items: [{ purchaseOrderItemId: poiId, productId: productB, quantity: 1 }], businessId: BIZ_A })).rejects.toThrow('Orden no encontrada');
  });

  it('PurchaseRepository.cancel (updateStatus) returns null for wrong business', async () => {
    const repo = new PurchaseRepository();
    const r = await repo.updateStatus(poId, 'cancelled', BIZ_A);
    expect(r).toBeNull();
    // verify status unchanged
    const po = await pool.query('SELECT status FROM purchase_orders WHERE id=$1', [poId]);
    expect(po.rows[0].status).not.toBe('cancelled');
  });

  it('SalesRepository.refund throws for wrong business', async () => {
    const repo = new SalesRepository();
    await expect(repo.refund({ saleId, userId: null, reason: 'test', items: [{ saleItemId, quantity: 1 }], businessId: BIZ_A })).rejects.toThrow('Venta no encontrada');
  });
});