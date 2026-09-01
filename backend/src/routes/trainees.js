import { Router } from 'express';
import Pod from '../models/Pod.js';
import Trainee from '../models/Trainee.js';
import { attPct, band, getCheckpoint, logAvg, podNumber, velocity } from '../services/traineeStats.js';

const router = Router();

// GET /api/trainees?pod=
router.get('/', async (req, res, next) => {
  try {
    const { pod } = req.query;
    const filter = {};
    if (pod) {
      const podDoc = await Pod.findOne({ name: `Pod ${pod}` });
      if (!podDoc) return res.json([]);
      filter.pod = podDoc._id;
    }

    const trainees = await Trainee.find(filter).populate('person').populate('pod').populate('buddy').lean();

    const list = await Promise.all(trainees.map(async (t) => {
      const assessment = await getCheckpoint(t._id);
      const chk = assessment?.total ?? null;
      return {
        id: t.code,
        name: t.person.name,
        branch: t.branch,
        pod: podNumber(t.pod),
        buddy: t.buddy?.name ?? null,
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
    }));

    res.json(list);
  } catch (e) {
    next(e);
  }
});

export default router;
