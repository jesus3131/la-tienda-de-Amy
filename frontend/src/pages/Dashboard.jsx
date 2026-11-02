import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { TrendingUp, Package, AlertTriangle, DollarSign, ShoppingCart, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/reports/dashboard')).data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const cards = [
    { label: 'Ventas hoy', value: data?.salesToday?.total ?? 0, icon: DollarSign, color: 'emerald' },
    { label: 'Transacciones', value: data?.salesToday?.count ?? 0, icon: ShoppingCart, color: 'blue' },
    { label: 'Ventas semana', value: data?.salesWeek ?? 0, icon: TrendingUp, color: 'violet' },
    { label: 'Productos', value: data?.totalProducts ?? 0, icon: Package, color: 'amber' },
    { label: 'Valor inventario', value: data?.inventoryValue ?? 0, icon: BarChart3, color: 'cyan' },
    { label: 'Stock bajo', value: data?.lowStockCount ?? 0, icon: AlertTriangle, color: 'red' },
  ];

  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    red: 'bg-red-50 text-red-600',
  };

  const topProducts = data?.topProducts?.map((p) => ({
    name: p.name?.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    revenue: Number(p.revenue),
  })) || [];

  const pieData = data?.topProducts?.map((p) => ({ name: p.name, value: Number(p.revenue) })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Resumen de operaciones del negocio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[c.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-900">
                {Number(c.value).toLocaleString('es-CO')}
              </div>
              <div className="text-xs text-stone-500 mt-1">{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">Productos más vendidos</h2>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e7e5e4', fontSize: '12px' }}
                  formatter={(v) => [Number(v).toLocaleString('es-CO'), 'Ingresos']}
                />
                <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-stone-400 text-sm">Sin datos de ventas</div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">Distribución de ingresos</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name?.slice(0, 12)}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => Number(v).toLocaleString('es-CO')} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-stone-400 text-sm">Sin datos de ventas</div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">Ventas recientes</h2>
        {data?.recentSales?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-stone-500 uppercase">ID</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-stone-500 uppercase">Total</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-stone-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((s) => (
                  <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-xs text-stone-600">{s.id?.slice(0, 8)}</td>
                    <td className="py-2 px-3 text-right font-medium text-stone-900">{Number(s.total).toLocaleString('es-CO')}</td>
                    <td className="py-2 px-3 text-right text-stone-500 text-xs">{new Date(s.created_at).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-stone-400 text-sm">Sin ventas registradas</div>
        )}
      </div>
    </div>
  );
}