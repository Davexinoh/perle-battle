import express from "express";
import { getDB } from "../lib/db.js";

const router = express.Router();

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

async function getSession(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const session = await getDB().collection("sessions").findOne({ token });
  return session?.username || null;
}

function computeScore(selected, correct, justification) {
  const isCorrect = selected === correct;
  const correctnessScore = isCorrect ? 60 : 15;

  const jLen = Math.min(justification.trim().length, 400);
  const depthScore = Math.floor((jLen / 400) * 20);

  const keywords = ["because", "however", "evidence", "accurate", "risk", "harm",
    "safety", "reasoning", "incorrect", "misleading", "better", "worse",
    "addresses", "fails", "explains", "lacks", "provides", "avoids"];
  const found = keywords.filter(k => justification.toLowerCase().includes(k)).length;
  const expertiseScore = Math.min(10, found * 2);
  const clarityScore = justification.trim().split(/\s+/).length >= 15 ? 10 : 5;

  return {
    total: Math.min(100, correctnessScore + depthScore + expertiseScore + clarityScore),
    breakdown: { correctness: correctnessScore, depth: depthScore, expertise: expertiseScore, clarity: clarityScore },
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

    const db = getDB();

    // Prevent duplicate submissions
    const existing = await db.collection("scores").findOne({ username, date: dateKey });
    if (existing) return res.status(409).json({ error: "Already submitted today" });

    // Get today's task with correct answer
    const task = await db.collection("tasks").findOne({ date: dateKey });
    if (!task) return res.status(404).json({ error: "Task not found" });

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
      domain: task.domain,
      date: dateKey,
      submittedAt: new Date(),
    };

    await db.collection("scores").insertOne(result);

    // Update user stats
    await db.collection("users").updateOne(
      { username },
      { $inc: { totalPoints: total, annotationCount: 1 } }
    );

    const { _id, ...safeResult } = result;
    return res.json(safeResult);
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
    const db = getDB();
    const existing = await db.collection("scores").findOne({ username, date: dateKey });

    if (existing) {
      const { _id, ...result } = existing;
      return res.json({ submitted: true, result });
    }
    return res.json({ submitted: false });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
