import Assessment from '../models/Assessment.js';
import Attendance from '../models/Attendance.js';
import DailyLog from '../models/DailyLog.js';

export async function attPct(traineeId) {
  const marks = await Attendance.find({ trainee: traineeId }).select('status').lean();
  if (!marks.length) return null;
  const p = marks.filter((m) => m.status === 'P').length;
  const h = marks.filter((m) => m.status === 'H').length;
  return (p + 0.5 * h) / marks.length;
}

export async function logAvg(traineeId) {
  const scored = await DailyLog.find({ trainee: traineeId, score: { $ne: null } }).select('score').lean();
  if (!scored.length) return null;
  return scored.reduce((a, l) => a + l.score, 0) / scored.length;
}

export async function getCheckpoint(traineeId) {
  return Assessment.findOne({ trainee: traineeId, kind: 'checkpoint' }).lean();
}

export function velocity(baseline, checkpointTotal) {
  if (checkpointTotal == null) return null;
  return Math.round(((checkpointTotal - baseline) / (100 - baseline)) * 1000) / 10;
}

// band needs at least a checkpoint mark to mean anything (SPEC.md §2:
// "re-weight over the components that actually have marks" — with only the
// log component available pre-assessment, a band letter would be noise).
export function band(baseline, checkpointTotal) {
  const v = velocity(baseline, checkpointTotal);
  if (v == null) return null;
  if (checkpointTotal >= 75 && v >= 55) return 'A';
  if (checkpointTotal >= 60) return 'B';
  if (checkpointTotal >= 45) return 'C';
  return 'D';
}

export function podNumber(podDoc) {
  return Number(String(podDoc.name).replace(/\D/g, ''));
}
