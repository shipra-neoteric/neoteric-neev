import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { queueLog, syncQueuedLogs } from '../../offline/logQueue';

const BATCH_ID = 'b1';

// The six daily-log prompts — the shape a 5-quality log needs, per SPEC.md's
// description: "someone who was not on site could reconstruct the day from it."
const PROMPTS = [
  { key: 'work', label: 'What did you work on today?' },
  { key: 'location', label: 'Where on site? (block / zone / floor)' },
  { key: 'numbers', label: 'Key numbers or measurements you recorded' },
  { key: 'problem', label: 'One problem or mistake you saw' },
  { key: 'question', label: 'One question you asked your site buddy or engineer' },
  { key: 'tomorrow', label: "Tomorrow's plan" },
];

const emptyForm = Object.fromEntries(PROMPTS.map((p) => [p.key, '']));

async function postLog(dayId, bodyJson) {
  await api.post('/logs', { day_id: dayId, bodyJson });
}

export default function MyLog() {
  const [days, setDays] = useState(null);
  const [dayCode, setDayCode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // null | 'saved' | 'queued'
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/batches/${BATCH_ID}/days`).then((d) => {
      setDays(d);
      setDayCode(d[d.length - 1].code);
    }).catch((e) => setError(e.message));

    const flush = () => syncQueuedLogs(postLog);
    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, []);

  const day = days?.find((d) => d.code === dayCode);

  async function save() {
    if (!day) return;
    setSaving(true);
    setError(null);
    try {
      await postLog(day.id, form);
      setStatus('saved');
    } catch (e) {
      // Network failure (offline) vs. a real server error (e.g. session expired):
      // only queue the former — a real error should surface, not silently disappear.
      const offline = !navigator.onLine || e instanceof TypeError;
      if (offline) {
        await queueLog(day.id, form);
        setStatus('queued');
      } else {
        setError(e.message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!days) return <div className="sub">Loading…</div>;

  return (
    <div>
      <select className="sel" style={{ width: '100%', marginBottom: 14 }}
        value={dayCode} onChange={(e) => { setDayCode(e.target.value); setStatus(null); }}>
        {days.map((d) => <option key={d.code} value={d.code}>{d.code} · {d.label}</option>)}
      </select>

      {PROMPTS.map((p) => (
        <div key={p.key} className="card" style={{ marginBottom: 10 }}>
          <div className="lbl">{p.label}</div>
          <textarea className="sel" rows={2} style={{ width: '100%', resize: 'vertical' }}
            value={form[p.key]}
            onChange={(e) => { setForm((f) => ({ ...f, [p.key]: e.target.value })); setStatus(null); }} />
        </div>
      ))}

      {status === 'saved' && <div className="sub" style={{ marginBottom: 10 }}>Saved — queued for your coordinator to score.</div>}
      {status === 'queued' && (
        <div className="alert warn" style={{ marginBottom: 10 }}>
          <span className="ai">!</span>
          <div>No connection — saved on your phone. It'll send automatically once you're back online.</div>
        </div>
      )}
      <button className="btn" style={{ width: '100%' }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Submit log'}
      </button>
    </div>
  );
}
