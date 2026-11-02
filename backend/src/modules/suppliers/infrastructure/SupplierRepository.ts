import { pool } from '../../../config/database';

export class SupplierRepository {
  async list(businessId: string, search?: string) {
    const params: any[] = [businessId];
    let where = 'WHERE business_id=$1';
    if (search) { params.push(`%${search}%`); where += ` AND (name ILIKE $${params.length} OR company ILIKE $${params.length})`; }
    const { rows } = await pool.query(`SELECT * FROM suppliers ${where} ORDER BY name`, params);
    return rows;
  }
  async create(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (business_id,name,company,tax_id,phone,email,address,notes,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [data.businessId, data.name, data.company || null, data.taxId || null, data.phone || null, data.email || null, data.address || null, data.notes || null, data.isActive ?? true],
    );
    return rows[0];
  }
  async update(id: string, data: any, businessId?: string) {
    const fields: string[] = []; const params: any[] = [];
    const map: any = { name:'name', company:'company', taxId:'tax_id', phone:'phone', email:'email', address:'address', notes:'notes', isActive:'is_active' };
    for (const [k,col] of Object.entries(map)) {
      if (data[k] !== undefined) { params.push(data[k]); fields.push(`${col}=$${params.length}`); }
    }
    if (!fields.length) return null;
    params.push(id);
    let where = `id=$${params.length}`;
    if (businessId) { params.push(businessId); where += ` AND business_id=$${params.length}`; }
    const { rows } = await pool.query(`UPDATE suppliers SET ${fields.join(',')}, updated_at=NOW() WHERE ${where} RETURNING *`, params);
    return rows[0] || null;
  }
  async findById(id: string, businessId?: string) { const params:any[]=[id]; let where='WHERE id=$1'; if(businessId){ params.push(businessId); where+=' AND business_id=$'+params.length; } const {rows}=await pool.query(`SELECT * FROM suppliers ${where}`,params); return rows[0]||null; }
}
