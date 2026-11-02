import { Request, Response } from 'express';
import { z } from 'zod';
import { CustomerRepository } from '../infrastructure/CustomerRepository';
import { DEFAULT_BUSINESS_ID } from '../../../shared/constants/defaults';
import { getBusinessId } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';

const schema = z.object({ name: z.string().min(1), documentId: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional().or(z.literal('')), address: z.string().optional(), notes: z.string().optional(), isActive: z.boolean().optional() });

export const customerController = {
  async list(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new CustomerRepository(); res.json(await repo.list(bid, req.query.search as string)); },
  async create(req: Request, res: Response) { const body=schema.parse(req.body); const bid=getBusinessId(req); const repo=new CustomerRepository(); res.status(201).json(await repo.create({...body,businessId:bid})); },
  async update(req: Request, res: Response) { const body=schema.partial().parse(req.body); const bid=getBusinessId(req); const repo=new CustomerRepository(); const c=await repo.update(req.params.id,body,bid); if(!c) throw new (require('../../../shared/errors/AppError').NotFoundError)('Customer',req.params.id); res.json(c); },
  async get(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new CustomerRepository(); const c=await repo.findById(req.params.id,bid); if(!c) throw new (require('../../../shared/errors/AppError').NotFoundError)('Customer',req.params.id); res.json(c); },
};

export function customerRoutes(app:any){ const express=require('express'); const r=express.Router(); r.get('/',authenticate,customerController.list); r.get('/:id',authenticate,customerController.get); r.post('/',authenticate,requireRole('admin','supervisor'),customerController.create); r.put('/:id',authenticate,requireRole('admin','supervisor'),customerController.update); app.use('/api/v1/customers',r); }

