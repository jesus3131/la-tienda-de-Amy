import { pool } from '../../../config/database';

export class ReportsRepository {
  async dashboard(businessId: string) {
    const today = new Date().toISOString().slice(0,10);
    const { rows: salesToday } = await pool.query(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM sales WHERE business_id=$1 AND created_at::date=$2`, [businessId, today]);
    const { rows: salesWeek } = await pool.query(`SELECT COALESCE(SUM(total),0) as total FROM sales WHERE business_id=$1 AND created_at >= NOW() - INTERVAL '7 days'`, [businessId]);
    const { rows: salesMonth } = await pool.query(`SELECT COALESCE(SUM(total),0) as total FROM sales WHERE business_id=$1 AND created_at >= NOW() - INTERVAL '30 days'`, [businessId]);
    const { rows: prodCount } = await pool.query('SELECT COUNT(*) as c FROM products WHERE business_id=$1 AND is_active=true', [businessId]);
    const { rows: invValue } = await pool.query(`SELECT COALESCE(SUM(i.quantity * p.cost_price),0) as v FROM inventory i JOIN products p ON p.id=i.product_id WHERE p.business_id=$1`, [businessId]);
    const { rows: lowStock } = await pool.query(`SELECT COUNT(*) as c FROM products p WHERE p.business_id=$1 AND p.is_active=true AND (SELECT COALESCE(SUM(i.quantity),0) FROM inventory i WHERE i.product_id=p.id) <= p.min_stock`, [businessId]);
    const { rows: topProducts } = await pool.query(
      `SELECT p.id,p.name, COALESCE(SUM(si.quantity),0) as units_sold, COALESCE(SUM(si.total),0) as revenue
       FROM products p LEFT JOIN sale_items si ON si.product_id=p.id LEFT JOIN sales s ON s.id=si.sale_id
       WHERE p.business_id=$1 GROUP BY p.id ORDER BY revenue DESC LIMIT 5`,
      [businessId],
    );
    const { rows: recentSales } = await pool.query('SELECT id,total,created_at FROM sales WHERE business_id=$1 ORDER BY created_at DESC LIMIT 10', [businessId]);
    return {
      salesToday: { total: Number(salesToday[0].total), count: Number(salesToday[0].count) },
      salesWeek: Number(salesWeek[0].total),
      salesMonth: Number(salesMonth[0].total),
      totalProducts: Number(prodCount[0].c),
      inventoryValue: Number(invValue[0].v),
      lowStockCount: Number(lowStock[0].c),
      topProducts,
      recentSales,
    };
  }

  async salesByPeriod(businessId: string, from: string, to: string) {
    const { rows } = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total),0) as total
       FROM sales WHERE business_id=$1 AND created_at::date BETWEEN $2 AND $3 GROUP BY DATE(created_at) ORDER BY date`,
      [businessId, from, to],
    );
    return rows;
  }

  async inventoryValuation(businessId: string) {
    const { rows } = await pool.query(
      `SELECT p.id,p.name,p.sku, COALESCE(SUM(i.quantity),0) as quantity, p.cost_price, p.sale_price,
              COALESCE(SUM(i.quantity),0)*p.cost_price as cost_value, COALESCE(SUM(i.quantity),0)*p.sale_price as sale_value
       FROM products p LEFT JOIN inventory i ON i.product_id=p.id
       WHERE p.business_id=$1 AND p.is_active=true GROUP BY p.id ORDER BY p.name`,
      [businessId],
    );
    return rows;
  }

  async topProducts(businessId: string, limit = 10) {
    const { rows } = await pool.query(
      `SELECT p.id,p.name, COALESCE(SUM(si.quantity),0) as units_sold, COALESCE(SUM(si.total),0) as revenue
       FROM products p LEFT JOIN sale_items si ON si.product_id=p.id
       WHERE p.business_id=$1 GROUP BY p.id ORDER BY revenue DESC LIMIT $2`,
      [businessId, limit],
    );
    return rows;
  }

  async cashClosures(businessId: string) {
    const { rows } = await pool.query(
      `SELECT cs.* FROM cash_sessions cs JOIN cash_registers cr ON cr.id=cs.cash_register_id JOIN branches b ON b.id=cr.branch_id WHERE b.business_id=$1 ORDER BY cs.opened_at DESC LIMIT 50`,
      [businessId],
    );
    return rows;
  }
}
