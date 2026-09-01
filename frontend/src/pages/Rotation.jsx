import { useEffect, useState } from 'react';
import { api } from '../api/client';

const DEPT_NAME = { SUP: 'Supervision', QC: 'Quality', MEA: 'Measurement', STR: 'Store' };

export default function Rotation() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/rotations').then(setRows).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!rows) return <div className="sub">Loading…</div>;

  const byBlock = {};
  rows.forEach((r) => { (byBlock[r.blockCode] ??= []).push(r); });

  return (
    <div>
      <div className="sub" style={{ marginBottom: 14 }}>
        Every pod hosts every department once — one pod inside one department at a time.
      </div>
      {Object.entries(byBlock).map(([block, pods]) => (
        <div key={block} className="card" style={{ marginBottom: 10 }}>
          <h3>{block}</h3>
          <div className="sub" style={{ marginBottom: 10 }}>{pods[0].startsOn} – {pods[0].endsOn}</div>
          {pods.sort((a, b) => a.pod.localeCompare(b.pod)).map((r) => (
            <div key={r.pod} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
              padding: '5px 0', borderBottom: '1px solid var(--rule-2)',
            }}>
              <span style={{ fontSize: '.89rem', color: 'var(--ink)' }}>{r.pod}</span>
              <span className={`dt d${r.department}`}>{DEPT_NAME[r.department]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
