import Batch from '../models/Batch.js';
import Day from '../models/Day.js';
import Person from '../models/Person.js';
import Pod from '../models/Pod.js';
import Trainee from '../models/Trainee.js';

// Fictional dev seed data — not real trainee records. Idempotent: skips entirely
// once a batch already exists (real data entry replaces this once trainee master
// maintenance screens exist).

const NAMES = ['Aditya Sharma', 'Rohit Yadav', 'Priyanshu Jain', 'Deepak Rathore',
  'Sandeep Kushwaha', 'Nikhil Tomar', 'Ankit Gupta', 'Shivam Dubey',
  'Ravi Parihar', 'Vishal Bhadauria', 'Manish Sen', 'Arjun Singh'];
const BRANCH = ['Civil — Govt Polytechnic Gwalior', 'Civil — MITS Polytechnic', 'Civil — Govt Polytechnic Morena',
  'Mechanical — Govt Polytechnic Gwalior', 'Civil — Govt Polytechnic Bhind', 'Civil — MITS Polytechnic',
  'Civil — Govt Polytechnic Gwalior', 'Electrical — Govt Polytechnic Gwalior', 'Civil — Govt Polytechnic Datia',
  'Civil — Govt Polytechnic Gwalior', 'Civil — Govt Polytechnic Shivpuri', 'Civil — MITS Polytechnic'];
const BUDDY_NAMES = ['S. Chauhan', 'M. Ahirwar', 'P. Dixit', 'K. Raghuvanshi'];
const BASE = [34, 52, 61, 28, 45, 58, 39, 66, 31, 48, 55, 42];

const DAYS = [
  ['D01', '2026-09-01', '1 Sep · Tue'], ['D02', '2026-09-02', '2 Sep · Wed'],
  ['D03', '2026-09-03', '3 Sep · Thu'], ['D04', '2026-09-04', '4 Sep · Fri'],
  ['D05', '2026-09-05', '5 Sep · Sat'], ['D06', '2026-09-07', '7 Sep · Mon'],
  ['D07', '2026-09-08', '8 Sep · Tue'], ['D08', '2026-09-09', '9 Sep · Wed'],
  ['D09', '2026-09-10', '10 Sep · Thu'], ['D10', '2026-09-11', '11 Sep · Fri'],
];

export async function seedIfEmpty() {
  if (await Batch.countDocuments()) return;

  const batch = await Batch.create({ slug: 'b1', name: '2026-01', startDate: new Date('2026-09-01'), status: 'active' });

  const buddyPersons = await Person.insertMany(
    BUDDY_NAMES.map((name) => ({ name, role: 'buddy' })));

  const pods = await Pod.insertMany(
    buddyPersons.map((buddy, i) => ({ batch: batch._id, name: `Pod ${i + 1}`, buddy: buddy._id })));

  const traineePersons = await Person.insertMany(
    NAMES.map((name) => ({ name, role: 'trainee' })));

  await Trainee.insertMany(NAMES.map((_, i) => ({
    code: 'T' + String(i + 1).padStart(2, '0'),
    person: traineePersons[i]._id,
    batch: batch._id,
    pod: pods[i % 4]._id,
    buddy: buddyPersons[i % 4]._id,
    branch: BRANCH[i],
    baselineScore: BASE[i],
    status: 'active',
  })));

  await Day.insertMany(DAYS.map(([code, date, label]) => ({
    batch: batch._id, code, date: new Date(date), label,
  })));

  console.log('Seeded dev data: 1 batch, 4 pods, 12 trainees, 10 days');
}

// Exported for routes that need the single seeded batch until multi-batch support exists.
export async function getDefaultBatch() {
  return Batch.findOne();
}
