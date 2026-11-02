import { Request, Response } from 'express';
import { z } from 'zod';
import { PurchaseRepository } from '../infrastructure/PurchaseRepository';
import { DEFAULT_BUSINESS_ID, DEFAULT_BRANCH_ID, DEFAULT_WAREHOUSE_ID } from '../../../shared/constants/defaults';
import { getBusinessId } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';
import { logAudit } from '../../../shared/audit/auditLogger';

const itemSchema = z.object({ productId: z.string().uuid(), quantity: z.number().positive(), unitCost: z.number().nonnegative(), taxRate: z.number().optional() });
const createSchema = z.object({ supplierId: z.string().uuid(), branchId: z.string().uuid().optional(), notes: z.string().optional(), items: z.array(itemSchema).min(1) });
const receiveSchema = z.object({ warehouseId: z.string().uuid().optional(), items: z.array(z.object({ purchaseOrderItemId: z.string().uuid(), productId: z.string().uuid(), quantity: z.number().positive(), expiryDate: z.string().optional(), batchNumber: z.string().optional() })).min(1) });

export const purchaseController = {
  async list(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new PurchaseRepository(); res.json(await repo.list(bid, req.query.status as string)); },
  async get(req: Request, res: Response) { const repo=new PurchaseRepository(); res.json(await repo.findById(req.params.id)); },
  async create(req: Request, res: Response) {
    const body=createSchema.parse(req.body);
    const bid=getBusinessId(req);
    const repo=new PurchaseRepository();
    const po = await repo.create({ businessId:bid, branchId: body.branchId||DEFAULT_BRANCH_ID, supplierId: body.supplierId, notes: body.notes, items: body.items, userId: (req as any).user?.id });
    await logAudit({ businessId: bid, userId: (req as any).user?.id, action: 'purchase.create', entityType: 'purchase_order', entityId: po.id, after: po, ip: req.ip });
    res.status(201).json(po);
  },
  async receive(req: Request, res: Response) {
    const bid = getBusinessId(req);
    const body=receiveSchema.parse(req.body);
    const repo=new PurchaseRepository();
    const result = await repo.receive({ purchaseOrderId: req.params.id, warehouseId: body.warehouseId||DEFAULT_WAREHOUSE_ID, items: body.items, userId: (req as any).user?.id });
    await logAudit({ businessId: bid, userId: (req as any).user?.id, action: 'purchase.receive', entityType: 'purchase_order', entityId: req.params.id, after: result, ip: req.ip });
    res.json(result);
  },
  async cancel(req: Request, res: Response) {
    const repo=new PurchaseRepository();
    res.json(await repo.updateStatus(req.params.id,'cancelled'));
  },
};

export function purchaseRoutes(app:any){ const express=require('express'); const r=express.Router(); r.get('/',authenticate,purchaseController.list); r.get('/:id',authenticate,purchaseController.get); r.post('/',authenticate,requireRole('admin','supervisor','warehouse'),purchaseController.create); r.post('/:id/receive',authenticate,requireRole('admin','supervisor','warehouse'),purchaseController.receive); r.post('/:id/cancel',authenticate,requireRole('admin','supervisor'),purchaseController.cancel); app.use('/api/v1/purchases',r); }

