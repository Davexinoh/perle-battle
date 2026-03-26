import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import ScoreBar from "../components/ScoreBar";

const TIER_COLOR = { EXPERT: "var(--green)", PROFICIENT: "var(--yellow)", DEVELOPING: "var(--red)" };

export default function Battle() {
  const { id } = useParams();
  const { user } = useAuth();
  const [battle, setBattle] = useState(null);
  const [task, setTask] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | info | already_done | resolved | error
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const [b, t, status] = await Promise.all([
        api.getBattle(id),
        api.getTask(),
        api.getStatus(),
      ]);
      setBattle(b);
      setTask(t);

      if (b.resolved) {
        setPhase("resolved");
      } else if (b.challenger === user?.username?.toLowerCase()) {
        setPhase("own_battle");
      } else if (status.submitted) {
        // Opponent already did today's task — they can accept immediately
        setPhase("info");
      } else {
        // Opponent hasn't done today's task yet
        setPhase("needs_task");
      }
    } catch (err) {
      setError(err.message || "Battle not found or expired.");
      setPhase("error");
    }
  }

  async function handleAccept() {
    setAccepting(true);
    try {
      const updated = await api.acceptBattle(id);
      setBattle(updated);
      setPhase("resolved");
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  }

  // ── LOADING ──
  if (phase === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  // ── ERROR ──
  if (phase === "error") return (
    <div className="container" style={{ paddingTop: 60, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⚔️</div>
      <h2 style={{ fontFamily: "Syne, sans-serif", color: "var(--text)", marginBottom: 8 }}>Battle not found</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>{error}</p>
      <Link to="/"><button className="btn btn-primary">Go home</button></Link>
    </div>
  );

  // ── OWN BATTLE ──
  if (phase === "own_battle") return (
    <div className="container" style={{ paddingTop: 60, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>🔗</div>
      <h2 style={{ fontFamily: "Syne, sans-serif", color: "var(--text)", marginBottom: 8 }}>Your battle link</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        Share this link with someone. Once they accept, scores will be compared here.
      </p>
      <div style={{ display: "flex", gap: 10, maxWidth: 480, margin: "0 auto" }}>
        <input className="input" readOnly value={window.location.href} style={{ flex: 1, fontSize: 13 }} />
        <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
          Copy
        </button>
      </div>
      {battle && (
        <div className="card" style={{ marginTop: 32, maxWidth: 480, margin: "32px auto 0", textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>
            Battle status
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--yellow)", display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Waiting for opponent…</span>
          </div>
        </div>
      )}
    </div>
  );

  // ── NEEDS TASK FIRST ──
  if (phase === "needs_task") return (
    <div className="container" style={{ paddingTop: 60, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⚔️</div>
      <h2 style={{ fontFamily: "Syne, sans-serif", color: "var(--text)", marginBottom: 8 }}>
        @{battle?.challenger} challenged you!
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
        You need to complete today's annotation challenge first before accepting this battle.
        Your scores will then be compared automatically.
      </p>
      <Link to="/">
        <button className="btn btn-primary">Take today's challenge first</button>
      </Link>
    </div>
  );

  // ── INFO (can accept) ──
  if (phase === "info") return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="card fade-up" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", padding: "48px 36px" }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⚔️</div>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
          @{battle?.challenger} challenged you!
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
          Domain: <span className="badge badge-domain">{task?.domain}</span>
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          You've already completed today's annotation. Accept the battle to compare scores.
        </p>

        {error && (
          <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        <button className="btn btn-primary" onClick={handleAccept} disabled={accepting} style={{ width: "100%" }}>
          {accepting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Accept battle"}
        </button>
      </div>
    </div>
  );

  // ── RESOLVED ──
  if (phase === "resolved" && battle) {
    const cScore = battle.challengerScore;
    const oScore = battle.opponentScore;
    const isWinner = battle.winner === user?.username?.toLowerCase();
    const isDraw = cScore === oScore;

    return (
      <div className="container fade-up" style={{ paddingTop: 40, paddingBottom: 60 }}>

        {/* Winner banner */}
        <div style={{
          textAlign: "center", marginBottom: 32,
          padding: "32px 24px",
          background: isDraw ? "var(--bg-card)" : isWinner ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)",
          border: `1px solid ${isDraw ? "var(--border)" : isWinner ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
          borderRadius: "var(--radius)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {isDraw ? "🤝" : isWinner ? "🏆" : "💀"}
          </div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)" }}>
            {isDraw ? "It's a draw!" : isWinner ? "You won!" : `@${battle.winner} wins`}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            Battle on {battle.date}
          </p>
        </div>

        {/* Score comparison */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { label: battle.challenger, score: cScore, tier: battle.challengerTier },
            { label: battle.opponent, score: oScore, tier: battle.opponentTier },
          ].map(({ label, score, tier }) => (
            <div key={label} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>@{label}</div>
              <div style={{
                fontSize: 56, fontWeight: 800, fontFamily: "Syne, sans-serif",
                color: TIER_COLOR[tier] || "var(--accent)",
                textShadow: `0 0 30px ${TIER_COLOR[tier] || "var(--accent)"}40`,
              }}>{score}</div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <ScoreBar value={score} color={TIER_COLOR[tier]} />
              </div>
              <span className={`badge badge-${tier?.toLowerCase()}`}>{tier}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/"><button className="btn btn-primary">Home</button></Link>
          <Link to="/leaderboard"><button className="btn btn-ghost">Leaderboard</button></Link>
        </div>
      </div>
    );
  }

  return null;
}
