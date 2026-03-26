import express from "express";
import { getDB } from "../lib/db.js";

const router = express.Router();

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

// GET /api/leaderboard/daily
router.get("/daily", async (req, res) => {
  try {
    const date = getTodayKey();
    const db = getDB();

    const scores = await db.collection("scores")
      .find({ date })
      .sort({ score: -1 })
      .limit(20)
      .toArray();

    const leaderboard = scores.map(s => ({
      username: s.username,
      score: s.score,
      tier: s.tier,
      domain: s.domain,
    }));

    return res.json({ date, leaderboard });
  } catch (err) {
    console.error("Leaderboard daily error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/leaderboard/alltime
router.get("/alltime", async (req, res) => {
  try {
    const db = getDB();

    const users = await db.collection("users")
      .find({}, { projection: { username: 1, displayUsername: 1, totalPoints: 1, annotationCount: 1 } })
      .sort({ totalPoints: -1 })
      .limit(20)
      .toArray();

    const leaderboard = users.map(u => ({
      username: u.displayUsername || u.username,
      score: u.totalPoints || 0,
      annotationCount: u.annotationCount || 0,
      tier: u.totalPoints >= 400 ? "EXPERT" : u.totalPoints >= 200 ? "PROFICIENT" : "DEVELOPING",
    }));

    return res.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard alltime error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
