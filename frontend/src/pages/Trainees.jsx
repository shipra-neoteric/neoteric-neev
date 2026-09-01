import { useEffect, useState } from 'react';
import { api } from '../api/client';
import BandChip from '../components/BandChip';

export default function Trainees() {
  const [trainees, setTrainees] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/trainees').then(setTrainees).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!trainees) return <div className="sub">Loading…</div>;

  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th>Trainee</th><th>Pod</th><th>Band</th><th>Velocity</th><th>Log avg</th><th>Attend</th>
          </tr>
        </thead>
        <tbody>
          {trainees.map((t) => (
            <tr key={t.id}>
              <td className="name">{t.name}<div className="sub" style={{ margin: 0 }}>{t.branch}</div></td>
              <td className="pod">P{t.pod}</td>
              <td><BandChip band={t.band} /></td>
              <td className="n">{t.velocity ?? '—'}</td>
              <td className="n">{t.log_avg != null ? t.log_avg.toFixed(2) : '—'}</td>
              <td className="n">{t.att_pct != null ? `${Math.round(t.att_pct * 100)}%` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
