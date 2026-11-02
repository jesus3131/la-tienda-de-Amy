import { pool } from '../../../config/database';
import crypto from 'crypto';

export class SessionRepository {
  async create(data: { userId: string; deviceName?: string; ip?: string; userAgent?: string; token: string }) {
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
    const { rows } = await pool.query(
      `INSERT INTO user_sessions (user_id, device_name, ip_address, user_agent, token_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [data.userId, data.deviceName || null, data.ip || null, data.userAgent || null, tokenHash],
    );
    return rows[0].id as string;
  }
  async listByUser(userId: string) {
    const { rows } = await pool.query('SELECT * FROM user_sessions WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
    return rows;
  }
  async revoke(id: string, userId: string) {
    await pool.query('UPDATE user_sessions SET is_active=false, revoked_at=NOW() WHERE id=$1 AND user_id=$2', [id, userId]);
  }
}
