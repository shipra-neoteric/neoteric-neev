// Role definitions and per-role nav visibility, ported from docs/app-prototype.html.
// Real auth (email+password for staff, phone+OTP for trainees — SPEC.md §1) replaces
// the role switcher once the backend auth endpoints exist.

export const ROLES = {
  deepti: {
    label: 'Deepti — Training Supervisor',
    note: 'Owner. Full access: assessments, bands, department allotment, and the Saturday review pack.',
    nav: ['dashboard', 'daily', 'trainees', 'assessment', 'reports'],
  },
  rajat: {
    label: 'Rajat — Training Coordinator',
    note: 'Runs it. Daily entry and trainee records. Cannot set bands or allot departments.',
    nav: ['dashboard', 'daily', 'trainees'],
  },
  buddy: {
    label: 'Site Buddy',
    note: 'Sees only their own pod. Submits a weekly rating on their three trainees.',
    nav: ['dashboard', 'trainees'],
  },
  bharti: {
    label: 'Bharti — Office Coordinator',
    note: 'Office. Trainee records and joining documents. No assessment access.',
    nav: ['dashboard', 'trainees'],
  },
};

export const NAV = [
  { key: 'dashboard', icon: '▣', label: 'Dashboard', path: '/dashboard' },
  { key: 'daily', icon: '✓', label: 'Daily entry', path: '/daily' },
  { key: 'trainees', icon: '▤', label: 'Trainees', path: '/trainees' },
  { key: 'assessment', icon: '◆', label: 'Assessment', path: '/assessment' },
  { key: 'reports', icon: '▦', label: 'Monthly pack', path: '/reports' },
];
