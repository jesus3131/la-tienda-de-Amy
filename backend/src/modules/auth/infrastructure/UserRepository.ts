import { pool } from '../../../config/database';

export class UserRepository {
  async findByEmail(email: string) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    return rows[0] || null;
  }
  async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    return rows[0] || null;
  }
  async create(data: { email: string; passwordHash: string; name: string; businessId?: string | null }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, business_id) VALUES ($1,$2,$3,$4) RETURNING id,email,name,business_id`,
      [data.email, data.passwordHash, data.name, data.businessId || null],
    );
    return rows[0];
  }
}
