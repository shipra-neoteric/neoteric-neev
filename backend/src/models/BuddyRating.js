import mongoose from 'mongoose';

// Not one of SPEC.md §2's fourteen named tables, but "Weekly buddy rating" is an
// explicit v2 build item (§7) and a scored component of the final weighted score
// (README: "Site buddy weekly rating — 15%") with no other table to hold it.
const buddyRatingSchema = new mongoose.Schema({
  trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainee', required: true },
  weekStart: { type: Date, required: true }, // Monday of the rated week
  score: { type: Number, min: 1, max: 5, required: true },
  note: String,
  submittedBy: String,
  submittedAt: { type: Date, default: Date.now },
});

buddyRatingSchema.index({ trainee: 1, weekStart: 1 }, { unique: true });

export default mongoose.model('BuddyRating', buddyRatingSchema);
