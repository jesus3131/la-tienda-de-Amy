import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../config/database';
import { ForbiddenError } from '../errors/AppError';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; businessId?: string; branchIds: string[] };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token requerido' } });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    const { rows } = await pool.query(
      `SELECT u.id,u.email,u.business_id, r.name as role
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id=u.id
       LEFT JOIN roles r ON r.id=ur.role_id
       WHERE u.id=$1 AND u.is_active=true`,
      [payload.userId],
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Usuario inválido' } });
    }
    const u = rows[0];
    const { rows: branches } = await pool.query(
      'SELECT branch_id FROM user_branch_access WHERE user_id=$1',
      [u.id],
    );
    req.user = {
      id: u.id,
      email: u.email,
      role: u.role || 'cashier',
      businessId: u.business_id,
      branchIds: branches.map((b: any) => b.branch_id),
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Permisos insuficientes' } });
    }
    next();
  };
}
