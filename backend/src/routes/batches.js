import { Router } from 'express';
import Attendance from '../models/Attendance.js';
import Batch from '../models/Batch.js';
import DailyLog from '../models/DailyLog.js';
import Day from '../models/Day.js';
import Trainee from '../models/Trainee.js';
import { writeMonthlyPack } from '../reports/monthlyPack.js';
import { podNumber } from '../services/traineeStats.js';

const router = Router();

async function findBatch(slug) {
  return Batch.findOne({ slug });
}

// GET /api/batches/:id/days/:code — the daily entry grid for one day
router.get('/:id/days/:code', async (req, res, next) => {
  try {
    const batch = await findBatch(req.params.id);
    if (!batch) return res.status(404).json({ error: 'unknown batch' });
    const day = await Day.findOne({ batch: batch._id, code: req.params.code });
    if (!day) return res.status(404).json({ error: 'unknown day' });

    const trainees = await Trainee.find({ batch: batch._id }).populate('person').populate('pod').lean();
    const [attendanceDocs, logDocs] = await Promise.all([
      Attendance.find({ day: day._id }).lean(),
      DailyLog.find({ day: day._id }).lean(),
    ]);
    const attByTrainee = Object.fromEntries(attendanceDocs.map((a) => [String(a.trainee), a]));
    const logByTrainee = Object.fromEntries(logDocs.map((l) => [String(l.trainee), l]));

    const rows = trainees.map((t) => ({
      trainee_id: t.code,
      name: t.person.name,
      pod: podNumber(t.pod),
      attendance: attByTrainee[String(t._id)]?.status ?? null,
      log_score: logByTrainee[String(t._id)]?.score ?? null,
      log_note: logByTrainee[String(t._id)]?.note ?? '',
    }));

    res.json({
      day: { id: day._id.toString(), code: day.code, date: day.date.toISOString().slice(0, 10), label: day.label },
      rows,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/batches/:id/days — list of days, for the day picker
router.get('/:id/days', async (req, res, next) => {
  try {
    const batch = await findBatch(req.params.id);
    if (!batch) return res.status(404).json({ error: 'unknown batch' });
    const days = await Day.find({ batch: batch._id }).sort('date').lean();
    res.json(days.map((d) => ({
      id: d._id.toString(), code: d.code, date: d.date.toISOString().slice(0, 10), label: d.label,
    })));
  } catch (e) {
    next(e);
  }
});

// GET /api/batches/:id/report?month=YYYY-MM — the monthly pack, as a PDF
router.get('/:id/report', async (req, res, next) => {
  try {
    const batch = await findBatch(req.params.id);
    if (!batch) return res.status(404).json({ error: 'unknown batch' });
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    await writeMonthlyPack(res, { batchId: batch.slug, batch, month });
  } catch (e) {
    next(e);
  }
});

export default router;
