import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/reports/dashboard')).data,
  });

  if (isLoading) return <div>Cargando...</div>;

  const cards = [
    { label: 'Ventas hoy', value: data?.salesToday?.total ?? 0 },
    { label: 'Ventas semana', value: data?.salesWeek ?? 0 },
    { label: 'Ventas mes', value: data?.salesMonth ?? 0 },
    { label: 'Productos', value: data?.totalProducts ?? 0 },
    { label: 'Valor inventario', value: data?.inventoryValue ?? 0 },
    { label: 'Stock bajo', value: data?.lowStockCount ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded shadow p-4">
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className="text-2xl font-bold">{Number(c.value).toLocaleString('es-CO')}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-2">Productos más vendidos</h2>
        <table className="w-full text-sm">
          <thead><tr><th className="text-left">Producto</th><th>Unidades</th><th>Ingresos</th></tr></thead>
          <tbody>
            {data?.topProducts?.map((p) => (
              <tr key={p.id}><td>{p.name}</td><td className="text-center">{p.units_sold}</td><td className="text-center">{Number(p.revenue).toLocaleString('es-CO')}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
