import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  role: {
    type: String,
    enum: ['trainee', 'coordinator', 'supervisor', 'office', 'buddy', 'dept_head', 'exec'],
    required: true,
  },
  active: { type: Boolean, default: true },
});

export default mongoose.model('Person', personSchema);
