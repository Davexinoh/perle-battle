export default function ScoreBar({ value, max = 100, color = "var(--accent)" }) {
  return (
    <div className="score-bar-track">
      <div className="score-bar-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}
