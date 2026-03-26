import express from "express";
import redis from "../lib/redis.js";

const router = express.Router();

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

async function enrichLeaderboard(entries) {
  return await Promise.all(
    entries.map(async ({ score, member }) => {
      const userRaw = await redis.get(`user:${member}`);
      const user = userRaw
        ? (typeof userRaw === "string" ? JSON.parse(userRaw) : userRaw)
        : {};
      return {
        username: user.username || member,
        score: Math.round(score),
        annotationCount: user.annotationCount || 0,
        tier: score >= 80 ? "EXPERT" : score >= 55 ? "PROFICIENT" : "DEVELOPING",
      };
    })
  );
}

// GET /api/leaderboard/daily
router.get("/daily", async (req, res) => {
  try {
    const dateKey = getTodayKey();
    const entries = await redis.zrange(`leaderboard:daily:${dateKey}`, 0, 19, {
      rev: true,
      withScores: true,
    });

    const parsed = [];
    for (let i = 0; i < entries.length; i += 2) {
      parsed.push({ member: entries[i], score: parseFloat(entries[i + 1]) });
    }

    const enriched = await enrichLeaderboard(parsed);
    return res.json({ date: dateKey, leaderboard: enriched });
  } catch (err) {
    console.error("Leaderboard daily error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/leaderboard/alltime
router.get("/alltime", async (req, res) => {
  try {
    const entries = await redis.zrange("leaderboard:alltime", 0, 19, {
      rev: true,
      withScores: true,
    });

    const parsed = [];
    for (let i = 0; i < entries.length; i += 2) {
      parsed.push({ member: entries[i], score: parseFloat(entries[i + 1]) });
    }

    const enriched = await enrichLeaderboard(parsed);
    return res.json({ leaderboard: enriched });
  } catch (err) {
    console.error("Leaderboard alltime error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
