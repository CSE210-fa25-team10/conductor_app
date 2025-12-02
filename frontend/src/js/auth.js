// Simple client-side auth helper for demo/navigation in the frontend
// Stores a small 'user' object in localStorage so pages can decide where to go

function setAuth(user) {
  if (!user) return;
  try {
    localStorage.setItem("conductor_user", JSON.stringify(user));
  } catch (e) {
    console.warn("Failed to persist auth", e);
  }
}

function getAuth() {
  try {
    const raw = localStorage.getItem("conductor_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearAuth() {
  try { localStorage.removeItem("conductor_user"); } catch (e) {}
}

function requireAuth(redirect = true) {
  const u = getAuth();
  if (!u && redirect) {
    if (typeof window !== "undefined") window.location.href = "../auth/login.html";
  }
  return u;
}

function requireRole(role, redirect = true) {
  const u = getAuth();
  if (!u || u.role !== role) {
    if (redirect && typeof window !== "undefined") {
      // go to user's correct dashboard if present, otherwise login
      if (u && u.role) {
        const target = u.role === "instructor" ? "../instructor/dashboard.html" : "../student/dashboard.html";
        window.location.href = target;
      } else {
        window.location.href = "../auth/login.html";
      }
    }
    return null;
  }
  return u;
}

// Expose for browser
if (typeof window !== "undefined") {
  window.__ConductorAuth = { setAuth, getAuth, clearAuth, requireAuth, requireRole };
}

if (typeof module !== "undefined") {
  module.exports = { setAuth, getAuth, clearAuth, requireAuth, requireRole };
}
