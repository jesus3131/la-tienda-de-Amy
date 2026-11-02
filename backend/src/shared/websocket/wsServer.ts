import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../config/database';
import crypto from 'crypto';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocket(server: HttpServer) {
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) { ws.close(4001, 'token required'); return; }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      (ws as any).userId = payload.userId;
      // load businessId
      (async () => {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const { rows: sess } = await pool.query('SELECT 1 FROM user_sessions WHERE user_id=$1 AND token_hash=$2 AND is_active=true', [payload.userId, tokenHash]);
        if (sess.length === 0) { ws.close(4003, 'session revoked'); return; }
        const { rows } = await pool.query('SELECT business_id FROM users WHERE id=$1', [payload.userId]);
        (ws as any).businessId = rows[0]?.business_id || null;
        clients.add(ws);
        ws.on('close', () => clients.delete(ws));
        ws.send(JSON.stringify({ type: 'connected' }));
      })().catch(() => ws.close(4002, 'invalid user'));
    } catch {
      ws.close(4002, 'invalid token');
      return;
    }
  });
}

export interface BroadcastEvent {
  type: string;
  payload?: any;
  businessId?: string | null;
  branchId?: string | null;
}

export function broadcast(event: BroadcastEvent) {
  const msg = JSON.stringify({ type: event.type, payload: event.payload });
  for (const c of clients) {
    if (c.readyState !== WebSocket.OPEN) continue;
    // Require business context for all commercial events; no global fallback.
    if (!event.businessId) continue;
    if ((c as any).businessId !== event.businessId) continue;
    c.send(msg);
  }
}

export function getClients() { return clients; }
