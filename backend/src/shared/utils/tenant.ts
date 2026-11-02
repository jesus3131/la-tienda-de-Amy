import { ForbiddenError } from '../errors/AppError';

export function getBusinessId(req: any): string {
  const bid = req?.user?.businessId;
  if (!bid) throw new ForbiddenError('Contexto de empresa no válido');
  return bid;
}
