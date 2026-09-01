import { Router } from 'express';
import Attendance from '../models/Attendance.js';
import Batch from '../models/Batch.js';
import DailyLog from '../models/DailyLog.js';
import Day from '../models/Day.js';
import Person from '../models/Person.js';
import Trainee from '../models/Trainee.js';
import { requireRole } from '../middleware/auth.js';
import { writeMonthlyPack } from '../reports/monthlyPack.js';
import { band, getCheckpoint, logAvg, podNumber, velocity } from '../services/traineeStats.js';

const router = Router();

async function findBatch(slug) {
  return Batch.findOne({ slug });
}

// GET /api/batches/:id/dashboard — tiles, alerts, band counts (SPEC.md §3)
router.get('/:id/dashboard', async (req, res, next) => {
  try {
    const batch = await findBatch(req.params.id);
    if (!batch) return res.status(404).json({ error: 'unknown batch' });

    const days = await Day.find({ batch: batch._id }).sort('date').lean();
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = days.find((d) => d.date.toISOString().slice(0, 10) === todayStr) ?? days[days.length - 1] ?? null;

    const trainees = await Trainee.find({ batch: batch._id }).lean();
    const total = trainees.length;

    const [todayAtt, todayLogs] = today
      ? await Promise.all([
        Attendance.find({ day: today._id }).lean(),
        DailyLog.find({ day: today._id, score: { $ne: null } }).lean(),
      ])
      : [[], []];

    const bandCounts = { A: 0, B: 0, C: 0, D: 0, pending: 0 };
    const velocities = [];
    const logAvgs = [];
    const dBandTrainees = [];
    for (const t of trainees) {
      const assessment = await getCheckpoint(t._id);
      const chk = assessment?.total ?? null;
      const b = band(t.baselineScore, chk);
      bandCounts[b ?? 'pending']++;
      const v = velocity(t.baselineScore, chk);
      if (v != null) velocities.push(v);
      const la = await logAvg(t._id);
      if (la != null) logAvgs.push(la);
      if (b === 'D') dBandTrainees.push(t);
    }
    const avgVelocity = velocities.length ? Math.round(velocities.reduce((a, b2) => a + b2, 0) / velocities.length) : null;
    const avgLogQuality = logAvgs.length ? Number((logAvgs.reduce((a, b2) => a + b2, 0) / logAvgs.length).toFixed(2)) : null;

    const logTrend = [];
    for (const d of days) {
      const scored = await DailyLog.find({ day: d._id, score: { $ne: null } }).select('score').lean();
      if (scored.length) {
        logTrend.push({ code: d.code, avg: Number((scored.reduce((a, l) => a + l.score, 0) / scored.length).toFixed(2)) });
      }
    }

    const alerts = [];
    if (dBandTrainees.length) {
      const names = await Person.find({ _id: { $in: dBandTrainees.map((t) => t.person) } }).select('name').lean();
      alerts.push({
        level: 'crit',
        text: `${dBandTrainees.length} trainee${dBandTrainees.length > 1 ? 's' : ''} in band D — ${names.map((p) => p.name).join(', ')}. This needs a written conversation with Deepti now, not a surprise at the Gateway.`,
      });
    }
    if (today && todayAtt.length < total) {
      alerts.push({ level: 'warn', text: `${total - todayAtt.length} attendance entries missing for ${today.code}.` });
    }

    res.json({
      today: today
        ? { id: today._id.toString(), code: today.code, label: today.label, date: today.date.toISOString().slice(0, 10) }
        : null,
      total,
      present: todayAtt.filter((a) => a.status === 'P').length,
      filled: todayAtt.length,
      logged: todayLogs.length,
      avgLogQuality,
      avgVelocity,
      bandCounts,
      alerts,
      logTrend,
    });
  } catch (e) {
    next(e);
  }
});

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
// "Export the monthly pack" is Rajat/Deepti/Bharti (SPEC.md §4).
router.get('/:id/report', requireRole('coordinator', 'supervisor', 'office'), async (req, res, next) => {
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
