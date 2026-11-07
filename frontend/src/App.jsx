import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useState } from 'react';
import { initWebSocket } from './services/websocket';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import api from './services/api';
import { listPendingSales, migrateLegacySales, removeQueuedSale, updateQueuedSale } from './services/offlineQueue';

const qc = new QueryClient();
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const POS = lazy(() => import('./pages/POS'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Customers = lazy(() => import('./pages/Customers'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Cash = lazy(() => import('./pages/Cash'));
const Reports = lazy(() => import('./pages/Reports'));

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    const show = (event) => {
      const detail = event.detail || {};
      const notification = { id: Date.now(), title: detail.title || 'Actualización', message: detail.message || '', type: detail.type || 'info' };
      setNotifications((current) => [...current.slice(-2), notification]);
      window.setTimeout(() => setNotifications((current) => current.filter((item) => item.id !== notification.id)), 4200);
    };
    window.addEventListener('app:notify', show);
    return () => window.removeEventListener('app:notify', show);
  }, []);
  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1100, width: 'min(100% - 2rem, 380px)' }}>
      {notifications.map((item) => (
        <div key={item.id} className={`toast show border-0 shadow mb-2 animate-slide-in ${item.type === 'success' ? 'bg-success text-white' : item.type === 'danger' ? 'bg-danger text-white' : 'bg-dark text-white'}`} role="status">
          <div className="toast-body d-flex gap-2 align-items-start">
            <i className={`bi ${item.type === 'success' ? 'bi-check-circle' : item.type === 'danger' ? 'bi-exclamation-triangle' : 'bi-info-circle'} fs-5`} />
            <div><strong className="d-block">{item.title}</strong><span className="small opacity-75">{item.message}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
      <NotificationCenter />
      <WsInit />
      <BrowserRouter>
        <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="spinner-border text-success" role="status" aria-label="Cargando" /></div>}>
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
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
