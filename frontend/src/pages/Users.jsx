import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertBanner from '../components/AlertBanner';
import ThemedSelect from '../components/theme/ThemedSelect';
import UserDrawer from '../components/UserDrawer';
import { useTheme } from '../context/ThemeContext';
import { STAFF_ROLES } from '../permissions';
import { btn, btnPrimaryBase, inputClass, primaryStyle } from '../ui/classes';
import { confirmDelete } from '../ui/confirm';

const ROLE_LABEL = Object.fromEntries(STAFF_ROLES.map((r) => [r.value, r.label]));
const ROLE_OPTIONS = [{ value: '', label: 'All roles' }, ...STAFF_ROLES];
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function Users() {
  const { session } = useAuth();
  const { getThemeColor } = useTheme();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = create, user = edit

  function reload() {
    api.get('/users').then(setUsers).catch((e) => setError(e.message));
  }
  useEffect(reload, []);

  async function toggleActive(user) {
    try {
      await api.put(`/users/${user.id}`, { active: !user.active });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(user) {
    if (!(await confirmDelete(user.name))) return;
    try {
      await api.delete(`/users/${user.id}`);
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <AlertBanner level="crit">{error}</AlertBanner>;
  if (!users) return <div className="text-sm text-gray-400">Loading…</div>;

  const filtered = users.filter((u) => {
    if (query && !u.name.toLowerCase().includes(query.toLowerCase()) && !u.email.toLowerCase().includes(query.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.active) return false;
    if (statusFilter === 'inactive' && u.active) return false;
    return true;
  });
  const filtersActive = query || roleFilter || statusFilter;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setEditing(null)} className={`flex items-center gap-1.5 ${btnPrimaryBase}`} style={primaryStyle(getThemeColor())}>
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap mb-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${inputClass()} pl-9`} placeholder="Search by name or email…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="w-44"><ThemedSelect value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} /></div>
        <div className="w-36"><ThemedSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} /></div>
        {filtersActive && (
          <button onClick={() => { setQuery(''); setRoleFilter(''); setStatusFilter(''); }} className={`${btn.secondary} text-xs !px-2.5 !py-1.5`}>
            Clear
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {users.length}</span>
      </div>

      <div className="overflow-x-auto custom-horizontal-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-2.5 text-left">User</th>
              <th className="px-4 py-2.5 text-left">Role</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                {users.length === 0 ? 'No users yet.' : 'No users match these filters.'}
              </td></tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                <td className="px-4 py-3 cursor-pointer" onClick={() => setEditing(u)}>
                  <div className="font-semibold text-gray-900 dark:text-white">{u.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(u)} disabled={u.id === session.id}
                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                    style={{ backgroundColor: u.active ? getThemeColor() : '#d1d5db' }}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${u.active ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                  </button>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{u.active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(u)} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(u)} disabled={u.id === session.id}
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <UserDrawer user={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />
      )}
    </div>
  );
}
