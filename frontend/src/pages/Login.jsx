import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../auth/roles';

// Placeholder until backend staff auth (email+password, SPEC.md §1) exists —
// picks a role to sign in as instead of taking real credentials.
export default function Login() {
  const { roleKey, signIn } = useAuth();
  const location = useLocation();
  const [selected, setSelected] = useState('deepti');

  if (roleKey) {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />;
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ width: 'min(360px, 92vw)' }}>
        <div className="brand" style={{ border: 0, padding: 0, marginBottom: 16 }}>
          <b>NEEV Tracker</b>
          <span>Batch 2026-01</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signIn(selected);
          }}
        >
          <div className="lbl">Sign in as</div>
          <select className="sel" style={{ width: '100%', marginBottom: 14 }}
            value={selected} onChange={(e) => setSelected(e.target.value)}>
            {Object.entries(ROLES).map(([key, r]) => (
              <option key={key} value={key}>{r.label}</option>
            ))}
          </select>
          <button className="btn" style={{ width: '100%' }} type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
