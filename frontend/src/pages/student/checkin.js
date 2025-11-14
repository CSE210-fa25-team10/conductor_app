const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const activityId = params.get('activity_id');
  const pinFromUrl = params.get('pin');

  const activityIdLabel = document.getElementById('activityIdLabel');
  const pinLabel = document.getElementById('pinLabel');
  const emailInput = document.getElementById('emailInput');
  const rollInput = document.getElementById('rollInput');
  const submitBtn = document.getElementById('submitBtn');
  const msgBox = document.getElementById('result');

  if (!activityId || !pinFromUrl) {
    msgBox.style.color = 'red';
    msgBox.textContent = 'Invalid QR link (missing activity or pin).';
    submitBtn.disabled = true;
    return;
  }

  activityIdLabel.textContent = activityId;
  pinLabel.textContent = pinFromUrl;

  submitBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const roll = rollInput.value.trim();

    if (!email) {
      msgBox.style.color = 'red';
      msgBox.textContent = 'Please enter your email.';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/attendance/checkin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: Number(activityId),
          pin: pinFromUrl,
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
      console.error('checkin (QR) error:', err);
      msgBox.style.color = 'red';
      msgBox.textContent = 'Network / server error.';
    }
  });
});
