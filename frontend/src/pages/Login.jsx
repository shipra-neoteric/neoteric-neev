import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function StaffLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
  );
}

function TraineeLogin() {
  const { requestOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [devCode, setDevCode] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { devCode: dc } = await requestOtp(phone);
      setDevCode(dc ?? null);
      setStep('code');
    } catch {
      setError('No trainee account found with that phone number.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone, code);
    } catch {
      setError('Wrong or expired code.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleRequest}>
        {error && <div className="alert crit" style={{ marginBottom: 12 }}><span className="ai">!</span><div>{error}</div></div>}
        <div className="lbl">Phone number</div>
        <input className="sel" type="tel" required autoFocus
          style={{ width: '100%', marginBottom: 16 }}
          value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn" style={{ width: '100%' }} type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send code'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify}>
      {error && <div className="alert crit" style={{ marginBottom: 12 }}><span className="ai">!</span><div>{error}</div></div>}
      {devCode && (
        <div className="alert info" style={{ marginBottom: 12 }}>
          <span className="ai">i</span>
          <div>No SMS provider configured yet — your code is <b>{devCode}</b> (dev mode only).</div>
        </div>
      )}
      <div className="lbl">6-digit code sent to {phone}</div>
      <input className="sel" inputMode="numeric" pattern="[0-9]*" maxLength={6} required autoFocus
        style={{ width: '100%', marginBottom: 16 }}
        value={code} onChange={(e) => setCode(e.target.value)} />
      <button className="btn" style={{ width: '100%', marginBottom: 8 }} type="submit" disabled={loading}>
        {loading ? 'Verifying…' : 'Verify & sign in'}
      </button>
      <button className="btn ghost" style={{ width: '100%' }} type="button" onClick={() => setStep('phone')}>
        Use a different number
      </button>
    </form>
  );
}

export default function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState('staff');

  if (session) {
    const fallback = session.role === 'trainee' ? '/t/today' : '/dashboard';
    return <Navigate to={location.state?.from ?? fallback} replace />;
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ width: 'min(360px, 92vw)' }}>
        <div className="brand" style={{ border: 0, padding: 0, marginBottom: 16 }}>
          <b>NEEV Tracker</b>
          <span>Batch 2026-01</span>
        </div>
        <div className="chipbar" style={{ marginBottom: 16 }}>
          <button type="button" className={`chip ${tab === 'staff' ? 'on' : ''}`} style={{ width: 'auto', padding: '5px 12px' }}
            onClick={() => setTab('staff')}>Staff</button>
          <button type="button" className={`chip ${tab === 'trainee' ? 'on' : ''}`} style={{ width: 'auto', padding: '5px 12px' }}
            onClick={() => setTab('trainee')}>Trainee</button>
        </div>
        {tab === 'staff' ? <StaffLogin /> : <TraineeLogin />}
      </div>
    </div>
  );
}
