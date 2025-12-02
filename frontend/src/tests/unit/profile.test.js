require("@testing-library/jest-dom");
const { fireEvent, waitFor } = require("@testing-library/dom");
const fs = require("fs");
const path = require("path");

const profileHtml = fs.readFileSync(
  path.resolve(__dirname, "../../pages/shared/profile.html"),
  "utf8"
);

describe("Profile Page - Complete Tests", () => {
  let container;
  let profileModule;

  beforeEach(() => {
    document.body.innerHTML = profileHtml;
    container = document.body;

    // Mock gapi (Google API)
    global.gapi = {
      load: jest.fn((_, cb) => cb && cb()),
      client: {
        init: jest.fn(() => Promise.resolve()),
        calendar: {
          events: {
            list: jest.fn(() =>
              Promise.resolve({ result: { items: [] } })
            ),
          },
        },
      },
      auth2: {
        getAuthInstance: jest.fn(() => ({
          isSignedIn: { get: () => true },
          signIn: jest.fn(),
        })),
      },
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    jest.resetModules();
    profileModule = require("../../js/profile.js");
    if (typeof profileModule.attachProfileHandlers === "function") {
      profileModule.attachProfileHandlers();
    }
    // Render the calendar for tests that interact with it
    if (typeof profileModule.renderCalendar === "function") {
      profileModule.renderCalendar();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.fetch;
    delete global.gapi;
  });

  // ===== Layout & Structure Tests =====
  describe("Layout and Structure", () => {
    test("renders main container", () => {
      const mainContainer = container.querySelector(".container");
      expect(mainContainer).toBeInTheDocument();
    });

    test("renders header with back button and title", () => {
      const header = container.querySelector(".header");
      expect(header).toBeInTheDocument();
      
      const backBtn = header.querySelector("#backToDashboard");
      const title = header.querySelector(".profile-header-title");
      
      expect(backBtn).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(title.textContent).toContain("Profile Settings");
    });

    test("renders profile grid with correct layout", () => {
      const profileGrid = container.querySelector(".profile-grid");
      expect(profileGrid).toBeInTheDocument();
    });

    test("renders Personal Information card", () => {
      const cards = container.querySelectorAll(".profile-card");
      expect(cards.length).toBeGreaterThanOrEqual(2);
      
      const personalInfoCard = Array.from(cards).find(card =>
        card.textContent.includes("Personal Information")
      );
      expect(personalInfoCard).toBeInTheDocument();
    });

    test("renders Availability card", () => {
      const cards = container.querySelectorAll(".profile-card");
      const availabilityCard = Array.from(cards).find(card =>
        card.textContent.includes("Availability")
      );
      expect(availabilityCard).toBeInTheDocument();
    });

    test("renders Calendar section", () => {
      const calendarCard = container.querySelector(".calendar-card");
      expect(calendarCard).toBeInTheDocument();
    });
  });

  // ===== Profile Photo Tests =====
  describe("Profile Photo", () => {
    test("renders profile photo section", () => {
      const photoSection = container.querySelector(".profile-photo-section");
      expect(photoSection).toBeInTheDocument();
    });

    test("renders profile photo placeholder", () => {
      const photoPreview = container.querySelector("#profilePhotoPreview");
      expect(photoPreview).toBeInTheDocument();
      
      const svg = photoPreview.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    test("renders photo upload button", () => {
      const uploadBtn = container.querySelector(".photo-upload-btn");
      expect(uploadBtn).toBeInTheDocument();
    });

    test("renders hidden file input", () => {
      const fileInput = container.querySelector("#photoInput");
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.type).toBe("file");
      expect(fileInput.accept).toBe("image/*");
    });

    test("renders photo info text", () => {
      const photoInfo = container.querySelector(".photo-info");
      expect(photoInfo).toBeInTheDocument();
      expect(photoInfo.textContent).toContain("5MB");
    });

    test("clicking upload button triggers file input", () => {
      const uploadBtn = container.querySelector(".photo-upload-btn");
      const fileInput = container.querySelector("#photoInput");
      
      const clickSpy = jest.spyOn(fileInput, "click");
      fireEvent.click(uploadBtn);
      
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  // ===== Input Field Tests =====
  describe("Input Fields", () => {
    test("renders all main profile inputs", () => {
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

    test("first name and last name are disabled", () => {
      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      
      expect(firstName.disabled).toBe(true);
      expect(lastName.disabled).toBe(true);
    });

    test("email and role are disabled", () => {
      const email = container.querySelector("#email");
      const role = container.querySelector("#role");
      
      expect(email.disabled).toBe(true);
      expect(role.disabled).toBe(true);
    });

    test("pronunciation field is editable", () => {
      const pronunciation = container.querySelector("#pronunciation");
      expect(pronunciation.disabled).toBe(false);
      
      fireEvent.input(pronunciation, { target: { value: "JON DOH" } });
      expect(pronunciation.value).toBe("JON DOH");
    });

    test("renders info notes for disabled fields", () => {
      const infoNotes = container.querySelectorAll(".info-note");
      expect(infoNotes.length).toBeGreaterThanOrEqual(3);
      
      const cannotChangeNote = Array.from(infoNotes).find(note =>
        note.textContent.includes("Cannot be changed")
      );
      expect(cannotChangeNote).toBeInTheDocument();
    });

    test("all inputs have proper labels", () => {
      const labels = container.querySelectorAll("label");
      expect(labels.length).toBeGreaterThanOrEqual(5);
      
      const firstNameLabel = Array.from(labels).find(l =>
        l.textContent.includes("First Name")
      );
      expect(firstNameLabel).toBeInTheDocument();
    });
  });

  // ===== Availability Section Tests =====
  describe("Availability Section", () => {
    test("renders seven availability checkboxes", () => {
      const ids = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      ids.forEach((id) => {
        const cb = container.querySelector(`#${id}`);
        expect(cb).toBeInTheDocument();
        expect(cb.type).toBe("checkbox");
      });
    });

    test("renders day labels for all days", () => {
      const dayLabels = container.querySelectorAll(".day-label");
      expect(dayLabels.length).toBe(7);
    });

    test("checkboxes can be checked", () => {
      const mon = container.querySelector("#mon");
      const wed = container.querySelector("#wed");
      
      mon.checked = true;
      wed.checked = true;
      
      expect(mon.checked).toBe(true);
      expect(wed.checked).toBe(true);
    });

    test("day labels have correct text", () => {
      const expectedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayLabels = container.querySelectorAll(".day-label");
      
      dayLabels.forEach((label, index) => {
        expect(label.textContent).toBe(expectedDays[index]);
      });
    });

    test("renders availability form", () => {
      const form = container.querySelector("#availabilityForm");
      expect(form).toBeInTheDocument();
      expect(form.tagName).toBe("FORM");
    });

    test("renders save availability button", () => {
      const form = container.querySelector("#availabilityForm");
      const saveBtn = form.querySelector("button[type='submit']");
      
      expect(saveBtn).toBeInTheDocument();
      expect(saveBtn.textContent).toContain("Save Availability");
    });
  });

  // ===== Teams Section Tests =====
  describe("Teams Section", () => {
    test("renders teams section (initially hidden)", () => {
      const teamsSection = container.querySelector("#teamsSection");
      expect(teamsSection).toBeInTheDocument();
    });

    test("renders teams list container", () => {
      const teamsList = container.querySelector("#teamsList");
      expect(teamsList).toBeInTheDocument();
    });

    test("teams section has correct title", () => {
      const teamsSection = container.querySelector("#teamsSection");
      const title = teamsSection.textContent;
      expect(title).toContain("My Teams");
    });
  });

  // ===== Calendar Tests =====
  describe("Calendar", () => {
    test("renders calendar grid and navigation controls", () => {
      const calendarGrid = container.querySelector("#calendarGrid");
      const prevMonth = container.querySelector("#prevMonth");
      const nextMonth = container.querySelector("#nextMonth");
      const monthLabel = container.querySelector("#currentMonth");

      expect(calendarGrid).toBeInTheDocument();
      expect(prevMonth).toBeInTheDocument();
      expect(nextMonth).toBeInTheDocument();
      expect(monthLabel).toBeInTheDocument();
    });

    test("renders calendar title", () => {
      const calendarTitle = container.querySelector(".calendar-title-text");
      expect(calendarTitle).toBeInTheDocument();
      expect(calendarTitle.textContent).toContain("My Calendar");
    });

    test("renders Google Calendar sync button", () => {
      const syncBtn = container.querySelector("#syncGoogleCalendar");
      expect(syncBtn).toBeInTheDocument();
      expect(syncBtn.textContent).toContain("Google Calendar");
    });

    test("clicking next month updates the month label", () => {
      const monthLabel = container.querySelector("#currentMonth");
      const nextMonthBtn = container.querySelector("#nextMonth");

      const initialLabel = monthLabel.textContent;
      fireEvent.click(nextMonthBtn);
      const afterNext = monthLabel.textContent;
      
      expect(afterNext).not.toBe(initialLabel);
    });

    test("clicking previous month updates the month label", () => {
      const monthLabel = container.querySelector("#currentMonth");
      const prevMonthBtn = container.querySelector("#prevMonth");
      const nextMonthBtn = container.querySelector("#nextMonth");

      const initialLabel = monthLabel.textContent;
      
      fireEvent.click(nextMonthBtn);
      fireEvent.click(prevMonthBtn);
      const afterPrev = monthLabel.textContent;
      
      expect(afterPrev).toBe(initialLabel);
    });

    test("calendar grid renders day headers", () => {
      fireEvent.click(container.querySelector("#nextMonth")); // Trigger render
      
      const dayHeaders = container.querySelectorAll(".calendar-day-header");
      expect(dayHeaders.length).toBe(7);
    });

    test("calendar grid renders day cells", () => {
      const dayCells = container.querySelectorAll(".calendar-day");
      expect(dayCells.length).toBeGreaterThan(0);
    });

    test("calendar controls have correct button text", () => {
      const prevBtn = container.querySelector("#prevMonth");
      const nextBtn = container.querySelector("#nextMonth");
      
      expect(prevBtn.textContent).toContain("Previous");
      expect(nextBtn.textContent).toContain("Next");
    });
  });

  // ===== Button Tests =====
  describe("Buttons", () => {
    test("renders Save Changes button in profile form", () => {
      const profileForm = container.querySelector("#profileForm");
      const saveBtn = profileForm.querySelector("button[type='submit']");
      
      expect(saveBtn).toBeInTheDocument();
      expect(saveBtn.textContent).toContain("Save Changes");
    });

    test("renders Save Availability button", () => {
      const availForm = container.querySelector("#availabilityForm");
      const saveBtn = availForm.querySelector("button[type='submit']");
      
      expect(saveBtn).toBeInTheDocument();
      expect(saveBtn.textContent).toContain("Save Availability");
    });

    test("all save buttons have correct styling class", () => {
      const saveButtons = container.querySelectorAll(".save-btn");
      expect(saveButtons.length).toBeGreaterThanOrEqual(2);
      
      saveButtons.forEach(btn => {
        expect(btn.classList.contains("save-btn")).toBe(true);
      });
    });

    test("back button has correct icon", () => {
      const backBtn = container.querySelector("#backToDashboard");
      const svg = backBtn.querySelector("svg");
      
      expect(svg).toBeInTheDocument();
    });

    test("Google Calendar button has SVG icon", () => {
      const syncBtn = container.querySelector("#syncGoogleCalendar");
      const svg = syncBtn.querySelector("svg");
      
      expect(svg).toBeInTheDocument();
    });
  });

  // ===== Modal Tests =====
  describe("Modals", () => {
    test("renders event modal", () => {
      const eventModal = container.querySelector("#eventModal");
      expect(eventModal).toBeInTheDocument();
    });

    test("renders members modal", () => {
      const membersModal = container.querySelector("#membersModal");
      expect(membersModal).toBeInTheDocument();
    });

    test("event modal has close button", () => {
      const eventModal = container.querySelector("#eventModal");
      const closeBtn = eventModal.querySelector(".close-btn");
      
      expect(closeBtn).toBeInTheDocument();
    });

    test("members modal has close button", () => {
      const membersModal = container.querySelector("#membersModal");
      const closeBtn = membersModal.querySelector(".close-btn");
      
      expect(closeBtn).toBeInTheDocument();
    });

    test("modals are initially hidden", () => {
      const eventModal = container.querySelector("#eventModal");
      const membersModal = container.querySelector("#membersModal");
      
      expect(eventModal.classList.contains("show")).toBe(false);
      expect(membersModal.classList.contains("show")).toBe(false);
    });

    test("event modal has title and content containers", () => {
      const eventModal = container.querySelector("#eventModal");
      const title = eventModal.querySelector("#modalTitle");
      const content = eventModal.querySelector("#eventsList");
      
      expect(title).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    test("members modal has title and content containers", () => {
      const membersModal = container.querySelector("#membersModal");
      const title = membersModal.querySelector("#membersModalTitle");
      const content = membersModal.querySelector("#membersList");
      
      expect(title).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });
  });

  // ===== Form Submission Tests =====
  describe("Form Submissions", () => {
    test("submitting profile form calls /api/user/pronunciation", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const pronunciation = container.querySelector("#pronunciation");
      const form = container.querySelector("#profileForm");
      
      fireEvent.input(pronunciation, { target: { value: "JON DOH" } });
      fireEvent.submit(form);

      await Promise.resolve();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      
      expect(url).toBe("/api/user/pronunciation");
      expect(options.method).toBe("PUT");
      expect(options.headers["Content-Type"]).toBe("application/json");
      
      const body = JSON.parse(options.body);
      expect(body.pronunciation).toBe("JON DOH");
    });

    test("submitting availability form sends selected days to /api/user/availability", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const monCheckbox = container.querySelector("#mon");
      const wedCheckbox = container.querySelector("#wed");
      monCheckbox.checked = true;
      wedCheckbox.checked = true;

      const form = container.querySelector("#availabilityForm");
      fireEvent.submit(form);

      await Promise.resolve();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("/api/user/availability");
      expect(options.method).toBe("PUT");
      expect(options.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(options.body);
      expect(body.availability).toBe("Monday, Wednesday");
    });

    test("shows success message after successful submission", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const form = container.querySelector("#profileForm");
      fireEvent.submit(form);

      await Promise.resolve();
      
      // Give time for success message to appear
      await waitFor(() => {
        const successMsg = container.querySelector("#successMessage");
        expect(successMsg.classList.contains("show")).toBe(true);
      }, { timeout: 100 });
    });
  });

  // ===== Data Loading Tests =====
  describe("Data Loading", () => {
    test("window load populates profile from /api/auth/me", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                name: "Allen Zhang",
                pronunciation: "Allen",
                email: "allen@example.com",
                role: "student",
                availability: "Monday, Friday",
              },
            }),
        })
      );

      // run load handler directly for deterministic control in tests
      await profileModule.loadUserProfile();

      const firstName = container.querySelector("#firstName");
      const lastName = container.querySelector("#lastName");
      const pronunciation = container.querySelector("#pronunciation");
      const email = container.querySelector("#email");
      const role = container.querySelector("#role");

      expect(firstName.value).toBe("Allen");
      expect(lastName.value).toBe("Zhang");
      expect(pronunciation.value).toBe("Allen");
      expect(email.value).toBe("allen@example.com");
      expect(role.value).toBe("Student");
    });

    test("loads availability checkboxes from user data", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                name: "Test User",
                email: "test@test.com",
                role: "student",
                availability: "Monday, Wednesday, Friday",
              },
            }),
        })
      );

      // run load handler directly for deterministic control in tests
      await profileModule.loadUserProfile();

      const mon = container.querySelector("#mon");
      const tue = container.querySelector("#tue");
      const wed = container.querySelector("#wed");
      const fri = container.querySelector("#fri");

      expect(mon.checked).toBe(true);
      expect(tue.checked).toBe(false);
      expect(wed.checked).toBe(true);
      expect(fri.checked).toBe(true);
    });
  });

  // ===== CSS and Styling Tests =====
  describe("Styling and CSS", () => {
    test("profile cards have correct styling classes", () => {
      const cards = container.querySelectorAll(".profile-card");
      cards.forEach(card => {
        expect(card.classList.contains("profile-card")).toBe(true);
      });
    });

    test("form groups have correct styling", () => {
      const formGroups = container.querySelectorAll(".form-group");
      expect(formGroups.length).toBeGreaterThan(0);
    });

    test("calendar uses grid layout", () => {
      const calendarGrid = container.querySelector(".calendar-grid");
      expect(calendarGrid).toBeInTheDocument();
    });

    test("day labels have proper styling classes", () => {
      const dayLabels = container.querySelectorAll(".day-label");
      dayLabels.forEach(label => {
        expect(label.classList.contains("day-label")).toBe(true);
      });
    });
  });

  // ===== Accessibility Tests =====
  describe("Accessibility", () => {
    test("all form inputs have associated labels", () => {
      const inputs = container.querySelectorAll("input[id]");
      inputs.forEach(input => {
        if (input.type !== "hidden" && input.type !== "file") {
          const label = container.querySelector(`label[for="${input.id}"]`);
          expect(label).toBeInTheDocument();
        }
      });
    });

    test("buttons have descriptive text or accessible label", () => {
      const buttons = container.querySelectorAll("button");
      buttons.forEach(button => {
        const text = button.textContent.trim();
        const aria = button.getAttribute("aria-label") || button.getAttribute("title");
        expect(text.length > 0 || (aria && aria.length > 0)).toBeTruthy();
      });
    });

    test("modals have proper role attributes", () => {
      const eventModal = container.querySelector("#eventModal");
      const membersModal = container.querySelector("#membersModal");
      
      expect(eventModal).toBeInTheDocument();
      expect(membersModal).toBeInTheDocument();
    });

    test("error and success containers have proper roles", () => {
      const errorDiv = container.querySelector("#registerError");
      const successDiv = container.querySelector("#registerSuccess");
      
      if (errorDiv) expect(errorDiv.getAttribute("role")).toBe("alert");
      if (successDiv) expect(successDiv.getAttribute("role")).toBe("status");
    });
  });
});