/* * /js/instructor/standup.js */

function q(sel) { return document.querySelector(sel); }
function qa(sel) { return Array.from(document.querySelectorAll(sel)); }

// Extract course id from instructor URL, expecting /instructor/courses/:courseId
function getCourseIdFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    // Find index of 'courses' (part of /instructor/courses/:courseId)
    const idx = parts.indexOf('courses'); 
    
    if (idx !== -1 && parts.length > idx + 1) {
        const v = parseInt(parts[idx + 1], 10);
        if (!Number.isNaN(v)) return v;
    }
    
    console.warn('Could not extract courseId from instructor course path:', window.location.pathname);
    return null;
}

const courseId = getCourseIdFromPath();

// Elements for the new feedback feature
const viewFeedbackBtn = q('#view-feedback-btn');
const feedbackModal = q('#feedback-overview-modal');
const feedbackListContent = q('#feedback-list-content');

// Check if critical elements exist
if (!viewFeedbackBtn || !feedbackModal || !feedbackListContent) {
    console.warn('Missing one or more required feedback elements in DOM. Feedback feature disabled.');
}


// --- Modal Functions ---

function openFeedbackModal() {
    if (!feedbackModal) return;
    feedbackModal.classList.add('active'); // Assuming 'active' class makes the modal visible
    q('#modal-overlay').classList.add('active'); // Show overlay
    
    // Attempt to fetch feedback when the modal is opened
    fetchFeedback();
}

function closeFeedbackModal() {
    if (!feedbackModal) return;
    feedbackModal.classList.remove('active');
    q('#modal-overlay').classList.remove('active');
}

// Helper to format date
function formatFeedbackDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper to sanitize text
function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// --- Render Feedback ---
function renderFeedback(entries) {
    feedbackListContent.innerHTML = ''; // Clear previous content

    if (!entries || entries.length === 0) {
        feedbackListContent.innerHTML = `<p class="text-gray-500 p-4 text-center">No anonymous feedback entries found for this course.</p>`;
        return;
    }

    // List of anonymous names
    const anonymousNames = [
    "Mongoose",
    "Hen",
    "Helix",
    "Falcon",
    "Cobra",
    "Viper",
    "Panther",
    "Badger",
    "Otter",
    "Raven"
    ];

    entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'feedback-item';

        // Pick one at random for each feedback entry
        const anonLabel = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];

        // Requested format: "Anonymous Mongoose: ${feedback content, created_at}"
        div.innerHTML = `
            <div class="feedback-header">Anonymous ${anonLabel}</div>
            <div class="feedback-meta">
                Type: ${entry.type || 'N/A'} | Submitted: ${formatFeedbackDate(entry.created_at)}
            </div>
            <div class="feedback-message">${escapeHtml(entry.message || 'No message provided.')}</div>
        `;
        feedbackListContent.appendChild(div);
    });
}

// --- Fetch Feedback from backend --- 
async function fetchFeedback() {
    if (!courseId) {
        feedbackListContent.innerHTML = `<p class="text-red-600 p-4">Error: Missing course ID in URL.</p>`;
        return;
    }

    feedbackListContent.innerHTML = `<p class="text-gray-500 p-4 text-center">Loading student feedback...</p>`;
    viewFeedbackBtn.disabled = true;

    try {
        // Use the standardized instructor API endpoint
        const res = await fetch(`/api/standup/instructor/${courseId}/feedback`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            const err = await res.json().catch(()=>({error: 'unknown'}));
            throw new Error(err.error || 'Failed to fetch anonymous feedback');
        }

        const data = await res.json();
        // Expect data.entries = []
        renderFeedback(Array.isArray(data.entries) ? data.entries : []);

    } catch (err) {
        console.error('fetchFeedback error', err);
        feedbackListContent.innerHTML = `<p class="text-red-600 p-4">Failed to load feedback: ${escapeHtml(err.message)}</p>`;
    } finally {
        viewFeedbackBtn.disabled = false;
    }
}

// --- Event Listeners ---
if (viewFeedbackBtn) {
    viewFeedbackBtn.addEventListener('click', openFeedbackModal);
}

document.addEventListener('DOMContentLoaded', () => {
    
    // Attach event listeners to the modal close button
    const modalCloseBtn = q('#feedback-overview-modal .close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeFeedbackModal);
    }
});

window.closeFeedbackModal = closeFeedbackModal;