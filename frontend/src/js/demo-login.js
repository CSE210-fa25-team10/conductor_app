// Demo login helpers (only for local / demo flows)
function demoSignIn(role = "student") {
  // create a plausible user object used by auth helper
  const demoUser = {
    name: role === "instructor" ? "Demo Instructor" : "Demo Student",
    email: role === "instructor" ? "instructor@demo.local" : "student@demo.local",
    role: role,
    pronunciation: role === "instructor" ? "Demo In" : "Demo Stu",
  };

  try {
    if (typeof require === 'function') {
      const auth = require('./auth.js');
      auth && auth.setAuth && auth.setAuth(demoUser);
    } else if (window && window.__ConductorAuth) {
      window.__ConductorAuth.setAuth(demoUser);
    } else {
      localStorage.setItem('conductor_user', JSON.stringify(demoUser));
    }

    // redirect to correct dashboard for demo
    const target = role === 'instructor' ? '/src/pages/instructor/dashboard.html' : '/src/pages/student/dashboard.html';
    if (typeof window !== 'undefined') window.location.href = target;
  } catch (e) {
    console.error('Demo sign-in failed', e);
  }
}

if (typeof module !== 'undefined') module.exports = { demoSignIn };
