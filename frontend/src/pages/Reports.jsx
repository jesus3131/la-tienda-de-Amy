import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function Reports() {
  const { data: inv } = useQuery({ queryKey: ['rep-inventory'], queryFn: async () => (await api.get('/reports/inventory')).data });
  const { data: top } = useQuery({ queryKey: ['rep-top'], queryFn: async () => (await api.get('/reports/top-products')).data });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="font-semibold mb-2">Valoración de inventario</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2 text-left">Producto</th><th className="p-2">Cantidad</th><th className="p-2">Valor costo</th></tr></thead>
          <tbody>{inv?.map((i) => <tr key={i.id} className="border-t"><td className="p-2">{i.name}</td><td className="p-2 text-center">{Number(i.quantity)}</td><td className="p-2 text-center">{Number(i.cost_value).toLocaleString('es-CO')}</td></tr>)}</tbody>
        </table>
        <a href="/api/v1/reports/export/inventory" className="inline-block mt-2 text-blue-600 text-sm mr-4">Exportar CSV</a>
        <a href="/api/v1/reports/export/inventory/excel" className="inline-block mt-2 text-green-600 text-sm">Exportar Excel</a>
      </div>
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-2">Top productos</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2 text-left">Producto</th><th className="p-2">Unidades</th><th className="p-2">Ingresos</th></tr></thead>
          <tbody>{top?.map((p) => <tr key={p.id} className="border-t"><td className="p-2">{p.name}</td><td className="p-2 text-center">{p.units_sold}</td><td className="p-2 text-center">{Number(p.revenue).toLocaleString('es-CO')}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
