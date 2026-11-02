import { ForbiddenError } from '../errors/AppError';
import { pool } from '../../config/database';

export function getBusinessId(req: any): string {
  const bid = req?.user?.businessId;
  if (!bid) throw new ForbiddenError('Contexto de empresa no válido');
  return bid;
}

export async function assertBranchAccess(req: any, branchId: string): Promise<void> {
  const businessId = getBusinessId(req);
  if (!req.user?.branchIds?.includes(branchId)) {
    throw new ForbiddenError('Sucursal no autorizada');
  }
  const { rows } = await pool.query(
    'SELECT 1 FROM branches WHERE id=$1 AND business_id=$2 AND is_active=true',
    [branchId, businessId],
  );
  if (rows.length === 0) throw new ForbiddenError('Sucursal no pertenece a la empresa');
}

export async function assertWarehouseAccess(req: any, warehouseId: string): Promise<{ branchId: string }> {
  const businessId = getBusinessId(req);
  const { rows } = await pool.query(
    `SELECT w.id, w.branch_id
     FROM warehouses w
     JOIN branches b ON b.id=w.branch_id
     WHERE w.id=$1 AND b.business_id=$2 AND b.is_active=true`,
    [warehouseId, businessId],
  );
  if (rows.length === 0) throw new ForbiddenError('Almacén no pertenece a la empresa');
  await assertBranchAccess(req, rows[0].branch_id);
  return { branchId: rows[0].branch_id };
}
