import { Router } from 'express';
import BuddyRating from '../models/BuddyRating.js';
import Pod from '../models/Pod.js';
import Trainee from '../models/Trainee.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

// POST /api/buddy-ratings — {trainee_id, weekStart, score, note} — buddy, own pod only
// (SPEC.md §4: "Weekly buddy rating | | own pod | | ✓ |" — Deepti can also enter one).
router.post('/', requirePermission('buddyRating', 'create'), async (req, res, next) => {
  try {
    const { trainee_id, weekStart, score, note } = req.body;
    if (!trainee_id || !weekStart || !(score >= 1 && score <= 5)) {
      return res.status(400).json({ error: 'trainee_id, weekStart and score (1-5) required' });
    }
    const trainee = await Trainee.findOne({ code: trainee_id });
    if (!trainee) return res.status(404).json({ error: 'unknown trainee' });

    if (req.user.role === 'buddy') {
      const pod = await Pod.findById(trainee.pod);
      if (String(pod?.buddy) !== req.user.sub) {
        return res.status(403).json({ error: 'can only rate your own pod' });
      }
    }

    await BuddyRating.findOneAndUpdate(
      { trainee: trainee._id, weekStart: new Date(weekStart) },
      { $set: { score, note: note ?? '', submittedBy: req.user.name, submittedAt: new Date() } },
      { upsert: true },
    );
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// GET /api/buddy-ratings?trainee=T01
router.get('/', requirePermission('buddyRating', 'view'), async (req, res, next) => {
  try {
    const trainee = await Trainee.findOne({ code: req.query.trainee });
    if (!trainee) return res.json([]);
    const ratings = await BuddyRating.find({ trainee: trainee._id }).sort('weekStart').lean();
    res.json(ratings.map((r) => ({
      weekStart: r.weekStart.toISOString().slice(0, 10),
      score: r.score,
      note: r.note,
      submittedBy: r.submittedBy,
    })));
  } catch (e) {
    next(e);
  }
});

export default router;
