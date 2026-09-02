import { useEffect, useState } from 'react';
import { api } from '../api/client';
import AlertBanner from '../components/AlertBanner';
import { DeptBadge } from '../components/StatusBadge';
import { card } from '../ui/classes';

export default function Rotation() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/rotations').then(setRows).catch((e) => setError(e.message));
  }, []);

  if (error) return <AlertBanner level="crit">{error}</AlertBanner>;
  if (!rows) return <div className="text-sm text-gray-400">Loading…</div>;

  const byBlock = {};
  rows.forEach((r) => { (byBlock[r.blockCode] ??= []).push(r); });

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Every pod hosts every department once — one pod inside one department at a time.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(byBlock).map(([block, pods]) => (
          <div key={block} className={card}>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{block}</h3>
            <div className="text-xs text-gray-400 mb-2">{pods[0].startsOn} – {pods[0].endsOn}</div>
            {pods.sort((a, b) => a.pod.localeCompare(b.pod)).map((r) => (
              <div key={r.pod} className="flex justify-between items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-900 dark:text-white">{r.pod}</span>
                <DeptBadge department={r.department} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
