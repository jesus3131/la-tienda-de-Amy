import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  businessId?: string;
  userId?: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext | undefined {
  return tenantContext.getStore();
}
