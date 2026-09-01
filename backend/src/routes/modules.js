import { Router } from 'express';
import Module from '../models/Module.js';
import Video from '../models/Video.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/modules?with=videos — everyone except Bharti (SPEC.md §4: "Watch module
// videos | ✓ | ✓ | ✓ | ✓ |" — trainee, buddy, coordinator, supervisor).
router.get('/', requireRole('trainee', 'buddy', 'coordinator', 'supervisor'), async (req, res, next) => {
  try {
    const modules = await Module.find().sort('sequence').lean();
    if (req.query.with !== 'videos') return res.json(modules);

    const videos = await Video.find({
      module: { $in: modules.map((m) => m._id) },
      status: { $ne: 'retired' },
    }).lean();
    const byModule = {};
    videos.forEach((v) => { (byModule[String(v.module)] ??= []).push(v); });

    res.json(modules.map((m) => ({ ...m, videos: byModule[String(m._id)] ?? [] })));
  } catch (e) {
    next(e);
  }
});

export default router;
