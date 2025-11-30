const API_BASE = "http://localhost:3000"; // Backend URL (using 127.0.0.1 for CORS consistency)
        
// DUMMY DATA (Must match data inserted into the DB: user_id 10, course_id 101)
const DUMMY_USER = { user_id: 10, name: "brandon", course_id: 101 };

// DOM Elements
const contentEl = document.getElementById('contentEl');
const submitBtn = document.getElementById('submitBtn');
const entriesContainer = document.getElementById('entriesContainer');
const feedbackMessageEl = document.getElementById('feedbackMessageEl');
const feedbackButtons = document.querySelectorAll('.feedback-btn');

// State for Multi-Sentiment Ratings
let sentiments = {
    personal: 0,
    team: 0,
    course: 0,
};

// --- RATING LOGIC SETUP ---

function setupStarRating(containerId) {
    const container = document.getElementById(containerId);
    const type = containerId.split('-')[0]; // 'personal', 'team', or 'course'
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'sentiment-star';
        star.innerText = '★';
        star.dataset.value = i;
        star.dataset.type = type;

        star.addEventListener('click', () => {
            const value = Number(star.dataset.value);
            sentiments[type] = value;
            updateStars(type, value);
        });

        container.appendChild(star);
    }
}

function updateStars(type, value) {
    const container = document.getElementById(`${type}-stars`);
    container.querySelectorAll('.sentiment-star').forEach(s => {
        s.classList.toggle('selected', Number(s.dataset.value) <= value);
    });
}

setupStarRating('personal-stars');
setupStarRating('team-stars');
setupStarRating('course-stars');


// --- SUBMIT ENTRY LOGIC (POST /api/standup) ---

submitBtn.addEventListener('click', async () => {
    const content = contentEl.value.trim();

    if (!content) {
        alert('Please write something for your entry.');
        return;
    }
    // // Check if all three sentiment ratings have been made
    // if (Object.values(sentiments).some(s => s === 0)) {
    //     alert('Please rate your Personal, Team, and Course sentiment.');
    //     return;
    // }

    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';

    try {
        const res = await fetch(`${API_BASE}/api/standup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: DUMMY_USER.user_id,
                name: DUMMY_USER.name,
                content,
                sentiment_personal: sentiments.personal, 
                sentiment_team: sentiments.team,
                sentiment_course: sentiments.course,
            }),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to submit entry');
        }

        const data = await res.json();
        
        // Add the new entry to the top of the history list
        addEntryToDOM(data.entry);

        // Reset form
        contentEl.value = '';
        sentiments = { personal: 0, team: 0, course: 0 };
        updateStars('personal', 0);
        updateStars('team', 0);
        updateStars('course', 0);

        alert('Standup entry submitted successfully!');

    } catch (err) {
        console.error('Submit error:', err);
        alert(`Error submitting entry: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit Standup';
    }
});


// --- ANONYMOUS FEEDBACK LOGIC (POST /api/standup/feedback) ---

feedbackButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const type = e.target.dataset.type; // 'COURSE' or 'TEAM'
        const message = feedbackMessageEl.value.trim();

        if (!message) {
            alert(`Please enter a message for your anonymous ${type} feedback.`);
            return;
        }

        e.target.disabled = true;
        e.target.innerText = 'Sending...';

        try {
            const res = await fetch(`${API_BASE}/api/standup/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: DUMMY_USER.course_id,
                    type: type,
                    message: message
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to post feedback');
            }

            alert(`Anonymous ${type} feedback posted successfully.`);
            feedbackMessageEl.value = '';
        } catch (err) {
            console.error('Feedback error:', err);
            alert(`Error posting feedback: ${err.message}`);
        } finally {
            e.target.disabled = false;
            // Restore original button text
            const buttonText = `Post Feedback on ${type.charAt(0) + type.slice(1).toLowerCase()}`;
            e.target.innerText = buttonText;
        }
    });
});


// --- FETCH HISTORY LOGIC (GET /api/standup?user_id=X) ---

async function fetchEntries() {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.classList.remove('hidden');
    entriesContainer.innerHTML = ''; // Clear previous content

    try {
        // Use GET method and pass user_id as a query parameter
        const url = `${API_BASE}/api/standup?user_id=${DUMMY_USER.user_id}`;
        
        const res = await fetch(url, {
            method: 'GET', // CORRECT HTTP METHOD
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to fetch entries');
        }

        const data = await res.json();
        
        if (data.entries.length === 0) {
             entriesContainer.innerHTML = `<p class="text-gray-500">No past entries found.</p>`;
        } else {
            // Entries are already ordered DESC by time from the backend
            data.entries.forEach(addEntryToDOM); 
        }

    } catch (err) {
        console.error('Fetch entries error:', err);
        entriesContainer.innerHTML = `<p style="color:red">Failed to load entries: ${err.message}</p>`;
    } finally {
        loadingMessage.classList.add('hidden');
    }
}


// Helper: add a single entry to DOM
function addEntryToDOM(entry) {
    const personalRating = entry.sentiment_personal || 0;
    const teamRating = entry.sentiment_team || 0;
    const courseRating = entry.sentiment_course || 0;

    const div = document.createElement('div');
    div.className = 'p-4 bg-gray-50 rounded-lg shadow-sm space-y-2';
    div.innerHTML = `
        <div class="flex justify-between items-center text-sm text-gray-500 font-medium">
            <span>Entry by ${entry.name || 'Me'}</span>
            <span>${new Date(entry.time).toLocaleString()}</span>
        </div>
        <p class="text-gray-800 text-base">${entry.content}</p>
        <div class="flex text-sm text-gray-700 space-x-6 pt-1 border-t border-gray-200">
            <div>
                <span class="font-medium">Personal:</span>
                <span class="sentiment-emoji">${getEmoji(personalRating)}</span>
            </div>
            <div>
                <span class="font-medium">Team:</span>
                <span class="sentiment-emoji">${getEmoji(teamRating)}</span>
            </div>
            <div>
                <span class="font-medium">Course:</span>
                <span class="sentiment-emoji">${getEmoji(courseRating)}</span>
            </div>
        </div>
    `;
    // Prepend ensures the newest entry goes to the top
    entriesContainer.prepend(div);
}

// Helper to convert rating value (1-5) to an emoji
function getEmoji(rating) {
    // Mapping: 1=Crying, 2=Pensive, 3=Neutral, 4=Slight Smile, 5=Grinning
    const emojis = ['😭', '😔', '😐', '🙂', '😄'];
    // Rating 1 gets index 0, Rating 5 gets index 4
    return emojis[rating - 1] || '❓';
}

// Initial fetch on page load
fetchEntries();