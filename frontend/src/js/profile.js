// src/js/profile.js

// ===== Global state =====
let currentDate = new Date();
let userEvents = [];
let currentUser = null;
let gapiInitialized = false;
let userTeams = [];

// ===== Google API configuration =====
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_API_KEY = "YOUR_API_KEY";
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
];
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

// ===== Google API init =====
function initializeGoogleAPI() {
  if (typeof gapi === "undefined") {
    // In tests or environments without gapi, just skip
    return;
  }
  gapi.load("client:auth2", () => {
    gapi.client
      .init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      })
      .then(() => {
        gapiInitialized = true;
      })
      .catch((err) => {
        console.error("Error initializing Google API:", err);
      });
  });
}

async function handleSyncCalendarClick() {
  if (typeof gapi === "undefined") {
    // In tests / non-browser, bail out
    alert &&
      alert(
        "Google Calendar is not available in this environment. (gapi not loaded)"
      );
    return;
  }

  if (!gapiInitialized) {
    alert("Google Calendar is still initializing. Please try again in a moment.");
    return;
  }

  const authInstance = gapi.auth2.getAuthInstance();
  if (!authInstance) {
    alert("Google authentication failed to initialize.");
    return;
  }

  try {
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
    await loadGoogleCalendarEvents();
  } catch (err) {
    console.error("Google sign-in error:", err);
    alert("Failed to sign in to Google.");
  }
}

async function loadGoogleCalendarEvents() {
  if (typeof gapi === "undefined") return;

  try {
    const now = new Date();
    const timeMin = now.toISOString();
    const threeMonthsLater = new Date(
      now.getFullYear(),
      now.getMonth() + 3,
      now.getDate()
    );
    const timeMax = threeMonthsLater.toISOString();

    const response = await gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      showDeleted: false,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.result.items || [];
    events.forEach((ev) => {
      const startStr = ev.start.dateTime || ev.start.date;
      if (!startStr) return;
      const date = new Date(startStr);
      userEvents.push({
        id: ev.id,
        summary: ev.summary || "(No title)",
        description: ev.description || "",
        location: ev.location || null,
        type: "google",
        startTime: date.toLocaleString(),
        dateKey: getDateKey(date),
      });
    });

    renderCalendar();
  } catch (err) {
    console.error("Error loading Google Calendar events:", err);
    alert("Failed to load Google Calendar events.");
  }
}

// ===== User profile =====
async function loadUserProfile() {
  try {
    const response = await fetch("/api/postman/user", { credentials: "include" });

    if (response.ok) {
      const userData = await response.json();
      currentUser = userData;
      populateForm(currentUser);

      if (currentUser.role === "student") {
        await loadUserTeams();
      }
    } else {
      console.error("Failed to load user profile. Status:", response.status);
      const errorData = await response.json().catch(() => ({}));
      console.error("Error details:", errorData);
      // redirect to login if not authenticated
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    // Don't redirect on network errors, keep user on page to see error
  }
}

function populateForm(user) {
  const nameParts = (user.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const firstNameEl = document.getElementById("firstName");
  const lastNameEl = document.getElementById("lastName");
  const pronEl = document.getElementById("pronunciation");
  const emailEl = document.getElementById("email");
  const roleEl = document.getElementById("role");

  if (firstNameEl) firstNameEl.value = firstName;
  if (lastNameEl) lastNameEl.value = lastName;
  if (pronEl) pronEl.value = user.pronunciation || "";
  if (emailEl) emailEl.value = user.email || "";
  if (roleEl)
    roleEl.value = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : "";

  if (user.profile_photo) {
    const photoPreview = document.getElementById("profilePhotoPreview");
    if (photoPreview) {
      photoPreview.innerHTML = `<img src="data:image/jpeg;base64,${user.profile_photo}" alt="Profile">`;
    }
  }

  if (user.availability) {
    const days = user.availability.split(",");
    days.forEach((day) => {
      const checkbox = document.querySelector(
        `input[value="${day.trim()}"]`
      );
      if (checkbox) checkbox.checked = true;
    });
  }
}

// ===== Photo upload =====
function handlePhotoChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("File size must be less than 5MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const photoPreview = document.getElementById("profilePhotoPreview");
    if (photoPreview) {
      photoPreview.innerHTML = `<img src="${event.target.result}" alt="Profile">`;
    }
  };
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append("profile_photo", file);

  fetch("/api/user/profile-photo", {
    method: "PUT",
    credentials: "include",
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        showSuccessMessage();
      } else {
        return response.json().then((data) => {
          alert("Error uploading photo: " + data.error);
        });
      }
    })
    .catch((error) => {
      alert("Error uploading photo: " + error.message);
    });
}

// ===== Teams =====
async function loadUserTeams() {
  try {
    const response = await fetch("/api/student/teams", {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      userTeams = data.teams || [];
      displayTeams();
    }
  } catch (error) {
    console.error("Error loading teams:", error);
  }
}

function displayTeams() {
  const teamsSection = document.getElementById("teamsSection");
  const teamsList = document.getElementById("teamsList");
  if (!teamsSection || !teamsList) return;

  if (!userTeams || userTeams.length === 0) {
    teamsSection.classList.remove("hidden");
    teamsList.innerHTML = `
      <div class="no-teams">
          <svg viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="9" cy="7" r="4"
                      stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>You're not part of any teams yet</p>
      </div>
    `;
  } else {
    teamsSection.classList.remove("hidden");
    teamsList.innerHTML = userTeams
      .map(
        (team) => `
        <div class="team-card" onclick="viewTeamMembers(${team.group_id})">
            <div class="team-header">
                <div>
                    <div class="team-name">${team.group_name}</div>
                    <div class="team-course">${team.course_name || "Course"}</div>
                </div>
                <span class="member-count">${team.member_count} members</span>
            </div>
            <button class="view-members-btn" onclick="event.stopPropagation(); viewTeamMembers(${team.group_id})">
                View Members
            </button>
        </div>
    `
      )
      .join("");
  }
}

async function viewTeamMembers(groupId) {
  try {
    const response = await fetch(`/api/groups/${groupId}/members`, {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      showMembersModal(data.members, data.group_name);
    }
  } catch (error) {
    console.error("Error loading team members:", error);
    alert("Failed to load team members");
  }
}

function showMembersModal(members, groupName) {
  const modal = document.getElementById("membersModal");
  const modalTitle = document.getElementById("membersModalTitle");
  const membersList = document.getElementById("membersList");

  if (!modal || !modalTitle || !membersList) return;

  modalTitle.textContent = `${groupName} - Members`;

  membersList.innerHTML = members
    .map((member) => {
      const initials =
        (member.name || "")
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "?";

      return `
        <div class="member-card">
            <div class="member-avatar">${initials}</div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-email">${member.email}</div>
                ${
                  member.pronunciation
                    ? `<div class="info-note">Prefers: ${member.pronunciation}</div>`
                    : ""
                }
            </div>
            <a href="mailto:${member.email}" class="contact-btn">Email</a>
        </div>
      `;
    })
    .join("");

  modal.classList.add("show");
}

// ===== Forms =====
function showSuccessMessage() {
  const msg = document.getElementById("successMessage");
  if (!msg) return;
  msg.classList.add("show");
  setTimeout(() => msg.classList.remove("show"), 2500);
}

function handleProfileSubmit(e) {
  e.preventDefault();

  // Clear any previous error messages
  const phoneError = document.getElementById('phoneError');
  if (phoneError) {
    phoneError.style.display = 'none';
    phoneError.textContent = '';
  }

  const formData = new FormData(e.target);
  const data = {};
  formData.forEach((value, key) => {
    if (key === "pronunciation") {
      data.pronunciation = value;
    } else if (key === "phone") {
      data.phone = value;
    }
  });

  // Validate phone number if provided
  if (data.phone && data.phone.trim() !== '') {
    const cleaned = data.phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      if (phoneError) {
        phoneError.textContent = "Phone number must be exactly 10 digits";
        phoneError.style.display = 'block';
      }
      return;
    }
  }

  fetch("/api/postman/user", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pronunciation: document.getElementById("pronunciation").value,
    }),
  })
    .then((response) =>
      response.json().then((data) => ({
        ok: response.ok,
        data,
      }))
    )
    .then(({ ok, data }) => {
      if (ok) {
        showSuccessMessage();
      } else {
        alert("Error: " + data.error);
      }
    })
    .catch((error) => {
      alert("Error updating profile: " + error.message);
    });
}

function handleAvailabilitySubmit(e) {
  e.preventDefault();

  const selectedDays = [];
  document
    .querySelectorAll('.day-checkbox input[type="checkbox"]:checked')
    .forEach((cb) => {
      selectedDays.push(cb.value);
    });

  fetch("/api/user/availability", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      availability: selectedDays.join(", "),
    }),
  })
    .then((response) =>
      response.json().then((data) => ({
        ok: response.ok,
        data,
      }))
    )
    .then(({ ok, data }) => {
      if (ok) {
        showSuccessMessage();
      } else {
        alert("Error: " + data.error);
      }
    })
    .catch((error) => {
      alert("Error updating availability: " + error.message);
    });
}

// ===== Modal helpers (used by inline HTML) =====
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("show");
}

// ===== Calendar helpers & rendering =====
function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getEventsForDate(date) {
  const key = getDateKey(date);
  return userEvents.filter((ev) => ev.dateKey === key);
}

function addLocalEvent(dateStr, summary, description, type, location) {
  const date = new Date(dateStr);
  userEvents.push({
    id: `local-${type}-${date.getTime()}-${Math.random()
      .toString(36)
      .slice(2)}`,
    summary,
    description,
    location: location || null,
    type, // 'lecture' or 'assignment'
    startTime: date.toLocaleString(),
    dateKey: getDateKey(date),
  });
}

// Example local events loader
async function loadCourseEvents() {
  const exampleEvents = [
    {
      type: "lecture",
      title: "Lecture: Intro to Distributed Systems",
      course: "CSE 210",
      start_at: "2025-11-03T13:00:00",
      end_at: "2025-11-03T14:15:00",
      location: "Room 101",
    },
    {
      type: "lecture",
      title: "Lecture: Consensus Algorithms",
      course: "CSE 210",
      start_at: "2025-11-05T13:00:00",
      end_at: "2025-11-05T14:15:00",
      location: "Room 101",
    },
    {
      type: "assignment",
      title: "Assignment 1 Due",
      course: "CSE 210",
      start_at: "2025-11-03T19:00:00",
      end_at: null,
      location: null,
    },
  ];

  exampleEvents.forEach((ev) => {
    if (ev.type === "lecture") {
      const start = new Date(ev.start_at);
      const end = ev.end_at ? new Date(ev.end_at) : null;
      const timeStr = end
        ? `${start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${end.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
      addLocalEvent(
        ev.start_at,
        `[LEC] ${ev.title}`,
        `Course: ${ev.course} • ${timeStr}`,
        "lecture",
        ev.location
      );
    } else if (ev.type === "assignment") {
      addLocalEvent(
        ev.start_at,
        `[HW] ${ev.title}`,
        `Course: ${ev.course}`,
        "assignment",
        ev.location
      );
    }
  });
}

function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  const currentMonthLabel = document.getElementById("currentMonth");
  if (!calendarGrid || !currentMonthLabel) return;

  calendarGrid.innerHTML = "";

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  currentMonthLabel.textContent = `${monthNames[month]} ${year}`;

  // weekday headers
  weekdayNames.forEach((day) => {
    const header = document.createElement("div");
    header.className = "calendar-day-header";
    header.textContent = day;
    calendarGrid.appendChild(header);
  });

  const firstDayOfMonth = new Date(year, month, 1);
  const startingWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // previous month days
  for (
    let d = daysInPrevMonth - startingWeekday + 1;
    d <= daysInPrevMonth;
    d++
  ) {
    const date = new Date(year, month - 1, d);
    addDayCell(calendarGrid, date, false);
  }

  // current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    addDayCell(calendarGrid, date, true);
  }

  // next month days to fill up to a complete week
  const totalDayCells = startingWeekday + daysInMonth;
  const remaining = (7 - (totalDayCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    addDayCell(calendarGrid, date, false);
  }
}

function addDayCell(container, date, isCurrentMonth) {
  const cell = document.createElement("div");
  cell.className = "calendar-day";
  if (!isCurrentMonth) cell.classList.add("other-month");

  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    cell.classList.add("today");
  }

  const events = getEventsForDate(date);
  if (events.length > 0) {
    cell.classList.add("has-event");
  }

  const dayNumber = document.createElement("div");
  dayNumber.className = "day-number";
  dayNumber.textContent = date.getDate();

  const eventsContainer = document.createElement("div");
  eventsContainer.className = "day-events";

  events.slice(0, 2).forEach((ev) => {
    const line = document.createElement("div");
    const typeClass = ev.type ? `event-dot-${ev.type}` : "";
    line.innerHTML = `<span class="event-dot ${typeClass}"></span>${
      ev.summary || "(No title)"
    }`;
    eventsContainer.appendChild(line);
  });

  if (events.length > 2) {
    const more = document.createElement("div");
    more.textContent = `+${events.length - 2} more`;
    eventsContainer.appendChild(more);
  }

  cell.appendChild(dayNumber);
  cell.appendChild(eventsContainer);

  cell.addEventListener("click", () => {
    openEventsModal(date, events);
  });

  container.appendChild(cell);
}

function openEventsModal(date, events) {
  const modal = document.getElementById("eventModal");
  const title = document.getElementById("modalTitle");
  const list = document.getElementById("eventsList");
  if (!modal || !title || !list) return;

  title.textContent = `Events for ${date.toDateString()}`;

  if (!events || events.length === 0) {
    list.innerHTML =
      '<p style="font-size:13px;color:#6b7280;">No events for this day.</p>';
  } else {
    list.innerHTML = events
      .map(
        (ev) => `
        <div class="event-item">
            <div class="event-title">${ev.summary || "(No title)"}</div>
            <div class="event-meta">
                ${ev.startTime ? `Time: ${ev.startTime}<br>` : ""}
                ${ev.location ? `Location: ${ev.location}<br>` : ""}
                ${
                  ev.type === "lecture"
                    ? "Type: Lecture / Course event"
                    : ev.type === "assignment"
                    ? "Type: Assignment due"
                    : ev.type === "google"
                    ? "Source: Google Calendar"
                    : ""
                }
            </div>
            ${
              ev.description
                ? `<div class="event-meta" style="margin-top:4px;">${ev.description}</div>`
                : ""
            }
        </div>
      `
      )
      .join("");
  }

  modal.classList.add("show");
}

// ===== DOM wiring (only if document/window exist) =====
if (typeof window !== "undefined" && typeof document !== "undefined") {
  // load-time setup
  window.addEventListener("load", async function () {
    await loadUserProfile();
    await loadCourseEvents();
    renderCalendar();
    initializeGoogleAPI();
  });

  // navigation
  const backBtn = document.getElementById("backToDashboard");
  if (backBtn) {
    backBtn.addEventListener("click", async function () {
      // Fetch user role and navigate to appropriate dashboard
      try {
        const response = await fetch('/api/user', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          const role = userData.role || 'student';
          window.location.href = role === 'instructor' ? '/instructor' : '/student';
        } else {
          // Default to student if fetch fails
          window.location.href = "/student";
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        window.location.href = "/student";
      }
    });
  }

  const goToCoursesBtn = document.getElementById("goToCourses");
  if (goToCoursesBtn) {
    goToCoursesBtn.addEventListener("click", async () => {
      // Navigate to courses based on user role
      try {
        const response = await fetch('/api/user', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          const role = userData.role || 'student';
          window.location.href = role === 'instructor' ? '/instructor' : '/student';
        } else {
          window.location.href = '/student';
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        window.location.href = '/student';
      }
    });
  }

  const syncBtn = document.getElementById("syncGoogleCalendar");
  if (syncBtn) {
    syncBtn.addEventListener("click", handleSyncCalendarClick);
  }

  const photoInput = document.getElementById("photoInput");
  if (photoInput) {
    photoInput.addEventListener("change", handlePhotoChange);
  }

  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileSubmit);
  }

  const availabilityForm = document.getElementById("availabilityForm");
  if (availabilityForm) {
    availabilityForm.addEventListener("submit", handleAvailabilitySubmit);
  }

  const prevMonthBtn = document.getElementById("prevMonth");
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }

  const nextMonthBtn = document.getElementById("nextMonth");
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }
}

// Optional: expose small helpers for tests if needed
if (typeof module !== "undefined") {
  module.exports = {
    getDateKey,
  };
}
