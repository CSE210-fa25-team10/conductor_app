// 模拟从后端获取课程数据
async function fetchUserCourses() {
    // 这里替换为你的实际 API 调用
    // const response = await fetch('/api/user/courses');
    // const courses = await response.json();
    
    // 模拟数据
    return [
        { id: 1, name: 'Introduction to Computer Science', code: 'CS101' },
        { id: 2, name: 'Data Structures and Algorithms', code: 'CS201' },
        { id: 3, name: 'Web Development', code: 'CS301' },
        { id: 4, name: 'Database Systems', code: 'CS401' },
        { id: 5, name: 'Machine Learning', code: 'CS501' }
    ];
}

// 渲染课程列表
function renderCourses(courses) {
    const coursesList = document.getElementById('coursesList');
    
    // 如果没有课程
    if (!courses || courses.length === 0) {
        coursesList.innerHTML = `
            <div class="empty-state">
                <p>No courses enrolled yet</p>
            </div>
        `;
        return;
    }
    
    // 生成课程项
    coursesList.innerHTML = courses.map(course => `
        <div class="course-item" onclick="goToCourse(${course.id})">
            <div>
                <span class="course-name">${course.name}</span>
                <span class="course-code">${course.code}</span>
            </div>
            <svg class="course-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
    `).join('');
}

// 点击课程后的处理
function goToCourse(courseId) {
    console.log('Going to course:', courseId);
    // 这里添加跳转逻辑
    // window.location.href = `/course/${courseId}`;
}

// 页面加载时获取并显示课程
async function initCourses() {
    const coursesList = document.getElementById('coursesList');
    
    // 显示加载状态
    coursesList.innerHTML = `
        <div class="loading-state">
            <p>Loading courses...</p>
        </div>
    `;
    
    try {
        const courses = await fetchUserCourses();
        renderCourses(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
        coursesList.innerHTML = `
            <div class="empty-state">
                <p>Failed to load courses</p>
            </div>
        `;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', initCourses);