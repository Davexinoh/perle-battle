import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords don't match");
    setLoading(true);
    try {
      await register(form.username.trim(), form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c6af7, #a394fa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: "#fff",
            margin: "0 auto 16px",
          }}>P</div>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)" }}>
            Join Perle Battle
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            Create your account and start competing
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Username
              </label>
              <input
                className="input"
                name="username"
                value={form.username}
                onChange={update}
                placeholder="choose a username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
              />
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5 }}>
                3–20 chars, letters/numbers/underscores only
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Password
              </label>
              <input
                className="input"
                name="password"
                type="password"
                value={form.password}
                onChange={update}
                placeholder="at least 6 characters"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Confirm password
              </label>
              <input
                className="input"
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={update}
                placeholder="repeat your password"
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: "var(--radius-sm)", padding: "10px 14px",
                color: "var(--red)", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Create account"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
