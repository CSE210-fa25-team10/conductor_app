const API_BASE = "http://localhost:3000"; // backend URL

const starContainer = document.getElementById('star-container');
const stars = starContainer.querySelectorAll('.star');
const contentEl = document.getElementById('content');
const leaderFeedbackEl = document.getElementById('leader_feedback');
const courseFeedbackEl = document.getElementById('course_feedback');
const submitBtn = document.getElementById('submit-btn');
const entriesContainer = document.getElementById('entries-container');

let selectedSentiment = 0;

// DUMMY USER for now
const dummyUser = { user_id: 10, name: "brandon" };

// Star rating click logic
stars.forEach(star => {
  star.addEventListener('click', () => {
    selectedSentiment = Number(star.dataset.value);
    stars.forEach(s => s.classList.toggle('selected', Number(s.dataset.value) <= selectedSentiment));
  });
});

// Submit new entry
submitBtn.addEventListener('click', async () => {
  const content = contentEl.value.trim();
  const leader_feedback = leaderFeedbackEl.value.trim();
  const course_feedback = courseFeedbackEl.value.trim();

  if (!content) {
    alert('Please write something for your entry.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/standup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: dummyUser.user_id,
        name: dummyUser.name,
        content,
        sentiment: selectedSentiment,
        leader_feedback,
        course_feedback
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to submit entry');
    }

    const data = await res.json();
    addEntryToDOM(data.entry);

    // Reset form
    contentEl.value = '';
    leaderFeedbackEl.value = '';
    courseFeedbackEl.value = '';
    selectedSentiment = 0;
    stars.forEach(s => s.classList.remove('selected'));

  } catch (err) {
    console.error('Submit error:', err);
    alert(`Error submitting entry: ${err.message}`);
  }
});

// // Fetch and display previous entries
// async function fetchEntries() {
//   try {
//     const res = await fetch(`${API_BASE}/api/standup`);
//     if (!res.ok) throw new Error('Failed to fetch entries');
//     const data = await res.json();
//     entriesContainer.innerHTML = '';
//     data.entries.forEach(addEntryToDOM);
//   } catch (err) {
//     console.error('Fetch entries error:', err);
//     entriesContainer.innerHTML = `<p style="color:red">Failed to load entries.</p>`;
//   }
// }

// Function to fetch and display previous entries
async function fetchEntries() {
  try {
    const res = await fetch(`${API_BASE}/api/standup`, {
      method: 'POST',                  // Note: Using POST since we're sending user_id in body
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: dummyUser.user_id }),
    });

    if (!res.ok) throw new Error('Failed to fetch entries');

    const data = await res.json();
    entriesContainer.innerHTML = '';
    data.entries.forEach(addEntryToDOM);

  } catch (err) {
    console.error('Fetch entries error:', err);
    entriesContainer.innerHTML = `<p style="color:red">Failed to load entries.</p>`;
  }
}


// Helper: add a single entry to DOM
function addEntryToDOM(entry) {
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `
    <div class="entry-header">
      <span>${entry.name || 'Me'}</span>
      <span>${new Date(entry.time).toLocaleString()}</span>
    </div>
    <p>${entry.content}</p>
    <p>Sentiment: ${'★'.repeat(entry.sentiment || 0)}${'☆'.repeat(5 - (entry.sentiment || 0))}</p>
    ${entry.leader_feedback ? `<p>Leader Feedback: ${entry.leader_feedback}</p>` : ''}
    ${entry.course_feedback ? `<p>Course Feedback: ${entry.course_feedback}</p>` : ''}
  `;
  entriesContainer.prepend(div);
}

// Initial fetch
fetchEntries();
