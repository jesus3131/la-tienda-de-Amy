import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('admin@erp.local');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.token, data.user, data.refreshToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No pudimos iniciar tu sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="brand-mark mb-4">A</div>
        <p className="text-uppercase small fw-bold opacity-75 mb-2">La tienda de Amy</p>
        <h1 className="display-4 fw-bold">Cada venta, una historia de crecimiento.</h1>
        <p className="lead opacity-75 mt-3">Administra inventario, caja y clientes desde un espacio simple, rápido y seguro.</p>
      </section>
      <form onSubmit={submit} className="login-panel card p-4 p-md-5 animate-fade-in">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="brand-mark">A</div>
          <div><div className="brand-title fw-bold fs-5">La tienda de Amy</div><div className="small text-muted">Panel de operaciones</div></div>
        </div>
        <div className="mb-4">
          <h2 className="h3 fw-bold mb-1">Bienvenido de nuevo</h2>
          <p className="text-muted mb-0">Ingresa para continuar con tu jornada.</p>
        </div>
        {error && <div className="alert alert-danger d-flex gap-2 align-items-center small"><i className="bi bi-exclamation-circle" />{error}</div>}
        <label className="form-label fw-semibold small" htmlFor="email">Correo electrónico</label>
        <div className="input-group mb-3">
          <span className="input-group-text bg-white border-end-0"><Mail size={17} /></span>
          <input id="email" className="form-control border-start-0" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <label className="form-label fw-semibold small" htmlFor="password">Contraseña</label>
        <div className="input-group mb-4">
          <span className="input-group-text bg-white border-end-0"><LockKeyhole size={17} /></span>
          <input id="password" className="form-control border-start-0 border-end-0" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" className="input-group-text bg-white border-start-0" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar contraseña">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        <button className="btn btn-success w-100 py-2 mb-4" disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2" /> Validando...</> : <><Sparkles size={17} className="me-2" /> Entrar al panel</>}
        </button>
        <div className="d-flex justify-content-center gap-2 text-muted small"><ShieldCheck size={16} className="text-success" /> Sesión protegida y cifrada</div>
      </form>
    </main>
  );
}
