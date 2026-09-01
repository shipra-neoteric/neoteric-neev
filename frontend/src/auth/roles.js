// Nav visibility per staff role (SPEC.md §4), keyed by the role string the
// backend's JWT actually carries (Person.role — see backend/src/models/Person.js).
// `title` is generic (not tied to a specific person) — the topbar shows the real
// logged-in name from the session next to it.

export const ROLES = {
  supervisor: {
    title: 'Training Supervisor',
    note: 'Owner. Full access: assessments, bands, department allotment, and the Saturday review pack.',
    nav: ['dashboard', 'daily', 'trainees', 'assessment', 'reports'],
  },
  coordinator: {
    title: 'Training Coordinator',
    note: 'Runs it. Daily entry and trainee records. Cannot set bands or allot departments.',
    nav: ['dashboard', 'daily', 'trainees', 'reports'],
  },
  office: {
    title: 'Office Coordinator',
    note: 'Office. Trainee records and joining documents. No assessment access.',
    nav: ['dashboard', 'trainees', 'reports'],
  },
  buddy: {
    title: 'Site Buddy',
    note: 'Sees only their own pod. Submits a weekly rating on their three trainees.',
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
