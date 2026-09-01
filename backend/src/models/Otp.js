import mongoose from 'mongoose';

// Trainee login is phone+OTP (SPEC.md §1). Short-lived, hashed, single collection —
// no need to keep history once verified or expired.
const otpSchema = new mongoose.Schema({
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Otp', otpSchema);
