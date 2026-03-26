import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import redis from "../lib/redis.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    if (username.length < 3 || username.length > 20)
      return res.status(400).json({ error: "Username must be 3–20 characters" });

    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ error: "Username can only contain letters, numbers, underscores" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    // Check if username taken
    const existing = await redis.get(`user:${username.toLowerCase()}`);
    if (existing) return res.status(409).json({ error: "Username already taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    const userData = {
      username,
      passwordHash,
      createdAt: Date.now(),
      totalPoints: 0,
      annotationCount: 0,
    };

    await redis.set(`user:${username.toLowerCase()}`, JSON.stringify(userData));

    // Create session
    const token = uuidv4();
    await redis.set(`session:${token}`, username.toLowerCase(), { ex: 60 * 60 * 24 * 7 }); // 7 days

    return res.json({ token, username });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const raw = await redis.get(`user:${username.toLowerCase()}`);
    if (!raw) return res.status(401).json({ error: "Invalid username or password" });

    const userData = typeof raw === "string" ? JSON.parse(raw) : raw;
    const valid = await bcrypt.compare(password, userData.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid username or password" });

    const token = uuidv4();
    await redis.set(`session:${token}`, username.toLowerCase(), { ex: 60 * 60 * 24 * 7 });

    return res.json({ token, username: userData.username });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) await redis.del(`session:${token}`);
  return res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });

    const username = await redis.get(`session:${token}`);
    if (!username) return res.status(401).json({ error: "Session expired" });

    const raw = await redis.get(`user:${username}`);
    if (!raw) return res.status(404).json({ error: "User not found" });

    const userData = typeof raw === "string" ? JSON.parse(raw) : raw;
    const { passwordHash, ...safe } = userData;

    return res.json(safe);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
