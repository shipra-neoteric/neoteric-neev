import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { TRAINEE_NAV } from '../auth/roles';

export default function TraineeShell() {
  const { session, isTrainee, signOut } = useAuth();

  if (!session) return <Navigate to="/login" replace />;
  if (!isTrainee) return <Navigate to="/dashboard" replace />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ground)' }}>
      <div className="topbar">
        <h1 style={{ fontSize: '1.05rem' }}>{session.name}</h1>
        <button className="btn ghost" onClick={signOut}>Sign out</button>
      </div>
      <div className="pad" style={{ flex: 1, paddingBottom: 90 }}>
        <Outlet />
      </div>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
        background: 'var(--surface)', borderTop: '1px solid var(--rule)', zIndex: 20,
      }}>
        {TRAINEE_NAV.map((item) => (
          <NavLink key={item.key} to={item.path}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '9px 3px', textDecoration: 'none', fontSize: '.72rem',
              color: isActive ? 'var(--navy)' : 'var(--ink-3)',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
