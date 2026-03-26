import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import ScoreBar from "../components/ScoreBar";

const TIER_COLOR = {
  EXPERT: "var(--green)",
  PROFICIENT: "var(--yellow)",
  DEVELOPING: "var(--red)",
};
const TIER_CLASS = {
  EXPERT: "badge-expert",
  PROFICIENT: "badge-proficient",
  DEVELOPING: "badge-developing",
};

export default function Result() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [battleId, setBattleId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [battleLoading, setBattleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const status = await api.getStatus();
        if (!status.submitted) {
          navigate("/");
          return;
        }
        setResult(status.result);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  async function handleCreateBattle() {
    setBattleLoading(true);
    setError("");
    try {
      const { battleId } = await api.createBattle();
      setBattleId(battleId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBattleLoading(false);
    }
  }

  function copyBattleLink() {
    navigator.clipboard.writeText(`${window.location.origin}/battle/${battleId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  if (!result) return null;

  const tier = result.tier;
  const tierColor = TIER_COLOR[tier];

  return (
    <div className="container fade-up" style={{ paddingTop: 40, paddingBottom: 60 }}>

      {/* Page title */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span className="badge badge-domain">{result.domain || "Today"}</span>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{result.date}</span>
        </div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: "var(--text)" }}>
          Your Result
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
          Here's how you did on today's annotation challenge.
        </p>
      </div>

      {/* Score hero */}
      <div className="card" style={{ marginBottom: 16, padding: "44px 32px", textAlign: "center" }}>
        <div style={{
          fontSize: 96, fontWeight: 800, lineHeight: 1,
          fontFamily: "Syne, sans-serif",
          color: tierColor,
          textShadow: `0 0 60px ${tierColor}40`,
        }}>
          {result.score}
        </div>
        <div style={{ maxWidth: 300, margin: "20px auto 0" }}>
          <ScoreBar value={result.score} color={tierColor} />
        </div>
        <div style={{ marginTop: 16 }}>
          <span className={`badge ${TIER_CLASS[tier]}`} style={{ fontSize: 12, padding: "5px 14px" }}>
            {tier}
          </span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 16 }}>
          {tier === "EXPERT" && "Outstanding annotation. You clearly understood the nuance."}
          {tier === "PROFICIENT" && "Solid work. Good reasoning with room to go deeper."}
          {tier === "DEVELOPING" && "Keep going. Every annotation sharpens your judgment."}
        </p>
      </div>

      {/* Breakdown + Verdict */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Breakdown */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 18 }}>
            Score breakdown
          </div>
          {[
            ["Correctness", result.breakdown?.correctness ?? (result.isCorrect ? 60 : 15), 60],
            ["Depth", result.breakdown?.depth ?? 0, 20],
            ["Expertise", result.breakdown?.expertise ?? 0, 10],
            ["Clarity", result.breakdown?.clarity ?? 0, 10],
          ].map(([label, val, max]) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                <span>{label}</span>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>{val}<span style={{ color: "var(--text-dim)", fontWeight: 400 }}>/{max}</span></span>
              </div>
              <ScoreBar value={val} max={max} />
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 18 }}>
            Verdict
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
              background: result.isCorrect ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: result.isCorrect ? "var(--green)" : "var(--red)",
            }}>
              {result.isCorrect ? "✓ Correct choice" : "✗ Incorrect choice"}
            </span>
          </div>

          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>
            You picked Response {result.selected} — correct was Response {result.correct}
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-muted)", margin: "12px 0 0" }}>
            {result.explanation}
          </p>
        </div>
      </div>

      {/* Your justification */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>
          Your justification
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
          "{result.justification}"
        </p>
      </div>

      {/* Battle card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 8 }}>
          Challenge someone
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.7 }}>
          Think you can beat a friend? Send them your battle link — they take the same task and scores are compared head-to-head.
        </p>

        {!battleId ? (
          <button
            className="btn btn-outline"
            onClick={handleCreateBattle}
            disabled={battleLoading}
          >
            {battleLoading
              ? <span className="spinner" style={{ width: 14, height: 14 }} />
              : "⚔️ Generate battle link"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              readOnly
              value={`${window.location.origin}/battle/${battleId}`}
              style={{ flex: 1, fontSize: 13, color: "var(--text-muted)" }}
            />
            <button className="btn btn-primary" onClick={copyBattleLink} style={{ flexShrink: 0 }}>
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        )}
        {error && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</p>}
      </div>

      {/* Stats */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 18 }}>
          Your stats
        </div>
        <div style={{ display: "flex", gap: 40 }}>
          {[
            ["Total points", user?.totalPoints ?? 0],
            ["Annotations", user?.annotationCount ?? 0],
            ["Today's score", result.score],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Syne, sans-serif", color: "var(--accent)" }}>{val}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/leaderboard">
          <button className="btn btn-primary">View leaderboard</button>
        </Link>
        <Link to="/">
          <button className="btn btn-ghost">Home</button>
        </Link>
      </div>
    </div>
  );
}
