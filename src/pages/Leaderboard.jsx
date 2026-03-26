import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import LeaderboardRow from "../components/LeaderboardRow";

export default function Leaderboard() {
  const [tab, setTab] = useState("daily");
  const [daily, setDaily] = useState(null);
  const [alltime, setAlltime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [d, a] = await Promise.all([api.getDaily(), api.getAllTime()]);
      setDaily(d);
      setAlltime(a);
    } catch (err) {
      setError("Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }

  const current = tab === "daily" ? daily : alltime;
  const entries = current?.leaderboard ?? [];

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: "var(--text)" }}>
          Leaderboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
          Live rankings across all Perle Battle contributors.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 4, width: "fit-content" }}>
        {[["daily", "Today"], ["alltime", "All Time"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            style={{
              background: tab === val ? "var(--accent)" : "transparent",
              color: tab === val ? "#fff" : "var(--text-muted)",
              border: "none",
              padding: "7px 20px",
              borderRadius: "var(--radius-sm)",
              fontWeight: tab === val ? 600 : 400,
              fontSize: 13,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date label */}
      {tab === "daily" && daily?.date && (
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>
          {daily.date}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : error ? (
        <div style={{ color: "var(--red)", fontSize: 14 }}>{error}</div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 28px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No annotations yet {tab === "daily" ? "today" : ""}. Be the first!
          </p>
          <Link to="/" style={{ display: "inline-block", marginTop: 20 }}>
            <button className="btn btn-primary">Take the challenge</button>
          </Link>
        </div>
      ) : (
        <div className="card">
          {entries.map((entry, i) => (
            <LeaderboardRow key={entry.username} rank={i + 1} entry={entry} />
          ))}
        </div>
      )}

      {/* Refresh */}
      {!loading && entries.length > 0 && (
        <button
          className="btn btn-ghost"
          onClick={load}
          style={{ marginTop: 20, fontSize: 13 }}
        >
          ↻ Refresh
        </button>
      )}
    </div>
  );
}
