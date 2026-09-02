import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  role: {
    type: String,
    enum: ['trainee', 'coordinator', 'supervisor', 'office', 'buddy', 'dept_head', 'exec', 'admin'],
    required: true,
  },
  active: { type: Boolean, default: true },
  // staff only — trainees authenticate via phone+OTP
  passwordHash: String,
  // Per-user overrides on top of the role defaults (permissions/defaults.js) —
  // { [module]: { view, create, edit, delete } }. Unset keys fall back to the role
  // default; admin role ignores this entirely and always has full access.
  permissions: { type: mongoose.Schema.Types.Mixed, default: undefined },
});

export default mongoose.model('Person', personSchema);
