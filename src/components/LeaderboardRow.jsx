export default function LeaderboardRow({ rank, entry }) {
  const tierClass = {
    EXPERT: "badge-expert",
    PROFICIENT: "badge-proficient",
    DEVELOPING: "badge-developing",
  }[entry.tier] || "badge-developing";

  const rankColor = rank === 1 ? "#fbbf24" : rank === 2 ? "#94a3b8" : rank === 3 ? "#cd7f32" : "var(--text-dim)";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "14px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ width: 28, textAlign: "center", fontWeight: 700, color: rankColor, fontSize: rank <= 3 ? 18 : 14 }}>
        {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : rank}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>@{entry.username}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {entry.annotationCount} annotation{entry.annotationCount !== 1 ? "s" : ""}
        </div>
      </div>
      <span className={`badge ${tierClass}`}>{entry.tier}</span>
      <div style={{ fontWeight: 700, fontSize: 20, color: "var(--accent)", minWidth: 44, textAlign: "right" }}>
        {entry.score}
      </div>
    </div>
  );
}
