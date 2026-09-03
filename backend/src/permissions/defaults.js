// Central permission model. Every route that used to hardcode requireRole(...) now
// calls requirePermission(module, action) instead, which checks (in order):
//   1. role === 'admin' → always allowed
//   2. an explicit true/false set on this specific user (Person.permissions) → wins
//   3. otherwise, the role's default below
// This is what "later I will decide who gets permission to delete what" needs — an
// admin can grant or revoke any single capability per user without touching code.
// `delete` defaults to false for every role on every module on purpose — nobody but
// admin can delete anything until explicitly granted.

export const MODULES = ['trainees', 'daily', 'assessment', 'content', 'rotation', 'buddyRating', 'reports', 'checklist', 'users'];
export const ACTIONS = ['view', 'create', 'edit', 'delete'];

export const ROLE_DEFAULTS = {
  supervisor: {
    trainees: { view: true, create: true, edit: true, delete: false },
    daily: { view: true, create: true, edit: true, delete: false },
    assessment: { view: true, create: true, edit: true, delete: false },
    content: { view: true, create: true, edit: true, delete: false, approve: true },
    rotation: { view: true, create: true, edit: true, delete: false },
    buddyRating: { view: true, create: true, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    checklist: { view: true, create: false, edit: true, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
  },
  coordinator: {
    trainees: { view: true, create: true, edit: true, delete: false },
    daily: { view: true, create: true, edit: true, delete: false },
    assessment: { view: false, create: false, edit: false, delete: false },
    content: { view: true, create: true, edit: true, delete: false, approve: false },
    rotation: { view: true, create: true, edit: true, delete: false },
    buddyRating: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    checklist: { view: true, create: false, edit: true, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
  },
  office: {
    trainees: { view: true, create: true, edit: true, delete: false },
    daily: { view: false, create: false, edit: false, delete: false },
    assessment: { view: false, create: false, edit: false, delete: false },
    content: { view: false, create: false, edit: false, delete: false, approve: false },
    rotation: { view: false, create: false, edit: false, delete: false },
    buddyRating: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    checklist: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
  },
  buddy: {
    trainees: { view: true, create: false, edit: false, delete: false },
    daily: { view: false, create: false, edit: false, delete: false },
    assessment: { view: false, create: false, edit: false, delete: false },
    content: { view: true, create: false, edit: false, delete: false, approve: false },
    rotation: { view: false, create: false, edit: false, delete: false },
    buddyRating: { view: true, create: true, edit: false, delete: false },
    reports: { view: false, create: false, edit: false, delete: false },
    checklist: { view: true, create: false, edit: true, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
  },
};

export function resolvePermission(user, moduleKey, action) {
  if (user.role === 'admin') return true;
  const explicit = user.permissions?.[moduleKey]?.[action];
  if (explicit === true) return true;
  if (explicit === false) return false;
  return !!ROLE_DEFAULTS[user.role]?.[moduleKey]?.[action];
}

// The full resolved matrix for a user — used in the login response (so the frontend
// can gate buttons) and the admin permission-editor (to show effective values).
export function resolveAllPermissions(user) {
  const extraActions = { content: ['approve'] };
  return Object.fromEntries(MODULES.map((m) => {
    const actions = [...ACTIONS, ...(extraActions[m] ?? [])];
    return [m, Object.fromEntries(actions.map((a) => [a, resolvePermission(user, m, a)]))];
  }));
}
