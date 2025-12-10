// src/js/login.js

/**
 * Show an error message on the login form.
 * @param {string} msg - The error message to display.
 */
function showError(msg) {
  const el = document.getElementById("loginError");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";

  const success = document.getElementById("loginSuccess");
  if (success) success.style.display = "none";
}

/**
 * Show a success message on the login form.
 * @param {string} msg - The success message to display.
 */
function showSuccess(msg) {
  const el = document.getElementById("loginSuccess");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";

  const error = document.getElementById("loginError");
  if (error) error.style.display = "none";
}

/**
 * Attach event handlers for the login form.
 * Finds the form and wires submit and toggle-password behavior.
 */
function attachLoginHandlers() {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const button = document.getElementById("loginButton");
  const toggleButton = document.getElementById("togglePassword");

  if (!form || !emailInput || !passwordInput) return;

  if (toggleButton && passwordInput) {
    toggleButton.addEventListener("click", function () {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      toggleButton.textContent = isHidden ? "Hide" : "Show";
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError("All fields are required.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Signing in…";
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data.error || "Login failed. Please check your credentials.");
        if (button) {
          button.disabled = false;
          button.textContent = "Sign In";
        }
        return;
      }

      const user = data.user || {};
      showSuccess("Login successful. Redirecting…");

      setTimeout(() => {
        if (user.role === "instructor") {
          window.location.href = "/instructor";
        } else {
          window.location.href = "/student";
        }
      }, 600);
    } catch (err) {
      console.error(err);
      showError("An unexpected error occurred. Please try again.");
      if (button) {
        button.disabled = false;
        button.textContent = "Sign In";
      }
    }
  });
}

// run automatically in browser
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", attachLoginHandlers);
}

// export for tests if they want to call attachLoginHandlers manually
if (typeof module !== "undefined") {
  module.exports = {
    attachLoginHandlers,
    showError,
    showSuccess,
  };
}