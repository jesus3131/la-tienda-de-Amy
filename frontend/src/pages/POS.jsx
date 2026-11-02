import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useOnline } from '../hooks/useOnline';

export default function POS() {
  const online = useOnline();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [cash, setCash] = useState(0);

  const { data: products } = useQuery({
    queryKey: ['pos-products', search],
    queryFn: async () => (await api.get('/products', { params: { search, limit: 20, active: true } })).data,
  });

  const addToCart = (p) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, unitPrice: Number(p.sale_price), quantity: 1, discount: 0, taxRate: Number(p.tax_rate) }];
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
      idempotencyKey: `sale-${Date.now()}`,
    };
    if (!online) {
      const queue = JSON.parse(localStorage.getItem('pendingSales') || '[]');
      queue.push(payload);
      localStorage.setItem('pendingSales', JSON.stringify(queue));
      alert('Sin conexión: venta guardada como pendiente. Se sincronizará al reconectar.');
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
    <div className="grid grid-cols-3 gap-4 h-full">
      <div className="col-span-2 bg-white rounded shadow p-4 flex flex-col">
        <input className="border p-2 rounded mb-3" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid grid-cols-3 gap-2 overflow-auto flex-1">
          {products?.data?.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} className="border rounded p-3 text-left hover:bg-slate-50">
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="text-xs text-slate-500">{p.sku}</div>
              <div className="text-sm font-bold mt-1">{Number(p.sale_price).toLocaleString('es-CO')}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded shadow p-4 flex flex-col">
        <h2 className="font-bold mb-2">Carrito</h2>
        <div className="flex-1 overflow-auto space-y-2">
          {cart.map((i) => (
            <div key={i.productId} className="border rounded p-2 text-sm">
              <div className="font-semibold">{i.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <input type="number" className="border w-16 p-1 rounded" value={i.quantity} onChange={(e) => updateQty(i.productId, Number(e.target.value))} />
                <span>x {i.unitPrice.toLocaleString('es-CO')}</span>
                <button onClick={() => remove(i.productId)} className="text-red-500 ml-auto">X</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-2 mt-2 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toLocaleString('es-CO')}</span></div>
          <div className="flex justify-between"><span>Impuestos</span><span>{tax.toLocaleString('es-CO')}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{total.toLocaleString('es-CO')}</span></div>
        </div>
        <button onClick={checkout} disabled={cart.length === 0} className="mt-3 bg-green-600 text-white p-2 rounded disabled:opacity-50">Cobrar</button>
      </div>
    </div>
  );
}
