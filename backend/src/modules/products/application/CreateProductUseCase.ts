import { ProductRepository } from '../infrastructure/ProductRepository';
import { AppError } from '../../../shared/errors/AppError';

export class CreateProductUseCase {
  constructor(private repo = new ProductRepository()) {}
  async execute(data: any) {
    if (!data.sku || !data.name) throw new AppError(400, 'VALIDATION', 'sku y name son requeridos');
    const existing = await this.repo.findBySku(data.businessId, data.sku);
    if (existing) throw new AppError(409, 'SKU_EXISTS', 'El SKU ya existe');
    return this.repo.create(data);
  }
}
