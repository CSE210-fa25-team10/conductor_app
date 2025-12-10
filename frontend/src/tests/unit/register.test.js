require("@testing-library/jest-dom");
const { fireEvent, waitFor } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");

const registerHtml = fs.readFileSync(
  path.resolve(__dirname, "../../pages/auth/register.html"),
  "utf8"
);

describe("Register Page", () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = registerHtml;
    container = document.body;

    jest.resetModules();
    const registerModule = require("../../js/register.js");
    if (typeof registerModule.attachRegisterHandlers === "function") {
      registerModule.attachRegisterHandlers();
    }

    if (global.fetch) jest.restoreAllMocks();
  });

  test("renders required inputs", () => {
    const firstName = container.querySelector("#firstName");
    const lastName = container.querySelector("#lastName");
    const email = container.querySelector("#email");
    const role = container.querySelector("#role");
    const password = container.querySelector("#password");
    const confirmPassword = container.querySelector("#confirmPassword");

    expect(firstName).toBeInTheDocument();
    expect(lastName).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(role).toBeInTheDocument();
    expect(password).toBeInTheDocument();
    expect(confirmPassword).toBeInTheDocument();
  });

  test("shows error when submitting empty form", () => {
    const submitButton = container.querySelector("button[type='submit']");
    fireEvent.click(submitButton);

    const errorElement = container.querySelector("#registerError");
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.style.display).toBe("block");
    expect(errorElement.textContent.toLowerCase()).toMatch(/required/);
  });

  test("calls /register with valid data", async () => {
    const firstName = container.querySelector("#firstName");
    const lastName = container.querySelector("#lastName");
    const email = container.querySelector("#email");
    const role = container.querySelector("#role");
    const password = container.querySelector("#password");
    const confirmPassword = container.querySelector("#confirmPassword");
    const submitButton = container.querySelector("button[type='submit']");

    fireEvent.input(firstName, { target: { value: "Test" } });
    fireEvent.input(lastName, { target: { value: "User" } });
    fireEvent.input(email, { target: { value: "test@test.com" } });
    fireEvent.change(role, { target: { value: "student" } });
    fireEvent.input(password, { target: { value: "pwd1234" } });
    fireEvent.input(confirmPassword, { target: { value: "pwd1234" } });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1 } }),
      })
    );

    delete window.location;
    // @ts-ignore
    window.location = { href: "" };

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/api\/auth\/register/i);
  });
});
