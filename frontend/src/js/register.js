// basic helpers
function showRegisterError(message) {
  const errorBox = document.getElementById("registerError");
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.style.display = message ? "block" : "none";
}

function clearRegisterError() {
  showRegisterError("");
}

function redirectAfterRegister(user) {
  if (!user || !user.role) {
    window.location.href = "../auth/login.html";
    return;
  }

  if (user.role === "instructor") {
    window.location.href = "../instructor/dashboard.html";
  } else {
    // default to student dashboard
    window.location.href = "../student/dashboard.html";
  }
}

// DOM ready
function attachRegisterHandlers() {
  const form = document.getElementById("registerForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const googleRegisterBtn = document.getElementById("googleRegisterBtn");
  const roleOptions = document.querySelectorAll(".role-option");

  if (!form) return;

  // Handle role selection button clicks
  roleOptions.forEach(option => {
    option.addEventListener("click", function() {
      // Remove selected class from all options
      roleOptions.forEach(opt => opt.classList.remove("selected"));
      
      // Add selected class to clicked option
      this.classList.add("selected");
      
      // Update hidden input with selected role
      const selectedRole = this.getAttribute("data-role");
      const roleInput = document.getElementById("role");
      if (roleInput) {
        roleInput.value = selectedRole;
      }
    });
  });

  // password show / hide toggle
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordBtn.textContent = isPassword ? "🙈" : "👁";
      togglePasswordBtn.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearRegisterError();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const pronunciation = document.getElementById("pronunciation").value.trim();
    const email = document.getElementById("email").value.trim();
    
    // Get the selected role from hidden input
    const role = document.getElementById("role").value;
    
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // basic client-side validation
    if (!firstName || !lastName || !email || !role || !password || !confirmPassword) {
      showRegisterError("Please fill out all required fields.");
      return;
    }

    if (password.length < 8) {
      showRegisterError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showRegisterError("Passwords do not match.");
      return;
    }

    // Disable submit button during request
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          pronunciation: pronunciation || null,
          email,
          password,
          role,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.error || "Registration failed. Please try again.";
        showRegisterError(msg);
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      // success — persist auth and redirect
      try {
        if (typeof require === "function") {
          const auth = require("./auth.js");
          if (auth && typeof auth.setAuth === "function") auth.setAuth(data.user || {});
        } else if (typeof window !== "undefined" && window.__ConductorAuth) {
          window.__ConductorAuth.setAuth(data.user || {});
        }
      } catch (e) {}
      redirectAfterRegister(data.user);
    } catch (err) {
      console.error("Register error:", err);
      showRegisterError("Network error. Please try again.");
      
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // hook up Google button using your helper (if present)
  if (googleRegisterBtn && typeof attachGoogleAuth === "function") {
    attachGoogleAuth(googleRegisterBtn, "register");
  }
}

// run automatically in browser
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", attachRegisterHandlers);
}

// export for tests so they can bind handlers directly
module.exports = {
  attachRegisterHandlers,
  showRegisterError,
  clearRegisterError,
  redirectAfterRegister,
};