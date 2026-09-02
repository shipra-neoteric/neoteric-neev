import { Award, CheckSquare, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import AlertBanner from '../components/AlertBanner';
import StatsCards from '../components/StatsCards';
import { BAND_BADGE, BAND_DOT } from '../components/StatusBadge';
import { card } from '../ui/classes';

const BATCH_ID = 'b1';
const BAND_ORDER = ['A', 'B', 'C', 'D'];

function Sparkline({ points }) {
  if (points.length < 2) return <div className="text-xs text-gray-400">Not enough data yet</div>;
  const w = 190, h = 36, pad = 4;
  const mx = 5, mn = 0;
  const xs = points.map((_, i) => pad + (w - pad * 2) * (i / (points.length - 1)));
  const ys = points.map((p) => pad + (h - pad * 2) - ((p.avg - mn) / (mx - mn)) * (h - pad * 2));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Daily log score trend" className="w-full mt-2">
      <path d={d} fill="none" className="stroke-primary-500" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xs.at(-1)} cy={ys.at(-1)} r="4" className="fill-orange-500" />
    </svg>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/batches/${BATCH_ID}/dashboard`).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <AlertBanner level="crit">{error}</AlertBanner>;
  if (!data) return <div className="text-sm text-gray-400">Loading…</div>;

  const { today, total, present, filled, logged, avgLogQuality, avgVelocity, bandCounts, alerts, logTrend } = data;
  const maxBand = Math.max(1, ...BAND_ORDER.map((b) => bandCounts[b]));

  const cards = [
    { key: 'present', icon: Users, label: `Present ${today ? `· ${today.label}` : ''}`, value: `${present}/${total}`, sub: filled === total ? 'Attendance complete' : `${total - filled} not marked yet` },
    { key: 'logged', icon: CheckSquare, label: 'Logs signed today', value: `${logged}/${total}` },
    { key: 'velocity', icon: TrendingUp, label: 'Mean learning velocity', value: avgVelocity ?? '—', sub: 'Share of improvement captured' },
    { key: 'band', icon: Award, label: 'Batch log quality', value: `${avgLogQuality ?? '—'}/5` },
  ];

  return (
    <div>
      <StatsCards cards={cards} />

      <div className={card + ' mb-6'}>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Batch log quality trend</h3>
        <Sparkline points={logTrend} />
      </div>

      {alerts.length > 0 && (
        <>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mt-6 mb-2">Needs attention</h3>
          <div className="space-y-2 mb-6">
            {alerts.map((a, i) => <AlertBanner key={i} level={a.level}>{a.text}</AlertBanner>)}
          </div>
        </>
      )}

      <div className={card + ' max-w-md'}>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Band distribution</h3>
        {BAND_ORDER.map((b) => (
          <div key={b} className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold w-7 text-center ${BAND_BADGE[b]}`}>{b}</span>
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${BAND_DOT[b]}`} style={{ width: `${(bandCounts[b] / maxBand) * 100}%` }} />
            </div>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 min-w-[16px] text-right">{bandCounts[b]}</span>
          </div>
        ))}
        {bandCounts.pending > 0 && (
          <div className="text-xs text-gray-400 mt-2">{bandCounts.pending} pending checkpoint assessment.</div>
        )}
      </div>
    </div>
  );
}
