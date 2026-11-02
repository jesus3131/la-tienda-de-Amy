import { pool } from '../../config/database';
import { broadcast } from '../websocket/wsServer';

const MAX_RETRIES = 5;
let running = false;

export async function processOutbox() {
  if (running) return;
  running = true;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM outbox_events WHERE published=false AND failed=false AND next_retry_at <= NOW() ORDER BY created_at ASC LIMIT 50`,
    );
    for (const ev of rows) {
      try {
        broadcast({ type: ev.event_type, payload: ev.payload });
        await pool.query('UPDATE outbox_events SET published=true WHERE id=$1', [ev.id]);
      } catch (e) {
        const retry = (ev.retry_count || 0) + 1;
        const failed = retry >= MAX_RETRIES;
        const delay = Math.min(60000, Math.pow(2, retry) * 1000);
        await pool.query(
          `UPDATE outbox_events SET retry_count=$1, next_retry_at=NOW() + ($2 || ' milliseconds')::interval, failed=$3 WHERE id=$4`,
          [retry, delay, failed, ev.id],
        );
      }
    }
  } catch (e) {
    console.error('outbox process error', e);
  } finally {
    running = false;
  }
}

export function startOutboxPublisher(intervalMs = 3000) {
  setInterval(processOutbox, intervalMs);
  processOutbox();
}
