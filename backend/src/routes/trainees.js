import { Router } from 'express';
import Attendance from '../models/Attendance.js';
import DailyLog from '../models/DailyLog.js';
import Day from '../models/Day.js';
import Person from '../models/Person.js';
import Pod from '../models/Pod.js';
import Trainee from '../models/Trainee.js';
import { requireRole } from '../middleware/auth.js';
import { attPct, band, getCheckpoint, logAvg, podNumber, velocity } from '../services/traineeStats.js';

const router = Router();

async function serializeTrainee(t) {
  const assessment = await getCheckpoint(t._id);
  const chk = assessment?.total ?? null;
  return {
    id: t.code,
    name: t.person.name,
    phone: t.person.phone ?? null,
    email: t.person.email ?? null,
    branch: t.branch,
    pod: podNumber(t.pod),
    buddy: t.buddy?.name ?? null,
    status: t.status,
    baseline: t.baselineScore,
    written: assessment?.written ?? null,
    practical: assessment?.practical ?? null,
    behavioural: assessment?.behavioural ?? null,
    checkpoint: chk,
    band: band(t.baselineScore, chk),
    velocity: velocity(t.baselineScore, chk),
    log_avg: await logAvg(t._id),
    att_pct: await attPct(t._id),
  };
}

async function resolvePod(podNum) {
  return Pod.findOne({ name: `Pod ${podNum}` });
}

async function nextCode() {
  const [last] = await Trainee.find().sort({ code: -1 }).limit(1).lean();
  const n = last ? parseInt(last.code.slice(1), 10) + 1 : 1;
  return 'T' + String(n).padStart(2, '0');
}

// GET /api/trainees?pod= — the batch roster (staff only, SPEC.md §4)
router.get('/', requireRole('coordinator', 'supervisor', 'office', 'buddy'), async (req, res, next) => {
  try {
    const { pod } = req.query;
    const filter = {};
    if (pod) {
      const podDoc = await resolvePod(pod);
      if (!podDoc) return res.json([]);
      filter.pod = podDoc._id;
    }
    const trainees = await Trainee.find(filter).populate('person').populate('pod').populate('buddy').lean();
    res.json(await Promise.all(trainees.map(serializeTrainee)));
  } catch (e) {
    next(e);
  }
});

async function traineeDetail(t) {
  const [days, attendanceDocs, logDocs] = await Promise.all([
    Day.find({ batch: t.batch }).sort('date').lean(),
    Attendance.find({ trainee: t._id }).lean(),
    DailyLog.find({ trainee: t._id }).lean(),
  ]);
  const attByDay = Object.fromEntries(attendanceDocs.map((a) => [String(a.day), a]));
  const logByDay = Object.fromEntries(logDocs.map((l) => [String(l.day), l]));

  const history = days.map((d) => ({
    code: d.code,
    label: d.label,
    attendance: attByDay[String(d._id)]?.status ?? null,
    log_score: logByDay[String(d._id)]?.score ?? null,
    log_note: logByDay[String(d._id)]?.note ?? '',
  }));

  return { ...(await serializeTrainee(t)), history };
}

// GET /api/trainees/me — own profile + history, for a logged-in trainee.
// Must stay ahead of GET /:code, or "me" would be matched as a trainee code.
router.get('/me', requireRole('trainee'), async (req, res, next) => {
  try {
    const t = await Trainee.findOne({ person: req.user.sub })
      .populate('person').populate('pod').populate('buddy').lean();
    if (!t) return res.status(404).json({ error: 'trainee record not found' });
    res.json(await traineeDetail(t));
  } catch (e) {
    next(e);
  }
});

// GET /api/trainees/:code — full profile + day-by-day history, for the detail drawer
// (staff only — a trainee sees their own via /me, not anyone else's, SPEC.md §4)
router.get('/:code', requireRole('coordinator', 'supervisor', 'office', 'buddy'), async (req, res, next) => {
  try {
    const t = await Trainee.findOne({ code: req.params.code })
      .populate('person').populate('pod').populate('buddy').lean();
    if (!t) return res.status(404).json({ error: 'unknown trainee' });
    res.json(await traineeDetail(t));
  } catch (e) {
    next(e);
  }
});

// POST /api/trainees — trainee master: add a new trainee. Rajat/Deepti/Bharti (README:
// "who owns what" — all three touch trainee records).
router.post('/', requireRole('coordinator', 'supervisor', 'office'), async (req, res, next) => {
  try {
    const { name, phone, email, branch, pod, baseline } = req.body;
    if (!name || !pod) return res.status(400).json({ error: 'name and pod are required' });

    const podDoc = await resolvePod(pod);
    if (!podDoc) return res.status(400).json({ error: `unknown pod ${pod}` });

    const code = await nextCode();
    const person = await Person.create({ name, phone: phone || undefined, email: email || undefined, role: 'trainee' });
    const trainee = await Trainee.create({
      code,
      person: person._id,
      batch: podDoc.batch,
      pod: podDoc._id,
      buddy: podDoc.buddy,
      branch: branch || '',
      baselineScore: baseline ?? null,
      status: 'active',
    });

    const full = await Trainee.findById(trainee._id).populate('person').populate('pod').populate('buddy').lean();
    res.status(201).json(await serializeTrainee(full));
  } catch (e) {
    next(e);
  }
});

// PUT /api/trainees/:code — trainee master: edit. Baseline is write-once (SPEC.md §8).
router.put('/:code', requireRole('coordinator', 'supervisor', 'office'), async (req, res, next) => {
  try {
    const t = await Trainee.findOne({ code: req.params.code });
    if (!t) return res.status(404).json({ error: 'unknown trainee' });

    const { name, phone, email, branch, pod, status, baseline } = req.body;

    if (baseline != null) {
      if (t.baselineScore != null && baseline !== t.baselineScore) {
        return res.status(400).json({ error: 'baseline is locked once set (SPEC.md §8)' });
      }
      t.baselineScore = baseline;
    }
    if (branch != null) t.branch = branch;
    if (status != null) t.status = status;
    if (pod != null) {
      const podDoc = await resolvePod(pod);
      if (!podDoc) return res.status(400).json({ error: `unknown pod ${pod}` });
      t.pod = podDoc._id;
      t.buddy = podDoc.buddy;
    }
    await t.save();

    if (name != null || phone != null || email != null) {
      const update = {};
      if (name != null) update.name = name;
      if (phone != null) update.phone = phone;
      if (email != null) update.email = email;
      await Person.findByIdAndUpdate(t.person, update);
    }

    const full = await Trainee.findById(t._id).populate('person').populate('pod').populate('buddy').lean();
    res.json(await serializeTrainee(full));
  } catch (e) {
    next(e);
  }
});

export default router;
