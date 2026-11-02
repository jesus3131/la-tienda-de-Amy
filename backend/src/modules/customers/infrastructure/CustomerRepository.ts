import { pool } from '../../../config/database';

export class CustomerRepository {
  async list(businessId: string, search?: string) {
    const params: any[] = [businessId];
    let where = 'WHERE business_id=$1 AND is_active=true';
    if (search) { params.push(`%${search}%`); where += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR document_id ILIKE $${params.length})`; }
    const { rows } = await pool.query(`SELECT * FROM customers ${where} ORDER BY name`, params);
    return rows;
  }
  async create(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO customers (business_id,name,document_id,phone,email,address,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.businessId, data.name, data.documentId || null, data.phone || null, data.email || null, data.address || null, data.notes || null],
    );
    return rows[0];
  }
  async update(id: string, data: any, businessId?: string) {
    const fields: string[] = []; const params: any[] = [];
    const map: any = { name:'name', documentId:'document_id', phone:'phone', email:'email', address:'address', notes:'notes', isActive:'is_active' };
    for (const [k,col] of Object.entries(map)) if (data[k]!==undefined){ params.push(data[k]); fields.push(`${col}=$${params.length}`); }
    if(!fields.length) return null;
    params.push(id);
    let where = `id=$${params.length}`;
    if (businessId) { params.push(businessId); where += ` AND business_id=$${params.length}`; }
    const {rows}=await pool.query(`UPDATE customers SET ${fields.join(',')}, updated_at=NOW() WHERE ${where} RETURNING *`,params);
    return rows[0] || null;
  }
  async findById(id:string, businessId?:string){ const params:any[]=[id]; let where='WHERE id=$1'; if(businessId){ params.push(businessId); where+=' AND business_id=$'+params.length; } const {rows}=await pool.query(`SELECT * FROM customers ${where}`,params); return rows[0]||null; }
}
