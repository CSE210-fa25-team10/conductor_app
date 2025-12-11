// 配置用户角色和数据
let userRole = 'student'; // 可以是 'student', 'ta', 或 'professor'

// 模拟数据
const userData = {
    student: {
        groupName: 'Group 4',
        groupMembers: ['Chenhao Yan', 'Lisa Wang', 'Zheng Yuan'],
        myName: 'Chenhao Yan'
    },
    ta: {
        groups: [
            { name: 'Group 1', memberCount: 4 },
            { name: 'Group 2', memberCount: 5 },
            { name: 'Group 3', memberCount: 4 },
            { name: 'Group 4', memberCount: 4 }
        ]
    }
};
async function getCourseInfoById() {
    const pathParts = window.location.pathname.split('/');
    const courseId = pathParts[pathParts.length - 1];

    console.log('Course ID:', courseId);

    try {
        const res = await fetch(`/api/postman/course?course_id=${courseId}`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch course');
        }

        const courseData = await res.json();
        console.log('Course data:', courseData);
        return courseData;

    } catch (e) {
        console.error('Error fetching course:', e);
        // alert('Error fetching course: ' + e.message);
    }
}


getCourseInfoById()
    .then(course => {
        document.getElementById('course-title').textContent = course.name + " " + course.code;
    })
    .catch(err => {
        console.error('Error fetching course:', err);
    });
async function getAssignmentsByCourseId() {
    const pathParts = window.location.pathname.split('/');
    const courseId = pathParts[pathParts.length - 1];
    try {
        const res = await fetch(`/api/postman/assignment?course_id=${courseId}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch assignments');
        }

        const assignmentsData = await res.json();
        console.log('assignments data:', assignmentsData);
        return assignmentsData;
    } catch (e) {
        console.error('Error fetching assignments:', e);
        return [];
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    const formatted = date.toLocaleString('en-US', options);
    return formatted.replace(',', ' @');
}

function renderAssignments(assignments) {
    const container = document.querySelector('.section');

    const existingCards = container.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());

    assignments.forEach(assignment => {
        const card = document.createElement('div');
        card.className = 'card';

        const dueDate = formatDate(assignment.due_date);

        card.innerHTML = `
            <div class="card-icon">🏔️</div>
            <div class="card-content">
                <div class="card-title">${assignment.name}</div>
                <div class="card-due">Due ${dueDate}</div>
                <div class="card-status">
                    <span class="status-icon"></span>
                    <span>(Status) Not Submitted • No Submission</span>
                </div>
            </div>
            <div class="card-grade">Grade: --/--</div>
        `;
        container.appendChild(card);
    });
}

async function initAssignments() {
    const assignments = await getAssignmentsByCourseId();
    if (assignments && assignments.length > 0) {
        renderAssignments(assignments);
    }
}

document.addEventListener('DOMContentLoaded', initAssignments);

async function fetchCurrentUserId() {
    try {
        const res = await fetch('/api/groups/users/me-id', { 
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error('Failed to fetch current user ID');
        }
        const data = await res.json();
        return data.user_id; 
    } catch (e) {
        console.error('Error fetching current user ID:', e);
        return null;
    }
}

async function fetchCurrentUserInfo(){
    try {
        const res = await fetch('/api/postman/user', {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error('Failed to fetch current user ID');
        }
        const data = await res.json();
        console.log('Current user info:', data);
        userRole = data.role; 
        return data
    } catch (e) {
        console.error('Error fetching current user ID:', e);
        return null;
    }
}

// 根据角色渲染内容
async function renderGroupInfo() {
    const groupInfoSection = document.getElementById('group-info-section');
    const pathParts = window.location.pathname.split('/');
    const courseId = pathParts[pathParts.length - 1];
    const currentUserId = await fetchCurrentUserId();

    if (userRole === 'student') {
        try {
            // 1. Fetch the student's group information
            const res = await fetch(`/api/groups/${courseId}/my-group`, {
                method: "GET",
                credentials: "include",
            });

            if (res.status === 404) {
                // ... (404 handling remains the same) ...
                groupInfoSection.innerHTML = `
                    <div class="section">
                        <div class="section-header">
                            <span>My Group</span>
                        </div>
                        <div class="group-card" style="padding: 20px; text-align: center; color: #777;">
                            <p>You are currently not assigned to a group for this course.</p>
                        </div>
                    </div>
                `;
                return;
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch student group');
            }

            const { group: groupData } = await res.json();
            const memberIds = groupData.members || [];
            
            // 2. Fetch User Names using the new API
            let displayMembers = [];
            if (memberIds.length > 0) {
                const idsString = memberIds.join(',');
                const userRes = await fetch(`/api/groups/users/${idsString}`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!userRes.ok) {
                    throw new Error('Failed to fetch group member names');
                }
                const { users: memberNameData } = await userRes.json();
                
                // Map the member IDs (from group data) to their fetched names
                const nameMap = memberNameData.reduce((acc, user) => {
                    acc[user.userId] = user.name;
                    return acc;
                }, {});

                // Now create the final member list structure
                // NOTE: You need the current user's ID to check for 'isMe'. 
                // We'll assume the current user ID is available in a global variable or session variable like 'window.currentUserId'
                // const currentUserId = 'YOUR_CURRENT_USER_ID_FROM_SESSION_VARIABLE'; 

                displayMembers = memberIds.map(userId => ({
                    id: userId,
                    name: nameMap[String(userId)] || `Unknown User (${userId})`,
                    isMe: String(userId) === String(currentUserId)
                }));
            }


            // 3. Render the Group Info with Names
            const groupName = groupData.name;
            const memberCount = displayMembers.length;

            groupInfoSection.innerHTML = `
                <div class="section">
                    <div class="section-header">
                        <span>My Group</span>
                    </div>
                    <div class="group-card">
                        <div class="group-header">
                            <h3>${groupName}</h3>
                            <span class="member-count">${memberCount} members</span>
                        </div>
                        <div class="group-details">
                            <p><strong>Slack:</strong> ${groupData.slack || 'N/A'}</p>
                            <p><strong>Repository:</strong> <a href="${groupData.repository_link}" target="_blank">${groupData.repository_link || 'N/A'}</a></p>
                            <p><strong>Mantra:</strong> ${groupData.mantra || 'No mantra set'}</p>
                        </div>
                        <div class="group-members">
                            ${displayMembers.map(member => `
                                <div class="member-item ${member.isMe ? 'is-me' : ''}">
                                    <div class="member-avatar">${member.name.charAt(0)}</div>
                                    <span>${member.name}</span>
                                    ${member.isMe ? '<span class="me-badge">You</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error('Error fetching student group info:', e);
            groupInfoSection.innerHTML = `<p style="color: red;">Error: Failed to load your group information.</p>`;
        }
    }
     else if (userRole === 'ta' || userRole === 'teamlead') {
         console.log("Rendering TA/teamlead view");
        // TA / Professor view (Kept for completeness, though not explicitly requested to change)
        const data = userData.ta; // Assuming TA data structure for now
        groupInfoSection.innerHTML = `
            <div class="section">
                <div class="section-header">
                    <span>Groups Overview</span>
                </div>
                <div class="groups-grid">
                    ${data.groups.map(group => `
                        <div class="group-summary-card">
                            <div class="group-icon">
                                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                     <path d="M640 773.973333a21.333333 21.333333 0 0 0-12.373333-19.413333l-95.957334-44.373333a106.666667 106.666667 0 0 1-61.866666-96.042667 374.485333 374.485333 0 0 0-0.213334-10.24 21.333333 21.333333 0 0 1 8.277334-20.352c24.362667-18.261333 34.133333-55.253333 34.133333-114.218667 0-56.32-30.378667-85.333333-85.333333-85.333333s-85.333333 29.013333-85.333334 85.333333c0 58.581333 9.898667 95.914667 34.176 114.261334a21.333333 21.333333 0 0 1 8.32 19.797333 261.973333 261.973333 0 0 0-0.213333 10.666667 106.666667 106.666667 0 0 1-61.866667 96.128l-96 44.373333A21.333333 21.333333 0 0 0 213.333333 773.973333V810.666667h426.666667v-36.693334zM298.666667 469.333333c0-80.298667 49.92-128 128-128s128 47.701333 128 128c0 65.578667-10.666667 111.445333-42.24 140.885334v3.626666a64 64 0 0 0 37.12 57.6l96 44.373334c22.613333 10.496 37.12 33.194667 37.12 58.112V853.333333H170.666667v-79.36a64 64 0 0 1 37.12-58.112l96-44.416a64 64 0 0 0 37.205333-61.226666C309.504 580.693333 298.666667 534.570667 298.666667 469.333333z m426.666666 170.666667h85.333334v-36.693333a21.333333 21.333333 0 0 0-12.373334-19.413334l-95.957333-44.373333a106.666667 106.666667 0 0 1-61.866667-96.042667 374.485333 374.485333 0 0 0-0.213333-10.24 21.333333 21.333333 0 0 1 8.277333-20.352c24.362667-18.261333 34.133333-55.253333 34.133334-114.218666 0-56.32-30.378667-85.333333-85.333334-85.333334-45.525333 0-74.197333 19.925333-82.688 58.794667a221.568 221.568 0 0 0-41.002666-11.861333C487.253333 203.392 532.650667 170.666667 597.333333 170.666667c78.08 0 128 47.701333 128 128 0 65.578667-10.666667 111.445333-42.24 140.885333v3.626667a64 64 0 0 0 37.12 57.6l96 44.373333c22.613333 10.496 37.12 33.194667 37.12 58.112V640a42.666667 42.666667 0 0 1-42.666666 42.666667h-85.333334v-42.666667z" fill="currentColor"/>
                                </svg>
                            </div>
                            <div class="group-summary-info">
                                <h3>${group.name}</h3>
                                <p>${group.memberCount} members</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const pathParts = window.location.pathname.split('/');
    const courseId = pathParts[pathParts.length - 1];

    const btn = document.getElementById("view-attendance-btn");
    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = `/student/attendance?course_id=${courseId}`;
        });
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const userInfo = await fetchCurrentUserInfo();
    if (userInfo) {
        console.log(`Successfully fetched user role: ${userRole}`);
        await renderGroupInfo();
    } else {
        console.error("Critical: Failed to load user info. Cannot proceed with rendering.");
    }
});