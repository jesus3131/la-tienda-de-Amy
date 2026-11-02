import { Request, Response } from 'express';
import { z } from 'zod';
import { SalesRepository } from '../infrastructure/SalesRepository';
import { getBusinessId, assertBranchAccess, assertWarehouseAccess } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';
import { broadcast } from '../../../shared/websocket/wsServer';
import { logAudit } from '../../../shared/audit/auditLogger';
import { ValidationError } from '../../../shared/errors/AppError';

const itemSchema = z.object({ productId: z.string().uuid(), quantity: z.number().positive(), unitPrice: z.number().optional(), discount: z.number().optional(), taxRate: z.number().optional() });
const saleSchema = z.object({
  branchId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional().nullable(),
  cashSessionId: z.string().uuid().optional().nullable(),
  items: z.array(itemSchema).min(1),
  payments: z.array(z.object({ method: z.enum(['cash','card','transfer','other']), amount: z.number().nonnegative(), reference: z.string().optional() })).min(1),
  idempotencyKey: z.string().trim().min(1).max(64).optional(),
  notes: z.string().optional(),
});

export const saleController = {
  async list(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new SalesRepository(); res.json(await repo.list(bid, { from: req.query.from, to: req.query.to, userId: req.query.userId })); },
  async get(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new SalesRepository(); const s=await repo.findById(req.params.id,bid); if(!s) throw new (require('../../../shared/errors/AppError').NotFoundError)('Sale',req.params.id); res.json(s); },
  async create(req: Request, res: Response) {
    const body=saleSchema.parse(req.body);
    const bid=getBusinessId(req);
    const repo=new SalesRepository();
    if (!body.branchId || !body.warehouseId) {
      throw new ValidationError('Sucursal y almacén son obligatorios');
    }
    const warehouse = await assertWarehouseAccess(req, body.warehouseId);
    await assertBranchAccess(req, body.branchId);
    if (warehouse.branchId !== body.branchId) throw new ValidationError('El almacén no pertenece a la sucursal');
    const result = await repo.registerSale({
      businessId: bid,
      branchId: body.branchId,
      warehouseId: body.warehouseId,
      customerId: body.customerId,
      cashSessionId: body.cashSessionId,
      userId: (req as any).user?.id,
      items: body.items,
      payments: body.payments,
      idempotencyKey: body.idempotencyKey,
      notes: body.notes,
    });
    broadcast({ type: 'sale.completed', payload: { saleId: result?.id, total: result?.total }, businessId: bid });
    await logAudit({ businessId: bid, userId: (req as any).user?.id, action: 'sale.create', entityType: 'sale', entityId: result?.id, after: { total: result?.total }, ip: req.ip });
    res.status(201).json(result);
  },
  async refund(req: Request, res: Response) {
    const body = z.object({ reason: z.string().optional(), items: z.array(z.object({ saleItemId: z.string().uuid(), quantity: z.number().positive() })).min(1) }).parse(req.body);
    const bid = getBusinessId(req);
    const repo=new SalesRepository();
    res.json(await repo.refund({ saleId: req.params.id, userId: (req as any).user?.id, reason: body.reason, items: body.items, businessId: bid }));
  },
};

export function saleRoutes(app:any){ const express=require('express'); const r=express.Router(); r.get('/',authenticate,saleController.list); r.get('/:id',authenticate,saleController.get); r.post('/',authenticate,saleController.create); r.post('/:id/refunds',authenticate,requireRole('admin','supervisor'),saleController.refund); app.use('/api/v1/sales',r); }
