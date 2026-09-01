import { Router } from 'express';
import Assessment from '../models/Assessment.js';
import Trainee from '../models/Trainee.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
const MAX = { written: 40, practical: 30, behavioural: 30 };
const KINDS = new Set(['checkpoint', 'drill', 'gateway']);
const DEPTS = new Set(['SUP', 'QC', 'MEA', 'STR']);

function inRange(value, max) {
  return typeof value === 'number' && value >= 0 && value <= max;
}

// PUT /api/assessments/:kind/bulk — [{trainee_id, written, practical, behavioural, department?}]
// department is required (and must be one of SUP/QC/MEA/STR) for kind=drill, since a
// trainee gets one drill mark per department (SPEC.md §2's assessment.kind, extended
// per README's per-department drill weighting). "Enter assessment marks" is Deepti-only
// for every kind (SPEC.md §4 has a single row covering all of them).
router.put('/:kind/bulk', requireRole('supervisor'), async (req, res, next) => {
  try {
    const { kind } = req.params;
    if (!KINDS.has(kind)) return res.status(400).json({ error: `unknown assessment kind: ${kind}` });

    const entries = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'expected an array' });
    for (const e of entries) {
      if (!inRange(e.written, MAX.written) || !inRange(e.practical, MAX.practical) || !inRange(e.behavioural, MAX.behavioural)) {
        return res.status(400).json({ error: `invalid entry: ${JSON.stringify(e)}` });
      }
      if (kind === 'drill' && !DEPTS.has(e.department)) {
        return res.status(400).json({ error: `drill entries need a valid department: ${JSON.stringify(e)}` });
      }
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
          filter: {
            trainee: traineeIdByCode[e.trainee_id],
            kind,
            department: kind === 'drill' ? e.department : null,
          },
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
