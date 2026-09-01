import { useEffect, useState } from 'react';
import { api } from '../api/client';
import BandChip from '../components/BandChip';
import TraineeDrawer from '../components/TraineeDrawer';

export default function Trainees() {
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

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!trainees) return <div className="sub">Loading…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="btn" onClick={() => setOpenCode(null)}>+ Add trainee</button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Trainee</th><th>Pod</th><th>Band</th><th>Velocity</th><th>Log avg</th><th>Attend</th>
            </tr>
          </thead>
          <tbody>
            {trainees.map((t) => (
              <tr key={t.id} className="click" onClick={() => setOpenCode(t.id)}>
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

      {openCode !== undefined && (
        <TraineeDrawer code={openCode} onClose={closeDrawer} onSaved={onSaved} />
      )}
    </div>
  );
}
