import jwt from 'jsonwebtoken';
import Person from '../models/Person.js';
import { resolvePermission } from '../permissions/defaults.js';

export async function requireAuth(req, res, next) {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'invalid or expired token' });
  }

  // Fetched fresh on every request (not trusted from the token) so a permission
  // change or deactivation by an admin takes effect immediately, not just after
  // the token's next expiry.
  try {
    const person = await Person.findById(payload.sub).lean();
    if (!person || !person.active) return res.status(401).json({ error: 'account no longer active' });

    req.user = {
      sub: payload.sub,
      name: person.name,
      role: person.role,
      permissions: person.permissions,
      traineeCode: payload.traineeCode,
    };
    next();
  } catch (e) {
    next(e);
  }
}

export function requirePermission(moduleKey, action) {
  return (req, res, next) => {
    if (!resolvePermission(req.user, moduleKey, action)) {
      return res.status(403).json({ error: `requires ${action} permission on ${moduleKey}` });
    }
    next();
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}
