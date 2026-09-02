import { Router } from 'express';
import Trainee from '../models/Trainee.js';
import Video from '../models/Video.js';
import VideoProgress from '../models/VideoProgress.js';
import { requirePermission, requireRole } from '../middleware/auth.js';
import { extractYoutubeId, fetchDuration, fetchOEmbed } from '../services/youtube.js';

const router = Router();

// POST /api/videos — {module_id, url} — Rajat/Deepti add (SPEC.md §4 & §5).
// Store the ID, never the full URL.
router.post('/', requirePermission('content', 'create'), async (req, res, next) => {
  try {
    const { module_id, url } = req.body;
    if (!module_id || !url) return res.status(400).json({ error: 'module_id and url required' });

    const youtubeId = extractYoutubeId(url);
    if (!youtubeId) return res.status(400).json({ error: 'could not extract a YouTube video ID from that URL' });

    const [meta, durationS] = await Promise.all([fetchOEmbed(youtubeId), fetchDuration(youtubeId)]);
    const video = await Video.create({
      module: module_id,
      youtubeId,
      title: meta?.title ?? null,
      channel: meta?.author_name ?? null,
      durationS,
      status: 'suggested',
      addedBy: req.user.name,
    });
    res.status(201).json(video);
  } catch (e) {
    next(e);
  }
});

// PUT /api/videos/:id/approve — Deepti only, suggested → linked (SPEC.md §4 & §5).
router.put('/:id/approve', requirePermission('content', 'approve'), async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { status: 'linked', approvedBy: req.user.name },
      { new: true },
    );
    if (!video) return res.status(404).json({ error: 'unknown video' });
    res.json(video);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/videos/:id
router.delete('/:id', requirePermission('content', 'delete'), async (req, res, next) => {
  try {
    await VideoProgress.deleteMany({ video: req.params.id });
    const deleted = await Video.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'unknown video' });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// POST /api/videos/:id/progress — {seconds} — trainee's own watch progress.
// Marked completed at 90% of duration, not 100% (SPEC.md §5).
router.post('/:id/progress', requireRole('trainee'), async (req, res, next) => {
  try {
    const { seconds } = req.body;
    if (typeof seconds !== 'number') return res.status(400).json({ error: 'seconds required' });

    const trainee = await Trainee.findOne({ person: req.user.sub });
    if (!trainee) return res.status(404).json({ error: 'trainee record not found' });

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'unknown video' });

    const existing = await VideoProgress.findOne({ trainee: trainee._id, video: video._id });
    const maxSeconds = Math.max(seconds, existing?.secondsWatched ?? 0);
    const update = { secondsWatched: maxSeconds };
    if (!existing?.completedAt && video.durationS && maxSeconds >= video.durationS * 0.9) {
      update.completedAt = new Date();
    }
    await VideoProgress.findOneAndUpdate(
      { trainee: trainee._id, video: video._id },
      { $set: update },
      { upsert: true },
    );
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
