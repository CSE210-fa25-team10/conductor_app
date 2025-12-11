const API_BASE_URL = '/api/postman'; 

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            credentials: 'include', 
            
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (response.status === 401) {
            console.warn("Session expired or invalid. Redirecting to login...");
            return; 
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || data.error || 'API call failed');
        }
        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

let currentUserId = null;

async function fetchUserInfo() {
    try {
        const userData = await apiCall('/user'); 
        currentUserId = userData.user_id;

        return {
            success: true,
            data: {
                profile: {
                    id: userData.user_id,
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone || "Not set",
                    major: userData.major || "Computer Science", 
                },
                preferences: {
                    pronouns: userData.pronouns || "Not set",
                    freeTime: userData.availability || "Not set", 
                    socialMedia: userData.slack || "Not set"      
                }
            }
        };
    } catch (error) {
        console.error("Failed to fetch user info", error);
        throw error;
    }
}

async function updateUserPreferences(preferences) {
    const backendPayload = {
        user_id: currentUserId
    };
    if (preferences.pronouns) backendPayload.pronouns = preferences.pronouns;
    if (preferences.freeTime) backendPayload.availability = preferences.freeTime; // freeTime -> availability
    if (preferences.socialMedia) backendPayload.slack = preferences.socialMedia;  // socialMedia -> slack

    const result = await apiCall('/user', {
        method: 'POST',
        body: JSON.stringify(backendPayload)
    });

    return {
        success: true,
        message: "Preferences updated successfully",
        data: {
            ...preferences,
            updatedAt: new Date().toISOString()
        }
    };
}

function renderUserInfo(userData) {
    const { profile, preferences } = userData;
    
    const userGreeting = document.querySelector('.user-greeting');
    if (userGreeting) {
        userGreeting.textContent = `Hi, ${profile.name}`;
    }
    
    const infoFields = {
        'major': profile.major || 'Not set',
        'email': profile.email,
        'pronouns': preferences.pronouns || 'Not set',
        'phone': profile.phone || 'Not set',
        'social media': preferences.socialMedia || 'Not set',
        'free time': preferences.freeTime || 'Not set'
    };
    
    document.querySelectorAll('.info-group').forEach(group => {
        const infoText = group.querySelector('.info-text');
        if (infoText) {
            const originalText = infoText.textContent.toLowerCase();
            

            for (const [key, value] of Object.entries(infoFields)) {
                if (originalText === key) {
                    infoText.textContent = value;
                    infoText.setAttribute('data-field', key);
                    break;
                }
            }
        }
    });
}

function makeFieldsEditable() {
    const editableFields = ['pronouns', 'free time', 'social media'];
    
    document.querySelectorAll('.info-group').forEach(group => {
        const infoBox = group.querySelector('.info-box');
        const infoText = group.querySelector('.info-text');
        const fieldLabel = infoText.getAttribute('data-field');
        
        if (editableFields.includes(fieldLabel)) {
            infoBox.classList.add('editable');
            infoBox.style.cursor = 'pointer';
            
            infoBox.addEventListener('click', () => {
                editField(infoText, fieldLabel);
            });
        }
    });
}

function editField(element, fieldLabel) {
    const currentValue = element.textContent;
    const originalValue = currentValue === 'Not set' ? '' : currentValue;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.className = 'info-edit-input';
    input.placeholder = `Enter your ${fieldLabel}`;
    
    element.textContent = '';
    element.appendChild(input);
    input.focus();
    input.select();
    
    const saveEdit = async () => {
        const newValue = input.value.trim();
        
        if (newValue === originalValue) {
            element.textContent = currentValue;
            return;
        }
        
        element.textContent = 'Saving...';
        
        try {
            const fieldMapping = {
                'pronouns': 'pronouns',
                'free time': 'freeTime',
                'social media': 'socialMedia'
            };
            
            const fieldKey = fieldMapping[fieldLabel];
            const updateData = { [fieldKey]: newValue };
            
            await updateUserPreferences(updateData);
            
            element.textContent = newValue || 'Not set';
            showNotification('Updated successfully!', 'success');
            
        } catch (error) {
            element.textContent = currentValue;
            showNotification('Failed to update. Please try again.', 'error');
        }
    };
    
    const cancelEdit = () => {
        element.textContent = currentValue;
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
}

/* Courses */
async function fetchUserCourses() {
    if (!currentUserId) {
        console.warn("User ID not set, skipping fetch courses");
        return [];
    }
    const coursesData = await apiCall(`/courses?user_id=${currentUserId}`);
    return coursesData.map(c => ({
        id: c.course_id,
        name: c.name,
        code: c.code || 'N/A',
        semester: c.semester || 'Current',
        instructor: 'TBD', 
        schedule: 'TBD'   
    }));
}

function renderCourses(courses) {
    const coursesList = document.getElementById('coursesList');
    
    if (!courses || courses.length === 0) {
        coursesList.innerHTML = `
            <div class="empty-state">
                <p>No courses available yet</p>
                <button class="join-class-btn" onclick="showCreateCourseModal()">
                    Create a Course
                </button>
            </div>
        `;
        return;
    }
    
    coursesList.innerHTML = courses.map(course => `
        <div class="course-item" onclick="goToCourse(${course.id})">
            <div class="course-info">
                <div class="course-main">
                    <span class="course-name">${course.name}</span>
                    <span class="course-code">${course.code}</span>
                </div>
                ${course.schedule ? `<span class="course-schedule">${course.schedule}</span>` : ''}
            </div>
            <svg class="course-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" 
                      stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
    `).join('');
}

function goToCourse(courseId) {
    console.log('Going to course:', courseId);
    window.location.href = `/instructor/courses/${courseId}`;
    showNotification(`Navigating to course ${courseId}...`, 'info');
}

/* Teacher/admin creates a course */
function showCreateCourseModal() {
    const modal = document.getElementById('createCourseModal');
    if (modal) {
        modal.classList.add('active');
        const firstInput = modal.querySelector('input[name="courseName"]');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
}

function closeCreateCourseModal() {
    const modal = document.getElementById('createCourseModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            document.getElementById('createCourseForm').reset();
        }, 300);
    }
}

async function handleCreateCourse(event) {
    event.preventDefault(); 

    const form = event.target;
    const formData = new FormData(form);
    
    const courseData = {
        name: formData.get('courseName').trim(),
        code: formData.get('courseCode').trim(),
        semester: formData.get('semester').trim(),
        instructor: formData.get('instructor').trim(),
        schedule: formData.get('schedule').trim(),
        detail: formData.get('courseDetail').trim(), 
        createdAt: new Date().toISOString()
    };

    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    try {
        await createCourse(courseData);
        
        closeCreateCourseModal();
        
    } catch (error) {
        console.error(error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    } finally {
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }, 500);
    }
}

async function createCourse(courseData) {
    const payload = {
        name: courseData.name,
        code: courseData.code,
        semester: courseData.semester,
        description: courseData.detail 
    };

    try {
        const response = await apiCall('/course', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        console.log("Created Course:", response);
        showNotification('Course created successfully!', 'success');
        
        await initCourses();

    } catch (error) {
        showNotification(error.message || 'Failed to create course', 'error');
        throw error; 
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

async function initUserInfo() {
    try {
        const response = await fetchUserInfo();
        renderUserInfo(response.data);
        makeFieldsEditable();
    } catch (error) {
        console.error('Error loading user info:', error);
        showNotification('Failed to load user information', 'error');
    }
}

async function initCourses() {
    const coursesList = document.getElementById('coursesList');
    
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
                <button class="retry-btn" onclick="initCourses()">Retry</button>
            </div>
        `;
    }
}

function initLogout() {
    const logoutBtn = document.querySelector('.icon-btn.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.location.href = '/login'; 
        });
    }
}

function initAvatarClick() {
    const avatar = document.querySelector('.avatar');
    if (avatar) {
        avatar.style.cursor = 'pointer';
        avatar.addEventListener('click', () => {
            window.location.href = '/profile';
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await initUserInfo();
    initCourses();
    initLogout();
    initAvatarClick();
    const joinClassBtn = document.querySelector('.top-bar .join-class-btn');
    if (joinClassBtn) {
        joinClassBtn.addEventListener('click', showCreateCourseModal);
    }

    const modal = document.getElementById('createCourseModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCreateCourseModal();
            }
        });
    }
});
