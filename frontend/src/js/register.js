// src/js/register.js

function showError(msg) {
  const el = document.getElementById("registerError");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";

  const success = document.getElementById("registerSuccess");
  if (success) success.style.display = "none";
}

function showSuccess(msg) {
  const el = document.getElementById("registerSuccess");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";

  const error = document.getElementById("registerError");
  if (error) error.style.display = "none";
}

function attachRegisterHandlers() {
  const form = document.getElementById("registerForm");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const pronunciation = document.getElementById("pronunciation");
  const email = document.getElementById("email");
  const role = document.getElementById("role");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const button = document.getElementById("registerButton");
  const toggleButton = document.getElementById("togglePassword");

  if (!form) return;

  if (toggleButton && password) {
    toggleButton.addEventListener("click", function () {
      const isHidden = password.type === "password";
      password.type = isHidden ? "text" : "password";
      toggleButton.textContent = isHidden ? "Hide" : "Show";
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (
      !firstName.value.trim() ||
      !lastName.value.trim() ||
      !email.value.trim() ||
      !role.value ||
      !password.value ||
      !confirmPassword.value
    ) {
      showError("Please fill in all required fields.");
      return;
    }

    if (password.value.length < 6) {
      showError("Password should be at least 6 characters long.");
      return;
    }

    if (password.value !== confirmPassword.value) {
      showError("Passwords do not match.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Creating account…";
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${firstName.value.trim()} ${lastName.value.trim()}`,
          email: email.value.trim(),
          password: password.value,
          role: role.value,
          pronunciation: pronunciation.value.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data.error || "Account creation failed. Please try again.");
        if (button) {
          button.disabled = false;
          button.textContent = "Create account";
        }
        return;
      }

      showSuccess("Account created successfully! Redirecting to login…");

      setTimeout(() => {
        window.location.href = "login.html?registered=1";
      }, 900);
    } catch (err) {
      console.error(err);
      showError("An unexpected error occurred. Please try again.");
      if (button) {
        button.disabled = false;
        button.textContent = "Create account";
      }
    }
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", attachRegisterHandlers);
}

module.exports = {
  attachRegisterHandlers,
  showError,
  showSuccess,
};
