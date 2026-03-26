export default function TaskCard({ task, selected, onSelect }) {
  return (
    <div>
      {/* Prompt */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 1,
          color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12,
        }}>
          User Prompt
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text)", margin: 0 }}>
          {task.prompt}
        </p>
      </div>

      {/* Response options */}
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: 1,
        color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12,
      }}>
        Select the better response
      </div>

      {["A", "B"].map((opt) => {
        const isSelected = selected === opt;
        return (
          <div
            key={opt}
            onClick={() => onSelect(opt)}
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
            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                background: isSelected ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                color: isSelected ? "#fff" : "var(--text-muted)",
              }}>
                {opt}
              </div>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: isSelected ? "var(--accent)" : "var(--text-muted)",
              }}>
                Response {opt}
              </span>
              {isSelected && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent)" }}>
                  Selected ✓
                </span>
              )}
            </div>

            {/* Response text */}
            <p style={{
              margin: 0, fontSize: 14, lineHeight: 1.85,
              color: isSelected ? "var(--text)" : "var(--text-muted)",
            }}>
              {opt === "A" ? task.responseA : task.responseB}
            </p>
          </div>
        );
      })}
    </div>
  );
}
