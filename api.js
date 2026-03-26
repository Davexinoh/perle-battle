const BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("perle_token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  register: (username, password) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  logout: () =>
    request("/auth/logout", { method: "POST" }),

  me: () => request("/auth/me"),

  // Task
  getTask: () => request("/task/today"),

  // Annotate
  submit: (payload) =>
    request("/annotate/submit", { method: "POST", body: JSON.stringify(payload) }),

  getStatus: () => request("/annotate/status"),

  // Leaderboard
  getDaily: () => request("/leaderboard/daily"),
  getAllTime: () => request("/leaderboard/alltime"),

  // Battle
  createBattle: () =>
    request("/battle/create", { method: "POST" }),

  getBattle: (id) => request(`/battle/${id}`),

  acceptBattle: (id) =>
    request(`/battle/${id}/accept`, { method: "POST" }),
};
