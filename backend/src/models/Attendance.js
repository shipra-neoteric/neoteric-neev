import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainee', required: true },
  day: { type: mongoose.Schema.Types.ObjectId, ref: 'Day', required: true },
  status: { type: String, enum: ['P', 'A', 'L', 'H'], required: true },
  markedBy: String,
  markedAt: { type: Date, default: Date.now },
});

attendanceSchema.index({ trainee: 1, day: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
