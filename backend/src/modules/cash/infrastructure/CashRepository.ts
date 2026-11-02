import { pool } from '../../../config/database';

export class CashRepository {
  async openSession(data: { cashRegisterId: string; userId: string; openingBalance: number }) {
    const { rows } = await pool.query(
      `INSERT INTO cash_sessions (cash_register_id,user_id,opening_balance,status) VALUES ($1,$2,$3,'open') RETURNING *`,
      [data.cashRegisterId, data.userId, data.openingBalance],
    );
    return rows[0];
  }
  async getSession(id: string) { const { rows } = await pool.query('SELECT * FROM cash_sessions WHERE id=$1', [id]); return rows[0]||null; }
  async findOpenSession(cashRegisterId: string) { const { rows } = await pool.query("SELECT * FROM cash_sessions WHERE cash_register_id=$1 AND status='open' ORDER BY opened_at DESC LIMIT 1", [cashRegisterId]); return rows[0]||null; }
  async closeSession(id: string, closingBalance: number) {
    const { rows: movs } = await pool.query('SELECT COALESCE(SUM(amount),0) as s FROM cash_movements WHERE cash_session_id=$1 AND type IN (\'in\',\'sale\')', [id]);
    const { rows: outs } = await pool.query('SELECT COALESCE(SUM(amount),0) as s FROM cash_movements WHERE cash_session_id=$1 AND type IN (\'out\',\'refund\')', [id]);
    const session = await this.getSession(id);
    const expected = Number(session.opening_balance) + Number(movs[0].s) - Number(outs[0].s);
    const diff = closingBalance - expected;
    const { rows } = await pool.query('UPDATE cash_sessions SET closing_balance=$1, expected_balance=$2, difference=$3, status=\'closed\', closed_at=NOW() WHERE id=$4 RETURNING *', [closingBalance, expected, diff, id]);
    return rows[0];
  }
  async addMovement(data: { cashSessionId: string; type: string; amount: number; reason?: string; referenceType?: string; referenceId?: string; userId?: string }) {
    const { rows } = await pool.query(
      `INSERT INTO cash_movements (cash_session_id,type,amount,reason,reference_type,reference_id,user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.cashSessionId, data.type, data.amount, data.reason || null, data.referenceType || null, data.referenceId || null, data.userId || null],
    );
    return rows[0];
  }
  async listSessions(cashRegisterId?: string) {
    const params: any[] = [];
    let where = '';
    if (cashRegisterId) { params.push(cashRegisterId); where = 'WHERE cash_register_id=$1'; }
    const { rows } = await pool.query(`SELECT * FROM cash_sessions ${where} ORDER BY opened_at DESC LIMIT 100`, params);
    return rows;
  }
}
