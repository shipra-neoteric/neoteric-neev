import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  youtubeId: { type: String, required: true }, // store the ID, never the full URL — SPEC.md §5
  title: String,
  channel: String,
  durationS: Number, // requires a YouTube Data API v3 key — null if not configured
  status: { type: String, enum: ['suggested', 'linked', 'retired'], default: 'suggested' },
  addedBy: String,
  approvedBy: String,
});

export default mongoose.model('Video', videoSchema);
