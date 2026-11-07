import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { TrendingUp, Package, AlertTriangle, DollarSign, ShoppingCart, BarChart3, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/reports/dashboard')).data,
  });

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
        <div className="spinner-border text-success" role="status" />
      </div>
    );
  }

  const cards = [
    { label: 'Ventas hoy', value: data?.salesToday?.total ?? 0, icon: DollarSign, color: 'success' },
    { label: 'Transacciones', value: data?.salesToday?.count ?? 0, icon: ShoppingCart, color: 'primary' },
    { label: 'Ventas semana', value: data?.salesWeek ?? 0, icon: TrendingUp, color: 'info' },
    { label: 'Productos', value: data?.totalProducts ?? 0, icon: Package, color: 'warning' },
    { label: 'Valor inventario', value: data?.inventoryValue ?? 0, icon: BarChart3, color: 'secondary' },
    { label: 'Stock bajo', value: data?.lowStockCount ?? 0, icon: AlertTriangle, color: 'danger' },
  ];

  const topProducts = data?.topProducts?.map((p) => ({
    name: p.name?.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    revenue: Number(p.revenue),
  })) || [];

  const pieData = data?.topProducts?.map((p) => ({ name: p.name, value: Number(p.revenue) })) || [];

  return (
    <div>
      <div className="page-heading d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div><div className="text-uppercase text-success small fw-bold mb-2">Resumen operativo</div><h1 className="h2 fw-bold text-dark mb-1">Buenos días, equipo <span aria-hidden="true">👋</span></h1>
        <p className="text-muted small mb-0">Resumen de operaciones del negocio</p>
        </div>
        <button className="btn btn-light border d-flex align-items-center gap-2"><RefreshCw size={15} /> Actualizar datos</button>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="col-6 col-md-4 col-xl-2">
              <div className="card kpi-card h-100">
                <div className="card-body p-3">
                  <div className={`d-inline-flex align-items-center justify-content-center rounded-3 bg-${c.color} bg-opacity-10 text-${c.color} mb-2`} style={{ width: 36, height: 36 }}>
                    <Icon size={18} />
                  </div>
                  <div className="h4 fw-bold text-dark mb-0">{Number(c.value).toLocaleString('es-CO')}</div>
                  <div className="text-muted small">{c.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card chart-card h-100">
            <div className="card-body">
              <h5 className="card-title fw-semibold mb-3" style={{ fontSize: 14 }}>Productos más vendidos</h5>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topProducts} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                    <Tooltip cursor={{ fill: '#e9f8f6' }} contentStyle={{ borderRadius: '8px', border: '1px solid #dce8e7', fontSize: '12px' }} formatter={(v) => [Number(v).toLocaleString('es-CO'), 'Ingresos']} />
                    <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 240 }}>Sin datos de ventas</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card chart-card h-100">
            <div className="card-body">
              <h5 className="card-title fw-semibold mb-3" style={{ fontSize: 14 }}>Distribución de ingresos</h5>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} innerRadius={48} paddingAngle={3} label={({ name }) => name?.slice(0, 12)}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => Number(v).toLocaleString('es-CO')} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 240 }}>Sin datos de ventas</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="card-title fw-semibold mb-3" style={{ fontSize: 14 }}>Ventas recientes</h5>
          {data?.recentSales?.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-0">
                <thead>
                  <tr>
                    <th className="text-muted small text-uppercase">ID</th>
                    <th className="text-end text-muted small text-uppercase">Total</th>
                    <th className="text-end text-muted small text-uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((s) => (
                    <tr key={s.id}>
                      <td className="font-monospace small text-muted">{s.id?.slice(0, 8)}</td>
                      <td className="text-end fw-medium">{Number(s.total).toLocaleString('es-CO')}</td>
                      <td className="text-end text-muted small">{new Date(s.created_at).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted py-4">Sin ventas registradas</div>
          )}
        </div>
      </div>
    </div>
  );
}