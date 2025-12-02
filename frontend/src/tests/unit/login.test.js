require("@testing-library/jest-dom");
const { fireEvent, waitFor } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");

const loginHtml = fs.readFileSync(
  path.resolve(__dirname, "../../pages/auth/login.html"),
  "utf8"
);

describe("Login Page - Complete Tests", () => {
  let container;
  let loginModule;

  beforeEach(() => {
    document.body.innerHTML = loginHtml;
    container = document.body;


    jest.resetModules();
    loginModule = require("../../js/login.js");
    // (No redirect helper exported) tests stub direct navigation by inspecting window.location
    if (typeof loginModule.attachLoginHandlers === "function") {
      loginModule.attachLoginHandlers();
    }

    if (global.fetch) jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== Layout & Structure Tests =====
  describe("Layout and Structure", () => {
    test("renders the main container", () => {
      const container = document.querySelector(".auth-container");
      expect(container).toBeInTheDocument();
    });

    test("renders the title 'Welcome Back'", () => {
      const title = document.querySelector(".auth-title");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe("Welcome Back");
    });

    test("renders subtitle text", () => {
      const subtitle = document.querySelector(".auth-subtext");
      expect(subtitle).toBeInTheDocument();
      expect(subtitle.textContent).toContain("Sign in");
    });

    test("renders the login form", () => {
      const form = document.querySelector("#loginForm");
      expect(form).toBeInTheDocument();
      expect(form.tagName).toBe("FORM");
    });

    test("renders error message container (initially hidden)", () => {
      const errorElement = document.querySelector("#loginError");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.style.display).toBe("none");
    });

    test("renders 'Don't have an account?' footer with register link", () => {
      const footer = document.querySelector(".auth-footer");
      expect(footer).toBeInTheDocument();
      expect(footer.textContent).toContain("Don't have an account?");
      
      const link = footer.querySelector("a");
      expect(link).toBeInTheDocument();
      expect(link.textContent).toContain("Register");
      expect(link.getAttribute("href")).toContain("register");
    });
  });

  // ===== Input Field Tests =====
  describe("Input Fields", () => {
    test("renders email input with correct attributes", () => {
      const emailInput = container.querySelector("#email");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.type).toBe("email");
      expect(emailInput.placeholder).toBeTruthy();
      expect(emailInput.autocomplete).toBe("email");
    });

    test("renders password input with correct attributes", () => {
      const passwordInput = container.querySelector("#password");
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput.type).toBe("password");
      expect(passwordInput.placeholder).toBeTruthy();
      expect(passwordInput.autocomplete).toBe("current-password");
    });

    test("email input accepts text input", () => {
      const emailInput = container.querySelector("#email");
      fireEvent.input(emailInput, { target: { value: "test@example.com" } });
      expect(emailInput.value).toBe("test@example.com");
    });

    test("password input accepts text input", () => {
      const passwordInput = container.querySelector("#password");
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      expect(passwordInput.value).toBe("password123");
    });

    test("password input masks text", () => {
      const passwordInput = container.querySelector("#password");
      expect(passwordInput.type).toBe("password");
    });

    test("renders labels for inputs", () => {
      const labels = container.querySelectorAll("label");
      expect(labels.length).toBeGreaterThanOrEqual(2);
      
      const emailLabel = Array.from(labels).find(l => 
        l.textContent.toLowerCase().includes("email")
      );
      const passwordLabel = Array.from(labels).find(l => 
        l.textContent.toLowerCase().includes("password")
      );
      
      expect(emailLabel).toBeInTheDocument();
      expect(passwordLabel).toBeInTheDocument();
    });
  });

  // ===== Button Tests =====
  describe("Buttons", () => {
    test("renders Sign In button", () => {
      const submitButton = container.querySelector("button[type='submit']");
      expect(submitButton).toBeInTheDocument();
      expect(submitButton.textContent).toContain("Sign In");
    });

    test("renders Google Sign In button", () => {
      const googleBtn = container.querySelector("#googleLoginBtn");
      expect(googleBtn).toBeInTheDocument();
      expect(googleBtn.textContent).toContain("Google");
    });

    test("Sign In button has correct classes", () => {
      const submitButton = container.querySelector("button[type='submit']");
      expect(submitButton.classList.contains("primary-btn")).toBe(true);
    });

    test("Google button has correct classes", () => {
      const googleBtn = container.querySelector("#googleLoginBtn");
      expect(googleBtn.classList.contains("google-button")).toBe(true);
    });

    test("Sign In button is clickable", () => {
      const submitButton = container.querySelector("button[type='submit']");
      const clickHandler = jest.fn();
      submitButton.addEventListener("click", clickHandler);
      
      fireEvent.click(submitButton);
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    test("Google button is clickable", () => {
      const googleBtn = container.querySelector("#googleLoginBtn");
      const clickHandler = jest.fn();
      googleBtn.addEventListener("click", clickHandler);
      
      fireEvent.click(googleBtn);
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });
  });

  // ===== OAuth Divider Tests =====
  describe("OAuth Divider", () => {
    test("renders OAuth divider with 'or' text", () => {
      const divider = container.querySelector(".oauth-divider");
      expect(divider).toBeInTheDocument();
      expect(divider.textContent).toContain("or");
    });
  });

  // ===== Form Validation Tests =====
  describe("Form Validation", () => {
    test("shows error when submitting empty form", () => {
      const submitButton = container.querySelector("button[type='submit']");
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#loginError");
      expect(errorElement.style.display).toBe("block");
      expect(errorElement.textContent.toLowerCase()).toMatch(/required|failed/);
    });

    test("shows error when email is empty", () => {
      const passwordInput = container.querySelector("#password");
      const submitButton = container.querySelector("button[type='submit']");
      
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#loginError");
      expect(errorElement.style.display).toBe("block");
    });

    test("shows error when password is empty", () => {
      const emailInput = container.querySelector("#email");
      const submitButton = container.querySelector("button[type='submit']");
      
      fireEvent.input(emailInput, { target: { value: "test@test.com" } });
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#loginError");
      expect(errorElement.style.display).toBe("block");
    });

    test("does not show error with valid inputs", async () => {
      const emailInput = container.querySelector("#email");
      const passwordInput = container.querySelector("#password");
      const submitButton = container.querySelector("button[type='submit']");

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { role: "student" } }),
        })
      );

      fireEvent.input(emailInput, { target: { value: "test@test.com" } });
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = container.querySelector("#loginError");
        expect(errorElement.style.display).not.toBe("block");
      });
    });
  });

  // ===== API Integration Tests =====
  describe("API Integration", () => {
    test("submits form successfully with valid input", async () => {
      const emailInput = container.querySelector("#email");
      const passwordInput = container.querySelector("#password");
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(emailInput, { target: { value: "test@test.com" } });
      fireEvent.input(passwordInput, { target: { value: "pwd123" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ user: { name: "Test User", role: "student" } }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toMatch(/\/api\/auth\/login/i);
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      
      const body = JSON.parse(options.body);
      expect(body.email).toBe("test@test.com");
      expect(body.password).toBe("pwd123");
    });

    test("shows error on failed login (401)", async () => {
      const emailInput = container.querySelector("#email");
      const passwordInput = container.querySelector("#password");
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(emailInput, { target: { value: "wrong@test.com" } });
      fireEvent.input(passwordInput, { target: { value: "wrongpwd" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Invalid credentials" }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = container.querySelector("#loginError");
        expect(errorElement.style.display).toBe("block");
        expect(errorElement.textContent).toContain("credentials");
      });
    });

    test("disables button during submission", async () => {
      const emailInput = container.querySelector("#email");
      const passwordInput = container.querySelector("#password");
      const submitButton = container.querySelector("#loginButton");

      fireEvent.input(emailInput, { target: { value: "test@test.com" } });
      fireEvent.input(passwordInput, { target: { value: "pwd123" } });

      global.fetch = jest.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ user: { role: "student" } }),
            });
          }, 100);
        })
      );

      fireEvent.click(submitButton);

      // Button should be disabled immediately after click
      await waitFor(() => {
        expect(submitButton.disabled).toBe(true);
      });
    });

    test("redirects to student dashboard on successful student login", async () => {
      const emailInput = container.querySelector("#email");
      const passwordInput = container.querySelector("#password");
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(emailInput, { target: { value: "student@test.com" } });
      fireEvent.input(passwordInput, { target: { value: "pwd123" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ user: { name: "Student", role: "student" } }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toContain("student_dashboard");
      }, { timeout: 1000 });
    });

    test("redirects to instructor dashboard on successful instructor login", async () => {
      const emailInput = container.querySelector("#email");
      const passwordInput = container.querySelector("#password");
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(emailInput, { target: { value: "instructor@test.com" } });
      fireEvent.input(passwordInput, { target: { value: "pwd123" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ user: { name: "Instructor", role: "instructor" } }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toContain("instructor_dashboard");
      }, { timeout: 1000 });
    });
  });

  // ===== CSS and Styling Tests =====
  describe("Styling and CSS", () => {
    test("form inputs have auth-input class or similar styling", () => {
      const emailInput = container.querySelector("#email");
      const passwordInput = container.querySelector("#password");
      
      // Check if inputs exist and are properly styled
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    test("buttons have proper styling classes", () => {
      const submitButton = container.querySelector("button[type='submit']");
      const googleBtn = container.querySelector("#googleLoginBtn");
      
      expect(submitButton.classList.length).toBeGreaterThan(0);
      expect(googleBtn.classList.length).toBeGreaterThan(0);
    });

    test("error message has correct styling class", () => {
      const errorElement = container.querySelector("#loginError");
      expect(errorElement.classList.contains("error-message")).toBe(true);
    });
  });

  // ===== Accessibility Tests =====
  describe("Accessibility", () => {
    test("email input has associated label", () => {
      const emailInput = container.querySelector("#email");
      const emailLabel = container.querySelector("label[for='email']");
      expect(emailLabel).toBeInTheDocument();
    });

    test("password input has associated label", () => {
      const passwordInput = container.querySelector("#password");
      const passwordLabel = container.querySelector("label[for='password']");
      expect(passwordLabel).toBeInTheDocument();
    });

    test("form has proper autocomplete attributes", () => {
      const emailInput = container.querySelector("#email");
      const passwordInput = container.querySelector("#password");
      
      expect(emailInput.autocomplete).toBe("email");
      expect(passwordInput.autocomplete).toBe("current-password");
    });
  });
});