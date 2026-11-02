import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { initWebSocket } from './services/websocket';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Purchases from './pages/Purchases';
import Cash from './pages/Cash';
import Reports from './pages/Reports';

const qc = new QueryClient();

function WsInit() {
  useEffect(() => { initWebSocket(qc); }, []);
  useEffect(() => {
    const sync = async () => {
      const queue = JSON.parse(localStorage.getItem('pendingSales') || '[]');
      if (queue.length === 0) return;
      const remaining = [];
      for (const p of queue) {
        try { await (await import('./services/api')).default.post('/sales', p); } catch { remaining.push(p); }
      }
      localStorage.setItem('pendingSales', JSON.stringify(remaining));
      if (remaining.length === 0) alert('Ventas pendientes sincronizadas.');
    };
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
  return null;
}

function Guard({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <WsInit />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="cash" element={<Cash />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
