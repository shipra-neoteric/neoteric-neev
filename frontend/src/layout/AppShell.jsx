import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { NAV } from '../auth/roles';

export default function AppShell() {
  const { role, roleKey, signOut } = useAuth();
  const location = useLocation();

  if (!roleKey) return <Navigate to="/login" replace />;

  const items = NAV.filter((item) => role.nav.includes(item.key));
  const current = items.find((i) => location.pathname.startsWith(i.path));

  return (
    <div className="app">
      <nav className="rail">
        <div className="brand">
          <b>NEEV Tracker</b>
          <span>Batch 2026-01</span>
        </div>
        <div className="navsec">Menu</div>
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) => (isActive ? 'on' : '')}
          >
            <span className="ic">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="main">
        <div className="topbar">
          <h1>{current?.label ?? 'NEEV Tracker'}</h1>
          <label style={{ fontSize: '.8rem', color: 'var(--ink-3)' }}>{role.label}</label>
          <button className="btn ghost" onClick={signOut}>Sign out</button>
        </div>
        <div className="pad">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
