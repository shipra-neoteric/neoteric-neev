import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
  trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainee', required: true },
  day: { type: mongoose.Schema.Types.ObjectId, ref: 'Day', required: true },
  bodyJson: mongoose.Schema.Types.Mixed,
  submittedAt: Date,
  score: { type: Number, min: 1, max: 5 },
  note: String,
  reviewedBy: String,
  reviewedAt: Date, // timestamped separately from submission — SPEC.md §8
});

dailyLogSchema.index({ trainee: 1, day: 1 }, { unique: true });

export default mongoose.model('DailyLog', dailyLogSchema);
