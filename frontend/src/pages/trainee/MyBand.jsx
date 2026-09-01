import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import BandChip from '../../components/BandChip';

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

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!me) return <div className="sub">Loading…</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}><BandChip band={me.band} /></div>
      {me.band && (
        <div className="alert info" style={{ marginBottom: 16 }}>
          <span className="ai">i</span><div>{BAND_SENTENCE[me.band]}</div>
        </div>
      )}

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="lbl">Checkpoint</div>
          <div className="big">{me.checkpoint ?? '—'}</div>
          <div className="sub">
            {me.checkpoint != null
              ? `Baseline ${me.baseline} → ${me.checkpoint} out of 100`
              : "Not assessed yet — you'll see this once Deepti enters your checkpoint marks."}
          </div>
        </div>
        <div className="card">
          <div className="lbl">Velocity</div>
          <div className="big">{me.velocity ?? '—'}</div>
          <div className="sub">The share of possible improvement you actually captured.</div>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="lbl">Daily log average</div>
          <div className="big">{me.log_avg != null ? me.log_avg.toFixed(2) : '—'}<span style={{ fontSize: '1.1rem', color: 'var(--ink-3)' }}>/5</span></div>
        </div>
        <div className="card">
          <div className="lbl">Attendance</div>
          <div className="big">{me.att_pct != null ? `${Math.round(me.att_pct * 100)}%` : '—'}</div>
        </div>
      </div>
    </div>
  );
}
