import { pool } from '../../../config/database';
import { ValidationError } from '../../../shared/errors/AppError';

export class InventoryRepository {
  async getStock(productId: string, warehouseId: string) {
    const { rows } = await pool.query('SELECT quantity FROM inventory WHERE product_id=$1 AND warehouse_id=$2', [productId, warehouseId]);
    return rows[0] ? Number(rows[0].quantity) : 0;
  }

  async list(businessId: string, warehouseId?: string, lowOnly?: boolean) {
    const params: any[] = [businessId];
    let where = 'WHERE p.business_id=$1';
    if (warehouseId) { params.push(warehouseId); where += ` AND i.warehouse_id=$${params.length}`; }
    const { rows } = await pool.query(
      `SELECT p.id,p.name,p.sku,p.min_stock, i.warehouse_id, COALESCE(i.quantity,0) as quantity, w.name as warehouse_name
       FROM products p
       LEFT JOIN inventory i ON i.product_id=p.id
       LEFT JOIN warehouses w ON w.id=i.warehouse_id
       ${where}
       GROUP BY p.id, p.name, p.sku, p.min_stock, i.warehouse_id, w.name
       ORDER BY p.name`,
      params,
    );
    let data = rows;
    if (lowOnly) data = data.filter((r: any) => Number(r.quantity) <= Number(r.min_stock));
    return data;
  }

  async adjust(params: { productId: string; warehouseId: string; quantity: number; type: string; reason?: string; userId?: string; businessId?: string; branchId?: string }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (params.businessId) {
        const { rows: p } = await client.query('SELECT id FROM products WHERE id=$1 AND business_id=$2', [params.productId, params.businessId]);
        if (p.length === 0) throw new ValidationError('Producto no encontrado en la empresa');
      }
      const { rows: invRows } = await client.query(
        'SELECT quantity FROM inventory WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE',
        [params.productId, params.warehouseId],
      );
      const before = invRows.length ? Number(invRows[0].quantity) : 0;
      const after = before + params.quantity;
      if (after < 0) throw new ValidationError('Inventario insuficiente');
      if (invRows.length) {
        await client.query('UPDATE inventory SET quantity=$1, updated_at=NOW() WHERE product_id=$2 AND warehouse_id=$3', [after, params.productId, params.warehouseId]);
      } else {
        await client.query('INSERT INTO inventory (product_id,warehouse_id,quantity) VALUES ($1,$2,$3)', [params.productId, params.warehouseId, after]);
      }
      await client.query(
        `INSERT INTO inventory_movements (business_id,branch_id,warehouse_id,product_id,movement_type,quantity,stock_before,stock_after,reason,user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [params.businessId || null, params.branchId || null, params.warehouseId, params.productId, params.type, params.quantity, before, after, params.reason || null, params.userId || null],
      );
      await client.query('COMMIT');
      return { before, after };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async movements(productId?: string, businessId?: string, limit = 100) {
    const params: any[] = [];
    const conds: string[] = [];
    if (productId) { params.push(productId); conds.push(`m.product_id=$${params.length}`); }
    if (businessId) { params.push(businessId); conds.push(`m.business_id=$${params.length}`); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    params.push(limit);
    const { rows } = await pool.query(
      `SELECT m.*, p.name as product_name FROM inventory_movements m LEFT JOIN products p ON p.id=m.product_id ${where} ORDER BY m.created_at DESC LIMIT $${params.length}`,
      params,
    );
    return rows;
  }

  async alerts(businessId: string) {
    const { rows: low } = await pool.query(
      `SELECT p.id,p.name,p.sku,p.min_stock, COALESCE(SUM(i.quantity),0) as quantity
       FROM products p LEFT JOIN inventory i ON i.product_id=p.id
       WHERE p.business_id=$1 AND p.is_active=true
       GROUP BY p.id HAVING COALESCE(SUM(i.quantity),0) <= p.min_stock`,
      [businessId],
    );
    const { rows: expired } = await pool.query(
      `SELECT pb.id,pb.product_id,p.name,pb.batch_number,pb.quantity,pb.expiry_date
       FROM product_batches pb JOIN products p ON p.id=pb.product_id
     WHERE p.business_id=$1 AND pb.expiry_date IS NOT NULL AND pb.expiry_date <= CURRENT_DATE AND pb.quantity>0`,
    [businessId],
    );
    const { rows: soon } = await pool.query(
      `SELECT pb.id,pb.product_id,p.name,pb.batch_number,pb.quantity,pb.expiry_date
       FROM product_batches pb JOIN products p ON p.id=pb.product_id
     WHERE p.business_id=$1 AND pb.expiry_date IS NOT NULL AND pb.expiry_date > CURRENT_DATE AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND pb.quantity>0
       ORDER BY pb.expiry_date`,
    [businessId],
    );
    return { lowStock: low, expired, expiringSoon: soon };
  }
}
