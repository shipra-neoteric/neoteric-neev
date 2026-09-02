import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AlertBanner from '../../components/AlertBanner';
import { BandBadge } from '../../components/StatusBadge';
import { card, microLabel } from '../../ui/classes';

// Every trainee-visible number needs a plain-language sentence beside it
// (SPEC.md §8) — a velocity number with no explanation reads as a failing grade.
const BAND_SENTENCE = {
  A: "You're moving fast — captured most of the improvement available to you since D01.",
  B: "You're on track — solid, steady progress since D01.",
  C: 'Developing — there are named gaps to close, with a mentor helping you close them.',
  D: 'At risk — this needs a direct conversation with Deepti, in writing. This is not the Gateway; that is in January.',
};

export default function MyBand() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/trainees/me').then(setMe).catch((e) => setError(e.message));
  }, []);

  if (error) return <AlertBanner level="crit">{error}</AlertBanner>;
  if (!me) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <div>
      <div className="mb-4"><BandBadge band={me.band} /></div>
      {me.band && <div className="mb-4"><AlertBanner level="info">{BAND_SENTENCE[me.band]}</AlertBanner></div>}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={card}>
          <div className={microLabel}>Checkpoint</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{me.checkpoint ?? '—'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {me.checkpoint != null
              ? `Baseline ${me.baseline} → ${me.checkpoint} out of 100`
              : "Not assessed yet — you'll see this once Deepti enters your checkpoint marks."}
          </div>
        </div>
        <div className={card}>
          <div className={microLabel}>Velocity</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{me.velocity ?? '—'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">The share of possible improvement you actually captured.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={card}>
          <div className={microLabel}>Daily log average</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {me.log_avg != null ? me.log_avg.toFixed(2) : '—'}<span className="text-base text-gray-400 font-normal">/5</span>
          </div>
        </div>
        <div className={card}>
          <div className={microLabel}>Attendance</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{me.att_pct != null ? `${Math.round(me.att_pct * 100)}%` : '—'}</div>
        </div>
      </div>
    </div>
  );
}
