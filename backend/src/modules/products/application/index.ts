export { CreateProductUseCase } from './CreateProductUseCase';
import { ProductRepository } from '../infrastructure/ProductRepository';
export class ListProductsUseCase { constructor(private repo=new ProductRepository()){} async execute(bid:string, f:any){ return this.repo.list(bid,f);} }
export class GetProductUseCase { constructor(private repo=new ProductRepository()){} async execute(id:string){ const p=await this.repo.findById(id); if(!p) throw new (require('../../../shared/errors/AppError').NotFoundError)('Product',id); return p;} }
export class UpdateProductUseCase { constructor(private repo=new ProductRepository()){} async execute(id:string,data:any){ return this.repo.update(id,data);} }
export class DeleteProductUseCase { constructor(private repo=new ProductRepository()){} async execute(id:string){ await this.repo.softDelete(id);} }
export class SearchProductsUseCase { constructor(private repo=new ProductRepository()){} async execute(bid:string,q:string){ return this.repo.list(bid,{search:q,limit:20});} }
