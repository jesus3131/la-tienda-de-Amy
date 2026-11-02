import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';

export default function Cash() {
  const qc = useQueryClient();
  const { data: current } = useQuery({ queryKey: ['cash-current'], queryFn: async () => (await api.get('/cash/sessions/current')).data });
  const { data: sessions } = useQuery({ queryKey: ['cash-sessions'], queryFn: async () => (await api.get('/cash/sessions')).data });
  const [opening, setOpening] = useState(0);
  const [closing, setClosing] = useState(0);

  const open = useMutation({ mutationFn: async () => (await api.post('/cash/sessions', { openingBalance: opening })).data, onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-current'] }) });
  const close = useMutation({ mutationFn: async (id) => (await api.post(`/cash/sessions/${id}/close`, { closingBalance: closing })).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-current'] }); qc.invalidateQueries({ queryKey: ['cash-sessions'] }); } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Caja</h1>
      {!current && (
        <div className="bg-white rounded shadow p-4 mb-4 flex gap-2">
          <input className="border p-2 rounded" type="number" value={opening} onChange={(e) => setOpening(Number(e.target.value))} placeholder="Saldo inicial" />
          <button onClick={() => open.mutate()} className="bg-green-600 text-white rounded px-3">Abrir caja</button>
        </div>
      )}
      {current && (
        <div className="bg-white rounded shadow p-4 mb-4">
          <div>Sesión abierta: {current.id}</div>
          <div className="flex gap-2 mt-2">
            <input className="border p-2 rounded" type="number" value={closing} onChange={(e) => setClosing(Number(e.target.value))} placeholder="Saldo cierre" />
            <button onClick={() => close.mutate(current.id)} className="bg-red-600 text-white rounded px-3">Cerrar caja</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100"><tr><th className="p-2">Abierta</th><th className="p-2">Cerrada</th><th className="p-2">Inicial</th><th className="p-2">Esperado</th><th className="p-2">Diferencia</th></tr></thead>
          <tbody>{sessions?.map((s) => <tr key={s.id} className="border-t"><td className="p-2">{new Date(s.opened_at).toLocaleString()}</td><td className="p-2">{s.closed_at ? new Date(s.closed_at).toLocaleString() : '-'}</td><td className="p-2 text-center">{Number(s.opening_balance)}</td><td className="p-2 text-center">{s.expected_balance ?? '-'}</td><td className="p-2 text-center">{s.difference ?? '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
