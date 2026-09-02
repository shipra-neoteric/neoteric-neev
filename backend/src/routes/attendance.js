import { Router } from 'express';
import Attendance from '../models/Attendance.js';
import Trainee from '../models/Trainee.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();
const VALID = new Set(['P', 'A', 'L', 'H']);

// PUT /api/attendance/bulk — [{trainee_id, day_id, status}], one call for the whole grid
// (SPEC.md §3: twelve separate requests over site 4G fail halfway and leave the grid
// inconsistent — validate everything before writing anything).
// "Mark attendance" is Rajat/Deepti only (SPEC.md §4).
router.put('/bulk', requirePermission('daily', 'edit'), async (req, res, next) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'expected an array' });
    for (const e of entries) {
      if (!VALID.has(e.status)) return res.status(400).json({ error: `invalid entry: ${JSON.stringify(e)}` });
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
          update: { $set: { status: e.status, markedBy: by, markedAt: now } },
          upsert: true,
        },
      }));
    if (ops.length) await Attendance.bulkWrite(ops);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
