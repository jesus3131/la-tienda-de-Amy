import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOnline } from '../hooks/useOnline';
import { useNodeStatus } from '../hooks/useNodeStatus';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, Truck, Users,
  ClipboardList, DollarSign, BarChart3, LogOut, ChevronLeft, ChevronRight,
  Menu, X
} from 'lucide-react';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/products', label: 'Productos', icon: Package },
      { to: '/inventory', label: 'Inventario', icon: Warehouse },
      { to: '/suppliers', label: 'Proveedores', icon: Truck },
      { to: '/customers', label: 'Clientes', icon: Users },
      { to: '/purchases', label: 'Compras', icon: ClipboardList },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { to: '/cash', label: 'Caja', icon: DollarSign },
      { to: '/reports', label: 'Reportes', icon: BarChart3 },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const online = useOnline();
  const node = useNodeStatus();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="d-flex align-items-center gap-2 px-3 py-4 border-bottom">
      <div className="brand-mark">
          A
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="fw-bold text-dark" style={{ fontSize: 14 }}>La tienda de Amy</div>
            <div className="text-muted" style={{ fontSize: 11 }}>ERP / POS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-grow-1 overflow-auto py-3 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <div className="px-3 mb-1 text-uppercase text-muted fw-semibold" style={{ fontSize: 10, letterSpacing: '0.08em' }}>
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-link-custom d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none mb-1 ${isActive ? 'active' : ''}`}
                  style={{ fontSize: 14 }}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span className="text-truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* User + status */}
      <div className="border-top p-3">
        <div className={`d-flex align-items-center gap-2 ${collapsed ? 'justify-content-center' : ''} mb-2`}>
          <div className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success fw-bold flex-shrink-0" style={{ width: 32, height: 32, fontSize: 12 }}>
            {user?.name?.[0] || 'A'}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="fw-medium text-dark text-truncate" style={{ fontSize: 12 }}>{user?.name}</div>
              <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{user?.role}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="d-flex align-items-center gap-1 px-2 mb-2" style={{ fontSize: 11 }}>
            <span className={`rounded-circle ${node.status ? 'bg-success' : 'bg-danger'}`} style={{ width: 8, height: 8, display: 'inline-block' }} />
            <span className="text-muted">{node.target === 'local' ? 'Nodo local' : 'Servidor central'}</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1 mb-2"
          style={{ fontSize: 12 }}
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> Colapsar</>}
        </button>
        {!collapsed && (
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-1"
            style={{ fontSize: 12 }}
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Mobile toggle */}
      <button
        className="btn btn-success position-fixed top-0 start-0 m-2 d-lg-none z-3"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ zIndex: 1050 }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none" style={{ zIndex: 1040 }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-shell d-flex flex-column border-end ${mobileOpen ? 'position-fixed top-0 start-0 h-100' : 'd-none d-lg-flex'}`}
        style={{ width: collapsed ? 64 : 256, zIndex: 1045, transition: 'width 0.2s' }}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-grow-1 overflow-auto">
        {!online && (
          <div className="alert alert-danger rounded-0 mb-0 text-center py-1" style={{ fontSize: 12 }}>
            Sin conexión — modo solo consulta. Las operaciones se sincronizarán al reconectar.
          </div>
        )}
        <div className="topbar d-flex justify-content-end align-items-center px-4 gap-2">
          <span className="status-pill small text-muted"><span className={`status-dot ${online ? 'bg-success' : 'bg-danger'}`} /> {online ? 'En línea' : 'Sin conexión'}</span>
          <span className="status-pill small text-muted">{node.target === 'local' ? 'Nodo local' : 'Servidor central'}</span>
        </div>
        <div className="container-fluid py-4 px-4" style={{ maxWidth: 1600 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}