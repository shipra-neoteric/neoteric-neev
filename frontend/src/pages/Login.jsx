import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { session, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (session) {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ width: 'min(360px, 92vw)' }}>
        <div className="brand" style={{ border: 0, padding: 0, marginBottom: 16 }}>
          <b>NEEV Tracker</b>
          <span>Batch 2026-01</span>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert crit" style={{ marginBottom: 12 }}><span className="ai">!</span><div>{error}</div></div>}
          <div className="lbl">Email</div>
          <input className="sel" type="email" autoComplete="username" required
            style={{ width: '100%', marginBottom: 12 }}
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="lbl">Password</div>
          <input className="sel" type="password" autoComplete="current-password" required
            style={{ width: '100%', marginBottom: 16 }}
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn" style={{ width: '100%' }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
