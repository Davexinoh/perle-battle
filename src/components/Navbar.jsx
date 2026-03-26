import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      borderBottom: "1px solid var(--border)",
      background: "rgba(12,12,16,0.9)",
      backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div className="container-wide" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c6af7, #a394fa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
          }}>P</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
            Perle <span style={{ color: "var(--accent)" }}>Battle</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavLink to="/" active={isActive("/")}>Challenge</NavLink>
          <NavLink to="/leaderboard" active={isActive("/leaderboard")}>Leaderboard</NavLink>
        </div>

        {/* Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <span style={{
                fontSize: 13, color: "var(--text-muted)",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                padding: "5px 12px", borderRadius: 20,
              }}>
                @{user.username}
              </span>
              <button className="btn btn-ghost" style={{ padding: "7px 16px", fontSize: 13 }} onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn btn-ghost" style={{ padding: "7px 16px", fontSize: 13 }}>Sign in</button>
              </Link>
              <Link to="/register">
                <button className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 13 }}>Sign up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to}>
      <button style={{
        background: "none", border: "none",
        color: active ? "var(--text)" : "var(--text-muted)",
        fontWeight: active ? 600 : 400,
        fontSize: 14, padding: "6px 14px",
        borderRadius: "var(--radius-sm)",
        background: active ? "var(--bg-card)" : "transparent",
        transition: "all 0.15s",
      }}>{children}</button>
    </Link>
  );
}
