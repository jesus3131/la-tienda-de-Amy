import { pool } from '../../../config/database';
import { ValidationError } from '../../../shared/errors/AppError';

export class PurchaseRepository {
  async list(businessId: string, status?: string) {
    const params: any[] = [businessId];
    let where = 'WHERE po.business_id=$1';
    if (status) { params.push(status); where += ` AND po.status=$${params.length}`; }
    const { rows } = await pool.query(
      `SELECT po.*, s.name as supplier_name FROM purchase_orders po JOIN suppliers s ON s.id=po.supplier_id ${where} ORDER BY po.created_at DESC`,
      params,
    );
    return rows;
  }

  async findById(id: string, businessId?: string) {
    const params: any[] = [id];
    let where = 'WHERE id=$1';
    if (businessId) { params.push(businessId); where += ` AND business_id=$${params.length}`; }
    const { rows: po } = await pool.query(`SELECT * FROM purchase_orders ${where}`, params);
    if (!po[0]) return null;
    const { rows: items } = await pool.query('SELECT * FROM purchase_order_items WHERE purchase_order_id=$1', [id]);
    return { ...po[0], items };
  }

  async create(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: supplier } = await client.query(
        'SELECT id FROM suppliers WHERE id=$1 AND business_id=$2 AND is_active=true',
        [data.supplierId, data.businessId],
      );
      if (supplier.length === 0) throw new ValidationError('Proveedor no válido');
      const { rows: branch } = await client.query(
        'SELECT id FROM branches WHERE id=$1 AND business_id=$2 AND is_active=true',
        [data.branchId, data.businessId],
      );
      if (branch.length === 0) throw new ValidationError('Sucursal no válida');
      const { rows } = await client.query(
        `INSERT INTO purchase_orders (business_id,branch_id,supplier_id,status,notes,created_by) VALUES ($1,$2,$3,'draft',$4,$5) RETURNING *`,
        [data.businessId, data.branchId || null, data.supplierId, data.notes || null, data.userId || null],
      );
      const po = rows[0];
      let subtotal = 0; let taxTotal = 0;
      for (const it of data.items) {
        const { rows: product } = await client.query(
          'SELECT id FROM products WHERE id=$1 AND business_id=$2 AND is_active=true',
          [it.productId, data.businessId],
        );
        if (product.length === 0) throw new ValidationError('Producto no válido');
        const lineTotal = Number(it.quantity) * Number(it.unitCost);
        const tax = lineTotal * (Number(it.taxRate || 0) / 100);
        subtotal += lineTotal; taxTotal += tax;
        await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id,product_id,quantity,unit_cost,tax_rate) VALUES ($1,$2,$3,$4,$5)`,
          [po.id, it.productId, it.quantity, it.unitCost, it.taxRate || 0],
        );
      }
      await client.query('UPDATE purchase_orders SET subtotal=$1, tax_total=$2, total=$3 WHERE id=$4', [subtotal, taxTotal, subtotal + taxTotal, po.id]);
      await client.query('COMMIT');
      return this.findById(po.id);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateStatus(id: string, status: string, businessId?: string) {
    const params: any[] = [status, id];
    let where = 'WHERE id=$2';
    if (businessId) { params.push(businessId); where += ` AND business_id=$${params.length}`; }
    const { rows } = await pool.query(`UPDATE purchase_orders SET status=$1, updated_at=NOW() ${where} RETURNING *`, params);
    return rows[0] || null;
  }

  async receive(data: { purchaseOrderId: string; warehouseId: string; items: Array<{ purchaseOrderItemId: string; productId: string; quantity: number; expiryDate?: string; batchNumber?: string }>; userId?: string; businessId?: string }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const params: any[] = [data.purchaseOrderId];
      let where = 'WHERE id=$1';
      if (data.businessId) { params.push(data.businessId); where += ` AND business_id=$${params.length}`; }
      const { rows: poRows } = await client.query(`SELECT * FROM purchase_orders ${where} FOR UPDATE`, params);
      const po = poRows[0];
      if (!po) throw new ValidationError('Orden no encontrada');
      if (po.status === 'received' || po.status === 'cancelled') throw new ValidationError('Orden no recepcionable');
      const { rows: warehouse } = await client.query(
        `SELECT w.id FROM warehouses w
         JOIN branches b ON b.id=w.branch_id
         WHERE w.id=$1 AND w.branch_id=$2 AND b.business_id=$3`,
        [data.warehouseId, po.branch_id, po.business_id],
      );
      if (warehouse.length === 0) throw new ValidationError('Almacén no válido para la orden');
      // create receipt
      const { rows: gr } = await client.query(
        `INSERT INTO goods_receipts (purchase_order_id,warehouse_id,received_by) VALUES ($1,$2,$3) RETURNING *`,
        [data.purchaseOrderId, data.warehouseId, data.userId || null],
      );
      for (const it of data.items) {
        const { rows: orderItem } = await client.query(
          `SELECT poi.product_id, poi.quantity, poi.received_quantity
           FROM purchase_order_items poi
           JOIN products p ON p.id=poi.product_id AND p.business_id=$3
           WHERE poi.id=$1 AND poi.purchase_order_id=$2
           FOR UPDATE`,
          [it.purchaseOrderItemId, data.purchaseOrderId, po.business_id],
        );
        if (orderItem.length === 0 || orderItem[0].product_id !== it.productId) throw new ValidationError('Ítem de compra no válido');
        if (Number(it.quantity) > Number(orderItem[0].quantity) - Number(orderItem[0].received_quantity)) {
          throw new ValidationError('Cantidad recibida supera la cantidad pendiente');
        }
        // batch
        let batchId: string | null = null;
        if (it.expiryDate) {
          const { rows: b } = await client.query(
            `INSERT INTO product_batches (product_id,warehouse_id,batch_number,quantity,expiry_date) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
            [it.productId, data.warehouseId, it.batchNumber || null, it.quantity, it.expiryDate],
          );
          batchId = b[0].id;
        }
        await client.query(
          `INSERT INTO goods_receipt_items (goods_receipt_id,purchase_order_item_id,product_id,batch_id,quantity,expiry_date) VALUES ($1,$2,$3,$4,$5,$6)`,
          [gr[0].id, it.purchaseOrderItemId, it.productId, batchId, it.quantity, it.expiryDate || null],
        );
        // update received_quantity
        await client.query('UPDATE purchase_order_items SET received_quantity = received_quantity + $1 WHERE id=$2', [it.quantity, it.purchaseOrderItemId]);
        // inventory upsert
        const { rows: inv } = await client.query('SELECT quantity FROM inventory WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE', [it.productId, data.warehouseId]);
        const before = inv.length ? Number(inv[0].quantity) : 0;
        const after = before + Number(it.quantity);
        if (inv.length) await client.query('UPDATE inventory SET quantity=$1, updated_at=NOW() WHERE product_id=$2 AND warehouse_id=$3', [after, it.productId, data.warehouseId]);
        else await client.query('INSERT INTO inventory (product_id,warehouse_id,quantity) VALUES ($1,$2,$3)', [it.productId, data.warehouseId, after]);
        await client.query(
          `INSERT INTO inventory_movements (business_id,branch_id,warehouse_id,product_id,batch_id,movement_type,quantity,stock_before,stock_after,reference_type,reference_id,user_id)
           VALUES ($1,$2,$3,$4,$5,'entry',$6,$7,$8,'purchase',$9,$10)`,
          [po.business_id, po.branch_id, data.warehouseId, it.productId, batchId, it.quantity, before, after, data.purchaseOrderId, data.userId || null],
        );
      }
      // determine status
      const { rows: items } = await client.query('SELECT quantity, received_quantity FROM purchase_order_items WHERE purchase_order_id=$1', [data.purchaseOrderId]);
      const allReceived = items.every((i: any) => Number(i.received_quantity) >= Number(i.quantity));
      const anyReceived = items.some((i: any) => Number(i.received_quantity) > 0);
      const newStatus = allReceived ? 'received' : (anyReceived ? 'partial' : po.status);
      await client.query('UPDATE purchase_orders SET status=$1, updated_at=NOW() WHERE id=$2', [newStatus, data.purchaseOrderId]);
      await client.query('COMMIT');
      return { receiptId: gr[0].id, status: newStatus };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
