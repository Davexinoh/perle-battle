import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/task.js";
import annotateRoutes from "./routes/annotate.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import battleRoutes from "./routes/battle.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/ping", (_, res) => res.json({ status: "ok", ts: Date.now() }));

app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/annotate", annotateRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/battle", battleRoutes);

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Perle Battle server running on port ${PORT}`));
}).catch(err => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});
