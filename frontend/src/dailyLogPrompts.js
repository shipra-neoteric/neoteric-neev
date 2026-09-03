// The six daily-log prompts — the shape a 5-quality log needs, per SPEC.md's
// description: "someone who was not on site could reconstruct the day from it."
// Shared between the trainee's submission form (MyLog.jsx) and every staff-facing
// place that reads a submitted log back (DailyEntry.jsx, TraineeProfile.jsx).
export const DAILY_LOG_PROMPTS = [
  { key: 'work', label: 'What did you work on today?' },
  { key: 'location', label: 'Where on site? (block / zone / floor)' },
  { key: 'numbers', label: 'Key numbers or measurements you recorded' },
  { key: 'problem', label: 'One problem or mistake you saw' },
  { key: 'question', label: 'One question you asked your site buddy or engineer' },
  { key: 'tomorrow', label: "Tomorrow's plan" },
];
