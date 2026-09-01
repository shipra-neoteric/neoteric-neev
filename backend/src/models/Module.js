import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // "M01"
  title: { type: String, required: true },
  department: { type: String, enum: ['SUP', 'QC', 'MEA', 'STR'], required: true },
  handbookSection: String,
  sequence: { type: Number, required: true },
});

export default mongoose.model('Module', moduleSchema);
