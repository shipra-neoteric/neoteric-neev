import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function BuddyRating() {
  const { session } = useAuth();
  const [trainees, setTrainees] = useState(null);
  const [error, setError] = useState(null);
  const [weekStart] = useState(mondayOf(new Date()));
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState({});

  useEffect(() => {
    api.get('/trainees').then((all) => {
      setTrainees(all.filter((t) => t.buddy === session.name));
    }).catch((e) => setError(e.message));
  }, [session.name]);

  async function submit(traineeId) {
    const score = scores[traineeId];
    if (!score) return;
    setSaving(traineeId);
    setError(null);
    try {
      await api.post('/buddy-ratings', {
        trainee_id: traineeId, weekStart, score, note: notes[traineeId] ?? '',
      });
      setSaved((s) => ({ ...s, [traineeId]: true }));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!trainees) return <div className="sub">Loading…</div>;

  return (
    <div>
      <div className="sub" style={{ marginBottom: 14 }}>Week of {weekStart} — your pod only.</div>
      {trainees.map((t) => (
        <div key={t.id} className="card" style={{ marginBottom: 10 }}>
          <h3>{t.name}</h3>
          <div className="chipbar" style={{ marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={`chip ${scores[t.id] === n ? 'on' : ''}`}
                onClick={() => { setScores((s) => ({ ...s, [t.id]: n })); setSaved((s) => ({ ...s, [t.id]: false })); }}>
                {n}
              </button>
            ))}
          </div>
          <input className="sel" style={{ width: '100%', marginBottom: 8 }} placeholder="Note (optional)"
            value={notes[t.id] ?? ''}
            onChange={(e) => { setNotes((n) => ({ ...n, [t.id]: e.target.value })); setSaved((s) => ({ ...s, [t.id]: false })); }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn" onClick={() => submit(t.id)} disabled={!scores[t.id] || saving === t.id}>
              {saving === t.id ? 'Saving…' : 'Save rating'}
            </button>
            {saved[t.id] && <span className="sub" style={{ margin: 0 }}>Saved</span>}
          </div>
        </div>
      ))}
      {trainees.length === 0 && <div className="sub">No trainees found for your pod.</div>}
    </div>
  );
}
