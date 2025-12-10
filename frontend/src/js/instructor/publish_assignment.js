console.log('Assignment script loaded');

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  // courseId 应该从 这里 取得http://localhost:3000/instructor/courses/1/assignments
  const pathParts = window.location.pathname.split('/');
  const courseId = pathParts[pathParts.length - 2];
  console.log("id:", courseId);
  const courseIdInput = document.getElementById('courseIdInput');
  courseIdInput.value = courseId;
  courseIdInput.readOnly = true;
  const titleInput = document.getElementById('titleInput');
  const descInput = document.getElementById('descInput');
  const dueDateInput = document.getElementById('dueDateInput');
  const pointsInput = document.getElementById('pointsInput');
  const publishBtn = document.getElementById('publishBtn');
  const resultMsg = document.getElementById('resultMsg');

  publishBtn.addEventListener('click', async () => {
    const courseId = courseIdInput.value.trim();
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const dueDate = dueDateInput.value;
    const points = pointsInput.value.trim();

    if (!courseId || !title || !dueDate || !points) {
      showError('Please fill in all required fields (Course ID, Title, Date, Points).');
      return;
    }

    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing...';
    resultMsg.textContent = '';
    resultMsg.className = '';

    try {
      console.log('req',{
        course_id: Number(courseId),
        name:title,
        description: description || null,
        due_date: dueDate,
        created_by: null,
        points_possible: Number(points)
      });
      const res = await fetch(`${API_BASE}/api/postman/assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          course_id: Number(courseId),
          name:title,
          description: description || null,
          due_date: dueDate, 
          created_by: null,
          points_possible: Number(points)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish assignment');
      }

      showSuccess(`Assignment "${data.name}" published successfully! (ID: ${data.assignment_id})`);
      
      titleInput.value = '';
      descInput.value = '';
      pointsInput.value = '';
      dueDateInput.value = '';

    } catch (err) {
      console.error('Publish error:', err);
      showError(err.message);
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = 'Publish Assignment';
    }
  });

  function showError(msg) {
    resultMsg.textContent = msg;
    resultMsg.className = 'error';
  }

  function showSuccess(msg) {
    resultMsg.textContent = msg;
    resultMsg.className = 'success';
  }
});