import { pool } from '../../../config/database';

export class CategoryRepository {
  async list(businessId: string) {
    const { rows } = await pool.query('SELECT * FROM categories WHERE business_id=$1 ORDER BY sort_order, name', [businessId]);
    return rows;
  }
  async create(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO categories (business_id,name,slug,description,parent_id,sort_order,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.businessId, data.name, data.slug, data.description || '', data.parentId || null, data.sortOrder || 0, data.isActive ?? true],
    );
    return rows[0];
  }
  async update(id: string, data: any, businessId?: string) {
    const fields: string[] = []; const params: any[] = [];
    if (data.name !== undefined) { params.push(data.name); fields.push(`name=$${params.length}`); }
    if (data.description !== undefined) { params.push(data.description); fields.push(`description=$${params.length}`); }
    if (data.isActive !== undefined) { params.push(data.isActive); fields.push(`is_active=$${params.length}`); }
    if (fields.length === 0) return null;
    params.push(id);
    let where = `id=$${params.length}`;
    if (businessId) { params.push(businessId); where += ` AND business_id=$${params.length}`; }
    const { rows } = await pool.query(`UPDATE categories SET ${fields.join(',')}, updated_at=NOW() WHERE ${where} RETURNING *`, params);
    return rows[0] || null;
  }
}
