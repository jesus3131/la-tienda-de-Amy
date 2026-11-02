import { pool } from '../../../config/database';

export class ProductRepository {
  async list(businessId: string, filters: { search?: string; categoryId?: string; active?: boolean; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const offset = (page - 1) * limit;
    const params: any[] = [businessId];
    let where = 'WHERE p.business_id=$1';
    if (filters.search) {
      params.push(`%${filters.search}%`);
      where += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.barcode ILIKE $${params.length})`;
    }
    if (filters.categoryId) {
      params.push(filters.categoryId);
      where += ` AND p.category_id=$${params.length}`;
    }
    if (filters.active !== undefined) {
      params.push(filters.active);
      where += ` AND p.is_active=$${params.length}`;
    }
    const countRes = await pool.query(`SELECT COUNT(*) FROM products p ${where}`, params);
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT p.*, c.name as category_name,
        COALESCE(SUM(i.quantity),0) as stock
       FROM products p
       LEFT JOIN categories c ON c.id=p.category_id
       LEFT JOIN inventory i ON i.product_id=p.id
       ${where}
       GROUP BY p.id, c.name
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { data: rows, total: Number(countRes.rows[0].count), page, limit };
  }

  async findById(id: string, businessId?: string) {
    const params: any[] = [id];
    let where = 'WHERE p.id=$1';
    if (businessId) { params.push(businessId); where += ` AND p.business_id=$${params.length}`; }
    const { rows } = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ${where}`,
      params,
    );
    return rows[0] || null;
  }

  async findBySku(businessId: string, sku: string) {
    const { rows } = await pool.query('SELECT id FROM products WHERE business_id=$1 AND sku=$2', [businessId, sku]);
    return rows[0] || null;
  }

  async create(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO products (business_id,category_id,primary_supplier_id,sku,barcode,name,description,image_url,unit_of_measure,cost_price,sale_price,tax_rate,min_stock,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        data.businessId, data.categoryId || null, data.primarySupplierId || null, data.sku, data.barcode || null,
        data.name, data.description || '', data.imageUrl || null, data.unitOfMeasure || 'unit',
        data.costPrice ?? 0, data.salePrice ?? 0, data.taxRate ?? 0, data.minStock ?? 0, data.isActive ?? true,
      ],
    );
    return rows[0];
  }

  async update(id: string, data: any, businessId?: string) {
    const fields: string[] = [];
    const params: any[] = [];
    const map: Record<string, string> = {
      categoryId: 'category_id', primarySupplierId: 'primary_supplier_id', sku: 'sku', barcode: 'barcode',
      name: 'name', description: 'description', imageUrl: 'image_url', unitOfMeasure: 'unit_of_measure',
      costPrice: 'cost_price', salePrice: 'sale_price', taxRate: 'tax_rate', minStock: 'min_stock', isActive: 'is_active',
    };
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) {
        params.push(data[k]);
        fields.push(`${col}=$${params.length}`);
      }
    }
    if (fields.length === 0) return this.findById(id, businessId);
    params.push(id);
    let where = `id=$${params.length}`;
    if (businessId) { params.push(businessId); where += ` AND business_id=$${params.length}`; }
    const { rows } = await pool.query(
      `UPDATE products SET ${fields.join(',')}, updated_at=NOW() WHERE ${where} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  async softDelete(id: string, businessId?: string) {
    const params: any[] = [id];
    let where = 'id=$1';
    if (businessId) { params.push(businessId); where += ` AND business_id=$${params.length}`; }
    await pool.query(`UPDATE products SET is_active=false, updated_at=NOW() WHERE ${where}`, params);
  }
}
