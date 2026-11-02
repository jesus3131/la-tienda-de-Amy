import { pool } from '../../../config/database';
import { ValidationError } from '../../../shared/errors/AppError';
import crypto from 'crypto';

export class SalesRepository {
  async list(businessId: string, filters: any = {}) {
    const params: any[] = [businessId];
    let where = 'WHERE s.business_id=$1';
    if (filters.from) { params.push(filters.from); where += ` AND s.created_at >= $${params.length}`; }
    if (filters.to) { params.push(filters.to); where += ` AND s.created_at <= $${params.length}`; }
    if (filters.userId) { params.push(filters.userId); where += ` AND s.user_id=$${params.length}`; }
    const { rows } = await pool.query(
      `SELECT s.*, u.name as user_name, c.name as customer_name
       FROM sales s LEFT JOIN users u ON u.id=s.user_id LEFT JOIN customers c ON c.id=s.customer_id
       ${where} ORDER BY s.created_at DESC LIMIT 200`,
      params,
    );
    return rows;
  }

  async findById(id: string, businessId?: string) {
    const params: any[] = [id];
    let where = 'WHERE id=$1';
    if (businessId) { params.push(businessId); where += ` AND business_id=$${params.length}`; }
    const { rows: sale } = await pool.query(`SELECT * FROM sales ${where}`, params);
    if (!sale[0]) return null;
    const { rows: items } = await pool.query(
      `SELECT si.*, p.name as product_name FROM sale_items si JOIN products p ON p.id=si.product_id WHERE si.sale_id=$1`,
      [id],
    );
    const { rows: payments } = await pool.query('SELECT * FROM payments WHERE sale_id=$1', [id]);
    return { ...sale[0], items, payments };
  }

  async registerSale(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const scopedIdempotencyKey = data.idempotencyKey
        ? crypto.createHash('sha256').update(`${data.businessId}:${data.idempotencyKey}`).digest('hex')
        : null;

      // idempotency check
      if (scopedIdempotencyKey) {
        const { rows: existing } = await client.query('SELECT response FROM idempotency_keys WHERE key=$1', [scopedIdempotencyKey]);
        if (existing.length) {
          const resp = existing[0].response;
          await client.query('ROLLBACK');
          return this.findById(resp.saleId, data.businessId);
        }
      }

      // validate products & stock
      const productIds = data.items.map((i: any) => i.productId);
      const { rows: products } = await client.query(
        'SELECT * FROM products WHERE id = ANY($1::uuid[]) AND business_id=$2',
        [productIds, data.businessId],
      );
      const pmap = new Map<string, any>(products.map((p: any) => [p.id, p] as [string, any]));
      if (data.customerId) {
        const { rows: customer } = await client.query(
          'SELECT id FROM customers WHERE id=$1 AND business_id=$2 AND is_active=true',
          [data.customerId, data.businessId],
        );
        if (customer.length === 0) throw new ValidationError('Cliente no válido');
      }

      // check stock per warehouse
      for (const it of data.items) {
        const p = pmap.get(it.productId);
        if (!p || !p.is_active) throw new ValidationError(`Producto no válido: ${it.productId}`);
        const { rows: inv } = await client.query(
          'SELECT quantity FROM inventory WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE',
          [it.productId, data.warehouseId],
        );
        const stock = inv.length ? Number(inv[0].quantity) : 0;
        if (stock < Number(it.quantity)) throw new ValidationError(`Stock insuficiente para ${p.name}`);
      }

      // sale totals
      let subtotal = 0; let taxTotal = 0; let discountTotal = 0;
      for (const it of data.items) {
        const p = pmap.get(it.productId)!;
        const price = Number(p.sale_price);
        const line = Number(it.quantity) * price;
        const disc = Number(it.discount || 0);
        if (disc < 0 || disc > line) throw new ValidationError(`Descuento inválido para ${p.name}`);
        const tax = (line - disc) * (Number(p.tax_rate || 0) / 100);
        subtotal += line; discountTotal += disc; taxTotal += tax;
      }
      const total = subtotal - discountTotal + taxTotal;
      const paymentsTotal = (data.payments || []).reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
      if (Math.abs(paymentsTotal - total) > 0.01) throw new ValidationError('El total de pagos no coincide con la venta');

      // insert sale
      const { rows: saleRows } = await client.query(
        `INSERT INTO sales (business_id,branch_id,warehouse_id,customer_id,cash_session_id,user_id,status,subtotal,tax_total,discount_total,total,idempotency_key,notes)
         VALUES ($1,$2,$3,$4,$5,$6,'completed',$7,$8,$9,$10,$11,$12) RETURNING *`,
        [data.businessId, data.branchId, data.warehouseId, data.customerId || null, data.cashSessionId || null, data.userId || null, subtotal, taxTotal, discountTotal, total, scopedIdempotencyKey, data.notes || null],
      );
      const sale = saleRows[0];

      for (const it of data.items) {
        const p = pmap.get(it.productId)!;
        const price = Number(p.sale_price);
        const qty = Number(it.quantity);
        const disc = Number(it.discount || 0);
        const taxRate = Number(p.tax_rate || 0);
        const lineTotal = qty * price - disc + (qty * price - disc) * (taxRate / 100);
        // batch selection FEFO
        let batchId: string | null = null;
        const { rows: batches } = await client.query(
          `SELECT id, quantity FROM product_batches WHERE product_id=$1 AND warehouse_id=$2 AND quantity>0 ORDER BY expiry_date ASC NULLS LAST`,
          [it.productId, data.warehouseId],
        );
        let remaining = qty;
        for (const b of batches) {
          if (remaining <= 0) break;
          const take = Math.min(Number(b.quantity), remaining);
          await client.query('UPDATE product_batches SET quantity = quantity - $1 WHERE id=$2', [take, b.id]);
          remaining -= take;
          if (!batchId) batchId = b.id;
        }
        if (batches.length > 0 && remaining > 0) {
          throw new ValidationError(`Lotes insuficientes para ${p.name}`);
        }
        await client.query(
          `INSERT INTO sale_items (sale_id,product_id,batch_id,quantity,unit_price,discount,tax_rate,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [sale.id, it.productId, batchId, qty, price, disc, taxRate, lineTotal],
        );
        // inventory decrement
        const { rows: inv } = await client.query('SELECT quantity FROM inventory WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE', [it.productId, data.warehouseId]);
        const before = inv.length ? Number(inv[0].quantity) : 0;
        const after = before - qty;
        if (inv.length) await client.query('UPDATE inventory SET quantity=$1, updated_at=NOW() WHERE product_id=$2 AND warehouse_id=$3', [after, it.productId, data.warehouseId]);
        else await client.query('INSERT INTO inventory (product_id,warehouse_id,quantity) VALUES ($1,$2,$3)', [it.productId, data.warehouseId, after]);
        await client.query(
          `INSERT INTO inventory_movements (business_id,branch_id,warehouse_id,product_id,batch_id,movement_type,quantity,stock_before,stock_after,reference_type,reference_id,user_id)
           VALUES ($1,$2,$3,$4,$5,'sale',$6,$7,$8,'sale',$9,$10)`,
          [data.businessId, data.branchId, data.warehouseId, it.productId, batchId, -qty, before, after, sale.id, data.userId || null],
        );
      }

      // payments
      for (const pay of data.payments || []) {
        await client.query('INSERT INTO payments (sale_id,method,amount,reference) VALUES ($1,$2,$3,$4)', [sale.id, pay.method, pay.amount, pay.reference || null]);
      }

      // cash movement if cash session
      if (data.cashSessionId) {
        const { rows: cashSession } = await client.query(
          `SELECT cs.id FROM cash_sessions cs
           JOIN cash_registers cr ON cr.id=cs.cash_register_id
           JOIN branches b ON b.id=cr.branch_id
           WHERE cs.id=$1 AND cs.status='open' AND b.business_id=$2 AND cr.branch_id=$3`,
          [data.cashSessionId, data.businessId, data.branchId],
        );
        if (cashSession.length === 0) throw new ValidationError('Sesión de caja no válida');
        await client.query(
          `INSERT INTO cash_movements (cash_session_id,type,amount,reason,reference_type,reference_id,user_id) VALUES ($1,'sale',$2,'Venta POS','sale',$3,$4)`,
          [data.cashSessionId, total, sale.id, data.userId || null],
        );
      }

      // outbox event
      await client.query('INSERT INTO outbox_events (aggregate_type,aggregate_id,event_type,payload) VALUES ($1,$2,$3,$4)', ['sale', sale.id, 'sale.completed', JSON.stringify({ saleId: sale.id, total })]);

      // idempotency store
      if (scopedIdempotencyKey) {
        const response = { saleId: sale.id, total, status: 'completed' };
        await client.query('INSERT INTO idempotency_keys (key,response) VALUES ($1,$2)', [scopedIdempotencyKey, JSON.stringify(response)]);
      }

      await client.query('COMMIT');
      const full = await this.findById(sale.id, data.businessId);
      return full;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async refund(data: { saleId: string; userId?: string; reason?: string; items: { saleItemId: string; quantity: number }[]; businessId?: string }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const params: any[] = [data.saleId];
      let where = 'WHERE id=$1';
      if (data.businessId) { params.push(data.businessId); where += ` AND business_id=$${params.length}`; }
      const { rows: saleRows } = await client.query(`SELECT * FROM sales ${where} FOR UPDATE`, params);
      const sale = saleRows[0];
      if (!sale) throw new Error('Venta no encontrada');
      let total = 0;
      const { rows: refundRow } = await client.query('INSERT INTO refunds (sale_id,user_id,reason,total) VALUES ($1,$2,$3,0) RETURNING *', [data.saleId, data.userId || null, data.reason || null]);
      const refund = refundRow[0];
      for (const it of data.items) {
        const { rows: si } = await client.query('SELECT * FROM sale_items WHERE id=$1 FOR UPDATE', [it.saleItemId]);
        const item = si[0];
        if (!item) throw new Error('Item no encontrado');
        const amount = (Number(item.unit_price) * Number(it.quantity));
        total += amount;
        await client.query('INSERT INTO refund_items (refund_id,sale_item_id,quantity,amount) VALUES ($1,$2,$3,$4)', [refund.id, it.saleItemId, it.quantity, amount]);
        // restore inventory
        const { rows: inv } = await client.query('SELECT quantity FROM inventory WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE', [item.product_id, sale.warehouse_id]);
        const before = inv.length ? Number(inv[0].quantity) : 0;
        const after = before + Number(it.quantity);
        if (inv.length) await client.query('UPDATE inventory SET quantity=$1, updated_at=NOW() WHERE product_id=$2 AND warehouse_id=$3', [after, item.product_id, sale.warehouse_id]);
        else await client.query('INSERT INTO inventory (product_id,warehouse_id,quantity) VALUES ($1,$2,$3)', [item.product_id, sale.warehouse_id, after]);
        await client.query(
          `INSERT INTO inventory_movements (business_id,branch_id,warehouse_id,product_id,movement_type,quantity,stock_before,stock_after,reference_type,reference_id,user_id,reason)
           VALUES ($1,$2,$3,$4,'return',$5,$6,$7,'refund',$8,$9,$10)`,
          [sale.business_id, sale.branch_id, sale.warehouse_id, item.product_id, it.quantity, before, after, refund.id, data.userId || null, data.reason || null],
        );
      }
      await client.query('UPDATE refunds SET total=$1 WHERE id=$2', [total, refund.id]);
      await client.query("UPDATE sales SET status='refunded', updated_at=NOW() WHERE id=$1", [data.saleId]);
      await client.query('COMMIT');
      return { refundId: refund.id, total };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
