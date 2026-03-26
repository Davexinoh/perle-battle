import express from "express";
import { v4 as uuidv4 } from "uuid";
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

// POST /api/battle/create
router.post("/create", async (req, res) => {
  try {
    const username = await getSession(req);
    if (!username) return res.status(401).json({ error: "Not authenticated" });

    const dateKey = getTodayKey();
    const db = getDB();

    const score = await db.collection("scores").findOne({ username, date: dateKey });
    if (!score) return res.status(400).json({ error: "Submit today's annotation first" });

    const battleId = uuidv4().slice(0, 8);
    const battle = {
      id: battleId,
      challenger: username,
      challengerScore: score.score,
      challengerTier: score.tier,
      opponent: null,
      opponentScore: null,
      opponentTier: null,
      date: dateKey,
      createdAt: new Date(),
      resolved: false,
      winner: null,
    };

    await db.collection("battles").insertOne(battle);
    return res.json({ battleId, battleUrl: `/battle/${battleId}` });
  } catch (err) {
    console.error("Battle create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/battle/:id
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const battle = await db.collection("battles").findOne({ id: req.params.id });
    if (!battle) return res.status(404).json({ error: "Battle not found or expired" });
    const { _id, ...safe } = battle;
    return res.json(safe);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/battle/:id/accept
router.post("/:id/accept", async (req, res) => {
  try {
    const username = await getSession(req);
    if (!username) return res.status(401).json({ error: "Not authenticated" });

    const db = getDB();
    const battle = await db.collection("battles").findOne({ id: req.params.id });
    if (!battle) return res.status(404).json({ error: "Battle not found or expired" });
    if (battle.challenger === username) return res.status(400).json({ error: "You can't battle yourself" });
    if (battle.resolved) return res.status(400).json({ error: "Battle already resolved" });

    const opponentScore = await db.collection("scores").findOne({ username, date: battle.date });
    if (!opponentScore) return res.status(400).json({ error: "You must complete today's annotation first" });

    const winner = battle.challengerScore >= opponentScore.score ? battle.challenger : username;

    await db.collection("battles").updateOne(
      { id: req.params.id },
      {
        $set: {
          opponent: username,
          opponentScore: opponentScore.score,
          opponentTier: opponentScore.tier,
          resolved: true,
          resolvedAt: new Date(),
          winner,
        }
      }
    );

    const updated = await db.collection("battles").findOne({ id: req.params.id });
    const { _id, ...safe } = updated;
    return res.json(safe);
  } catch (err) {
    console.error("Battle accept error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
