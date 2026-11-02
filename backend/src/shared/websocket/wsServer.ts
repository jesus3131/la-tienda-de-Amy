import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../config/database';

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
    } catch {
      ws.close(4002, 'invalid token');
      return;
    }
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    ws.send(JSON.stringify({ type: 'connected' }));
  });
}

export function broadcast(event: { type: string; payload?: any }) {
  const msg = JSON.stringify(event);
  for (const c of clients) {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  }
}

export function getClients() { return clients; }
