import { Request, Response } from 'express';
import { z } from 'zod';
import { SupplierRepository } from '../infrastructure/SupplierRepository';
import { DEFAULT_BUSINESS_ID } from '../../../shared/constants/defaults';
import { getBusinessId } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';

const schema = z.object({ name: z.string().min(1), company: z.string().optional(), taxId: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional().or(z.literal('')), address: z.string().optional(), notes: z.string().optional(), isActive: z.boolean().optional() });

export const supplierController = {
  async list(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new SupplierRepository(); res.json(await repo.list(bid, req.query.search as string)); },
  async create(req: Request, res: Response) { const body=schema.parse(req.body); const bid=getBusinessId(req); const repo=new SupplierRepository(); res.status(201).json(await repo.create({...body,businessId:bid})); },
  async update(req: Request, res: Response) { const body=schema.partial().parse(req.body); const repo=new SupplierRepository(); res.json(await repo.update(req.params.id,body)); },
  async get(req: Request, res: Response) { const repo=new SupplierRepository(); res.json(await repo.findById(req.params.id)); },
};

export function supplierRoutes(app:any){ const express=require('express'); const r=express.Router(); r.get('/',authenticate,supplierController.list); r.get('/:id',authenticate,supplierController.get); r.post('/',authenticate,requireRole('admin','supervisor','warehouse'),supplierController.create); r.put('/:id',authenticate,requireRole('admin','supervisor','warehouse'),supplierController.update); app.use('/api/v1/suppliers',r); }

