const API_BASE = "http://localhost:3000";
const courseId = 101;   // TODO: drive from URL or dropdown
const userId = 12;      // TODO: in real app, derive from session/auth

async function loadMyAttendance() {
  const res = await fetch(
    `${API_BASE}/api/attendance/courses/${courseId}/student/${userId}/overview`
  );
  const data = await res.json();

  const me = data.me;
  const pct = me.percent.toFixed(1);

  const myStats = document.getElementById("myStats");
  myStats.textContent = `${me.attended} / ${me.total_sessions} sessions (${pct}%)`;

  const bar = document.getElementById("myBar");
  bar.style.width = `${pct}%`;

  const groupList = document.getElementById("groupList");
  groupList.innerHTML = "";

  if (!data.groups || data.groups.length === 0) {
    groupList.innerHTML = "<li>No team assigned in this course.</li>";
  } else {
    data.groups.forEach((g) => {
      const li = document.createElement("li");
      li.textContent = `Team ${g.group_id} — ${g.name}: ${g.overall_percent.toFixed(
        1
      )}% overall attendance`;
      groupList.appendChild(li);
    });
  }
}

loadMyAttendance().catch((err) =>
  console.error("my attendance load error", err)
);
