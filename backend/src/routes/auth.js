import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Otp from '../models/Otp.js';
import Person from '../models/Person.js';
import Trainee from '../models/Trainee.js';
import { sendOtp } from '../services/sms.js';

const router = Router();

// POST /api/auth/login — email + password for staff (SPEC.md §1).
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

// POST /api/auth/otp/request — {phone} — trainee login step 1 (SPEC.md §1).
router.post('/otp/request', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    const person = await Person.findOne({ phone, role: 'trainee', active: true });
    if (!person) return res.status(404).json({ error: 'no active trainee with that phone number' });

    await Otp.deleteMany({ person: person._id });
    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    await Otp.create({ person: person._id, codeHash, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    const devInfo = await sendOtp(phone, code);
    res.json({ sent: true, ...devInfo });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/otp/verify — {phone, code} — trainee login step 2.
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

    const person = await Person.findOne({ phone, role: 'trainee', active: true });
    if (!person) return res.status(401).json({ error: 'invalid code' });

    const otp = await Otp.findOne({ person: person._id }).sort({ _id: -1 });
    if (!otp || otp.expiresAt < new Date()) return res.status(401).json({ error: 'code expired — request a new one' });
    if (!await bcrypt.compare(code, otp.codeHash)) return res.status(401).json({ error: 'invalid code' });

    await Otp.deleteMany({ person: person._id });

    const trainee = await Trainee.findOne({ person: person._id });
    const token = jwt.sign(
      { sub: person._id.toString(), name: person.name, role: 'trainee', traineeCode: trainee?.code },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }, // trainees stay signed in on their own phone
    );
    res.json({ token, name: person.name, role: 'trainee', traineeCode: trainee?.code });
  } catch (e) {
    next(e);
  }
});

export default router;
