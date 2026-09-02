import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertBanner from '../components/AlertBanner';
import { useTheme } from '../context/ThemeContext';
import { btnPrimaryBase, card, inputClass, primaryStyle } from '../ui/classes';

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function BuddyRating() {
  const { session } = useAuth();
  const { getThemeColor } = useTheme();
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

  if (error) return <AlertBanner level="crit">{error}</AlertBanner>;
  if (!trainees) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Week of {weekStart} — your pod only.</p>
      <div className="space-y-3">
        {trainees.map((t) => (
          <div key={t.id} className={card}>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{t.name}</h3>
            <div className="flex gap-1.5 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n}
                  onClick={() => { setScores((s) => ({ ...s, [t.id]: n })); setSaved((s) => ({ ...s, [t.id]: false })); }}
                  className={`w-8 h-8 text-sm font-semibold rounded-full border transition-colors ${
                    scores[t.id] === n
                      ? 'text-white border-transparent'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                  style={scores[t.id] === n ? { backgroundColor: getThemeColor() } : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
            <input className={inputClass()} style={{ marginBottom: 12 }} placeholder="Note (optional)"
              value={notes[t.id] ?? ''}
              onChange={(e) => { setNotes((n) => ({ ...n, [t.id]: e.target.value })); setSaved((s) => ({ ...s, [t.id]: false })); }} />
            <div className="flex items-center gap-3">
              <button onClick={() => submit(t.id)} disabled={!scores[t.id] || saving === t.id}
                className={btnPrimaryBase} style={primaryStyle(getThemeColor())}>
                {saving === t.id ? 'Saving…' : 'Save rating'}
              </button>
              {saved[t.id] && <span className="text-xs text-gray-500 dark:text-gray-400">Saved</span>}
            </div>
          </div>
        ))}
        {trainees.length === 0 && <div className="text-sm text-gray-400">No trainees found for your pod.</div>}
      </div>
    </div>
  );
}
