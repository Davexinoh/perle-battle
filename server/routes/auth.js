import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../lib/db.js";

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

    const db = getDB();
    const existing = await db.collection("users").findOne({ username: username.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Username already taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      username: username.toLowerCase(),
      displayUsername: username,
      passwordHash,
      createdAt: new Date(),
      totalPoints: 0,
      annotationCount: 0,
    });

    const token = uuidv4();
    await db.collection("sessions").insertOne({
      token,
      username: username.toLowerCase(),
      createdAt: new Date(),
    });

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

    const db = getDB();
    const user = await db.collection("users").findOne({ username: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid username or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid username or password" });

    const token = uuidv4();
    await db.collection("sessions").insertOne({
      token,
      username: user.username,
      createdAt: new Date(),
    });

    return res.json({ token, username: user.displayUsername || user.username });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) await getDB().collection("sessions").deleteOne({ token });
  return res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });

    const db = getDB();
    const session = await db.collection("sessions").findOne({ token });
    if (!session) return res.status(401).json({ error: "Session expired" });

    const user = await db.collection("users").findOne({ username: session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { passwordHash, _id, ...safe } = user;
    return res.json(safe);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
