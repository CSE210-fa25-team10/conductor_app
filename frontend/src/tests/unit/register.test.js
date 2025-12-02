require("@testing-library/jest-dom");
const { fireEvent, waitFor } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");

const registerHtml = fs.readFileSync(
  path.resolve(__dirname, "../../pages/auth/register.html"),
  "utf8"
);

describe("Register Page - Complete Tests", () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = registerHtml;
    container = document.body;

    // no window.location mocking here — tests don't need actual navigation

    jest.resetModules();
    const registerModule = require("../../js/register.js");
    if (typeof registerModule.attachRegisterHandlers === "function") {
      registerModule.attachRegisterHandlers();
    }

    if (global.fetch) jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== Layout & Structure Tests =====
  describe("Layout and Structure", () => {
    test("renders the main container", () => {
      const authContainer = document.querySelector(".auth-container");
      expect(authContainer).toBeInTheDocument();
    });

    test("renders the title 'Create your account'", () => {
      const title = document.querySelector(".auth-title");
      expect(title).toBeInTheDocument();
      expect(title.textContent).toContain("Create your account");
    });

    test("renders subtitle text", () => {
      const subtitle = document.querySelector(".auth-subtitle");
      expect(subtitle).toBeInTheDocument();
      expect(subtitle.textContent).toBeTruthy();
    });

    test("renders the registration form", () => {
      const form = document.querySelector("#registerForm");
      expect(form).toBeInTheDocument();
      expect(form.tagName).toBe("FORM");
    });

    test("renders error message container (initially hidden)", () => {
      const errorElement = document.querySelector("#registerError");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.style.display).toBe("none");
    });

    test("renders 'Already have an account?' footer with login link", () => {
      const footer = document.querySelector(".auth-footer");
      expect(footer).toBeInTheDocument();
      expect(footer.textContent).toContain("Already have an account?");
      
      const link = footer.querySelector("a");
      expect(link).toBeInTheDocument();
      expect(link.textContent).toContain("Login");
      expect(link.getAttribute("href")).toContain("login");
    });
  });

  // ===== Input Field Tests =====
  describe("Input Fields", () => {
    test("renders all required input fields", () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");

      expect(firstName).toBeInTheDocument();
      expect(lastName).toBeInTheDocument();
      expect(email).toBeInTheDocument();
      expect(password).toBeInTheDocument();
      expect(confirmPassword).toBeInTheDocument();
    });

    test("renders optional pronunciation field", () => {
      const pronunciation = container.querySelector("#pronunciation");
      expect(pronunciation).toBeInTheDocument();
    });

    test("first name input accepts text", () => {
      const firstName = container.querySelector("#firstName");
      fireEvent.input(firstName, { target: { value: "John" } });
      expect(firstName.value).toBe("John");
    });

    test("last name input accepts text", () => {
      const lastName = container.querySelector("#lastName");
      fireEvent.input(lastName, { target: { value: "Doe" } });
      expect(lastName.value).toBe("Doe");
    });

    test("email input has correct type and attributes", () => {
      const email = container.querySelector("#email");
      expect(email.type).toBe("email");
      expect(email.autocomplete).toBe("email");
    });

    test("password inputs have correct type and attributes", () => {
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      
      expect(password.type).toBe("password");
      expect(confirmPassword.type).toBe("password");
      expect(password.autocomplete).toBe("new-password");
      expect(confirmPassword.autocomplete).toBe("new-password");
    });

    test("renders password hint text", () => {
      const hint = container.querySelector(".auth-password-hint");
      expect(hint).toBeInTheDocument();
      expect(hint.textContent).toContain("8 characters");
    });

    test("pronunciation field accepts text", () => {
      const pronunciation = container.querySelector("#pronunciation");
      fireEvent.input(pronunciation, { target: { value: "JON DOH" } });
      expect(pronunciation.value).toBe("JON DOH");
    });

    test("all inputs have proper placeholders", () => {
      const firstName = container.querySelector("#firstName");
      const email = container.querySelector("#email");
      
      expect(firstName.placeholder).toBeTruthy();
      expect(email.placeholder).toBeTruthy();
    });
  });

  // ===== Role Selection Tests =====
  describe("Role Selection", () => {
    test("renders role selector with two options", () => {
      const roleSelector = container.querySelector(".role-selector");
      expect(roleSelector).toBeInTheDocument();
      
      const roleOptions = roleSelector.querySelectorAll(".role-option");
      expect(roleOptions.length).toBe(2);
    });

    test("renders student role option with emoji", () => {
      const studentOption = container.querySelector('[data-role="student"]');
      expect(studentOption).toBeInTheDocument();
      
      const emoji = studentOption.querySelector(".role-emoji");
      const label = studentOption.querySelector(".role-label");
      
      expect(emoji).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(label.textContent).toBe("Student");
    });

    test("renders instructor role option with emoji", () => {
      const instructorOption = container.querySelector('[data-role="instructor"]');
      expect(instructorOption).toBeInTheDocument();
      
      const emoji = instructorOption.querySelector(".role-emoji");
      const label = instructorOption.querySelector(".role-label");
      
      expect(emoji).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(label.textContent).toBe("Instructor");
    });

    test("clicking student option adds selected class", () => {
      const studentOption = container.querySelector('[data-role="student"]');
      fireEvent.click(studentOption);
      
      expect(studentOption.classList.contains("selected")).toBe(true);
    });

    test("clicking instructor option adds selected class", () => {
      const instructorOption = container.querySelector('[data-role="instructor"]');
      fireEvent.click(instructorOption);
      
      expect(instructorOption.classList.contains("selected")).toBe(true);
    });

    test("selecting one role deselects the other", () => {
      const studentOption = container.querySelector('[data-role="student"]');
      const instructorOption = container.querySelector('[data-role="instructor"]');
      
      fireEvent.click(studentOption);
      expect(studentOption.classList.contains("selected")).toBe(true);
      
      fireEvent.click(instructorOption);
      expect(studentOption.classList.contains("selected")).toBe(false);
      expect(instructorOption.classList.contains("selected")).toBe(true);
    });

    test("role selection updates hidden input field", () => {
      const studentOption = container.querySelector('[data-role="student"]');
      const roleInput = container.querySelector("#role");
      
      fireEvent.click(studentOption);
      expect(roleInput.value).toBe("student");
    });

    test("hidden role input exists", () => {
      const roleInput = container.querySelector("#role");
      expect(roleInput).toBeInTheDocument();
      expect(roleInput.type).toBe("hidden");
    });

    test("both role options are clickable", () => {
      const studentOption = container.querySelector('[data-role="student"]');
      const instructorOption = container.querySelector('[data-role="instructor"]');
      
      const studentClick = jest.fn();
      const instructorClick = jest.fn();
      
      studentOption.addEventListener("click", studentClick);
      instructorOption.addEventListener("click", instructorClick);
      
      fireEvent.click(studentOption);
      fireEvent.click(instructorOption);
      
      expect(studentClick).toHaveBeenCalled();
      expect(instructorClick).toHaveBeenCalled();
    });
  });

  // ===== Button Tests =====
  describe("Buttons", () => {
    test("renders Create Account button", () => {
      const submitButton = container.querySelector("button[type='submit']");
      expect(submitButton).toBeInTheDocument();
      expect(submitButton.textContent).toContain("Create account");
    });

    test("renders Google registration button", () => {
      const googleBtn = container.querySelector("#googleRegisterBtn");
      expect(googleBtn).toBeInTheDocument();
      expect(googleBtn.textContent).toContain("Google");
    });

    test("renders password toggle button", () => {
      const toggleBtn = container.querySelector("#togglePassword");
      expect(toggleBtn).toBeInTheDocument();
    });

    test("password toggle button changes password visibility", () => {
      const passwordInput = container.querySelector("#password");
      const toggleBtn = container.querySelector("#togglePassword");
      
      expect(passwordInput.type).toBe("password");
      
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe("text");
      
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe("password");
    });

    test("Create Account button has correct styling classes", () => {
      const submitButton = container.querySelector("button[type='submit']");
      expect(submitButton.classList.contains("primary-btn")).toBe(true);
    });

    test("Google button has correct styling classes", () => {
      const googleBtn = container.querySelector("#googleRegisterBtn");
      expect(googleBtn.classList.contains("google-button")).toBe(true);
    });

    test("Google button contains SVG icon", () => {
      const googleBtn = container.querySelector("#googleRegisterBtn");
      const svg = googleBtn.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    test("all buttons are clickable", () => {
      const submitButton = container.querySelector("button[type='submit']");
      const googleBtn = container.querySelector("#googleRegisterBtn");
      const toggleBtn = container.querySelector("#togglePassword");
      
      const submitClick = jest.fn();
      const googleClick = jest.fn();
      const toggleClick = jest.fn();
      
      submitButton.addEventListener("click", submitClick);
      googleBtn.addEventListener("click", googleClick);
      toggleBtn.addEventListener("click", toggleClick);
      
      fireEvent.click(submitButton);
      fireEvent.click(googleBtn);
      fireEvent.click(toggleBtn);
      
      expect(submitClick).toHaveBeenCalled();
      expect(googleClick).toHaveBeenCalled();
      expect(toggleClick).toHaveBeenCalled();
    });

    test("password toggle changes emoji/icon", () => {
      const toggleBtn = container.querySelector("#togglePassword");
      const initialText = toggleBtn.textContent;
      
      fireEvent.click(toggleBtn);
      const afterText = toggleBtn.textContent;
      
      expect(afterText).not.toBe(initialText);
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

      const errorElement = container.querySelector("#registerError");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.style.display).toBe("block");
      expect(errorElement.textContent.toLowerCase()).toMatch(/required/);
    });

    test("shows error when first name is missing", () => {
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(lastName, { target: { value: "Doe" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "password123" } });
      fireEvent.input(confirmPassword, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#registerError");
      expect(errorElement.style.display).toBe("block");
    });

    test("shows error when last name is missing", () => {
      const firstName = container.querySelector("#firstName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "John" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "password123" } });
      fireEvent.input(confirmPassword, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#registerError");
      expect(errorElement.style.display).toBe("block");
    });

    test("shows error when passwords don't match", () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "John" } });
      fireEvent.input(lastName, { target: { value: "Doe" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "password123" } });
      fireEvent.input(confirmPassword, { target: { value: "different123" } });
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#registerError");
      expect(errorElement.style.display).toBe("block");
      expect(errorElement.textContent).toContain("match");
    });

    test("shows error when password is too short", () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "John" } });
      fireEvent.input(lastName, { target: { value: "Doe" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "pass" } });
      fireEvent.input(confirmPassword, { target: { value: "pass" } });
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#registerError");
      expect(errorElement.style.display).toBe("block");
      expect(errorElement.textContent.toLowerCase()).toContain("8 character");
    });

    test("shows error when role is not selected", () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "John" } });
      fireEvent.input(lastName, { target: { value: "Doe" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.input(password, { target: { value: "password123" } });
      fireEvent.input(confirmPassword, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#registerError");
      expect(errorElement.style.display).toBe("block");
    });

    test("shows error when email is missing", () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "John" } });
      fireEvent.input(lastName, { target: { value: "Doe" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "password123" } });
      fireEvent.input(confirmPassword, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      const errorElement = container.querySelector("#registerError");
      expect(errorElement.style.display).toBe("block");
    });
  });

  // ===== API Integration Tests =====
  describe("API Integration", () => {
    test("calls /api/auth/register with valid data", async () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "Test" } });
      fireEvent.input(lastName, { target: { value: "User" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "pwd12345" } });
      fireEvent.input(confirmPassword, { target: { value: "pwd12345" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1, role: "student" } }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toMatch(/\/api\/auth\/register/i);
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      
      const body = JSON.parse(options.body);
      expect(body.first_name).toBe("Test");
      expect(body.last_name).toBe("User");
      expect(body.email).toBe("test@test.com");
      expect(body.role).toBe("student");
      expect(body.password).toBe("pwd12345");
    });

    test("includes pronunciation in API call if provided", async () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const pronunciation = container.querySelector("#pronunciation");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "John" } });
      fireEvent.input(lastName, { target: { value: "Doe" } });
      fireEvent.input(pronunciation, { target: { value: "JON DOH" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "pwd12345" } });
      fireEvent.input(confirmPassword, { target: { value: "pwd12345" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1, role: "student" } }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.pronunciation).toBe("JON DOH");
    });

    test("sends null for pronunciation if not provided", async () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "John" } });
      fireEvent.input(lastName, { target: { value: "Doe" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "pwd12345" } });
      fireEvent.input(confirmPassword, { target: { value: "pwd12345" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1, role: "student" } }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.pronunciation).toBeNull();
    });

    test("shows error on failed registration", async () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "Test" } });
      fireEvent.input(lastName, { target: { value: "User" } });
      fireEvent.input(email, { target: { value: "existing@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "pwd12345" } });
      fireEvent.input(confirmPassword, { target: { value: "pwd12345" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Email already exists" }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = container.querySelector("#registerError");
        expect(errorElement.style.display).toBe("block");
        expect(errorElement.textContent).toContain("Email already exists");
      });
    });

    test("disables button during submission", async () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "Test" } });
      fireEvent.input(lastName, { target: { value: "User" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "pwd12345" } });
      fireEvent.input(confirmPassword, { target: { value: "pwd12345" } });

      global.fetch = jest.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ user: { id: 1, role: "student" } }),
            });
          }, 100);
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton.disabled).toBe(true);
        expect(submitButton.textContent).toContain("Creating");
      });
    });

    test("re-enables button after failed submission", async () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");
      const studentOption = container.querySelector('[data-role="student"]');
      const submitButton = container.querySelector("button[type='submit']");

      fireEvent.input(firstName, { target: { value: "Test" } });
      fireEvent.input(lastName, { target: { value: "User" } });
      fireEvent.input(email, { target: { value: "test@test.com" } });
      fireEvent.click(studentOption);
      fireEvent.input(password, { target: { value: "pwd12345" } });
      fireEvent.input(confirmPassword, { target: { value: "pwd12345" } });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Registration failed" }),
        })
      );

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton.disabled).toBe(false);
        expect(submitButton.textContent).toContain("Create account");
      });
    });
  });

  // ===== CSS and Styling Tests =====
  describe("Styling and CSS", () => {
    test("role options have correct styling classes", () => {
      const roleOptions = container.querySelectorAll(".role-option");
      roleOptions.forEach(option => {
        expect(option.classList.contains("role-option")).toBe(true);
      });
    });

    test("selected role has selected class", () => {
      const studentOption = container.querySelector('[data-role="student"]');
      fireEvent.click(studentOption);
      expect(studentOption.classList.contains("selected")).toBe(true);
    });

    test("form uses grid layout for name fields", () => {
      const fieldRow = container.querySelector(".auth-field-row");
      expect(fieldRow).toBeInTheDocument();
    });

    test("inputs have proper styling classes", () => {
      const inputs = container.querySelectorAll(".auth-input");
      expect(inputs.length).toBeGreaterThan(0);
    });

    test("error message has correct styling", () => {
      const errorElement = container.querySelector("#registerError");
      expect(errorElement.classList.contains("auth-error")).toBe(true);
    });
  });

  // ===== Accessibility Tests =====
  describe("Accessibility", () => {
    test("all inputs have associated labels", () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");

      const firstNameLabel = container.querySelector("label[for='firstName']");
      const lastNameLabel = container.querySelector("label[for='lastName']");
      const emailLabel = container.querySelector("label[for='email']");
      const passwordLabel = container.querySelector("label[for='password']");
      const confirmPasswordLabel = container.querySelector("label[for='confirmPassword']");

      expect(firstNameLabel).toBeInTheDocument();
      expect(lastNameLabel).toBeInTheDocument();
      expect(emailLabel).toBeInTheDocument();
      expect(passwordLabel).toBeInTheDocument();
      expect(confirmPasswordLabel).toBeInTheDocument();
    });

    test("password toggle button has aria-label", () => {
      const toggleBtn = container.querySelector("#togglePassword");
      expect(toggleBtn.getAttribute("aria-label")).toBeTruthy();
    });

    test("role selector has descriptive label", () => {
      const roleLabel = Array.from(container.querySelectorAll("label")).find(
        label => label.textContent.includes("I am a")
      );
      expect(roleLabel).toBeInTheDocument();
    });

    test("error container has proper role", () => {
      const errorDiv = container.querySelector("#registerError");
      expect(errorDiv.getAttribute("role")).toBe("alert");
    });

    test("form has novalidate attribute for custom validation", () => {
      const form = container.querySelector("#registerForm");
      expect(form.hasAttribute("novalidate")).toBe(true);
    });

    test("required fields have required attribute", () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const email = container.querySelector("#email");
      const password = container.querySelector("#password");
      const confirmPassword = container.querySelector("#confirmPassword");

      expect(firstName.required).toBe(true);
      expect(lastName.required).toBe(true);
      expect(email.required).toBe(true);
      expect(password.required).toBe(true);
      expect(confirmPassword.required).toBe(true);
    });
  });
});