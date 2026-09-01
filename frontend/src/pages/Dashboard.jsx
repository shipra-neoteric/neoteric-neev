import { useEffect, useState } from 'react';
import { api } from '../api/client';

const BATCH_ID = 'b1';
const BAND_ORDER = ['A', 'B', 'C', 'D'];

function Sparkline({ points }) {
  if (points.length < 2) return <div className="sub">Not enough data yet</div>;
  const w = 190, h = 36, pad = 4;
  const mx = 5, mn = 0;
  const xs = points.map((_, i) => pad + (w - pad * 2) * (i / (points.length - 1)));
  const ys = points.map((p) => pad + (h - pad * 2) - ((p.avg - mn) / (mx - mn)) * (h - pad * 2));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Daily log score trend">
      <path d={d} fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xs.at(-1)} cy={ys.at(-1)} r="4" fill="var(--ochre)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/batches/${BATCH_ID}/dashboard`).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!data) return <div className="sub">Loading…</div>;

  const { today, total, present, filled, logged, avgLogQuality, avgVelocity, bandCounts, alerts, logTrend } = data;
  const maxBand = Math.max(1, ...BAND_ORDER.map((b) => bandCounts[b]));

  return (
    <div>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="lbl">Present {today ? `· ${today.label}` : ''}</div>
          <div className="big">{present}<span style={{ fontSize: '1.1rem', color: 'var(--ink-3)' }}>/{total}</span></div>
          <div className="sub">{filled === total ? 'Attendance complete' : `${total - filled} not marked yet`}</div>
        </div>
        <div className="card">
          <div className="lbl">Logs signed today</div>
          <div className="big">{logged}<span style={{ fontSize: '1.1rem', color: 'var(--ink-3)' }}>/{total}</span></div>
        </div>
        <div className="card">
          <div className="lbl">Batch log quality</div>
          <div className="big">{avgLogQuality ?? '—'}<span style={{ fontSize: '1.1rem', color: 'var(--ink-3)' }}>/5</span></div>
          <Sparkline points={logTrend} />
        </div>
        <div className="card">
          <div className="lbl">Mean learning velocity</div>
          <div className="big">{avgVelocity ?? '—'}</div>
          <div className="sub">Share of available improvement captured</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <>
          <h3 style={{ fontFamily: 'Archivo', fontSize: '1rem', margin: '22px 0 9px' }}>Needs attention</h3>
          {alerts.map((a, i) => (
            <div key={i} className={`alert ${a.level}`}>
              <span className="ai">{a.level === 'crit' ? 'D' : a.level === 'warn' ? '!' : 'i'}</span>
              <div>{a.text}</div>
            </div>
          ))}
        </>
      )}

      <div className="card" style={{ marginTop: 20, maxWidth: 420 }}>
        <h3>Band distribution</h3>
        {BAND_ORDER.map((b) => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
            <span className={`band b${b}`}><span className="dot" />{b}</span>
            <div className="prog" style={{ flex: 1 }}>
              <i style={{ width: `${(bandCounts[b] / maxBand) * 100}%`, background: `var(--band${b})` }} />
            </div>
            <span className="mono" style={{ fontSize: '.82rem', minWidth: 16, textAlign: 'right' }}>{bandCounts[b]}</span>
          </div>
        ))}
        {bandCounts.pending > 0 && (
          <div className="sub" style={{ marginTop: 10 }}>{bandCounts.pending} pending checkpoint assessment.</div>
        )}
      </div>
    </div>
  );
}
