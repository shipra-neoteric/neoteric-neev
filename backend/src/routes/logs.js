import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import Trainee from '../models/Trainee.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// PUT /api/logs/bulk — [{trainee_id, day_id, score, note}], staff scoring the daily
// entry grid in front of the trainee at 17:30 (SPEC.md §7 v1).
// "Score and sign a daily log" is Rajat/Deepti only (SPEC.md §4).
router.put('/bulk', requireRole('coordinator', 'supervisor'), async (req, res, next) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'expected an array' });
    for (const e of entries) {
      if (!(e.score >= 1 && e.score <= 5)) return res.status(400).json({ error: `invalid entry: ${JSON.stringify(e)}` });
    }
    if (!entries.length) return res.status(204).end();

    const codes = [...new Set(entries.map((e) => e.trainee_id))];
    const trainees = await Trainee.find({ code: { $in: codes } }).select('code').lean();
    const traineeIdByCode = Object.fromEntries(trainees.map((t) => [t.code, t._id]));

    const by = req.user.name;
    const now = new Date();
    const ops = entries
      .filter((e) => traineeIdByCode[e.trainee_id])
      .map((e) => ({
        updateOne: {
          filter: { trainee: traineeIdByCode[e.trainee_id], day: e.day_id },
          // reviewedAt is timestamped separately from submittedAt — SPEC.md §8
          update: { $set: { score: e.score, note: e.note ?? '', reviewedBy: by, reviewedAt: now } },
          upsert: true,
        },
      }));
    if (ops.length) await DailyLog.bulkWrite(ops);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// POST /api/logs — {day_id, bodyJson} — trainee submits their own log; idempotent on
// (trainee, day) via upsert (SPEC.md §3). Score/review come later from staff via
// PUT /bulk above — submitting again before review just replaces bodyJson/submittedAt.
router.post('/', requireRole('trainee'), async (req, res, next) => {
  try {
    const { day_id, bodyJson } = req.body;
    if (!day_id || !bodyJson) return res.status(400).json({ error: 'day_id and bodyJson required' });

    const trainee = await Trainee.findOne({ person: req.user.sub });
    if (!trainee) return res.status(404).json({ error: 'trainee record not found' });

    await DailyLog.findOneAndUpdate(
      { trainee: trainee._id, day: day_id },
      { $set: { bodyJson, submittedAt: new Date() } },
      { upsert: true },
    );
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
