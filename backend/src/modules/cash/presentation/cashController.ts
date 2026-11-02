import { Request, Response } from 'express';
import { z } from 'zod';
import { CashRepository } from '../infrastructure/CashRepository';
import { getBusinessId, assertBranchAccess } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';
import { logAudit } from '../../../shared/audit/auditLogger';
import { pool } from '../../../config/database';
import { ValidationError } from '../../../shared/errors/AppError';

export const cashController = {
  async open(req: Request, res: Response) {
    const body = z.object({ cashRegisterId: z.string().uuid(), openingBalance: z.number().nonnegative() }).parse(req.body);
    const bid = getBusinessId(req);
    const cashRegisterId = body.cashRegisterId;
    if (!cashRegisterId) throw new ValidationError('Caja obligatoria');
    const { rows } = await pool.query(
      'SELECT branch_id FROM cash_registers WHERE id=$1 AND is_active=true',
      [cashRegisterId],
    );
    if (!rows[0]) throw new ValidationError('Caja no encontrada');
    await assertBranchAccess(req, rows[0].branch_id);
    const repo = new CashRepository();
    const s = await repo.openSession({ cashRegisterId, userId: (req as any).user.id, openingBalance: body.openingBalance, businessId: bid, branchId: rows[0].branch_id });
    await logAudit({ businessId: bid, userId: (req as any).user.id, action: 'cash.open', entityType: 'cash_session', entityId: s.id, after: s, ip: req.ip });
    res.status(201).json(s);
  },
  async close(req: Request, res: Response) {
    const bid = getBusinessId(req);
    const body = z.object({ closingBalance: z.number().nonnegative() }).parse(req.body);
    const repo = new CashRepository();
    const session = await repo.getSession(req.params.id, bid);
    if (!session) throw new (require('../../../shared/errors/AppError').NotFoundError)('CashSession', req.params.id);
    const s = await repo.closeSession(req.params.id, body.closingBalance, bid);
    await logAudit({ businessId: bid, userId: (req as any).user.id, action: 'cash.close', entityType: 'cash_session', entityId: req.params.id, after: s, ip: req.ip });
    res.json(s);
  },
  async current(req: Request, res: Response) {
    const repo = new CashRepository();
    const regId = req.query.cashRegisterId as string;
    if (!regId) throw new ValidationError('Caja obligatoria');
    res.json(await repo.findOpenSession(regId, getBusinessId(req)));
  },
  async movement(req: Request, res: Response) {
    const body = z.object({ cashSessionId: z.string().uuid(), type: z.enum(['in','out']), amount: z.number().positive(), reason: z.string().optional() }).parse(req.body);
    const repo = new CashRepository();
    const session = await repo.getSession(body.cashSessionId, getBusinessId(req));
    if (!session || session.status !== 'open') throw new ValidationError('Sesión de caja no disponible');
    res.status(201).json(await repo.addMovement({ ...body, userId: (req as any).user.id }));
  },
  async list(req: Request, res: Response) {
    const repo = new CashRepository();
    res.json(await repo.listSessions(getBusinessId(req), req.query.cashRegisterId as string));
  },
};

export function cashRoutes(app: any) {
  const express = require('express');
  const r = express.Router();
  r.post('/sessions', authenticate, requireRole('admin','supervisor','cashier'), cashController.open);
  r.get('/sessions/current', authenticate, cashController.current);
  r.get('/sessions', authenticate, cashController.list);
  r.post('/sessions/:id/close', authenticate, requireRole('admin','supervisor','cashier'), cashController.close);
  r.post('/movements', authenticate, requireRole('admin','supervisor','cashier'), cashController.movement);
  app.use('/api/v1/cash', r);
}
