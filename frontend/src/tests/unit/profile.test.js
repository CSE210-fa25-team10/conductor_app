require("@testing-library/jest-dom");
const fs = require("fs");
const path = require("path");

const profileHtml = fs.readFileSync(
  // from src/tests/unit → src/pages/shared/profile.html
  path.resolve(__dirname, "../../pages/shared/profile.html"),
  "utf8"
);

describe("Profile Page", () => {
  let container;

  beforeEach(() => {
    // load HTML into jsdom
    document.body.innerHTML = profileHtml;
    container = document.body;

    // load and attach JS (event listeners, etc.)
    jest.resetModules();
    require("../../js/profile.js");
  });

  test("renders main profile inputs", () => {
    const firstName = container.querySelector("#firstName");
    const lastName = container.querySelector("#lastName");
    const pronunciation = container.querySelector("#pronunciation");
    const email = container.querySelector("#email");
    const role = container.querySelector("#role");

    expect(firstName).toBeInTheDocument();
    expect(lastName).toBeInTheDocument();
    expect(pronunciation).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(role).toBeInTheDocument();
  });

  test("renders seven availability checkboxes", () => {
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    days.forEach((id) => {
      const cb = container.querySelector(`#${id}`);
      expect(cb).toBeInTheDocument();
      expect(cb.type).toBe("checkbox");
    });
  });

  test("has calendar grid and navigation", () => {
    const calendarGrid = container.querySelector("#calendarGrid");
    const prevMonth = container.querySelector("#prevMonth");
    const nextMonth = container.querySelector("#nextMonth");
    const monthLabel = container.querySelector("#currentMonth");

    expect(calendarGrid).toBeInTheDocument();
    expect(prevMonth).toBeInTheDocument();
    expect(nextMonth).toBeInTheDocument();
    expect(monthLabel).toBeInTheDocument();
  });
});
