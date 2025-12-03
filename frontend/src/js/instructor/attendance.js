console.log('Instructor attendance script loaded');

// const API_BASE = 'http://localhost:3000';
const API_BASE = '';

async function startAttendanceSession() {
  const courseId = document.getElementById('courseIdInput').value.trim();
  console.log("in attendance.js",courseId);
  const name = document.getElementById('nameInput').value.trim();

  if (!courseId || !name) {
    alert('Please enter course ID and session name.');
    return;
  }

  try {//Update the URL to include /courses/:courseId/
    const res = await fetch(`${API_BASE}/api/attendance/courses/${courseId}/session/start`, {
    // const res = await fetch(`${API_BASE}/api/attendance/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name
      })
    });

    const data = await res.json();
    console.log('startAttendanceSession response:', res.status, data);

    if (!res.ok) {
      alert(`Error ${res.status}: ${data.error || 'unknown error'}`);
      return;
    }

    document.getElementById('qrImg').src = data.qr_code_data_url;
    document.getElementById('pinCode').innerText = data.pin;

    const si = document.getElementById('sessionInfo');
    si.innerText = `Session "${data.name}" started at ${
      new Date(data.starts_at).toLocaleString()
    } (activity_id=${data.activity_id})`;
  } catch (err) {
    console.error('startAttendanceSession error:', err);
    alert('Failed to start: ' + err.message);
  }
}

document
  .getElementById('startAttendanceBtn')
  .addEventListener('click', startAttendanceSession);
