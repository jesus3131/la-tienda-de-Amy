import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function Inventory() {
  const { data: inv } = useQuery({ queryKey: ['inventory'], queryFn: async () => (await api.get('/inventory')).data });
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: async () => (await api.get('/inventory/alerts')).data });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Stock bajo</h2>
          <ul className="text-sm space-y-1">
            {alerts?.lowStock?.map((p) => <li key={p.id}>{p.name} — {Number(p.quantity)}</li>)}
            {(!alerts?.lowStock || alerts.lowStock.length === 0) && <li className="text-slate-400">Sin alertas</li>}
          </ul>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Próximos a vencer</h2>
          <ul className="text-sm space-y-1">
            {alerts?.expiringSoon?.map((b) => <li key={b.id}>{b.name} — {b.expiry_date} ({Number(b.quantity)})</li>)}
            {(!alerts?.expiringSoon || alerts.expiringSoon.length === 0) && <li className="text-slate-400">Sin alertas</li>}
          </ul>
        </div>
      </div>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2 text-left">Producto</th><th className="p-2">Cantidad</th><th className="p-2">Mínimo</th></tr></thead>
          <tbody>
            {inv?.map((i) => (
              <tr key={i.id || i.product_id + i.warehouse_id} className="border-t">
                <td className="p-2">{i.name || i.product_id}</td>
                <td className="p-2 text-center">{Number(i.quantity)}</td>
                <td className="p-2 text-center">{Number(i.min_stock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
