import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("perle-battle");
    console.log("Connected to MongoDB");

    // Indexes
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days
    await db.collection("scores").createIndex({ username: 1, date: 1 }, { unique: true });
    await db.collection("tasks").createIndex({ date: 1 }, { unique: true });
    await db.collection("battles").createIndex({ id: 1 }, { unique: true });
    await db.collection("battles").createIndex({ createdAt: 1 }, { expireAfterSeconds: 172800 }); // 48hr
  }
  return db;
}

export function getDB() {
  if (!db) throw new Error("DB not connected. Call connectDB first.");
  return db;
}
