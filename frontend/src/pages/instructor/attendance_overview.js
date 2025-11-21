const API_BASE = "http://localhost:3000";
const courseId = 101; // TODO: wire from URL / dropdown

async function loadOverview() {
  const res = await fetch(
    `${API_BASE}/api/attendance/courses/${courseId}/instructor-overview`
  );
  const data = await res.json();

  document.getElementById("totalSessions").textContent =
    data.total_sessions ?? 0;

  const container = document.getElementById("groupsContainer");
  container.innerHTML = "";

  data.groups.forEach((g) => {
    const card = document.createElement("div");
    card.className = "group-card";

    const pct = g.overall_percent.toFixed(1);

    card.innerHTML = `
      <div class="group-header">
        <div class="group-name">Team ${g.group_id} — ${g.name}</div>
        <div class="group-percent">Overall: ${pct}%</div>
      </div>
      <div class="bar">
        <div class="bar-inner" style="width: ${pct}%;"></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Attended</th>
            <th>Total</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    const tbody = card.querySelector("tbody");
    g.members.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name}</td>
        <td>${m.attended}</td>
        <td>${m.total_sessions}</td>
        <td>${m.percent.toFixed(1)}%</td>
      `;
      tbody.appendChild(tr);
    });

    container.appendChild(card);
  });
}

loadOverview().catch((err) => console.error("overview load error", err));
