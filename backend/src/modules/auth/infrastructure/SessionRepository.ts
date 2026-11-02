import { pool } from '../../../config/database';
import crypto from 'crypto';

export class SessionRepository {
  async create(data: { userId: string; deviceName?: string; ip?: string; userAgent?: string; token: string; refreshToken: string; refreshExpiresAt: Date }) {
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(data.refreshToken).digest('hex');
    const { rows } = await pool.query(
      `INSERT INTO user_sessions (user_id, device_name, ip_address, user_agent, token_hash, refresh_token_hash, refresh_expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [data.userId, data.deviceName || null, data.ip || null, data.userAgent || null, tokenHash, refreshTokenHash, data.refreshExpiresAt],
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
  async validate(token: string, userId: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await pool.query(
      `UPDATE user_sessions
       SET last_activity=NOW()
       WHERE user_id=$1 AND token_hash=$2 AND is_active=true
       RETURNING id`,
      [userId, tokenHash],
    );
    return rows.length > 0;
  }
  async findByRefreshToken(refreshToken: string) {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { rows } = await pool.query(
      `SELECT id, user_id FROM user_sessions
       WHERE refresh_token_hash=$1 AND is_active=true AND refresh_expires_at > NOW()`,
      [refreshTokenHash],
    );
    return rows[0] || null;
  }
  async rotate(id: string, token: string, refreshToken: string, refreshExpiresAt: Date) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query(
      `UPDATE user_sessions
       SET token_hash=$1, refresh_token_hash=$2, refresh_expires_at=$3, last_activity=NOW()
       WHERE id=$4 AND is_active=true`,
      [tokenHash, refreshTokenHash, refreshExpiresAt, id],
    );
  }
}
