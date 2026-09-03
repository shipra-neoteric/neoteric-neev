// Mirrors backend/src/permissions/defaults.js's module/action list, for building the
// permission-matrix editor in the Users admin page.
export const MODULES = [
  { key: 'trainees', label: 'Trainees' },
  { key: 'daily', label: 'Daily entry' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'content', label: 'Modules & videos', extra: ['approve'] },
  { key: 'rotation', label: 'Rotation' },
  { key: 'buddyRating', label: 'Weekly rating' },
  { key: 'reports', label: 'Monthly pack' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'users', label: 'Users' },
];
export const ACTIONS = ['view', 'create', 'edit', 'delete'];

export const STAFF_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'supervisor', label: 'Training Supervisor' },
  { value: 'coordinator', label: 'Training Coordinator' },
  { value: 'office', label: 'Office Coordinator' },
  { value: 'buddy', label: 'Site Buddy' },
];
