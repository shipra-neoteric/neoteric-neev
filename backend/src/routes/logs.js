import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import Trainee from '../models/Trainee.js';

const router = Router();

// PUT /api/logs/bulk — [{trainee_id, day_id, score, note}], staff scoring the daily
// entry grid in front of the trainee at 17:30 (SPEC.md §7 v1).
router.put('/bulk', async (req, res, next) => {
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

    const by = req.header('X-Role') || 'unknown';
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

export default router;
