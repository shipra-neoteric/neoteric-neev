import { Check, ShieldCheck, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { ACTIONS, MODULES, STAFF_ROLES } from '../permissions';
import { btnPrimaryBase, inputClass, label as labelClass, primaryStyle } from '../ui/classes';
import AlertBanner from './AlertBanner';
import Drawer from './Drawer';
import ThemedSelect from './theme/ThemedSelect';

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'coordinator', active: true };

export default function UserDrawer({ user, onClose, onSaved }) {
  const { getThemeColor } = useTheme();
  const isCreate = !user;
  const [form, setForm] = useState(emptyForm);
  const [matrix, setMatrix] = useState({}); // effective permissions, editable
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isCreate) {
      setForm(emptyForm);
      setMatrix(Object.fromEntries(MODULES.map((m) => [m.key, Object.fromEntries([...ACTIONS, ...(m.extra ?? [])].map((a) => [a, false]))])));
      return;
    }
    setForm({ name: user.name, email: user.email, phone: user.phone ?? '', password: '', role: user.role, active: user.active });
    setMatrix(user.effectivePermissions);
  }, [user, isCreate]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function toggle(moduleKey, action) {
    setMatrix((m) => ({ ...m, [moduleKey]: { ...m[moduleKey], [action]: !m[moduleKey]?.[action] } }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name, email: form.email, phone: form.phone || null, role: form.role,
        active: form.active, permissions: form.role === 'admin' ? null : matrix,
      };
      if (form.password) body.password = form.password;
      if (isCreate) {
        if (!form.password) throw new Error('password is required for a new user');
        await api.post('/users', body);
      } else {
        await api.put(`/users/${user.id}`, body);
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer title={isCreate ? 'Add user' : user.name} subtitle={!isCreate ? user.email : undefined}
      icon={isCreate ? UserPlus : ShieldCheck} onClose={onClose}>
      {error && <AlertBanner level="crit">{error}</AlertBanner>}

      <div className="space-y-3">
        <div>
          <label className={labelClass}>Full name</label>
          <input className={inputClass()} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass()} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass()} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>{isCreate ? 'Password' : 'New password (leave blank to keep current)'}</label>
          <input className={inputClass()} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className={labelClass}>Role</label>
            <ThemedSelect value={form.role} onChange={(v) => set('role', v)} options={STAFF_ROLES} />
          </div>
          <label className="flex items-center gap-2 h-10 px-1 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </div>

      {form.role !== 'admin' && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Module permissions</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Tick exactly what this person should be able to do — nothing beyond the role default is granted automatically.
          </p>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/40 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Module</th>
                  {ACTIONS.map((a) => <th key={a} className="px-2 py-2 text-center">{a}</th>)}
                  <th className="px-2 py-2 text-center">approve</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m.key} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">{m.label}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} className="px-2 py-2 text-center">
                        <button type="button" onClick={() => toggle(m.key, a)}
                          className={`w-5 h-5 rounded border inline-flex items-center justify-center ${
                            matrix[m.key]?.[a] ? 'text-white border-transparent' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          style={matrix[m.key]?.[a] ? { backgroundColor: getThemeColor() } : undefined}>
                          {matrix[m.key]?.[a] && <Check className="w-3 h-3" />}
                        </button>
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center">
                      {m.extra?.includes('approve') && (
                        <button type="button" onClick={() => toggle(m.key, 'approve')}
                          className={`w-5 h-5 rounded border inline-flex items-center justify-center ${
                            matrix[m.key]?.approve ? 'text-white border-transparent' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          style={matrix[m.key]?.approve ? { backgroundColor: getThemeColor() } : undefined}>
                          {matrix[m.key]?.approve && <Check className="w-3 h-3" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button onClick={save} disabled={saving || !form.name || !form.email} className={btnPrimaryBase} style={primaryStyle(getThemeColor())}>
        {saving ? 'Saving…' : isCreate ? 'Create user' : 'Save changes'}
      </button>
    </Drawer>
  );
}
