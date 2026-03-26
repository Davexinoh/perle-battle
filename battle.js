import express from "express";
import { v4 as uuidv4 } from "uuid";
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

// POST /api/battle/create — challenger creates a battle link after submitting
router.post("/create", async (req, res) => {
  try {
    const username = await getSession(req);
    if (!username) return res.status(401).json({ error: "Not authenticated" });

    const dateKey = getTodayKey();
    const scoreRaw = await redis.get(`score:${username}:${dateKey}`);
    if (!scoreRaw) return res.status(400).json({ error: "Submit today's annotation first" });

    const challengerResult = typeof scoreRaw === "string" ? JSON.parse(scoreRaw) : scoreRaw;

    const battleId = uuidv4().slice(0, 8);
    const battle = {
      id: battleId,
      challenger: username,
      challengerScore: challengerResult.score,
      challengerTier: challengerResult.tier,
      opponent: null,
      opponentScore: null,
      opponentTier: null,
      date: dateKey,
      createdAt: Date.now(),
      resolved: false,
    };

    await redis.set(`battle:${battleId}`, JSON.stringify(battle), { ex: 60 * 60 * 48 }); // 48hr TTL

    return res.json({ battleId, battleUrl: `/battle/${battleId}` });
  } catch (err) {
    console.error("Battle create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/battle/:id — get battle state
router.get("/:id", async (req, res) => {
  try {
    const raw = await redis.get(`battle:${req.params.id}`);
    if (!raw) return res.status(404).json({ error: "Battle not found or expired" });
    const battle = typeof raw === "string" ? JSON.parse(raw) : raw;
    return res.json(battle);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/battle/:id/accept — opponent accepts and submits their score
router.post("/:id/accept", async (req, res) => {
  try {
    const username = await getSession(req);
    if (!username) return res.status(401).json({ error: "Not authenticated" });

    const raw = await redis.get(`battle:${req.params.id}`);
    if (!raw) return res.status(404).json({ error: "Battle not found or expired" });

    const battle = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (battle.challenger === username)
      return res.status(400).json({ error: "You can't battle yourself" });

    if (battle.resolved)
      return res.status(400).json({ error: "Battle already resolved" });

    // Get opponent's score for that day
    const opponentScoreRaw = await redis.get(`score:${username}:${battle.date}`);
    if (!opponentScoreRaw)
      return res.status(400).json({ error: "You must complete today's annotation first" });

    const opponentResult = typeof opponentScoreRaw === "string"
      ? JSON.parse(opponentScoreRaw)
      : opponentScoreRaw;

    battle.opponent = username;
    battle.opponentScore = opponentResult.score;
    battle.opponentTier = opponentResult.tier;
    battle.resolved = true;
    battle.resolvedAt = Date.now();
    battle.winner = battle.challengerScore >= battle.opponentScore
      ? battle.challenger
      : battle.opponent;

    await redis.set(`battle:${req.params.id}`, JSON.stringify(battle), { ex: 60 * 60 * 48 });

    return res.json(battle);
  } catch (err) {
    console.error("Battle accept error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
