import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Person from '../models/Person.js';

const router = Router();

// POST /api/auth/login — email + password for staff (SPEC.md §1).
// Trainee phone+OTP login is v2 (the trainee PWA) and isn't built yet.
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const person = await Person.findOne({ email: String(email).toLowerCase(), active: true });
    const ok = person?.passwordHash && await bcrypt.compare(password, person.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign(
      { sub: person._id.toString(), name: person.name, role: person.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' },
    );
    res.json({ token, name: person.name, role: person.role });
  } catch (e) {
    next(e);
  }
});

export default router;
