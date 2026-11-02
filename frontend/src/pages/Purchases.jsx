import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';

export default function Purchases() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({ queryKey: ['purchases'], queryFn: async () => (await api.get('/purchases')).data });
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: async () => (await api.get('/suppliers')).data });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get('/products')).data });

  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(0);

  const create = useMutation({
    mutationFn: async (p) => (await api.post('/purchases', p)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchases'] }),
  });

  const receive = useMutation({
    mutationFn: async (id) => (await api.post(`/purchases/${id}/receive`, { items: [] })).data,
  });

  const submit = () => {
    if (!supplierId || !productId) return;
    create.mutate({ supplierId, items: [{ productId, quantity: qty, unitCost: cost }] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Compras</h1>
      <div className="bg-white rounded shadow p-4 mb-4 flex gap-2 flex-wrap">
        <select className="border p-2 rounded" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">Proveedor</option>
          {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="border p-2 rounded" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Producto</option>
          {products?.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input className="border p-2 rounded w-20" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        <input className="border p-2 rounded w-24" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
        <button onClick={submit} className="bg-slate-900 text-white rounded px-3">Crear orden</button>
      </div>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2 text-left">Proveedor</th><th className="p-2">Estado</th><th className="p-2">Total</th><th className="p-2">Acciones</th></tr></thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-2">{o.supplier_name}</td>
                <td className="p-2 text-center">{o.status}</td>
                <td className="p-2 text-center">{Number(o.total).toLocaleString('es-CO')}</td>
                <td className="p-2 text-center">
                  {o.status !== 'received' && (
                    <button onClick={() => {
                      // receive full quantity
                      const items = o.items?.map((it) => ({ purchaseOrderItemId: it.id, productId: it.product_id, quantity: Number(it.quantity) - Number(it.received_quantity) }));
                      api.post(`/purchases/${o.id}/receive`, { items: items.filter((i) => i.quantity > 0) }).then(() => qc.invalidateQueries({ queryKey: ['purchases'] }));
                    }} className="text-green-600">Recibir</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
