import { Router } from 'express';
import Pod from '../models/Pod.js';
import Trainee from '../models/Trainee.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

// GET /api/pods — the 4 pods and their current buddy (any authenticated staff)
router.get('/', async (req, res, next) => {
  try {
    const pods = await Pod.find().populate('buddy').sort('name').lean();
    res.json(pods.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      buddyId: p.buddy?._id?.toString() ?? null,
      buddyName: p.buddy?.name ?? null,
    })));
  } catch (e) {
    next(e);
  }
});

// PUT /api/pods/:id — {buddyId} — reassign a pod's buddy. Cascades to every trainee
// currently in that pod, since Trainee.buddy is a denormalized snapshot, not a live
// join (see backend/src/routes/trainees.js).
router.put('/:id', requirePermission('trainees', 'edit'), async (req, res, next) => {
  try {
    const { buddyId } = req.body;
    if (!buddyId) return res.status(400).json({ error: 'buddyId required' });

    const pod = await Pod.findByIdAndUpdate(req.params.id, { buddy: buddyId }, { new: true }).populate('buddy');
    if (!pod) return res.status(404).json({ error: 'unknown pod' });

    await Trainee.updateMany({ pod: pod._id }, { buddy: buddyId });

    res.json({ id: pod._id.toString(), name: pod.name, buddyId: pod.buddy._id.toString(), buddyName: pod.buddy.name });
  } catch (e) {
    next(e);
  }
});

export default router;
