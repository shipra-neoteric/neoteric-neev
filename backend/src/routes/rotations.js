import { Router } from 'express';
import Pod from '../models/Pod.js';
import Rotation from '../models/Rotation.js';

const router = Router();

// GET /api/rotations — the batch's block schedule (view-only; editing "who's allotted
// where" is out of scope for now — SPEC.md §7 v3 asks for immersion *reviews*, not a
// rotation editor).
router.get('/', async (req, res, next) => {
  try {
    const pods = await Pod.find().lean();
    const podNameById = Object.fromEntries(pods.map((p) => [String(p._id), p.name]));
    const rotations = await Rotation.find({ pod: { $in: pods.map((p) => p._id) } }).sort('startsOn').lean();
    res.json(rotations.map((r) => ({
      pod: podNameById[String(r.pod)],
      blockCode: r.blockCode,
      department: r.department,
      startsOn: r.startsOn.toISOString().slice(0, 10),
      endsOn: r.endsOn.toISOString().slice(0, 10),
    })));
  } catch (e) {
    next(e);
  }
});

export default router;
