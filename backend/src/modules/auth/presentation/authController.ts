import { Request, Response } from 'express';
import { z } from 'zod';
import { LoginUseCase } from '../application/LoginUseCase';
import { RegisterUseCase } from '../application/RegisterUseCase';
import { SessionRepository } from '../infrastructure/SessionRepository';
import { authenticate, AuthRequest } from '../../../shared/middleware/auth';
import { pool } from '../../../config/database';
import { env } from '../../../config/env';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const registerSchema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1), businessId: z.string().uuid().optional() });

export const authController = {
  async login(req: Request, res: Response) {
    const body = loginSchema.parse(req.body);
    const uc = new LoginUseCase();
    const result = await uc.execute(body.email, body.password, {
      deviceName: req.body.deviceName,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json(result);
  },
  async register(req: Request, res: Response) {
    if (env.NODE_ENV === 'production') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no disponible' } });
    }
    const body = registerSchema.parse(req.body);
    const uc = new RegisterUseCase();
    const user = await uc.execute(body.email, body.password, body.name, body.businessId);
    res.status(201).json(user);
  },
  async refresh(req: Request, res: Response) {
    const body = z.object({ refreshToken: z.string().min(32) }).parse(req.body);
    const sessions = new SessionRepository();
    const session = await sessions.findByRefreshToken(body.refreshToken);
    if (!session) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Refresh token inválido o expirado' } });
    const { rows } = await pool.query(
      `SELECT u.id,u.email,u.name,u.business_id,r.name AS role
       FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
       WHERE u.id=$1 AND u.is_active=true`,
      [session.user_id],
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Usuario inválido' } });
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role || 'cashier' }, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(48).toString('base64url');
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sessions.rotate(session.id, token, refreshToken, refreshExpiresAt);
    res.json({ token, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role || 'cashier', businessId: user.business_id } });
  },
  async sessions(req: AuthRequest, res: Response) {
    const repo = new SessionRepository();
    res.json(await repo.listByUser(req.user!.id));
  },
  async revokeSession(req: AuthRequest, res: Response) {
    const repo = new SessionRepository();
    await repo.revoke(req.params.id, req.user!.id);
    res.status(204).send();
  },
  async me(req: AuthRequest, res: Response) {
    const { rows } = await pool.query(
      `SELECT u.id,u.email,u.name,u.business_id, r.name as role
       FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
       WHERE u.id=$1`,
      [req.user!.id],
    );
    res.json(rows[0]);
  },
};

export function authRoutes(app: any) {
  const express = require('express');
  const router = express.Router();
  router.post('/login', authController.login);
  router.post('/refresh', authController.refresh);
  router.post('/register', authController.register);
  router.get('/me', authenticate, authController.me);
  router.get('/sessions', authenticate, authController.sessions);
  router.post('/sessions/:id/revoke', authenticate, authController.revokeSession);
  app.use('/api/v1/auth', router);
}
