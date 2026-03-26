import express from "express";
import redis from "../lib/redis.js";
import { generateDailyTask, getTodayDomain } from "../lib/gemini.js";

const router = express.Router();

function getTodayKey() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

// GET /api/task/today
router.get("/today", async (req, res) => {
  try {
    const dateKey = getTodayKey();
    const cacheKey = `task:${dateKey}`;

    // Return cached task if exists
    const cached = await redis.get(cacheKey);
    if (cached) {
      const task = typeof cached === "string" ? JSON.parse(cached) : cached;
      // Never expose correct answer to client
      const { correct, explanation, ...clientTask } = task;
      return res.json({ ...clientTask, date: dateKey });
    }

    // Generate new task
    const domain = getTodayDomain();
    const task = await generateDailyTask(domain);

    // Cache until end of day (86400 seconds)
    await redis.set(cacheKey, JSON.stringify(task), { ex: 86400 });

    const { correct, explanation, ...clientTask } = task;
    return res.json({ ...clientTask, date: dateKey });
  } catch (err) {
    console.error("Task generation error:", err);
    return res.status(500).json({ error: "Failed to generate task" });
  }
});

export default router;
