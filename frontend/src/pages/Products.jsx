import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';

export default function Products() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ sku: '', name: '', costPrice: 0, salePrice: 0, minStock: 0 });
  const { data } = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get('/products')).data });

  const create = useMutation({
    mutationFn: async (payload) => (await api.post('/products', payload)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setForm({ sku: '', name: '', costPrice: 0, salePrice: 0, minStock: 0 }); },
  });

  const remove = useMutation({
    mutationFn: async (id) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    onError: (err) => alert(err.response?.data?.error?.message || 'Error al eliminar'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
      <div className="bg-white rounded shadow p-4 mb-4 grid grid-cols-5 gap-2">
        <input className="border p-2 rounded" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2 rounded" type="number" placeholder="Costo" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
        <input className="border p-2 rounded" type="number" placeholder="Venta" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} />
        <button onClick={() => create.mutate(form)} className="bg-slate-900 text-white rounded px-3">Crear</button>
      </div>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2 text-left">SKU</th><th className="p-2 text-left">Nombre</th><th className="p-2">Costo</th><th className="p-2">Venta</th><th className="p-2">Stock</th><th className="p-2">Acciones</th></tr></thead>
          <tbody>
            {data?.data?.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.sku}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2 text-center">{Number(p.cost_price).toLocaleString('es-CO')}</td>
                <td className="p-2 text-center">{Number(p.sale_price).toLocaleString('es-CO')}</td>
                <td className="p-2 text-center">{Number(p.stock ?? 0)}</td>
                <td className="p-2 text-center"><button onClick={() => { if (confirm('¿Desactivar producto?')) remove.mutate(p.id); }} className="text-red-500">Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
