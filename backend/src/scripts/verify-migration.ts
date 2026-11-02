import { pool } from '../config/database';

async function main() {
  const tables = [
    'businesses','branches','warehouses','users','roles','permissions','role_permissions',
    'user_roles','user_branch_access','categories','suppliers','products','product_suppliers',
    'inventory','product_batches','inventory_movements','customers','purchase_orders',
    'purchase_order_items','goods_receipts','goods_receipt_items','sales','sale_items',
    'payments','refunds','refund_items','cash_registers','cash_sessions','cash_movements',
    'notifications','audit_logs','system_settings','idempotency_keys','outbox_events',
    'user_sessions','user_devices',
  ];
  console.log('Table counts:');
  for (const t of tables) {
    try {
      const { rows } = await pool.query(`SELECT count(*)::int AS c FROM ${t}`);
      console.log(`  ${t}: ${rows[0].c}`);
    } catch (e) {
      console.log(`  ${t}: ERROR ${(e as Error).message}`);
    }
  }
  // FK integrity check
  const { rows: fk } = await pool.query(`
    SELECT count(*)::int AS violations
    FROM (
      SELECT 1 FROM sales s LEFT JOIN users u ON u.id=s.user_id WHERE s.user_id IS NOT NULL AND u.id IS NULL
      UNION ALL
      SELECT 1 FROM sale_items si LEFT JOIN products p ON p.id=si.product_id WHERE p.id IS NULL
      UNION ALL
      SELECT 1 FROM inventory i LEFT JOIN products p ON p.id=i.product_id WHERE p.id IS NULL
    ) x
  `);
  console.log('FK violations:', fk[0].violations);
  // Sequences
  const { rows: seqs } = await pool.query(`SELECT count(*)::int AS c FROM pg_sequences WHERE schemaname='public'`);
  console.log('Sequences:', seqs[0].c);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
