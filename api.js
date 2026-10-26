/*
 * Capa de comunicación: el frontend habla con esta capa y no directamente
 * con la base de datos. Sustituye los métodos demo por endpoints de tu API.
 */
window.ForgeAPI = (() => {
  const cfg = window.FORGE_CONFIG || {};
  async function request(path, options = {}) {
    if (!cfg.API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
    const response = await fetch(`${cfg.API_BASE_URL.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "include"
    });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || `Error de API (${response.status})`);
    return body;
  }
  return {
    request,
    // Endpoints sugeridos. Deben implementarse y asegurarse en tu backend.
    login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    registerMember: data => request("/members/register", { method: "POST", body: JSON.stringify(data) }),
    getMe: () => request("/auth/me"),
    getDashboard: () => request("/dashboard"),
    getMembers: () => request("/members"),
    createEmployee: data => request("/employees", { method: "POST", body: JSON.stringify(data) }),
    updateMembership: (id, data) => request(`/memberships/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) })
  };
})();
