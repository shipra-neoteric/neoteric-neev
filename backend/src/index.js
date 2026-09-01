import "dotenv/config";
import cors from "cors";
import express from "express";
import assessmentsRoutes from "./routes/assessments.js";
import attendanceRoutes from "./routes/attendance.js";
import batchesRoutes from "./routes/batches.js";
import logsRoutes from "./routes/logs.js";
import traineesRoutes from "./routes/trainees.js";
import { connectDB } from "./db/connect.js";
import { seedIfEmpty } from "./db/seed.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/trainees", traineesRoutes);
app.use("/api/batches", batchesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/assessments", assessmentsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 4000;

connectDB()
  .then(() => seedIfEmpty())
  .then(() => {
    app.listen(port, () => {
      console.log(`NEEV Tracker API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start: could not connect to MongoDB", err);
    process.exit(1);
  });
