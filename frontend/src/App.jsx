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
import api from './services/api';
import { listPendingSales, migrateLegacySales, removeQueuedSale, updateQueuedSale } from './services/offlineQueue';

const qc = new QueryClient();

function WsInit() {
  useEffect(() => { initWebSocket(qc); }, []);
  useEffect(() => {
    const sync = async () => {
      await migrateLegacySales();
      const queue = await listPendingSales();
      for (const sale of queue) {
        await updateQueuedSale(sale, { status: 'syncing', attempts: sale.attempts + 1 });
        try {
          await api.post('/sales', sale.payload);
          await removeQueuedSale(sale.id);
        } catch (error) {
          await updateQueuedSale(sale, {
            status: error.response?.status >= 400 && error.response?.status < 500 ? 'rejected' : 'pending',
            lastError: error.response?.data?.error?.message || 'No se pudo sincronizar',
          });
        }
      }
    };
    window.addEventListener('online', sync);
    sync().catch((error) => console.error('Offline queue sync failed', error));
    return () => window.removeEventListener('online', sync);
  }, []);
  return null;
}

function Guard({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RoleGuard({ roles, children }) {
  const role = useAuthStore((s) => s.user?.role);
  if (!roles.includes(role)) return <Navigate to="/" replace />;
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
            <Route path="pos" element={<RoleGuard roles={['admin', 'supervisor', 'cashier']}><POS /></RoleGuard>} />
            <Route path="products" element={<RoleGuard roles={['admin', 'supervisor', 'warehouse']}><Products /></RoleGuard>} />
            <Route path="inventory" element={<RoleGuard roles={['admin', 'supervisor', 'warehouse']}><Inventory /></RoleGuard>} />
            <Route path="suppliers" element={<RoleGuard roles={['admin', 'supervisor', 'warehouse']}><Suppliers /></RoleGuard>} />
            <Route path="customers" element={<RoleGuard roles={['admin', 'supervisor']}><Customers /></RoleGuard>} />
            <Route path="purchases" element={<RoleGuard roles={['admin', 'supervisor', 'warehouse']}><Purchases /></RoleGuard>} />
            <Route path="cash" element={<RoleGuard roles={['admin', 'supervisor', 'cashier']}><Cash /></RoleGuard>} />
            <Route path="reports" element={<RoleGuard roles={['admin', 'supervisor']}><Reports /></RoleGuard>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
