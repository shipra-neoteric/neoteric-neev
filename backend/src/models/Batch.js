import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, // stable URL id, e.g. "b1"
  name: { type: String, required: true },
  startDate: Date,
  phase1End: Date,
  gatewayDate: Date,
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
});

export default mongoose.model('Batch', batchSchema);
