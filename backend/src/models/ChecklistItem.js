import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema({
  trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainee', required: true },
  itemIndex: { type: Number, required: true }, // 0-27, into the fixed 28-item list
  done: { type: Boolean, default: false },
  signedBy: String,
  signedAt: Date,
  evidenceUrl: String, // Cloudinary URL, set by the trainee before sign-off
});

checklistItemSchema.index({ trainee: 1, itemIndex: 1 }, { unique: true });

export default mongoose.model('ChecklistItem', checklistItemSchema);
