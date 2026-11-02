import { Request, Response } from 'express';
import { z } from 'zod';
import { CategoryRepository } from '../infrastructure/CategoryRepository';
import { DEFAULT_BUSINESS_ID } from '../../../shared/constants/defaults';
import { getBusinessId } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';

const schema = z.object({ name: z.string().min(1), slug: z.string().min(1), description: z.string().optional(), parentId: z.string().uuid().optional().nullable(), sortOrder: z.number().optional(), isActive: z.boolean().optional() });

export const categoryController = {
  async list(req: Request, res: Response) {
    const bid = getBusinessId(req);
    const repo = new CategoryRepository();
    res.json(await repo.list(bid));
  },
  async create(req: Request, res: Response) {
    const body = schema.parse(req.body);
    const bid = getBusinessId(req);
    const repo = new CategoryRepository();
    res.status(201).json(await repo.create({ ...body, businessId: bid }));
  },
  async update(req: Request, res: Response) {
    const body = schema.partial().parse(req.body);
    const repo = new CategoryRepository();
    res.json(await repo.update(req.params.id, body));
  },
};

export function categoryRoutes(app: any) {
  const express = require('express');
  const router = express.Router();
  router.get('/', authenticate, categoryController.list);
  router.post('/', authenticate, requireRole('admin','supervisor'), categoryController.create);
  router.put('/:id', authenticate, requireRole('admin','supervisor'), categoryController.update);
  app.use('/api/v1/categories', router);
}

