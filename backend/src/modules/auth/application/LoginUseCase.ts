import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../infrastructure/UserRepository';
import { SessionRepository } from '../infrastructure/SessionRepository';
import { env } from '../../../config/env';
import { pool } from '../../../config/database';
import { AppError } from '../../../shared/errors/AppError';

export class LoginUseCase {
  constructor(private repo = new UserRepository(), private sessions = new SessionRepository()) {}
  async execute(email: string, password: string, meta?: { deviceName?: string; ip?: string; userAgent?: string }) {
    const user = await this.repo.findByEmail(email);
    if (!user || !user.is_active) throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
    const { rows } = await pool.query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1`,
      [user.id],
    );
    const role = rows[0]?.name || 'cashier';
    const token = jwt.sign({ userId: user.id, email: user.email, role }, env.JWT_SECRET, { expiresIn: '24h' });
    const sessionId = await this.sessions.create({ userId: user.id, deviceName: meta?.deviceName, ip: meta?.ip, userAgent: meta?.userAgent, token });
    return { token, sessionId, user: { id: user.id, email: user.email, name: user.name, role, businessId: user.business_id } };
  }
}
