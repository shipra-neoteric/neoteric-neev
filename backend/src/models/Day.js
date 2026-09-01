import mongoose from 'mongoose';

const daySchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  code: { type: String, required: true }, // "D01"
  date: { type: Date, required: true },
  label: String, // "1 Sep · Tue"
  phase: String,
  isMusterDay: { type: Boolean, default: false },
  isOff: { type: Boolean, default: false },
});

daySchema.index({ batch: 1, code: 1 }, { unique: true });

export default mongoose.model('Day', daySchema);
