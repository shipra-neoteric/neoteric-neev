import mongoose from 'mongoose';

// Text content alongside a module's videos — same idea as a video, but written
// instead of linked. Trainees view these read-only in the Today screen.
const moduleNoteSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  addedBy: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('ModuleNote', moduleNoteSchema);
