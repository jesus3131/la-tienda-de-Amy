import { Request, Response } from 'express';
import { z } from 'zod';
import { CashRepository } from '../infrastructure/CashRepository';
import { DEFAULT_CASH_REGISTER_ID } from '../../../shared/constants/defaults';
import { getBusinessId } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';
import { logAudit } from '../../../shared/audit/auditLogger';
import { DEFAULT_BUSINESS_ID } from '../../../shared/constants/defaults';

export const cashController = {
  async open(req: Request, res: Response) {
    const body = z.object({ cashRegisterId: z.string().uuid().optional(), openingBalance: z.number().nonnegative() }).parse(req.body);
    const repo = new CashRepository();
    const s = await repo.openSession({ cashRegisterId: body.cashRegisterId || DEFAULT_CASH_REGISTER_ID, userId: (req as any).user.id, openingBalance: body.openingBalance });
    await logAudit({ businessId: getBusinessId(req), userId: (req as any).user.id, action: 'cash.open', entityType: 'cash_session', entityId: s.id, after: s, ip: req.ip });
    res.status(201).json(s);
  },
  async close(req: Request, res: Response) {
    const body = z.object({ closingBalance: z.number().nonnegative() }).parse(req.body);
    const repo = new CashRepository();
    const s = await repo.closeSession(req.params.id, body.closingBalance);
    await logAudit({ businessId: getBusinessId(req), userId: (req as any).user.id, action: 'cash.close', entityType: 'cash_session', entityId: req.params.id, after: s, ip: req.ip });
    res.json(s);
  },
  async current(req: Request, res: Response) {
    const repo = new CashRepository();
    const regId = (req.query.cashRegisterId as string) || DEFAULT_CASH_REGISTER_ID;
    res.json(await repo.findOpenSession(regId));
  },
  async movement(req: Request, res: Response) {
    const body = z.object({ cashSessionId: z.string().uuid(), type: z.enum(['in','out']), amount: z.number().positive(), reason: z.string().optional() }).parse(req.body);
    const repo = new CashRepository();
    res.status(201).json(await repo.addMovement({ ...body, userId: (req as any).user.id }));
  },
  async list(req: Request, res: Response) {
    const repo = new CashRepository();
    res.json(await repo.listSessions(req.query.cashRegisterId as string));
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

