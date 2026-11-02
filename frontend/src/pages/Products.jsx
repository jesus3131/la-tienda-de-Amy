import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';
import { Plus, Search, Package, Trash2, Pencil, X, Upload } from 'lucide-react';
import ProductImage from '../components/ui/ProductImage';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ sku: '', name: '', costPrice: 0, salePrice: 0, minStock: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => (await api.get('/products', { params: { search, limit: 50 } })).data,
  });

  const create = useMutation({
    mutationFn: async (payload) => {
      const product = (await api.post('/products', payload)).data;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        await api.post(`/products/${product.id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return product;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setShowForm(false); setForm({ sku: '', name: '', costPrice: 0, salePrice: 0, minStock: 0 }); setImageFile(null); setImagePreview(null); },
  });

  const update = useMutation({
    mutationFn: async ({ id, payload, file }) => {
      await api.put(`/products/${id}`, payload);
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        await api.post(`/products/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      if (payload.removeImage) {
        await api.delete(`/products/${id}/image`);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setEditing(null); },
  });

  const remove = useMutation({
    mutationFn: async (id) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const openEdit = (p) => {
    setEditing(p);
    setEditForm({ sku: p.sku, name: p.name, costPrice: Number(p.cost_price), salePrice: Number(p.sale_price), minStock: Number(p.min_stock) });
    setEditPreview(p.image_url);
    setEditImage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
          <p className="text-sm text-stone-500 mt-1">Gestiona el catálogo de productos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Nuevo producto
        </Button>
      </div>

      <div className="card p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input className="input pl-9" placeholder="Buscar por nombre, SKU o código de barras..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {showForm && (
        <div className="card p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Nuevo producto</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="input" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className="input md:col-span-2" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" type="number" placeholder="Costo" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
            <input className="input" type="number" placeholder="Venta" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} />
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-stone-600 mb-1">Imagen (opcional)</label>
            <div className="flex items-center gap-3">
              {imagePreview && <img src={imagePreview} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-stone-200" />}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
              }} className="text-sm text-stone-600" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => create.mutate(form)} loading={create.isPending}>Crear producto</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setImageFile(null); setImagePreview(null); }}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-900">Editar producto</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded-lg hover:bg-stone-100"><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <div className="space-y-3">
              <input className="input" placeholder="SKU" value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
              <input className="input" placeholder="Nombre" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" type="number" placeholder="Costo" value={editForm.costPrice} onChange={(e) => setEditForm({ ...editForm, costPrice: Number(e.target.value) })} />
                <input className="input" type="number" placeholder="Venta" value={editForm.salePrice} onChange={(e) => setEditForm({ ...editForm, salePrice: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Imagen</label>
                <div className="flex items-center gap-3">
                  {(editPreview || editing.image_url) && (
                    <img src={editPreview || (editing.image_url?.startsWith('http') ? editing.image_url : `${import.meta.env.VITE_API_URL || ''}${editing.image_url}`)} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-stone-200" />
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setEditImage(f); setEditPreview(URL.createObjectURL(f)); }
                  }} className="text-sm text-stone-600" />
                  {editing.image_url && (
                    <Button variant="danger" className="text-xs" onClick={() => update.mutate({ id: editing.id, payload: { removeImage: true }, file: null })}>
                      Quitar imagen
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={() => update.mutate({ id: editing.id, payload: { sku: editForm.sku, name: editForm.name, costPrice: editForm.costPrice, salePrice: editForm.salePrice, minStock: editForm.minStock }, file: editImage })} loading={update.isPending}>
                Guardar cambios
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
        ) : data?.data?.length === 0 ? (
          <EmptyState title="Sin productos" description="Crea tu primer producto para comenzar" icon={Package} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">SKU</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Costo</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Venta</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Stock</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Estado</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data?.data?.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <ProductImage src={p.image_url} alt={p.name} size="sm" />
                        <div>
                          <div className="font-medium text-stone-900">{p.name}</div>
                          <div className="text-xs text-stone-400">{p.category_name || 'Sin categoría'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-mono text-xs">{p.sku}</td>
                    <td className="py-3 px-4 text-right text-stone-600">{Number(p.cost_price).toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 text-right font-medium text-stone-900">{Number(p.sale_price).toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-medium ${Number(p.stock) <= Number(p.min_stock) ? 'text-red-600' : 'text-stone-900'}`}>
                        {Number(p.stock ?? 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm('¿Desactivar producto?')) remove.mutate(p.id); }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}