import { useEffect, useState } from 'react';
import { api } from '../api/client';
import BandChip from '../components/BandChip';

const MAX = { written: 40, practical: 30, behavioural: 30 };

function velocityOf(baseline, chk) {
  if (chk == null) return null;
  return Math.round(((chk - baseline) / (100 - baseline)) * 1000) / 10;
}
function bandOf(baseline, chk) {
  const v = velocityOf(baseline, chk);
  if (v == null) return null;
  if (chk >= 75 && v >= 55) return 'A';
  if (chk >= 60) return 'B';
  if (chk >= 45) return 'C';
  return 'D';
}

export default function Assessment() {
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/trainees').then(setRows).catch((e) => setError(e.message));
  }, []);

  function setMark(traineeId, field, raw) {
    const value = raw === '' ? null : Math.max(0, Math.min(MAX[field], Number(raw)));
    setRows((rs) => rs.map((r) => r.id === traineeId ? { ...r, [field]: value } : r));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.put('/assessments/checkpoint/bulk', rows
        .filter((r) => r.written != null && r.practical != null && r.behavioural != null)
        .map((r) => ({
          trainee_id: r.id,
          written: r.written,
          practical: r.practical,
          behavioural: r.behavioural,
        })));
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!rows) return <div className="sub">Loading…</div>;

  return (
    <div>
      <div className="alert info" style={{ marginBottom: 14 }}>
        <span className="ai">i</span>
        <div>Checkpoint = written (/40) + practical (/30) + behavioural (/30). Velocity and band
          recompute live below and are saved to the trainee once you hit Save.</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 10, alignItems: 'center' }}>
        {saved && <span className="sub" style={{ margin: 0 }}>Saved</span>}
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save marks'}</button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Trainee</th><th>Baseline</th>
              <th style={{ width: 80 }}>Written /40</th>
              <th style={{ width: 90 }}>Practical /30</th>
              <th style={{ width: 100 }}>Behavioural /30</th>
              <th>Checkpoint</th><th>Velocity</th><th>Band</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const chk = (r.written != null && r.practical != null && r.behavioural != null)
                ? r.written + r.practical + r.behavioural : null;
              return (
                <tr key={r.id}>
                  <td className="name">{r.name}</td>
                  <td className="n">{r.baseline}</td>
                  <td><input className="sel" type="number" min={0} max={MAX.written} style={{ width: 64 }}
                    value={r.written ?? ''} onChange={(e) => setMark(r.id, 'written', e.target.value)} /></td>
                  <td><input className="sel" type="number" min={0} max={MAX.practical} style={{ width: 64 }}
                    value={r.practical ?? ''} onChange={(e) => setMark(r.id, 'practical', e.target.value)} /></td>
                  <td><input className="sel" type="number" min={0} max={MAX.behavioural} style={{ width: 64 }}
                    value={r.behavioural ?? ''} onChange={(e) => setMark(r.id, 'behavioural', e.target.value)} /></td>
                  <td className="n">{chk ?? '—'}</td>
                  <td className="n">{velocityOf(r.baseline, chk) ?? '—'}</td>
                  <td><BandChip band={bandOf(r.baseline, chk)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
