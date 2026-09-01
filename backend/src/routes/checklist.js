import { v2 as cloudinary } from 'cloudinary';
import { Router } from 'express';
import ChecklistItem from '../models/ChecklistItem.js';
import Pod from '../models/Pod.js';
import Trainee from '../models/Trainee.js';
import { requireRole } from '../middleware/auth.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// The fixed 28-item Phase 1 checklist (from docs/app-prototype.html's CHECKLIST array —
// the real programme's list, not fictional seed data).
export const CHECKLIST_ITEMS = [
  'Set out a building grid with a total station', 'Closed a level book arithmetic check',
  'Accepted or rejected a cement consignment', 'Verified steel by mass per metre',
  'Performed a slump test and cast cubes', 'Signed a pre-pour checklist after verifying every line',
  'Checked shuttering for plumb and back-propping', 'Prepared a BBS and reconciled steel used',
  'Checked masonry for plumb, joint and bond', 'Fixed plaster dots and tap-tested a wall',
  'Witnessed and recorded a ponding test', 'Witnessed a plumbing hydro test',
  'Witnessed a megger and earth resistance test', 'Approved a dry-laid tiling layout',
  'Raised a GRN end to end', 'Completed a physical stock verification',
  'Prepared a cement and steel reconciliation', 'Took off quantities and compared to BOQ',
  'Built a rate analysis from first principles', 'Carried out a joint measurement in the MB',
  'Checked an RA bill line by line', 'Raised an NCR through to verified closure',
  'Exercised Stop-Work Authority', 'Produced and closed a flat snag list',
  'Submitted a DPR every working day', 'Delivered a toolbox talk in Hindi',
  'Computed manpower from a target', 'Presented a site problem to leadership',
];

const router = Router();

function assembleChecklist(items) {
  const byIndex = Object.fromEntries(items.map((i) => [i.itemIndex, i]));
  return CHECKLIST_ITEMS.map((text, i) => ({
    index: i,
    text,
    done: byIndex[i]?.done ?? false,
    evidenceUrl: byIndex[i]?.evidenceUrl ?? null,
    signedBy: byIndex[i]?.signedBy ?? null,
    signedAt: byIndex[i]?.signedAt ?? null,
  }));
}

function validIndex(index) {
  return index >= 0 && index < CHECKLIST_ITEMS.length;
}

// GET /api/checklist/me — trainee's own checklist
router.get('/me', requireRole('trainee'), async (req, res, next) => {
  try {
    const trainee = await Trainee.findOne({ person: req.user.sub });
    if (!trainee) return res.status(404).json({ error: 'trainee record not found' });
    const items = await ChecklistItem.find({ trainee: trainee._id }).lean();
    res.json(assembleChecklist(items));
  } catch (e) {
    next(e);
  }
});

// GET /api/checklist/:code — staff view of one trainee's checklist
router.get('/:code', requireRole('buddy', 'coordinator', 'supervisor'), async (req, res, next) => {
  try {
    const trainee = await Trainee.findOne({ code: req.params.code });
    if (!trainee) return res.status(404).json({ error: 'unknown trainee' });
    const items = await ChecklistItem.find({ trainee: trainee._id }).lean();
    res.json(assembleChecklist(items));
  } catch (e) {
    next(e);
  }
});

// POST /api/checklist/:index/evidence — {dataUrl} — trainee uploads a photo before
// sign-off. Accepts a base64 data URL directly (Cloudinary's SDK takes it as-is —
// no multipart/multer needed).
router.post('/:index/evidence', requireRole('trainee'), async (req, res, next) => {
  try {
    const index = Number(req.params.index);
    if (!validIndex(index)) return res.status(400).json({ error: 'invalid item index' });
    const { dataUrl } = req.body;
    if (!dataUrl) return res.status(400).json({ error: 'dataUrl required' });

    const trainee = await Trainee.findOne({ person: req.user.sub });
    if (!trainee) return res.status(404).json({ error: 'trainee record not found' });

    const upload = await cloudinary.uploader.upload(dataUrl, { folder: `neev/checklist/${trainee.code}` });

    await ChecklistItem.findOneAndUpdate(
      { trainee: trainee._id, itemIndex: index },
      { $set: { evidenceUrl: upload.secure_url } },
      { upsert: true },
    );
    res.json({ evidenceUrl: upload.secure_url });
  } catch (e) {
    next(e);
  }
});

// PUT /api/checklist/:code/:index/sign — buddy (own pod), coordinator or supervisor
// (SPEC.md §4: "Sign a checklist item | | own pod | ✓ | ✓ |").
router.put('/:code/:index/sign', requireRole('buddy', 'coordinator', 'supervisor'), async (req, res, next) => {
  try {
    const index = Number(req.params.index);
    if (!validIndex(index)) return res.status(400).json({ error: 'invalid item index' });

    const trainee = await Trainee.findOne({ code: req.params.code });
    if (!trainee) return res.status(404).json({ error: 'unknown trainee' });

    if (req.user.role === 'buddy') {
      const pod = await Pod.findById(trainee.pod);
      if (String(pod?.buddy) !== req.user.sub) {
        return res.status(403).json({ error: 'can only sign for your own pod' });
      }
    }

    const item = await ChecklistItem.findOneAndUpdate(
      { trainee: trainee._id, itemIndex: index },
      { $set: { done: true, signedBy: req.user.name, signedAt: new Date() } },
      { upsert: true, new: true },
    );
    res.json(item);
  } catch (e) {
    next(e);
  }
});

export default router;
