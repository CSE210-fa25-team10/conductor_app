const API_BASE = "http://localhost:3000";
const courseId = 101;

// ==== LOAD EVERYTHING ====
async function loadData() {
  // 1. Get summary to find latest lecture/activity
  const summary = await fetch(`${API_BASE}/api/attendance/courses/${courseId}/summary`)
    .then(r => r.json());

  const latest = summary.activities[summary.activities.length - 1];
  const latestActivityId = latest.activity_id;

  document.getElementById("sessionName").innerText =
    `${latest.name} (activity_id=${latestActivityId})`;

  // 2. Get per-group attendance summary
  const groupsData = await fetch(`${API_BASE}/api/attendance/courses/${courseId}/groups`)
    .then(r => r.json());

  renderTeams(groupsData.groups, latestActivityId);
}

// ==== RENDER UI ====
function renderTeams(groups, activityId) {
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  groups.forEach(group => {
    const act = group.activities.find(a => a.activity_id === activityId);
    const presentUsers = act.present_users || [];

    const box = document.createElement("div");
    box.className = "team-box";
    box.innerHTML = `
      <div class="team-title">Team ${group.group_id} — ${group.name}</div>
      <table>
        <thead>
          <tr><th>Name</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    const tbody = box.querySelector("tbody");

    // Load actual group members:
    fetch(`${API_BASE}/api/attendance/courses/${courseId}/groups/${group.group_id}/students`)
      .then(r => r.json())
      .then(students => {
        students.forEach(stu => {
          const isPresent = presentUsers.includes(stu.user_id);

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${stu.name}</td>
            <td>${isPresent ? "✔️" : "❌"}</td>
            <td>
              <button data-uid="${stu.user_id}">
                ${isPresent ? "Undo" : "Mark"}
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });

        tbody.querySelectorAll("button").forEach(btn => {
          btn.addEventListener("click", async () => {
            const userId = Number(btn.dataset.uid);
            const makePresent = btn.innerText === "Mark";

            await fetch(`${API_BASE}/api/attendance/manual`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                activity_id: activityId,
                user_id: userId,
                present: makePresent
              })
            });

            loadData(); // refresh UI
          });
        });
      });

    container.appendChild(box);
  });
}

loadData();
