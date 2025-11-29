const API_BASE_URL = '/api'; 

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'API call failed');
        }
        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

async function fetchUserInfo() {
    // return await apiCall('/user/complete');
    return{
        succsee: true,
        data: {
            profile: {
                id: "user_123",
                name: "John Doe",
                email: "john.doe@university.edu",
                phone: "+1-234-567-8900",
                major: "Computer Science"
            },
            preferences: {
                pronouns: "he/him",
                freeTime: "Weekday evenings and weekends",
                socialMedia: "@johndoe"
            }
        }
    }
}

async function updateUserPreferences(preferences) {
    // return await apiCall('/user/preferences', {
    //     method: 'PUT',
    //     body: JSON.stringify(preferences)
    // });
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: "Preferences updated successfully",
                data: {
                    ...preferences,
                    updatedAt: new Date().toISOString()
                }
            });
        }, 500);
    });
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
    // const response = await apiCall('/user/courses');
    // return response.data;
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { 
                    id: 1, 
                    name: 'Introduction to Computer Science', 
                    code: 'CS101',
                    semester: '2024-Fall',
                    instructor: 'Dr. Smith',
                    schedule: 'MWF 10:00-11:00'
                },
                { 
                    id: 2, 
                    name: 'Data Structures and Algorithms', 
                    code: 'CS201',
                    semester: '2024-Fall',
                    schedule: 'TTh 14:00-15:30'
                },
                { 
                    id: 3, 
                    name: 'Web Development', 
                    code: 'CS301',
                    semester: '2024-Fall',
                    schedule: 'MWF 13:00-14:00'
                },
                { 
                    id: 4, 
                    name: 'Database Systems', 
                    code: 'CS401',
                    semester: '2024-Fall',
                    schedule: 'TTh 10:00-11:30'
                },
                { 
                    id: 5, 
                    name: 'Machine Learning', 
                    code: 'CS501',
                    semester: '2024-Fall',
                    schedule: 'MWF 15:00-16:00'
                }
            ]);
        }, 800);
    });
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
    // window.location.href = `/course/${courseId}`;
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
    try {
        // const response = await apiCall('/courses', {
        //     method: 'POST',
        //     body: JSON.stringify(courseData)
        // });

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("Created Course with Detail:", courseData); 

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

function initSettings() {
    const settingsBtn = document.querySelector('.icon-btn.settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            showNotification('Settings page coming soon!', 'info');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initUserInfo();
    initCourses();
    initSettings();
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
