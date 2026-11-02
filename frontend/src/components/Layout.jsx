import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOnline } from '../hooks/useOnline';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/pos', label: 'POS' },
  { to: '/products', label: 'Productos' },
  { to: '/inventory', label: 'Inventario' },
  { to: '/suppliers', label: 'Proveedores' },
  { to: '/customers', label: 'Clientes' },
  { to: '/purchases', label: 'Compras' },
  { to: '/cash', label: 'Caja' },
  { to: '/reports', label: 'Reportes' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const online = useOnline();
  return (
    <div className="flex min-h-screen bg-slate-100">
      {!online && <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-1 z-50 text-sm">Sin conexión — modo solo consulta. Las operaciones se sincronizarán al reconectar.</div>}
      <aside className="w-60 bg-slate-900 text-white p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-6">ERP/POS</h1>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="block px-3 py-2 rounded hover:bg-slate-700 text-sm">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="text-xs text-slate-400 mt-4">
          <div>{user?.name}</div>
          <div>{user?.role}</div>
          <button onClick={() => { logout(); navigate('/login'); }} className="mt-2 text-red-400 hover:underline">Cerrar sesión</button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
