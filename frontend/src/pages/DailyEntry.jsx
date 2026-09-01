import { useEffect, useState } from 'react';
import { api } from '../api/client';

const BATCH_ID = 'b1';
const ATT_CODES = ['P', 'A', 'L', 'H'];
const LOG_SCORES = [1, 2, 3, 4, 5];

export default function DailyEntry() {
  const [days, setDays] = useState(null);
  const [dayCode, setDayCode] = useState(null);
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/batches/${BATCH_ID}/days`).then((d) => {
      setDays(d);
      setDayCode(d[d.length - 1].code);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!dayCode) return;
    setRows(null);
    api.get(`/batches/${BATCH_ID}/days/${dayCode}`)
      .then((data) => setRows(data.rows))
      .catch((e) => setError(e.message));
  }, [dayCode]);

  const day = days?.find((d) => d.code === dayCode);

  function setAtt(traineeId, status) {
    setRows((rs) => rs.map((r) => r.trainee_id === traineeId
      ? { ...r, attendance: r.attendance === status ? null : status }
      : r));
    setSaved(false);
  }

  function setLog(traineeId, score) {
    setRows((rs) => rs.map((r) => r.trainee_id === traineeId
      ? { ...r, log_score: r.log_score === score ? null : score }
      : r));
    setSaved(false);
  }

  async function save() {
    if (!day) return;
    setSaving(true);
    setError(null);
    try {
      await api.put('/attendance/bulk', rows
        .filter((r) => r.attendance)
        .map((r) => ({ trainee_id: r.trainee_id, day_id: day.id, status: r.attendance })));
      await api.put('/logs/bulk', rows
        .filter((r) => r.log_score)
        .map((r) => ({ trainee_id: r.trainee_id, day_id: day.id, score: r.log_score, note: r.log_note })));
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!days || !rows) return <div className="sub">Loading…</div>;

  const done = rows.filter((r) => r.attendance && r.log_score).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <select className="sel" value={dayCode} onChange={(e) => setDayCode(e.target.value)}>
          {days.map((d) => <option key={d.code} value={d.code}>{d.code} · {d.label}</option>)}
        </select>
        <div className="prog" style={{ width: 150 }}>
          <i style={{ width: `${(done / rows.length) * 100}%` }} />
        </div>
        <span className="mono sub" style={{ margin: 0 }}>{done} of {rows.length} complete</span>
        <div style={{ flex: 1 }} />
        {saved && <span className="sub" style={{ margin: 0 }}>Saved</span>}
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save day'}</button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th style={{ width: 34 }} />
              <th>Trainee</th><th>Pod</th>
              <th style={{ width: 150 }}>Attendance</th>
              <th style={{ width: 190 }}>Log quality</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.trainee_id}>
                <td className="mono sub" style={{ margin: 0 }}>{r.trainee_id}</td>
                <td className="name">{r.name}</td>
                <td className="pod">P{r.pod}</td>
                <td>
                  <div className="chipbar">
                    {ATT_CODES.map((a) => (
                      <button key={a}
                        className={`chip ${r.attendance === a ? 'on' : ''} ${a === 'A' ? 'a' : a === 'L' ? 'l' : ''}`}
                        onClick={() => setAtt(r.trainee_id, a)}>{a}</button>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="chipbar">
                    {LOG_SCORES.map((n) => (
                      <button key={n} className={`chip ${r.log_score === n ? 'on' : ''}`}
                        onClick={() => setLog(r.trainee_id, n)}>{n}</button>
                    ))}
                  </div>
                </td>
                <td>
                  <input className="sel" style={{ width: '100%', minWidth: 150 }}
                    value={r.log_note ?? ''}
                    onChange={(e) => {
                      const note = e.target.value;
                      setRows((rs) => rs.map((x) => x.trainee_id === r.trainee_id ? { ...x, log_note: note } : x));
                      setSaved(false);
                    }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
