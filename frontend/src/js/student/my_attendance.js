// // const API_BASE = "http://localhost:3000";
// // const courseId = 101;   // TODO: drive from URL or dropdown
// // const userId = 10;      // TODO: in real app, derive from session/auth
// console.log("my_attendance.js loaded");

// const params = new URLSearchParams(window.location.search);
// const courseId = Number(params.get("course_id"));
// // const userId = Number(params.get("user_id"));

// async function loadMyAttendance() {
//   const res = await fetch(`/api/attendance/courses/${courseId}/student/overview`, {
//       credentials: 'include'
//     });

//   if (!res.ok) {
//         // Handle HTTP errors (like 400 or 500 from the backend controller)
//         const errorData = await res.json().catch(() => ({ error: 'Unknown API Error' }));
//         console.error('API Error:', errorData.error);
//         throw new Error(`Failed to load attendance: ${errorData.error}`);
//     }
//   const data = await res.json();
//   console.log("data ", data);

//   const me = data.me;
//   const pct = me.percent.toFixed(1);

//   const myStats = document.getElementById("myStats");
//   myStats.textContent = `${me.attended} / ${me.total_sessions} sessions (${pct}%)`;

//   const bar = document.getElementById("myBar");
//   bar.style.width = `${pct}%`;

//   const groupList = document.getElementById("groupList");
//   groupList.innerHTML = "";

//   if (!data.groups || data.groups.length === 0) {
//     groupList.innerHTML = "<li>No team assigned in this course.</li>";
//   } else {
//     data.groups.forEach((g) => {
//       const li = document.createElement("li");
//       li.textContent = `Team ${g.group_id} — ${g.name}: ${g.overall_percent.toFixed(
//         1
//       )}% overall attendance`;
//       groupList.appendChild(li);
//     });
//   }
// }

// loadMyAttendance().catch((err) =>
//   console.error("my attendance load error", err)
// );


console.log("my_attendance.js loaded");

// Get course_id from URL
const params = new URLSearchParams(window.location.search);
const courseId = Number(params.get("course_id"));
console.log("Course ID from URL:", courseId);

// Debug: check if courseId is valid
if (!courseId || isNaN(courseId)) {
    console.error("Invalid or missing course_id in URL!");
}

// Function to load attendance
async function loadMyAttendance() {
    console.log("Starting to load attendance...");

    try {
        // Make fetch request to backend with credentials (cookies)
        console.log("Sending fetch request to backend...");
        const res = await fetch(`/api/attendance/courses/${courseId}/student/overview`, {
            credentials: 'include'
        });

        console.log("Fetch response status:", res.status);

        // Parse JSON
        const data = await res.json();
        console.log("Data received from backend:", data);

        // Check if session/user info is missing
        if (!data.me) {
            console.warn("Warning: 'me' field missing in API response. Likely user/session not found.");
        }

        // Update DOM
        const me = data.me || { attended: 0, total_sessions: 0, percent: 0 };
        const pct = me.percent ? me.percent.toFixed(1) : 0;

        console.log(`My attendance: ${me.attended}/${me.total_sessions} (${pct}%)`);

        const myStats = document.getElementById("myStats");
        if (myStats) myStats.textContent = `${me.attended} / ${me.total_sessions} sessions (${pct}%)`;

        const bar = document.getElementById("myBar");
        if (bar) bar.style.width = `${pct}%`;

        const groupList = document.getElementById("groupList");
        if (groupList) {
            groupList.innerHTML = "";

            if (!data.groups || data.groups.length === 0) {
                console.log("No group data found for this course.");
                groupList.innerHTML = "<li>No team assigned in this course.</li>";
            } else {
                console.log(`Rendering ${data.groups.length} group(s)...`);
                data.groups.forEach((g) => {
                    const li = document.createElement("li");
                    li.textContent = `Team ${g.group_id} — ${g.name}: ${g.overall_percent.toFixed(1)}% overall attendance`;
                    groupList.appendChild(li);
                });
            }
        }
    } catch (err) {
        console.error("my attendance load error:", err);
    }
}

// Call the function
loadMyAttendance();
