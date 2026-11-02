import { pool } from '../../../config/database';
import { ValidationError } from '../../../shared/errors/AppError';

export class CashRepository {
  async openSession(data: { cashRegisterId: string; userId: string; openingBalance: number; businessId: string; branchId: string }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: register } = await client.query(
        `SELECT cr.id FROM cash_registers cr
         JOIN branches b ON b.id=cr.branch_id
         WHERE cr.id=$1 AND cr.branch_id=$2 AND b.business_id=$3 AND cr.is_active=true
         FOR UPDATE`,
        [data.cashRegisterId, data.branchId, data.businessId],
      );
      if (register.length === 0) throw new ValidationError('Caja no autorizada');
      const { rows: existing } = await client.query(
        `SELECT id FROM cash_sessions WHERE cash_register_id=$1 AND status='open' FOR UPDATE`,
        [data.cashRegisterId],
      );
      if (existing.length > 0) throw new ValidationError('La caja ya tiene una sesión abierta');
      const { rows } = await client.query(
        `INSERT INTO cash_sessions (cash_register_id,user_id,opening_balance,status) VALUES ($1,$2,$3,'open') RETURNING *`,
        [data.cashRegisterId, data.userId, data.openingBalance],
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async getSession(id: string, businessId?: string) {
    const params: any[] = [id];
    let sql = `SELECT cs.* FROM cash_sessions cs JOIN cash_registers cr ON cr.id=cs.cash_register_id JOIN branches b ON b.id=cr.branch_id WHERE cs.id=$1`;
    if (businessId) { params.push(businessId); sql += ` AND b.business_id=$${params.length}`; }
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
  }
  async findOpenSession(cashRegisterId: string, businessId: string) {
    const { rows } = await pool.query(
    `SELECT cs.* FROM cash_sessions cs
     JOIN cash_registers cr ON cr.id=cs.cash_register_id
     JOIN branches b ON b.id=cr.branch_id
     WHERE cs.cash_register_id=$1 AND b.business_id=$2 AND cs.status='open'
     ORDER BY opened_at DESC LIMIT 1`,
    [cashRegisterId, businessId],
    );
    return rows[0] || null;
  }
  async closeSession(id: string, closingBalance: number, businessId: string) {
    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    const { rows: sessionRows } = await client.query(
      `SELECT cs.* FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id=cs.cash_register_id
       JOIN branches b ON b.id=cr.branch_id
       WHERE cs.id=$1 AND b.business_id=$2 FOR UPDATE`,
      [id, businessId],
    );
    const session = sessionRows[0];
    if (!session || session.status !== 'open') throw new ValidationError('Sesión de caja no disponible');
    const { rows: movs } = await client.query('SELECT COALESCE(SUM(amount),0) as s FROM cash_movements WHERE cash_session_id=$1 AND type IN (\'in\',\'sale\')', [id]);
    const { rows: outs } = await client.query('SELECT COALESCE(SUM(amount),0) as s FROM cash_movements WHERE cash_session_id=$1 AND type IN (\'out\',\'refund\')', [id]);
    const expected = Number(session.opening_balance) + Number(movs[0].s) - Number(outs[0].s);
    const diff = closingBalance - expected;
    const { rows } = await client.query('UPDATE cash_sessions SET closing_balance=$1, expected_balance=$2, difference=$3, status=\'closed\', closed_at=NOW() WHERE id=$4 RETURNING *', [closingBalance, expected, diff, id]);
    await client.query('COMMIT');
    return rows[0];
    } catch (error) {
    await client.query('ROLLBACK');
    throw error;
    } finally {
    client.release();
    }
  }
  async addMovement(data: { cashSessionId: string; type: string; amount: number; reason?: string; referenceType?: string; referenceId?: string; userId?: string }) {
    const { rows } = await pool.query(
      `INSERT INTO cash_movements (cash_session_id,type,amount,reason,reference_type,reference_id,user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.cashSessionId, data.type, data.amount, data.reason || null, data.referenceType || null, data.referenceId || null, data.userId || null],
    );
    return rows[0];
  }
  async listSessions(businessId: string, cashRegisterId?: string) {
    const params: any[] = [businessId];
    let where = 'WHERE b.business_id=$1';
    if (cashRegisterId) { params.push(cashRegisterId); where += ` AND cs.cash_register_id=$${params.length}`; }
    const { rows } = await pool.query(
      `SELECT cs.* FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id=cs.cash_register_id
       JOIN branches b ON b.id=cr.branch_id
       ${where} ORDER BY cs.opened_at DESC LIMIT 100`,
      params,
    );
    return rows;
  }
}
