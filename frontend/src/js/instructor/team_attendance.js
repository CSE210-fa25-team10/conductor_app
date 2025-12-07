const API_BASE = "http://localhost:3000";

// Function to get courseId from the URL path
function getCourseIdFromPath() {
  const pathParts = window.location.pathname.split('/');
  // The courseId is the second-to-last part in a path like /instructor/courses/:courseId/manual
  const id = pathParts[pathParts.length - 2]; 
  const courseIdInt = Number.parseInt(id, 10);

  if (Number.isInteger(courseIdInt) && courseIdInt > 0) {
    console.log('DEBUG: Course ID successfully extracted:', courseIdInt);
    return courseIdInt;
   }
   console.error("FATAL: Invalid Course ID in path. ID:", courseIdInt);
   return null;
}

const courseId = getCourseIdFromPath();

if (!courseId) {
  document.getElementById("sessionName").innerText = "Error: Invalid Course ID.";
  document.getElementById("teamsContainer").innerHTML = "<p>Cannot load attendance without a valid Course ID.</p>";
  console.error("FATAL: Stopping script execution due to invalid Course ID.");
  throw new Error("Invalid Course ID.");
}

// ==== LOAD EVERYTHING from backend ====
async function loadData() {

  try {
    // --- 1. Get summary to find latest lecture/activity ---
    const summaryUrl = `/api/attendance/courses/${courseId}/summary`;
     const summaryResponse = await fetch(summaryUrl, { credentials: 'include' });
    
    if (!summaryResponse.ok) {
        const errorBody = await summaryResponse.json().catch(() => ({ error: 'Summary Network Error' }));
        console.error("FATAL: Summary API Failed. Status:", summaryResponse.status, "Body:", errorBody);
        throw new Error(`Failed to fetch summary: ${errorBody.error || summaryResponse.statusText}`);
     }

    const summary = await summaryResponse.json();

    if (!summary.activities || summary.activities.length === 0) {
        document.getElementById("sessionName").innerText = "No activities found for this course.";
        document.getElementById("teamsContainer").innerHTML = "<p>Please start an attendance session first.</p>";
        return;
     }

    const latest = summary.activities[summary.activities.length - 1];
    const latestActivityId = latest.activity_id;

     document.getElementById("sessionName").innerText =
     `${latest.name} (activity_id=${latestActivityId})`;
     
     // --- 2. Get per-group attendance summary ---
     const groupsUrl = `/api/attendance/courses/${courseId}/groups`;
     const groupsResponse = await fetch(groupsUrl, { credentials: 'include' });

    if (!groupsResponse.ok) {
        const errorBody = await groupsResponse.json().catch(() => ({ error: 'Groups Network Error' }));
        console.error("FATAL: Groups API Failed. Status:", groupsResponse.status, "Body:", errorBody);
        throw new Error(`Failed to fetch groups: ${errorBody.error || groupsResponse.statusText}`);
    }

    const groupsData = await groupsResponse.json();

    renderTeams(groupsData.groups, latestActivityId);

  } catch (error) {
    console.error("LOADDATA FAILED COMPLETELY. Displaying generic error.", error);
    document.getElementById("sessionName").innerText = `Error loading data. See console for details.`;
    document.getElementById("teamsContainer").innerHTML = `<p>Data initialization failed. Is the course valid and are you logged in?</p>`;
 }
}

// ==== RENDER UI (with DOM Fix) ====
function renderTeams(groups, activityId) {
   const container = document.getElementById("teamsContainer");
   container.innerHTML = "";

   groups.forEach(group => {
    const act = group.activities.find(a => a.activity_id === activityId);
    const presentUsers = act ? act.present_users || [] : [];
 
    const box = document.createElement("div");
    box.className = "team-box";

     // --- DOM FIX START (CRITICAL) ---
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody"); 

    thead.innerHTML = `<tr><th>Name</th><th>Status</th><th>Action</th></tr>`;
    table.appendChild(thead);
    table.appendChild(tbody); 

    const teamTitle = document.createElement("div");
    teamTitle.className = "team-title";
    teamTitle.innerText = `Team ${group.group_id} — ${group.name}`;

    box.appendChild(teamTitle); 
    box.appendChild(table); 

    // Load actual group members:
    const studentsUrl = `/api/attendance/courses/${courseId}/groups/${group.group_id}/students`; 
    fetch(studentsUrl, { credentials: 'include' })
     .then(r => {
        if (!r.ok) {
            console.error(`ERROR: Failed to fetch students for group ${group.group_id}. Status: ${r.status}`);
            return Promise.resolve([]); 
        }
        return r.json();
    })
    .then(students => {
          students.forEach(stu => {
          const isPresent = presentUsers.includes(stu.user_id);

          const tr = document.createElement("tr");
          tr.innerHTML = `
          <td>${stu.name}</td>
          <td data-status-uid="${stu.user_id}">${isPresent ? "✔️" : "❌"}</td>
            <td>
               <button data-uid="${stu.user_id}" data-action="${isPresent ? "undo" : "mark"}">
                 ${isPresent ? "Undo" : "Mark"}
                </button>
            </td>
             `;
        tbody.appendChild(tr); 
        });

          tbody.querySelectorAll("button").forEach(btn => {
          btn.addEventListener("click", async () => {
          const userId = Number(btn.dataset.uid);
          const isMarkAction = btn.dataset.action === "mark"; // True if button says "Mark"
          const makePresent = isMarkAction;

                // --- Temporary Local UI Feedback (while waiting for refresh) ---
                const originalText = btn.innerText;
                btn.disabled = true;
                btn.innerText = "Wait...";
   
            const manualUrl = `/api/attendance/courses/${courseId}/manual`;
            const manualRes = await fetch(manualUrl, {
              method: "POST",
              credentials: 'include',
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                activity_id: activityId,
                user_id: userId,
                present: makePresent
              })
            });

            if (!manualRes.ok) {
                 const errorBody = await manualRes.json().catch(() => ({ error: 'Manual Mark Failed' }));
                  console.error('ERROR: Manual Mark failed:', errorBody);
                   btn.disabled = false;
                   btn.innerText = originalText; 
            } else {
            loadData(); 
            }
          });
        });
      })
     .catch(err => {
        console.error('ERROR: Student load failed in renderTeams:', err);
        const errorRow = document.createElement("p");
        errorRow.innerText = "Error loading team members.";
        box.appendChild(errorRow);
    });

    container.appendChild(box);
 });
}

loadData();