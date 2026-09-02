import { LogOut, Moon, Sun } from 'lucide-react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { NAV } from '../auth/roles';
import { useTheme } from '../context/ThemeContext';
import { confirmSignOut } from '../ui/confirm';

function getInitials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function AppShell() {
  const { role, session, isTrainee, signOut } = useAuth();
  const { theme, toggleTheme, getThemeColor } = useTheme();
  const location = useLocation();

  if (!session) return <Navigate to="/login" replace />;
  if (isTrainee) return <Navigate to="/t/today" replace />;

  const items = NAV.filter((item) => role.nav.includes(item.key));
  const current = items.find((i) => location.pathname.startsWith(i.path));

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:my-1 lg:ml-1 lg:rounded-xl
        bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: getThemeColor() }}>NT</div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-gray-900 dark:text-white truncate">NEEV Tracker</div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">Batch 2026-01</div>
          </div>
        </div>
        <div className="px-2.5 pt-4 pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider pointer-events-none">
          Menu
        </div>
        <div className="flex-1 px-2.5 space-y-0.5 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const Icon = item.icon;
            const active = current?.key === item.key;
            return (
              <NavLink key={item.key} to={item.path}
                className={`flex items-center gap-2.5 text-[15px] py-2 px-2.5 rounded-lg transition-colors ${
                  active ? 'font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                style={active ? { backgroundColor: `${getThemeColor()}1a`, color: getThemeColor() } : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-16 flex items-center gap-4 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800 flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 truncate">{current?.label ?? 'NEEV Tracker'}</h1>
          <button onClick={toggleTheme} aria-label="Toggle theme"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: getThemeColor() }}>{getInitials(session.name)}</div>
            <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
              <div className="font-medium text-gray-700 dark:text-gray-200">{session.name}</div>
              <div>{role.title}</div>
            </div>
          </div>
          <button onClick={async () => { if (await confirmSignOut()) signOut(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95"
            aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <nav className="lg:hidden flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {items.map((item) => {
            const Icon = item.icon;
            const active = current?.key === item.key;
            return (
              <NavLink key={item.key} to={item.path}
                className="flex flex-col items-center gap-1 px-3 py-2 text-[11px] whitespace-nowrap border-b-2"
                style={{
                  borderColor: active ? getThemeColor() : 'transparent',
                  color: active ? getThemeColor() : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
