console.log('Grading script loaded');

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const subIdInput = document.getElementById('subIdInput');
  const scoreInput = document.getElementById('scoreInput');
  const feedbackInput = document.getElementById('feedbackInput');
  const submitBtn = document.getElementById('submitGradeBtn');
  const resultMsg = document.getElementById('resultMsg');

  submitBtn.addEventListener('click', async () => {
    const submissionId = subIdInput.value.trim();
    const score = scoreInput.value.trim();
    const feedback = feedbackInput.value.trim();

    if (!submissionId) {
      showError('Please enter a Submission ID.');
      return;
    }
    if (!score) {
      showError('Please enter a score.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    resultMsg.textContent = '';
    resultMsg.className = '';

    try {
      const res = await fetch(`${API_BASE}/api/assignments/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          submission_id: Number(submissionId),
          grade: Number(score),
          feedback: feedback
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit grade');
      }

      showSuccess(`Grade recorded! (Submission ${submissionId}: ${score} pts)`);
      
      feedbackInput.value = '';
      // scoreInput.value = ''; 

    } catch (err) {
      console.error('Grading error:', err);
      showError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Grade';
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