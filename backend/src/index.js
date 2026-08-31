import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`NEEV Tracker API listening on port ${port}`);
});
