import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import ScoreBar from "../components/ScoreBar";

const TIER_CLASS = { EXPERT: "badge-expert", PROFICIENT: "badge-proficient", DEVELOPING: "badge-developing" };
const TIER_COLOR = { EXPERT: "var(--green)", PROFICIENT: "var(--yellow)", DEVELOPING: "var(--red)" };

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState("loading"); // loading | task | annotate | submitting | result | already_done
  const [task, setTask] = useState(null);
  const [selected, setSelected] = useState(null);
  const [justification, setJustification] = useState("");
  const [result, setResult] = useState(null);
  const [battleId, setBattleId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadTask(); }, []);

  async function loadTask() {
    try {
      const [taskData, status] = await Promise.all([api.getTask(), api.getStatus()]);
      setTask(taskData);
      if (status.submitted) {
        navigate("/result");
      } else {
        setPhase("task");
      }
    } catch (err) {
      setError("Failed to load today's task. Please refresh.");
      setPhase("task");
    }
  }

  async function handleSubmit() {
    if (!selected || justification.trim().length < 20) return;
    setPhase("submitting");
    try {
      await api.submit({ selected, justification, date: task.date });
      navigate("/result");
    } catch (err) {
      setError(err.message);
      setPhase("annotate");
    }
  }

  async function handleCreateBattle() {
    try {
      const { battleId } = await api.createBattle();
      setBattleId(battleId);
    } catch (err) {
      setError(err.message);
    }
  }

  function copyBattleLink() {
    const url = `${window.location.origin}/battle/${battleId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── LOADING ──
  if (phase === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading today's challenge…</span>
      </div>
    </div>
  );

  // ── SUBMITTING ──
  if (phase === "submitting") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Scoring your annotation…</span>
      </div>
    </div>
  );

  // ── TASK + ANNOTATE ──
  if (phase === "task" || phase === "annotate") return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--red)", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span className="badge badge-domain">{task?.domain}</span>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{task?.date}</span>
        </div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>
          Today's Annotation Challenge
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}>
          Pick the better AI response and explain your reasoning to earn points.
        </p>
      </div>

      {/* Prompt */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>
          User Prompt
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text)" }}>{task?.prompt}</p>
      </div>

      {/* Responses */}
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>
        Select the better response
      </div>

      {["A", "B"].map(opt => {
        const isSelected = selected === opt;
        return (
          <div
            key={opt}
            onClick={() => { setSelected(opt); setPhase("annotate"); }}
            style={{
              border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
              background: isSelected ? "rgba(124,106,247,0.06)" : "var(--bg-card)",
              borderRadius: "var(--radius)",
              padding: "20px 24px",
              marginBottom: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                background: isSelected ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                color: isSelected ? "#fff" : "var(--text-muted)",
                flexShrink: 0,
              }}>{opt}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "var(--accent)" : "var(--text-muted)" }}>
                Response {opt}
              </span>
              {isSelected && <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent)" }}>Selected ✓</span>}
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: isSelected ? "var(--text)" : "var(--text-muted)" }}>
              {opt === "A" ? task?.responseA : task?.responseB}
            </p>
          </div>
        );
      })}

      {/* Justification */}
      {phase === "annotate" && (
        <div className="card fade-up" style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>
            Justify your choice
          </div>
          <textarea
            className="input"
            style={{ resize: "vertical", minHeight: 110, lineHeight: 1.7 }}
            placeholder="Explain why this response is better — consider accuracy, safety, helpfulness, and any potential harms…"
            value={justification}
            onChange={e => setJustification(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <span style={{ fontSize: 12, color: justification.length >= 20 ? "var(--text-dim)" : "var(--red)" }}>
              {justification.length} / 400 chars {justification.length < 20 ? "(min 20)" : "✓"}
            </span>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={justification.trim().length < 20}
            >
              Submit annotation
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── RESULT ──
  if (phase === "result" && result) {
    const tier = result.tier;
    return (
      <div className="container fade-up" style={{ paddingTop: 40, paddingBottom: 60 }}>

        {/* Score hero */}
        <div className="card" style={{ marginBottom: 16, textAlign: "center", padding: "40px 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 16 }}>
            Your score
          </div>
          <div style={{
            fontSize: 80, fontWeight: 800, lineHeight: 1,
            fontFamily: "Syne, sans-serif",
            color: TIER_COLOR[tier],
            textShadow: `0 0 40px ${TIER_COLOR[tier]}40`,
          }}>
            {result.score}
          </div>
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <ScoreBar value={result.score} color={TIER_COLOR[tier]} />
          </div>
          <span className={`badge ${TIER_CLASS[tier]}`} style={{ marginTop: 8 }}>{tier}</span>
        </div>

        {/* Breakdown + Feedback */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 16 }}>
              Breakdown
            </div>
            {[
              ["Correctness", result.breakdown?.correctness ?? (result.isCorrect ? 60 : 15), 60],
              ["Depth", result.breakdown?.depth ?? 0, 20],
              ["Expertise", result.breakdown?.expertise ?? 0, 10],
              ["Clarity", result.breakdown?.clarity ?? 0, 10],
            ].map(([label, val, max]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 }}>
                  <span>{label}</span>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>{val}/{max}</span>
                </div>
                <ScoreBar value={val} max={max} />
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 16 }}>
              Verdict
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: "3px 10px",
                borderRadius: 20,
                background: result.isCorrect ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                color: result.isCorrect ? "var(--green)" : "var(--red)",
              }}>
                {result.isCorrect ? "✓ Correct" : "✗ Incorrect"}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                Correct: Response {result.correct}
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-muted)", margin: 0 }}>
              {result.explanation}
            </p>
          </div>
        </div>

        {/* Battle */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>
            Challenge someone
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.7 }}>
            Generate a battle link — your opponent takes the same task and scores are compared head-to-head.
          </p>
          {!battleId ? (
            <button className="btn btn-outline" onClick={handleCreateBattle}>
              Generate battle link
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="input"
                readOnly
                value={`${window.location.origin}/battle/${battleId}`}
                style={{ flex: 1, color: "var(--text-muted)", fontSize: 13 }}
              />
              <button className="btn btn-primary" onClick={copyBattleLink} style={{ flexShrink: 0 }}>
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>
          )}
          {error && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>

        {/* User stats */}
        <div className="card" style={{ display: "flex", gap: 32 }}>
          {[
            ["Total points", user?.totalPoints ?? 0],
            ["Annotations", user?.annotationCount ?? 0],
            ["Today's score", result.score],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Syne, sans-serif", color: "var(--accent)" }}>{val}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
