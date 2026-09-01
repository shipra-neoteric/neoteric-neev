import { useEffect, useState } from 'react';
import { api } from '../api/client';
import BandChip from '../components/BandChip';

const MAX = { written: 40, practical: 30, behavioural: 30 };
const DEPTS = ['SUP', 'QC', 'MEA', 'STR'];
const DEPT_NAME = { SUP: 'Supervision', QC: 'Quality', MEA: 'Measurement', STR: 'Store' };
const KINDS = [
  { key: 'checkpoint', label: 'Checkpoint' },
  { key: 'drill', label: 'Department drill' },
  { key: 'gateway', label: 'Gateway' },
];

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
  const [kind, setKind] = useState('checkpoint');
  const [department, setDepartment] = useState('SUP');
  const [rows, setRows] = useState(null);
  const [marks, setMarks] = useState({}); // used for drill/gateway — checkpoint reuses rows directly
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/trainees').then(setRows).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setMarks({});
    setSaved(false);
  }, [kind, department]);

  function setCheckpointMark(traineeId, field, raw) {
    const value = raw === '' ? null : Math.max(0, Math.min(MAX[field], Number(raw)));
    setRows((rs) => rs.map((r) => r.id === traineeId ? { ...r, [field]: value } : r));
    setSaved(false);
  }

  function setOtherMark(traineeId, field, raw) {
    const value = raw === '' ? null : Math.max(0, Math.min(MAX[field], Number(raw)));
    setMarks((m) => ({ ...m, [traineeId]: { ...m[traineeId], [field]: value } }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (kind === 'checkpoint') {
        await api.put('/assessments/checkpoint/bulk', rows
          .filter((r) => r.written != null && r.practical != null && r.behavioural != null)
          .map((r) => ({ trainee_id: r.id, written: r.written, practical: r.practical, behavioural: r.behavioural })));
      } else {
        const entries = Object.entries(marks)
          .filter(([, m]) => m.written != null && m.practical != null && m.behavioural != null)
          .map(([traineeId, m]) => ({
            trainee_id: traineeId, written: m.written, practical: m.practical, behavioural: m.behavioural,
            ...(kind === 'drill' ? { department } : {}),
          }));
        await api.put(`/assessments/${kind}/bulk`, entries);
      }
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
      <div className="chipbar" style={{ marginBottom: 14 }}>
        {KINDS.map((k) => (
          <button key={k.key} className={`chip ${kind === k.key ? 'on' : ''}`} style={{ width: 'auto', padding: '5px 12px' }}
            onClick={() => setKind(k.key)}>{k.label}</button>
        ))}
      </div>

      {kind === 'drill' && (
        <div style={{ marginBottom: 14 }}>
          <div className="lbl">Department</div>
          <select className="sel" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {DEPTS.map((d) => <option key={d} value={d}>{DEPT_NAME[d]}</option>)}
          </select>
        </div>
      )}

      <div className="alert info" style={{ marginBottom: 14 }}>
        <span className="ai">i</span>
        <div>{kind === 'checkpoint'
          ? 'Checkpoint = written (/40) + practical (/30) + behavioural (/30). Velocity and band recompute live below.'
          : kind === 'drill'
            ? `Department drill for ${DEPT_NAME[department]} — one mark per trainee per department, doesn't affect their overall band.`
            : 'Gateway — the Month 5 pass/continue assessment.'}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 10, alignItems: 'center' }}>
        {saved && <span className="sub" style={{ margin: 0 }}>Saved</span>}
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save marks'}</button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Trainee</th>
              {kind === 'checkpoint' && <th>Baseline</th>}
              <th style={{ width: 80 }}>Written /40</th>
              <th style={{ width: 90 }}>Practical /30</th>
              <th style={{ width: 100 }}>Behavioural /30</th>
              <th>Total</th>
              {kind === 'checkpoint' && <><th>Velocity</th><th>Band</th></>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              if (kind === 'checkpoint') {
                const chk = (r.written != null && r.practical != null && r.behavioural != null)
                  ? r.written + r.practical + r.behavioural : null;
                return (
                  <tr key={r.id}>
                    <td className="name">{r.name}</td>
                    <td className="n">{r.baseline}</td>
                    <td><input className="sel" type="number" min={0} max={MAX.written} style={{ width: 64 }}
                      value={r.written ?? ''} onChange={(e) => setCheckpointMark(r.id, 'written', e.target.value)} /></td>
                    <td><input className="sel" type="number" min={0} max={MAX.practical} style={{ width: 64 }}
                      value={r.practical ?? ''} onChange={(e) => setCheckpointMark(r.id, 'practical', e.target.value)} /></td>
                    <td><input className="sel" type="number" min={0} max={MAX.behavioural} style={{ width: 64 }}
                      value={r.behavioural ?? ''} onChange={(e) => setCheckpointMark(r.id, 'behavioural', e.target.value)} /></td>
                    <td className="n">{chk ?? '—'}</td>
                    <td className="n">{velocityOf(r.baseline, chk) ?? '—'}</td>
                    <td><BandChip band={bandOf(r.baseline, chk)} /></td>
                  </tr>
                );
              }
              const m = marks[r.id] ?? {};
              const total = (m.written != null && m.practical != null && m.behavioural != null)
                ? m.written + m.practical + m.behavioural : null;
              return (
                <tr key={r.id}>
                  <td className="name">{r.name}</td>
                  <td><input className="sel" type="number" min={0} max={MAX.written} style={{ width: 64 }}
                    value={m.written ?? ''} onChange={(e) => setOtherMark(r.id, 'written', e.target.value)} /></td>
                  <td><input className="sel" type="number" min={0} max={MAX.practical} style={{ width: 64 }}
                    value={m.practical ?? ''} onChange={(e) => setOtherMark(r.id, 'practical', e.target.value)} /></td>
                  <td><input className="sel" type="number" min={0} max={MAX.behavioural} style={{ width: 64 }}
                    value={m.behavioural ?? ''} onChange={(e) => setOtherMark(r.id, 'behavioural', e.target.value)} /></td>
                  <td className="n">{total ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
