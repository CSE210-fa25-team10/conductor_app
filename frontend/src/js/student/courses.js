// 配置用户角色和数据
const userRole = 'student'; // 可以是 'student', 'ta', 或 'professor'

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
// 根据角色渲染内容
function renderGroupInfo() {
    const groupInfoSection = document.getElementById('group-info-section');

    if (userRole === 'student') {
        // Student 视图：显示自己的组信息
        const data = userData.student;
        groupInfoSection.innerHTML = `
            <div class="section">
                <div class="section-header">
                    <span>My Group</span>
                </div>
                <div class="group-card">
                    <div class="group-header">
                        <h3>${data.groupName}</h3>
                        <span class="member-count">${data.groupMembers.length} members</span>
                    </div>
                    <div class="group-members">
                        ${data.groupMembers.map(member => `
                            <div class="member-item ${member === data.myName ? 'is-me' : ''}">
                                <div class="member-avatar">${member.charAt(0)}</div>
                                <span>${member}</span>
                                ${member === data.myName ? '<span class="me-badge">You</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } else if (userRole === 'ta') {
        // TA 视图：显示所有组
        const data = userData.ta;
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

// 页面加载时渲染
document.addEventListener('DOMContentLoaded', renderGroupInfo);