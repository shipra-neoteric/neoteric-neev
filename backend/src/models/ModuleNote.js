import mongoose from 'mongoose';

// A file attachment (PDF/DOC/image) alongside a module's videos. `body` is legacy —
// notes created before attachments existed were plain text; kept so old ones still
// render. Trainees view these read-only on the Today screen.
const moduleNoteSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  title: { type: String, required: true },
  fileUrl: String,
  fileName: String,
  fileType: String,
  body: String,
  addedBy: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('ModuleNote', moduleNoteSchema);
