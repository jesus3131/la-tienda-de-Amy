import { Request, Response } from 'express';
import { ReportsRepository } from '../infrastructure/ReportsRepository';
import { DEFAULT_BUSINESS_ID } from '../../../shared/constants/defaults';
import { getBusinessId } from '../../../shared/utils/tenant';
import { authenticate, requireRole } from '../../../shared/middleware/auth';
import { pool } from '../../../config/database';
import ExcelJS from 'exceljs';

export const reportController = {
  async dashboard(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new ReportsRepository(); res.json(await repo.dashboard(bid)); },
  async sales(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new ReportsRepository(); const from = (req.query.from as string) || new Date(Date.now()-30*86400000).toISOString().slice(0,10); const to = (req.query.to as string) || new Date().toISOString().slice(0,10); res.json(await repo.salesByPeriod(bid, from, to)); },
  async inventory(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new ReportsRepository(); res.json(await repo.inventoryValuation(bid)); },
  async topProducts(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new ReportsRepository(); res.json(await repo.topProducts(bid, Number(req.query.limit||10))); },
  async cashClosures(req: Request, res: Response) { const bid=getBusinessId(req); const repo=new ReportsRepository(); res.json(await repo.cashClosures(bid)); },
  async exportExcel(req: Request, res: Response) {
    const type = req.params.type;
    const bid = getBusinessId(req);
    let rows: any[] = [];
    if (type === 'inventory') rows = await new ReportsRepository().inventoryValuation(bid);
    else if (type === 'sales') rows = await new ReportsRepository().salesByPeriod(bid, (req.query.from as string) || '2020-01-01', (req.query.to as string) || '2030-01-01');
    else if (type === 'products') { const { rows: r } = await pool.query('SELECT * FROM products WHERE business_id=$1', [bid]); rows = r; }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(type);
    if (rows.length) {
      ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k, width: 20 }));
      rows.forEach((r) => ws.addRow(r));
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  },
  async exportCsv(req: Request, res: Response) {
    const type = req.params.type;
    const bid=getBusinessId(req);
    let rows: any[] = [];
    if (type === 'inventory') rows = await new ReportsRepository().inventoryValuation(bid);
    else if (type === 'sales') rows = await new ReportsRepository().salesByPeriod(bid, (req.query.from as string)||'2020-01-01', (req.query.to as string)||'2030-01-01');
    else if (type === 'products') { const { rows: r } = await pool.query('SELECT * FROM products WHERE business_id=$1', [bid]); rows = r; }
    // build csv
    if (rows.length === 0) { res.setHeader('Content-Type','text/csv'); return res.send(''); }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
    res.send(csv);
  },
};

export function reportRoutes(app: any) {
  const express = require('express');
  const r = express.Router();
  r.get('/dashboard', authenticate, requireRole('admin','supervisor'), reportController.dashboard);
  r.get('/sales', authenticate, requireRole('admin','supervisor'), reportController.sales);
  r.get('/inventory', authenticate, requireRole('admin','supervisor','warehouse'), reportController.inventory);
  r.get('/top-products', authenticate, requireRole('admin','supervisor'), reportController.topProducts);
  r.get('/cash-closures', authenticate, requireRole('admin','supervisor'), reportController.cashClosures);
  r.get('/export/:type', authenticate, requireRole('admin','supervisor'), reportController.exportCsv);
  r.get('/export/:type/excel', authenticate, requireRole('admin','supervisor'), reportController.exportExcel);
  app.use('/api/v1/reports', r);
}

