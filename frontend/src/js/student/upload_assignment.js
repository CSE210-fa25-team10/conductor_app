console.log('Upload script loaded');

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const assignIdInput = document.getElementById('assignIdInput');
  const emailInput = document.getElementById('emailInput');
  const fileInput = document.getElementById('fileInput');
  const commentInput = document.getElementById('commentInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const resultMsg = document.getElementById('resultMsg');

  uploadBtn.addEventListener('click', async () => {
    const assignmentId = assignIdInput.value.trim();
    const email = emailInput.value.trim();
    const comments = commentInput.value.trim();
    const file = fileInput.files[0];

    if (!assignmentId || !email) {
      showError('Please enter Assignment ID and Student Email.');
      return;
    }
    if (!file) {
      showError('Please select a file to upload.');
      return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    resultMsg.textContent = '';
    resultMsg.className = '';

    try {
      const formData = new FormData();
      formData.append('assignment_id', assignmentId);
      formData.append('email', email);
      formData.append('file', file);
      if (comments) {
        formData.append('comments', comments);
      }

      const res = await fetch(`${API_BASE}/api/submissions/upload`, {
        method: 'POST',
        credentials: 'include', 
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      showSuccess(`Success! File "${data.filename}" uploaded. Submission ID: ${data.submission_id}`);
      
      fileInput.value = '';
      commentInput.value = '';

    } catch (err) {
      console.error('Upload error:', err);
      showError(err.message);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload Submission';
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