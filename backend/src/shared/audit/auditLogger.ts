import { pool } from '../../config/database';

export async function logAudit(params: {
  businessId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  before?: any;
  after?: any;
  ip?: string;
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (business_id,user_id,action,entity_type,entity_id,before_state,after_state,ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [params.businessId || null, params.userId || null, params.action, params.entityType || null, params.entityId || null,
        params.before ? JSON.stringify(params.before) : null, params.after ? JSON.stringify(params.after) : null, params.ip || null],
    );
  } catch (e) {
    console.error('audit log failed', e);
  }
}
