import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { AlertTriangle, Package, Clock } from 'lucide-react';
import ProductImage from '../components/ui/ProductImage';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Inventory() {
  const { data: inv, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: async () => (await api.get('/inventory')).data });
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: async () => (await api.get('/inventory/alerts')).data });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Inventario</h1>
        <p className="text-sm text-stone-500 mt-1">Control de existencias y alertas</p>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-stone-700">Stock bajo</h2>
          </div>
          {alerts?.lowStock?.length > 0 ? (
            <ul className="space-y-2">
              {alerts.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">{p.name}</span>
                  <Badge variant="warning">{Number(p.quantity)} / {Number(p.min_stock)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-400">Sin alertas de stock bajo</p>
          )}
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-stone-700">Próximos a vencer</h2>
          </div>
          {alerts?.expiringSoon?.length > 0 ? (
            <ul className="space-y-2">
              {alerts.expiringSoon.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">{b.name}</span>
                  <Badge variant="danger">{b.expiry_date}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-400">Sin alertas de vencimiento</p>
          )}
        </div>
      </div>

      {/* Inventory table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
        ) : inv?.length === 0 ? (
          <EmptyState title="Sin inventario" description="Agrega productos para ver el inventario" icon={Package} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 uppercase">Producto</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-stone-500 uppercase">Cantidad</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-stone-500 uppercase">Mínimo</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-stone-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inv?.map((i) => {
                  const qty = Number(i.quantity);
                  const min = Number(i.min_stock);
                  const status = qty <= 0 ? 'danger' : qty <= min ? 'warning' : 'success';
                  const label = qty <= 0 ? 'Agotado' : qty <= min ? 'Bajo' : 'OK';
                  return (
                    <tr key={i.id || i.product_id + i.warehouse_id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductImage src={i.image_url} alt={i.name} size="sm" />
                          <span className="font-medium text-stone-900">{i.name || i.product_id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-stone-900">{qty.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-right text-stone-500">{min.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-center"><Badge variant={status}>{label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}