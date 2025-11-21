const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const courseIdInput = document.getElementById('courseIdInput');
  const pinInput = document.getElementById('pinInput');
  const emailInput = document.getElementById('emailInput');
  const rollInput = document.getElementById('rollInput');
  const submitBtn = document.getElementById('submitBtn');
  const msgBox = document.getElementById('result');

  submitBtn.addEventListener('click', async () => {
    const courseId = courseIdInput.value.trim();
    const pin = pinInput.value.trim();
    const email = emailInput.value.trim();
    const roll = rollInput.value.trim();

    if (!courseId || !email || !pin) {
      msgBox.style.color = 'red';
      msgBox.textContent = 'Course ID, email, and PIN are required.';
      return;
    }
    if (pin.length !== 6) {
      msgBox.style.color = 'red';
      msgBox.textContent = 'PIN must be 6 digits.';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/attendance/checkin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: Number(courseId),
          pin,
          email,
          roll_id: roll
        })
      });

      const data = await res.json();

      if (res.ok) {
        msgBox.style.color = 'green';
        msgBox.innerHTML = `
          <h3>You're Checked In! 🎉</h3>
          <p>Session: <strong>${data.activity.name}</strong></p>
          <p>Time: ${new Date(data.activity.starts_at).toLocaleString()}</p>
        `;
      } else {
        msgBox.style.color = 'red';
        msgBox.textContent = `Error: ${data.error}`;
      }
    } catch (err) {
      console.error('manual checkin error:', err);
      msgBox.style.color = 'red';
      msgBox.textContent = 'Network / server error.';
    }
  });
});
