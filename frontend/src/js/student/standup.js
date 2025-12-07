/* /js/student/standup.js */

// const API_BASE = "http://localhost:3000";

function q(sel) { return document.querySelector(sel); }
function qa(sel) { return Array.from(document.querySelectorAll(sel)); }

// Extract course id from URL, expecting /course/:id
function getCourseIdFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // find index of "course" then take next segment
  const idx = parts.indexOf('course');
  if (idx !== -1 && parts.length > idx + 1) {
    const v = parseInt(parts[idx + 1], 10);
    if (!Number.isNaN(v)) return v;
  }
  // fallback: try second segment (e.g. /course/1 -> parts[1])
  if (parts.length >= 2) {
    const v = parseInt(parts[1], 10);
    if (!Number.isNaN(v)) return v;
  }
  console.warn('Could not extract courseId from path:', window.location.pathname);
  return null;
}

const courseId = getCourseIdFromPath();

const textarea = q('#standup-textarea');
const saveBtn = q('#save-standup-btn');
const saveStatus = q('#save-status-message');

const datesCol = q('#journal-dates-content');
const pulsesCol = q('#journal-pulses-content');

const feedbackBtn = q('#feedback-btn');
const feedbackModal = q('#feedback-modal');
const feedbackType = q('#feedback-type');
const feedbackMessage = q('#feedback-message');
const submitFeedbackBtn = q('#submit-feedback-btn');
const closeFeedbackModalBtn = q('#close-feedback-modal');
const feedbackStatus = q('#feedback-status');

// If any required element missing, warn (helps debugging)
const requiredEls = [
  ['textarea', textarea],
  ['saveBtn', saveBtn],
  ['datesCol', datesCol],
  ['pulsesCol', pulsesCol],
  ['feedbackBtn', feedbackBtn],
  ['feedbackModal', feedbackModal],
  ['submitFeedbackBtn', submitFeedbackBtn],
];
requiredEls.forEach(([name, el]) => { if (!el) console.warn(`Missing element ${name} in DOM`); });

let sentiments = { personal: 0, team: 0, course: 0 };
let allEntries = []; // fetched entries for this course
let selectedDateKey = null; // 'YYYY-MM-DD' string or null => shows all

function initEmojiButtons() {
  qa('.pulse-row').forEach(row => {
    const category = row.dataset.category;
    row.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = Number(btn.dataset.value) || 0;
        sentiments[category] = val;
        row.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected-emoji'));
        btn.classList.add('selected-emoji');
      });
    });
  });
}
initEmojiButtons();

function toDateKey(isoOrMs) {
  const d = new Date(isoOrMs);
  if (Number.isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function niceDate(isoOrMs) {
  const d = new Date(isoOrMs);
  return d.toLocaleString(); // readable date/time
}
function shortDateLabel(dateKey) {
  // dateKey = YYYY-MM-DD
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function getEmoji(rating) {
  const emojis = ['😭','😔','😐','🙂','😄'];
  return emojis[(rating || 0) - 1] || '❓';
}

// --- Render history ---
function renderHistory(entries) {
  allEntries = entries || [];

  // Group by date-key
  const groups = allEntries.reduce((acc, e) => {
    const key = toDateKey(e.time) || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  // Sort date keys descending
  const dateKeys = Object.keys(groups).sort((a,b) => b.localeCompare(a));

  // Render left column: dates
  datesCol.innerHTML = '';
  if (dateKeys.length === 0) {
    datesCol.innerHTML = `<p class="text-gray-500 text-sm">No recent reports.</p>`;
  } else {

    // Add "All" option at top
    const allBtn = document.createElement('div');
    allBtn.className = 'journal-date-link cursor-pointer p-2 mb-2 rounded font-medium';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => {
      selectedDateKey = null;

      datesCol.querySelectorAll('.journal-date-link').forEach(n => n.classList.remove('bg-indigo-50'));
      allBtn.classList.add('bg-indigo-50');
      renderPulsesForKey(allEntries); // Pass all entries
    });
    datesCol.prepend(allBtn);

    dateKeys.forEach(key => {
      const listItem = document.createElement('div');
      listItem.className = 'journal-date-link cursor-pointer p-2 hover:bg-gray-100 rounded';
      listItem.dataset.dateKey = key;
      listItem.innerHTML = `<div class="font-medium">${shortDateLabel(key)}</div>
                            <div class="text-xs text-gray-500">${groups[key].length} report(s)</div>`;
      listItem.addEventListener('click', () => {
        selectedDateKey = key;
        datesCol.querySelectorAll('.journal-date-link').forEach(n => n.classList.remove('bg-indigo-50'));
        listItem.classList.add('bg-indigo-50');

        renderPulsesForKey(groups[key]);
      });
      datesCol.appendChild(listItem);
    });

    // Set initial selection to 'All' or the latest date
    if (selectedDateKey === null) {
        allBtn.classList.add('bg-indigo-50');
        renderPulsesForKey(allEntries);
    } else {
        // If a date was previously selected, re-select it
        const prevSelected = q(`[data-date-key="${selectedDateKey}"]`);
        if (prevSelected) {
            prevSelected.classList.add('bg-indigo-50');
            renderPulsesForKey(groups[selectedDateKey]);
        } else {
             // Fallback to All if previous selection is gone
             selectedDateKey = null;
             allBtn.classList.add('bg-indigo-50');
             renderPulsesForKey(allEntries);
        }
    }
  }
}
let showAllPulses = false;
let currentItems = [];

function renderPulsesForKey(items) {
  currentItems = items || [];
  pulsesCol.innerHTML = '';
  
  if (currentItems.length === 0) {
    pulsesCol.innerHTML = `<p class="text-gray-500 text-sm">No pulses for this selection.</p>`;
    return;
  }

  // Sort entries newest first
  currentItems.sort((a,b) => new Date(b.time) - new Date(a.time));

  // Determine which entries to display based on the limit
  const limit = 2;
  const entriesToDisplay = showAllPulses ? currentItems : currentItems.slice(0, limit);
  
  // For each entry, show a small pulse card
  entriesToDisplay.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'journal-pulse-entry';
    const personal = entry.sentiment_personal || 0;
    const team = entry.sentiment_team || 0;
    const course = entry.sentiment_course || 0;
    div.innerHTML = `
    <div class="pulse-detail-row">
            <span class="pulse-time">${new Date(entry.time).toLocaleString()}</span>
            <div class="pulse-content">${escapeHtml(truncate(entry.content || '', 80))}</div>
            <div class="pulse-sentiments">
                <span class="sentiment-item"><span class="sentiment-label">P:</span> <span class="sentiment-emoji">${getEmoji(personal)}</span> (${personal || '-'})</span>
                <span class="sentiment-item"><span class="sentiment-label">T:</span> <span class="sentiment-emoji">${getEmoji(team)}</span> (${team || '-'})</span>
                <span class="sentiment-item"><span class="sentiment-label">C:</span> <span class="sentiment-emoji">${getEmoji(course)}</span> (${course || '-'})</span>
            </div>
        </div>
    `;
    pulsesCol.appendChild(div);
  });
  
  // Add View More/View Less link if applicable
  if (currentItems.length > limit) {
      const moreBtn = document.createElement('button');
      moreBtn.className = 'view-more-btn text-indigo-600 hover:text-indigo-800 text-sm mt-3 w-full text-center';
      
      if (showAllPulses) {
          moreBtn.textContent = 'View Less';
      } else {
          moreBtn.textContent = `View More (${currentItems.length - limit} hidden)`;
      }
      
      moreBtn.addEventListener('click', () => {
          showAllPulses = !showAllPulses;
          renderPulsesForKey(currentItems);
      });
      pulsesCol.appendChild(moreBtn);
  }
}

// small helpers
function truncate(str, n) { return str.length > n ? str.slice(0,n-1) + '…' : str; }
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Fetch entries from backend --- 
async function fetchEntries() {
  if (!courseId) {
    datesCol.innerHTML = `<p class="text-red-600">Missing course ID in URL.</p>`;
    pulsesCol.innerHTML = '';
    return;
  }

  datesCol.innerHTML = `<p class="text-gray-500 text-sm">Loading history...</p>`;
  pulsesCol.innerHTML = `<p class="text-gray-500 text-sm">Loading pulses...</p>`;

  try {
    const res = await fetch(`/api/standup/${courseId}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({error: 'unknown'}));
      throw new Error(err.error || 'Failed to fetch standup entries');
    }
    const data = await res.json();
    // Expect data.entries = []
    renderHistory(Array.isArray(data.entries) ? data.entries : []);
  } catch (err) {
    console.error('fetchEntries error', err);
    datesCol.innerHTML = `<p class="text-red-600">Failed to load history: ${escapeHtml(err.message)}</p>`;
    pulsesCol.innerHTML = '';
  }
}

// --- Submit standup entry --- 
async function submitStandup() {
  if (!courseId) {
    alert('Cannot determine course; refresh the page.');
    return;
  }
  const content = (textarea && textarea.value || '').trim();
  if (!content) { alert('Please write something for your entry.'); return; }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Submitting...';
  saveBtn.classList.add('submitting-state');

  try {
    const payload = {
      content,
      sentiment_personal: sentiments.personal || 0,
      sentiment_team: sentiments.team || 0,
      sentiment_course: sentiments.course || 0
    };

    const res = await fetch(`/api/standup/${courseId}`, {
      method: 'POST',
      credentials: 'include', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(()=>({ error: 'unknown' }));
      throw new Error(err.error || 'Failed to save standup');
    }

    const data = await res.json();
    await fetchEntries();

    // clear UI
    if (textarea) textarea.value = '';
    qa('.pulse-row').forEach(row => row.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected-emoji')));
    sentiments = { personal:0, team:0, course:0 };
    saveBtn.textContent = 'Saved';
    saveBtn.classList.remove('submitting-state');
    saveBtn.classList.add('save-success-state');
    setTimeout(()=> {
      saveBtn.textContent = 'Save';
      saveBtn.classList.remove('save-success-state');
      saveBtn.disabled = false;
      }, 1200);
  } catch (err) {
    console.error('submitStandup error', err);
    saveBtn.textContent = 'Error';
    saveBtn.classList.remove('submitting-state');
    saveBtn.classList.add('save-error-state'); 
    saveBtn.disabled = false;
    setTimeout(() => {
        saveBtn.textContent = 'Save'; // Revert after delay
        saveBtn.classList.remove('save-error-state');
    }, 2000);
  } finally {
    saveBtn.disabled = false;
  }
}

// wire save button
if (saveBtn) saveBtn.addEventListener('click', submitStandup);

// --- Anonymous feedback modal wiring ---
function openFeedbackModal() {
  if (!feedbackModal) return;
  feedbackModal.classList.remove('hidden');
}
function closeFeedbackModal() {
  if (!feedbackModal) return;
  feedbackModal.classList.add('hidden');
  feedbackStatus.classList.add('hidden');
  feedbackStatus.textContent = '';
  feedbackMessage.value = '';
}

if (feedbackBtn) feedbackBtn.addEventListener('click', openFeedbackModal);
if (closeFeedbackModalBtn) closeFeedbackModalBtn.addEventListener('click', closeFeedbackModal);

// Submit anonymous feedback
async function submitFeedback() {
  if (!courseId) { alert('Missing course id.'); return; }
  const msg = (feedbackMessage && feedbackMessage.value || '').trim();
  if (!msg) { alert('Please type a message.'); return; }

  submitFeedbackBtn.disabled = true;
  feedbackStatus.classList.remove('hidden');
  feedbackStatus.textContent = 'Sending...';

  try {
    const payload = { type: (feedbackType && feedbackType.value) || 'COURSE', message: msg };
    const res = await fetch(`/api/standup/${courseId}/feedback`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({ error: 'unknown' }));
      throw new Error(err.error || 'Failed to submit feedback');
    }
    feedbackStatus.textContent = 'Feedback submitted. Thank you.';
    setTimeout(closeFeedbackModal, 900);
  } catch (err) {
    console.error('submitFeedback error', err);
    feedbackStatus.textContent = `Error: ${err.message}`;
  } finally {
    submitFeedbackBtn.disabled = false;
  }
}
if (submitFeedbackBtn) submitFeedbackBtn.addEventListener('click', submitFeedback);

document.addEventListener('DOMContentLoaded', () => {
  initEmojiButtons();
  fetchEntries();
});
