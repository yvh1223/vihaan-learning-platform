// Lightweight progress utilities to keep UI in sync
// Ensures subject cards reflect saved progress from localStorage

(function () {
  function readStudentData() {
    try {
      const raw = localStorage.getItem('studentData');
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function updateCardProgress(subject, value) {
    const card = document.querySelector(`[data-subject="${subject}"]`);
    if (!card) return;
    const fill = card.querySelector('.progress-fill');
    const text = card.querySelector('.progress-text');
    if (fill) fill.style.width = `${value}%`;
    if (text) text.textContent = `${value}% Complete`;
  }

  function syncProgressFromStorage() {
    const data = readStudentData();
    const progress = (data && data.currentProgress) || {};
    ['mathematics', 'science', 'english', 'social-studies'].forEach((s) => {
      const v = Number(progress[s] || 0);
      updateCardProgress(s, isFinite(v) ? v : 0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncProgressFromStorage);
  } else {
    syncProgressFromStorage();
  }
})();

