import express from "express";
import redis from "../lib/redis.js";

const router = express.Router();

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

async function getSession(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const username = await redis.get(`session:${token}`);
  return username || null;
}

function computeScore(selected, correct, justification) {
  const isCorrect = selected === correct;
  const correctnessScore = isCorrect ? 60 : 15;

  const jLen = Math.min(justification.trim().length, 400);
  const depthScore = Math.floor((jLen / 400) * 20);

  // Keyword-based domain/clarity scoring (simple heuristic)
  const keywords = ["because", "however", "evidence", "accurate", "risk", "harm",
    "safety", "reasoning", "incorrect", "misleading", "better", "worse",
    "addresses", "fails", "explains", "lacks", "provides", "avoids"];
  const found = keywords.filter(k => justification.toLowerCase().includes(k)).length;
  const expertiseScore = Math.min(10, found * 2);
  const clarityScore = justification.trim().split(/\s+/).length >= 15 ? 10 : 5;

  return {
    total: Math.min(100, correctnessScore + depthScore + expertiseScore + clarityScore),
    breakdown: {
      correctness: correctnessScore,
      depth: depthScore,
      expertise: expertiseScore,
      clarity: clarityScore,
    },
    isCorrect,
  };
}

function getTier(score) {
  if (score >= 80) return "EXPERT";
  if (score >= 55) return "PROFICIENT";
  return "DEVELOPING";
}

// POST /api/annotate/submit
router.post("/submit", async (req, res) => {
  try {
    const username = await getSession(req);
    if (!username) return res.status(401).json({ error: "Not authenticated" });

    const { selected, justification, date } = req.body;
    if (!selected || !justification || !date)
      return res.status(400).json({ error: "Missing fields" });

    const dateKey = getTodayKey();
    if (date !== dateKey)
      return res.status(400).json({ error: "Task date mismatch" });

    // Prevent duplicate submissions
    const existingKey = `score:${username}:${dateKey}`;
    const existing = await redis.get(existingKey);
    if (existing) return res.status(409).json({ error: "Already submitted today" });

    // Get today's task (with correct answer)
    const taskRaw = await redis.get(`task:${dateKey}`);
    if (!taskRaw) return res.status(404).json({ error: "Task not found" });
    const task = typeof taskRaw === "string" ? JSON.parse(taskRaw) : taskRaw;

    const { total, breakdown, isCorrect } = computeScore(selected, task.correct, justification);
    const tier = getTier(total);

    const result = {
      username,
      score: total,
      tier,
      breakdown,
      isCorrect,
      selected,
      correct: task.correct,
      explanation: task.explanation,
      justification,
      date: dateKey,
      submittedAt: Date.now(),
    };

    // Store result
    await redis.set(existingKey, JSON.stringify(result), { ex: 60 * 60 * 24 * 30 });

    // Update leaderboards
    await redis.zadd(`leaderboard:daily:${dateKey}`, { score: total, member: username });
    await redis.zincrby("leaderboard:alltime", total, username);

    // Update user stats
    const userRaw = await redis.get(`user:${username}`);
    if (userRaw) {
      const user = typeof userRaw === "string" ? JSON.parse(userRaw) : userRaw;
      user.totalPoints = (user.totalPoints || 0) + total;
      user.annotationCount = (user.annotationCount || 0) + 1;
      await redis.set(`user:${username}`, JSON.stringify(user));
    }

    return res.json(result);
  } catch (err) {
    console.error("Submit error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/annotate/status
router.get("/status", async (req, res) => {
  try {
    const username = await getSession(req);
    if (!username) return res.status(401).json({ error: "Not authenticated" });

    const dateKey = getTodayKey();
    const existing = await redis.get(`score:${username}:${dateKey}`);
    if (existing) {
      const result = typeof existing === "string" ? JSON.parse(existing) : existing;
      return res.json({ submitted: true, result });
    }
    return res.json({ submitted: false });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
