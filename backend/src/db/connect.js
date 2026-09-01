import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export async function connectDB() {
  if (!process.env.MONGO_URL) throw new Error('MONGO_URL is not set');
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: 'neev_tracker',
    serverSelectionTimeoutMS: 10000,
  });

  // The assessment schema's unique index widened from {trainee,kind} to
  // {trainee,kind,department} to allow one drill mark per department. Mongoose
  // doesn't drop superseded indexes on its own — do it once, idempotently.
  try {
    await mongoose.connection.collection('assessments').dropIndex('trainee_1_kind_1');
  } catch {
    // already dropped, or never existed — nothing to do
  }

  return mongoose.connection;
}
