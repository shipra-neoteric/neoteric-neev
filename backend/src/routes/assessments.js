import { Router } from 'express';
import Assessment from '../models/Assessment.js';
import Trainee from '../models/Trainee.js';

const router = Router();
const MAX = { written: 40, practical: 30, behavioural: 30 };

function inRange(value, max) {
  return typeof value === 'number' && value >= 0 && value <= max;
}

// PUT /api/assessments/checkpoint/bulk — [{trainee_id, written, practical, behavioural}]
// Enter assessment marks is Deepti-only (SPEC.md §4) — enforced client-side for now
// via role-based nav until real staff auth exists.
router.put('/checkpoint/bulk', async (req, res, next) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'expected an array' });
    for (const e of entries) {
      if (!inRange(e.written, MAX.written) || !inRange(e.practical, MAX.practical) || !inRange(e.behavioural, MAX.behavioural)) {
        return res.status(400).json({ error: `invalid entry: ${JSON.stringify(e)}` });
      }
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
          filter: { trainee: traineeIdByCode[e.trainee_id], kind: 'checkpoint' },
          update: {
            $set: {
              written: e.written,
              practical: e.practical,
              behavioural: e.behavioural,
              total: e.written + e.practical + e.behavioural,
              assessedBy: by,
              assessedAt: now,
            },
          },
          upsert: true,
        },
      }));
    if (ops.length) await Assessment.bulkWrite(ops);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
