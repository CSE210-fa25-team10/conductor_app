require("@testing-library/jest-dom");
const { fireEvent, waitFor } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");

// NOTE: now two .. to get from src/tests/unit → src
const loginHtml = fs.readFileSync(
  path.resolve(__dirname, "../../pages/auth/login.html"),
  "utf8"
);

describe("Login Page", () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = loginHtml;
    container = document.body;

    jest.resetModules();
    const loginModule = require("../../js/login.js");
    if (typeof loginModule.attachLoginHandlers === "function") {
      loginModule.attachLoginHandlers();
    }

    if (global.fetch) jest.restoreAllMocks();
  });

  test("renders email and password inputs", () => {
    const emailInput = container.querySelector("#email");
    const passwordInput = container.querySelector("#password");
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  test("shows an error message when submitting an empty form", () => {
    const submitButton = container.querySelector("button[type='submit']");
    fireEvent.click(submitButton);

    const errorElement = container.querySelector("#loginError");
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.style.display).toBe("block");
    expect(errorElement.textContent.toLowerCase()).toMatch(/required|failed/);
  });

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

    delete window.location;
    // @ts-ignore
    window.location = { href: "" };

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/api\/auth\/login/i);
  });
});
