import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';

export default function Suppliers() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const { data } = useQuery({ queryKey: ['suppliers'], queryFn: async () => (await api.get('/suppliers')).data });
  const create = useMutation({ mutationFn: async (p) => (await api.post('/suppliers', p)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setForm({ name: '', phone: '', email: '' }); } });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Proveedores</h1>
      <div className="bg-white rounded shadow p-4 mb-4 flex gap-2">
        <input className="border p-2 rounded flex-1" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button onClick={() => create.mutate(form)} className="bg-slate-900 text-white rounded px-3">Crear</button>
      </div>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2 text-left">Nombre</th><th className="p-2">Teléfono</th><th className="p-2">Email</th></tr></thead>
          <tbody>{data?.map((s) => <tr key={s.id} className="border-t"><td className="p-2">{s.name}</td><td className="p-2 text-center">{s.phone}</td><td className="p-2 text-center">{s.email}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
