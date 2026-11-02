import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateProductUseCase } from '../application/CreateProductUseCase';
import { ListProductsUseCase, GetProductUseCase, UpdateProductUseCase, DeleteProductUseCase } from '../application';
import { DEFAULT_BUSINESS_ID } from '../../../shared/constants/defaults';
import { getBusinessId } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';
import { logAudit } from '../../../shared/audit/auditLogger';

const createSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  barcode: z.string().optional().nullable(),
  unitOfMeasure: z.string().optional(),
  costPrice: z.number().optional(),
  salePrice: z.number().optional(),
  taxRate: z.number().optional(),
  minStock: z.number().optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  primarySupplierId: z.string().uuid().optional().nullable(),
});

export const productController = {
  async list(req: Request, res: Response) {
    const bid = getBusinessId(req);
    const uc = new ListProductsUseCase();
    const result = await uc.execute(bid, {
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      active: req.query.active === undefined ? undefined : req.query.active === 'true',
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50),
    });
    res.json(result);
  },
  async get(req: Request, res: Response) {
    const uc = new GetProductUseCase();
    const p = await uc.execute(req.params.id);
    res.json(p);
  },
  async create(req: Request, res: Response) {
    const body = createSchema.parse(req.body);
    const bid = getBusinessId(req);
    const uc = new CreateProductUseCase();
    const p = await uc.execute({ ...body, businessId: bid });
    await logAudit({ businessId: bid, userId: (req as any).user?.id, action: 'product.create', entityType: 'product', entityId: p.id, after: p, ip: req.ip });
    res.status(201).json(p);
  },
  async update(req: Request, res: Response) {
    const body = createSchema.partial().parse(req.body);
    const uc = new UpdateProductUseCase();
    const p = await uc.execute(req.params.id, body);
    res.json(p);
  },
  async remove(req: Request, res: Response) {
    const uc = new DeleteProductUseCase();
    await uc.execute(req.params.id);
    res.status(204).send();
  },
};

export function productRoutes(app: any) {
  const express = require('express');
  const router = express.Router();
  router.get('/', authenticate, productController.list);
  router.get('/:id', authenticate, productController.get);
  router.post('/', authenticate, requireRole('admin','supervisor','warehouse'), productController.create);
  router.put('/:id', authenticate, requireRole('admin','supervisor','warehouse'), productController.update);
  router.delete('/:id', authenticate, requireRole('admin','supervisor'), productController.remove);
  app.use('/api/v1/products', router);
}

