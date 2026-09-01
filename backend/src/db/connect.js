import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export async function connectDB() {
  if (!process.env.MONGO_URL) throw new Error('MONGO_URL is not set');
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: 'neev_tracker',
    serverSelectionTimeoutMS: 10000,
  });
  return mongoose.connection;
}
