import { DAILY_LOG_PROMPTS } from '../dailyLogPrompts';

// Read-only rendering of a trainee's submitted 6-prompt write-up — used everywhere
// staff need to see what a trainee actually wrote, not just the score/note staff
// themselves entered (DailyEntry.jsx, TraineeProfile.jsx).
export default function DailyLogBody({ body }) {
  if (!body) return <div className="text-sm text-gray-400">No write-up submitted for this day.</div>;
  return (
    <dl className="space-y-2.5">
      {DAILY_LOG_PROMPTS.map((p) => (
        <div key={p.key}>
          <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{p.label}</dt>
          <dd className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{body[p.key] || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
