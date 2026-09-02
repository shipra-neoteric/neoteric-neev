import bcrypt from 'bcryptjs';
import { Router } from 'express';
import Person from '../models/Person.js';
import { requirePermission } from '../middleware/auth.js';
import { resolveAllPermissions } from '../permissions/defaults.js';

const STAFF_ROLES = ['admin', 'supervisor', 'coordinator', 'office', 'buddy'];
const router = Router();

function serialize(person) {
  return {
    id: person._id.toString(),
    name: person.name,
    email: person.email,
    phone: person.phone ?? null,
    role: person.role,
    active: person.active,
    permissions: person.permissions ?? null,
    effectivePermissions: resolveAllPermissions(person),
  };
}

// GET /api/users — the staff roster (admin panel)
router.get('/', requirePermission('users', 'view'), async (req, res, next) => {
  try {
    const users = await Person.find({ role: { $in: STAFF_ROLES } }).sort('name').lean();
    res.json(users.map(serialize));
  } catch (e) {
    next(e);
  }
});

// POST /api/users — create a staff account with a real password
router.post('/', requirePermission('users', 'create'), async (req, res, next) => {
  try {
    const { name, email, phone, role, password, active, permissions } = req.body;
    if (!name || !email || !password || !STAFF_ROLES.includes(role)) {
      return res.status(400).json({ error: 'name, email, password and a valid role are required' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

    const exists = await Person.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(400).json({ error: 'a user with that email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await Person.create({
      name, email: String(email).toLowerCase(), phone: phone || undefined, role, passwordHash,
      active: active ?? true, permissions: permissions ?? undefined,
    });
    res.status(201).json(serialize(user));
  } catch (e) {
    next(e);
  }
});

// PUT /api/users/:id — edit; password/permissions only touched if provided
router.put('/:id', requirePermission('users', 'edit'), async (req, res, next) => {
  try {
    const { name, email, phone, role, password, active, permissions } = req.body;
    const update = {};
    if (name != null) update.name = name;
    if (email != null) update.email = String(email).toLowerCase();
    if (phone != null) update.phone = phone;
    if (role != null) {
      if (!STAFF_ROLES.includes(role)) return res.status(400).json({ error: 'invalid role' });
      update.role = role;
    }
    if (active != null) update.active = active;
    if (permissions !== undefined) update.permissions = permissions;
    if (password) {
      if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await Person.findOneAndUpdate(
      { _id: req.params.id, role: { $in: STAFF_ROLES } }, update, { new: true },
    );
    if (!user) return res.status(404).json({ error: 'unknown user' });
    res.json(serialize(user));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/users/:id
router.delete('/:id', requirePermission('users', 'delete'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.sub) return res.status(400).json({ error: "can't delete your own account" });
    const deleted = await Person.findOneAndDelete({ _id: req.params.id, role: { $in: STAFF_ROLES } });
    if (!deleted) return res.status(404).json({ error: 'unknown user' });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
