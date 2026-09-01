import mongoose from 'mongoose';

const podSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  name: { type: String, required: true },
  buddy: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
});

export default mongoose.model('Pod', podSchema);
