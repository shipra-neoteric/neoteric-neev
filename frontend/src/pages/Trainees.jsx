import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertBanner from '../components/AlertBanner';
import PodBuddyPanel from '../components/PodBuddyPanel';
import { BandBadge } from '../components/StatusBadge';
import TraineeDrawer from '../components/TraineeDrawer';
import { useTheme } from '../context/ThemeContext';
import { btnPrimaryBase, primaryStyle } from '../ui/classes';

export default function Trainees() {
  const { getThemeColor } = useTheme();
  const { can } = useAuth();
  const [trainees, setTrainees] = useState(null);
  const [error, setError] = useState(null);
  const [openCode, setOpenCode] = useState(undefined); // undefined = closed, null = create, "T01" = view/edit

  function reload() {
    api.get('/trainees').then(setTrainees).catch((e) => setError(e.message));
  }

  useEffect(reload, []);

  function closeDrawer() {
    setOpenCode(undefined);
  }
  function onSaved() {
    closeDrawer();
    reload();
  }

  if (error) return <AlertBanner level="crit">{error}</AlertBanner>;
  if (!trainees) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <div>
      {can('trainees', 'edit') && <PodBuddyPanel />}

      <div className="flex justify-end mb-3">
        <button onClick={() => setOpenCode(null)} className={`flex items-center gap-1.5 ${btnPrimaryBase}`} style={primaryStyle(getThemeColor())}>
          <Plus className="w-4 h-4" /> Add trainee
        </button>
      </div>

      <div className="overflow-x-auto custom-horizontal-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-2.5 text-left">Trainee</th>
              <th className="px-4 py-2.5 text-left hidden sm:table-cell">Pod</th>
              <th className="px-4 py-2.5 text-left">Band</th>
              <th className="px-4 py-2.5 text-left hidden md:table-cell">Velocity</th>
              <th className="px-4 py-2.5 text-left hidden md:table-cell">Log avg</th>
              <th className="px-4 py-2.5 text-left hidden lg:table-cell">Attend</th>
            </tr>
          </thead>
          <tbody>
            {trainees.map((t) => (
              <tr key={t.id} onClick={() => setOpenCode(t.id)}
                className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900 dark:text-white">{t.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t.branch}</div>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-400 hidden sm:table-cell">P{t.pod}</td>
                <td className="px-4 py-3"><BandBadge band={t.band} /></td>
                <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-200 hidden md:table-cell">{t.velocity ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-200 hidden md:table-cell">{t.log_avg != null ? t.log_avg.toFixed(2) : '—'}</td>
                <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-200 hidden lg:table-cell">{t.att_pct != null ? `${Math.round(t.att_pct * 100)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openCode !== undefined && (
        <TraineeDrawer code={openCode} onClose={closeDrawer} onSaved={onSaved} />
      )}
    </div>
  );
}
