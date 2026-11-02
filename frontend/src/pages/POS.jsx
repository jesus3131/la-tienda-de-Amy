import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useOnline } from '../hooks/useOnline';
import { Search, Plus, Minus, Trash2, ShoppingCart, Package } from 'lucide-react';
import ProductImage from '../components/ui/ProductImage';
import Button from '../components/ui/Button';
import { enqueueSale } from '../services/offlineQueue';

export default function POS() {
  const online = useOnline();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  const { data: products } = useQuery({
    queryKey: ['pos-products', search],
    queryFn: async () => (await api.get('/products', { params: { search, limit: 30, active: true } })).data,
  });

  const addToCart = (p) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, imageUrl: p.image_url, unitPrice: Number(p.sale_price), quantity: 1, discount: 0, taxRate: Number(p.tax_rate) }];
    });
  };

  const updateQty = (id, q) => setCart((prev) => prev.map((i) => i.productId === id ? { ...i, quantity: Math.max(1, q) } : i));
  const remove = (id) => setCart((prev) => prev.filter((i) => i.productId !== id));

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = cart.reduce((s, i) => s + (i.quantity * i.unitPrice - i.discount) * (i.taxRate / 100), 0);
  const discount = cart.reduce((s, i) => s + i.discount, 0);
  const total = subtotal - discount + tax;

  const checkout = async () => {
    const payload = {
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, taxRate: i.taxRate })),
      payments: [{ method: 'cash', amount: total }],
      idempotencyKey: globalThis.crypto.randomUUID(),
    };
    if (!online) {
      await enqueueSale(payload);
      alert('Sin conexión: venta guardada como pendiente.');
      setCart([]);
      return;
    }
    try {
      const { data } = await api.post('/sales', payload);
      alert(`Venta registrada. Total: ${Number(data.total).toLocaleString('es-CO')}`);
      setCart([]);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Product catalog */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Buscar producto por nombre, SKU o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products?.data?.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="card p-3 text-left hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <div className="aspect-square rounded-lg bg-stone-100 mb-2 overflow-hidden flex items-center justify-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Package className="w-8 h-8 text-stone-300" />
                  )}
                </div>
                <div className="text-xs font-medium text-stone-900 truncate">{p.name}</div>
                <div className="text-xs text-stone-400 truncate">{p.sku}</div>
                <div className="text-sm font-bold text-emerald-600 mt-1">{Number(p.sale_price).toLocaleString('es-CO')}</div>
                <div className="text-xs text-stone-400">Stock: {Number(p.stock ?? 0)}</div>
              </button>
            ))}
          </div>
          {(!products?.data || products.data.length === 0) && (
            <div className="flex flex-col items-center justify-center h-40 text-stone-400">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">Sin productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="card flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-stone-900">Carrito</h2>
          <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            {cart.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400">
              <ShoppingCart className="w-10 h-10 mb-2" />
              <p className="text-sm">Carrito vacío</p>
            </div>
          ) : (
            cart.map((i) => (
              <div key={i.productId} className="flex items-center gap-3 p-2 rounded-lg bg-stone-50 border border-stone-100">
                <ProductImage src={i.imageUrl} alt={i.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-stone-900 truncate">{i.name}</div>
                  <div className="text-xs text-stone-500">{i.unitPrice.toLocaleString('es-CO')} × {i.quantity}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(i.productId, i.quantity - 1)} className="p-1 rounded hover:bg-stone-200 text-stone-500">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-medium w-6 text-center">{i.quantity}</span>
                  <button onClick={() => updateQty(i.productId, i.quantity + 1)} className="p-1 rounded hover:bg-stone-200 text-stone-500">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => remove(i.productId)} className="p-1 rounded hover:bg-red-100 text-stone-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-stone-200 p-4 space-y-2">
          <div className="flex justify-between text-sm text-stone-600">
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between text-sm text-stone-600">
            <span>Impuestos</span>
            <span>{tax.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-200">
            <span>Total</span>
            <span className="text-emerald-600">{total.toLocaleString('es-CO')}</span>
          </div>
          <Button onClick={checkout} disabled={cart.length === 0} className="w-full mt-2" variant="primary">
            Cobrar
          </Button>
        </div>
      </div>
    </div>
  );
}