const groupsData = [
    { name: 'Group 1', memberCount: 4 },
    { name: 'Group 2', memberCount: 5 },
    { name: 'Group 3', memberCount: 4 },
    { name: 'Group 4', memberCount: 4 },
    { name: 'Group 5', memberCount: 4 },
    { name: 'Group 6', memberCount: 5 },
    { name: 'Group 7', memberCount: 4 },
    { name: 'Group 8', memberCount: 4 }
];

const groupIconSVG = `
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <path d="M640 773.973333a21.333333 21.333333 0 0 0-12.373333-19.413333l-95.957334-44.373333a106.666667 106.666667 0 0 1-61.866666-96.042667 374.485333 374.485333 0 0 0-0.213334-10.24 21.333333 21.333333 0 0 1 8.277334-20.352c24.362667-18.261333 34.133333-55.253333 34.133333-114.218667 0-56.32-30.378667-85.333333-85.333333-85.333333s-85.333333 29.013333-85.333334 85.333333c0 58.581333 9.898667 95.914667 34.176 114.261334a21.333333 21.333333 0 0 1 8.32 19.797333 261.973333 261.973333 0 0 0-0.213333 10.666667 106.666667 106.666667 0 0 1-61.866667 96.128l-96 44.373333A21.333333 21.333333 0 0 0 213.333333 773.973333V810.666667h426.666667v-36.693334zM298.666667 469.333333c0-80.298667 49.92-128 128-128s128 47.701333 128 128c0 65.578667-10.666667 111.445333-42.24 140.885334v3.626666a64 64 0 0 0 37.12 57.6l96 44.373334c22.613333 10.496 37.12 33.194667 37.12 58.112V853.333333H170.666667v-79.36a64 64 0 0 1 37.12-58.112l96-44.416a64 64 0 0 0 37.205333-61.226666C309.504 580.693333 298.666667 534.570667 298.666667 469.333333z m426.666666 170.666667h85.333334v-36.693333a21.333333 21.333333 0 0 0-12.373334-19.413334l-95.957333-44.373333a106.666667 106.666667 0 0 1-61.866667-96.042667 374.485333 374.485333 0 0 0-0.213333-10.24 21.333333 21.333333 0 0 1 8.277333-20.352c24.362667-18.261333 34.133333-55.253333 34.133334-114.218666 0-56.32-30.378667-85.333333-85.333334-85.333334-45.525333 0-74.197333 19.925333-82.688 58.794667a221.568 221.568 0 0 0-41.002666-11.861333C487.253333 203.392 532.650667 170.666667 597.333333 170.666667c78.08 0 128 47.701333 128 128 0 65.578667-10.666667 111.445333-42.24 140.885333v3.626667a64 64 0 0 0 37.12 57.6l96 44.373333c22.613333 10.496 37.12 33.194667 37.12 58.112V640a42.666667 42.666667 0 0 1-42.666666 42.666667h-85.333334v-42.666667z" fill="currentColor"/>
    </svg>
`;

const userRole = "prof";

function showModal(type) {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById(type + '-modal').classList.add('active');
}

function hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('assignment-modal').classList.remove('active');
    document.getElementById('attendance-modal').classList.remove('active');
}

// group detail modal
function showGroupDetailModal() {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('group-detail-modal').classList.add('active');
}

function hideGroupDetailModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('group-detail-modal').classList.remove('active');
}

function getCourseIdFromPath() {
    const pathParts = window.location.pathname.split('/');
    const courseId = Number.parseInt(pathParts[pathParts.length - 1], 10);
    return Number.isInteger(courseId) && courseId > 0 ? courseId : null;
}

let instructorOverviewData = null;

async function fetchAndCacheOverviewData(courseId) {
    if (instructorOverviewData) return;  // already loaded

    try {
        const res = await fetch(`/api/attendance/courses/${courseId}/instructor-overview`, {
            credentials: 'include'
        });

        if (!res.ok) throw new Error("Bad response: " + res.status);

        instructorOverviewData = await res.json();

    } catch (err) {
        console.error("Failed to fetch group overview:", err);
        alert("Failed to load attendance data.");
        instructorOverviewData = null;
    }
}


function renderGroups() {
    if (userRole !== "prof") return;

    const section = document.getElementById('group-info-section');
    if (!section) return console.error("Missing #group-info-section");

    // If backend provided groups → use them
    const groups = (instructorOverviewData?.groups)
        ? instructorOverviewData.groups.map(g => ({
            groupId: g.group_id,
            name: g.name,
            memberCount: g.members.length
        }))
        : groupsData.map((g, idx) => ({
            groupId: idx + 1,
            ...g
        }));

    section.innerHTML = `
        <div class="section">
            <div class="section-header"><span>Groups Overview</span></div>
            <div class="groups-grid" id="groups-grid">
                ${groups.map(g => `
                    <div class="group-summary-card clickable"
                         data-group-id="${g.groupId}"
                         data-group-name="${g.name}">
                        <div class="group-icon">${groupIconSVG}</div>
                        <div class="group-summary-info">
                            <h3>${g.name}</h3>
                            <p>${g.memberCount} members</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // attach click handler AFTER rendering
    document.getElementById('groups-grid')
        .addEventListener('click', handleGroupCardClick);
}


function renderGroupAttendanceDetails(groupId, groupName) {
    const content = document.getElementById('group-detail-content');
    document.getElementById('group-detail-title').textContent = `${groupName} Attendance`;

    if (!instructorOverviewData?.groups) {
        content.innerHTML = `<p>Data unavailable</p>`;
        return showGroupDetailModal();
    }

    const g = instructorOverviewData.groups.find(x => String(x.group_id) === String(groupId));
    if (!g) {
        content.innerHTML = `<p>Group not found</p>`;
        return showGroupDetailModal();
    }

    const memberHtml = g.members.map(m => `
        <li><strong>${m.name}</strong>: ${m.attended}/${m.total_sessions} sessions 
            (${m.percent}%)</li>
    `).join('');

    content.innerHTML = `
        <h4>Team Performance Summary</h4>
        <p><strong>Overall Team Attendance:</strong> ${g.overall_percent}%</p>
        <hr/>
        <h4>Individual Member Records</h4>
        <ul>${memberHtml}</ul>
    `;

    showGroupDetailModal();
}


function handleGroupCardClick(event) {
    const card = event.target.closest('.group-summary-card');
    if (!card) return;

    const groupId = card.dataset.groupId;
    const name = card.dataset.groupName;

    renderGroupAttendanceDetails(groupId, name);
}


function setupAttendanceButtons() {
    const courseId = getCourseIdFromPath();
    if (!courseId) return;

    const manual = document.getElementById('mark-manual-btn');
    const overview = document.getElementById('view-overview-btn');

    manual?.addEventListener('click', () =>
        window.location.href = `/instructor/courses/${courseId}/manual`
    );
    overview?.addEventListener('click', () =>
        window.location.href = `/instructor/courses/${courseId}/overview`
    );
}


document.addEventListener('DOMContentLoaded', async () => {
    const courseId = getCourseIdFromPath();

    if (courseId) await fetchAndCacheOverviewData(courseId);

    setupAttendanceButtons();
    renderGroups();
});

// Expose for HTML
window.showModal = showModal;
window.hideModal = hideModal;
window.hideGroupDetailModal = hideGroupDetailModal;
