import { QueryClient } from '@tanstack/react-query';

let socket = null;
let qc = null;

export function initWebSocket(queryClient) {
  qc = queryClient;
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  if (import.meta.env.PROD && !apiUrl.startsWith('https://')) {
    console.error('VITE_API_URL must be an HTTPS URL in production');
    return;
  }
  const url = new URL(apiUrl);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = url.host;
  socket = new WebSocket(`${protocol}//${host}/ws?token=${encodeURIComponent(token || '')}`);
  socket.onopen = () => console.log('WS connected');
  socket.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'sale.completed') {
        qc.invalidateQueries({ queryKey: ['dashboard'] });
        qc.invalidateQueries({ queryKey: ['inventory'] });
        qc.invalidateQueries({ queryKey: ['pos-products'] });
      }
      if (msg.type === 'inventory.updated') {
        qc.invalidateQueries({ queryKey: ['inventory'] });
        qc.invalidateQueries({ queryKey: ['alerts'] });
      }
    } catch (e) {}
  };
  socket.onclose = () => {
    setTimeout(() => initWebSocket(qc), 3000);
  };
}
