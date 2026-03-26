import express from "express";
import { getDB } from "../lib/db.js";
import { generateDailyTask, getTodayDomain } from "../lib/gemini.js";

const router = express.Router();

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

// GET /api/task/today
router.get("/today", async (req, res) => {
  try {
    const date = getTodayKey();
    const db = getDB();

    // Return cached task if exists
    const cached = await db.collection("tasks").findOne({ date });
    if (cached) {
      const { correct, explanation, _id, ...clientTask } = cached;
      return res.json({ ...clientTask });
    }

    // Generate new task
    const domain = getTodayDomain();
    const task = await generateDailyTask(domain);

    await db.collection("tasks").insertOne({ ...task, date });

    const { correct, explanation, _id, ...clientTask } = { ...task, date };
    return res.json(clientTask);
  } catch (err) {
    console.error("Task generation error:", err);
    return res.status(500).json({ error: "Failed to generate task" });
  }
});

export default router;
