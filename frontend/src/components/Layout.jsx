import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOnline } from '../hooks/useOnline';
import { useNodeStatus } from '../hooks/useNodeStatus';
import { LayoutDashboard, ShoppingCart, Package, Warehouse, Truck, Users, ClipboardList, DollarSign, BarChart3, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/pos', label: 'Punto de Venta', icon: ShoppingCart, roles: ['admin', 'supervisor', 'cashier'] },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/products', label: 'Productos', icon: Package, roles: ['admin', 'supervisor', 'warehouse'] },
      { to: '/inventory', label: 'Inventario', icon: Warehouse, roles: ['admin', 'supervisor', 'warehouse'] },
      { to: '/suppliers', label: 'Proveedores', icon: Truck, roles: ['admin', 'supervisor', 'warehouse'] },
      { to: '/customers', label: 'Clientes', icon: Users, roles: ['admin', 'supervisor'] },
      { to: '/purchases', label: 'Compras', icon: ClipboardList, roles: ['admin', 'supervisor', 'warehouse'] },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { to: '/cash', label: 'Caja', icon: DollarSign, roles: ['admin', 'supervisor', 'cashier'] },
      { to: '/reports', label: 'Reportes', icon: BarChart3, roles: ['admin', 'supervisor'] },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const online = useOnline();
  const node = useNodeStatus();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-stone-50">
      {!online && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-1.5 z-50 text-xs font-medium">
          Sin conexión — modo solo consulta. Las operaciones se sincronizarán al reconectar.
        </div>
      )}
      <aside
        className={`flex flex-col bg-white border-r border-stone-200 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'} ${online ? '' : 'mt-7'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-stone-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-stone-900 truncate">La tienda de Amy</h1>
              <p className="text-xs text-stone-400 truncate">ERP / POS</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + node status */}
        <div className="border-t border-stone-100 p-3 space-y-2">
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-700 text-xs font-bold">{user?.name?.[0] || 'A'}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-stone-900 truncate">{user?.name}</p>
                <p className="text-xs text-stone-400 truncate">{user?.role}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="text-xs text-stone-400 px-1">
              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${node.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {node.target === 'local' ? 'Nodo local' : 'Servidor central'}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {!collapsed && (
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}