import { Request, Response } from 'express';
import { z } from 'zod';
import { InventoryRepository } from '../infrastructure/InventoryRepository';
import { DEFAULT_BUSINESS_ID, DEFAULT_WAREHOUSE_ID } from '../../../shared/constants/defaults';
import { getBusinessId } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';
import { broadcast } from '../../../shared/websocket/wsServer';
import { logAudit } from '../../../shared/audit/auditLogger';

const adjustSchema = z.object({ productId: z.string().uuid(), warehouseId: z.string().uuid().optional(), quantity: z.number(), type: z.string(), reason: z.string().optional() });

export const inventoryController = {
  async list(req: Request, res: Response) {
    const bid = getBusinessId(req);
    const repo = new InventoryRepository();
    res.json(await repo.list(bid, req.query.warehouseId as string, req.query.lowOnly === 'true'));
  },
  async adjust(req: Request, res: Response) {
    const body = adjustSchema.parse(req.body);
    const bid = getBusinessId(req);
    const repo = new InventoryRepository();
    const wh = body.warehouseId || DEFAULT_WAREHOUSE_ID;
    const result = await repo.adjust({ productId: body.productId, warehouseId: wh, quantity: body.quantity, type: body.type, reason: body.reason, userId: (req as any).user?.id, businessId: bid });
    await logAudit({ businessId: bid, userId: (req as any).user?.id, action: 'inventory.adjust', entityType: 'product', entityId: body.productId, after: { quantity: body.quantity, type: body.type }, ip: req.ip });
    broadcast({ type: 'inventory.updated', payload: { productId: body.productId } });
    res.json(result);
  },
  async movements(req: Request, res: Response) {
    const repo = new InventoryRepository();
    res.json(await repo.movements(req.query.productId as string, Number(req.query.limit || 100)));
  },
  async alerts(req: Request, res: Response) {
    const bid = getBusinessId(req);
    const repo = new InventoryRepository();
    res.json(await repo.alerts(bid));
  },
};

export function inventoryRoutes(app: any) {
  const express = require('express');
  const r = express.Router();
  r.get('/', authenticate, inventoryController.list);
  r.post('/adjustments', authenticate, requireRole('admin','supervisor','warehouse'), inventoryController.adjust);
  r.get('/movements', authenticate, inventoryController.movements);
  r.get('/alerts', authenticate, inventoryController.alerts);
  app.use('/api/v1/inventory', r);
}

