// Small UX enhancements for a smoother learning experience

(function () {
  // 1) Make images lazy if not explicitly opted out
  function ensureLazyImages() {
    document.querySelectorAll('img:not([loading])').forEach((img) => {
      img.loading = 'lazy';
    });
  }

  // 2) Focus-visible polyfill-like behavior for better keyboard focus cues
  function enableFocusRingOnKeyboard() {
    function handleFirstTab(e) {
      if (e.key === 'Tab') {
        document.documentElement.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
        window.addEventListener('mousedown', handleMouseDownOnce);
      }
    }
    function handleMouseDownOnce() {
      document.documentElement.classList.remove('user-is-tabbing');
      window.removeEventListener('mousedown', handleMouseDownOnce);
      window.addEventListener('keydown', handleFirstTab);
    }
    window.addEventListener('keydown', handleFirstTab);
  }

  // 3) Smooth scroll for in-page anchors (respects reduced motion)
  function enableSmoothScroll() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      });
    });
  }

  function init() {
    ensureLazyImages();
    enableFocusRingOnKeyboard();
    enableSmoothScroll();
    initTextSizeToggle();
    injectScheduleBadges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Text size toggle (persisted)
(function () {
  const KEY = 'textScale';
  const SCALES = [1.0, 1.15, 1.3];

  function applyScale(scale) {
    document.documentElement.style.fontSize = `${Math.round(scale * 100)}%`;
    const btn = document.getElementById('text-size-toggle');
    if (btn) btn.setAttribute('aria-pressed', scale > 1 ? 'true' : 'false');
  }

  function nextScale(current) {
    const idx = SCALES.indexOf(current);
    return SCALES[(idx + 1) % SCALES.length];
  }

  function readScale() {
    const raw = localStorage.getItem(KEY);
    const n = Number(raw);
    return SCALES.includes(n) ? n : 1.0;
  }

  function saveScale(scale) {
    try { localStorage.setItem(KEY, String(scale)); } catch (_) {}
  }

  function init() {
    // apply saved scale
    applyScale(readScale());
    // bind toggle
    const btn = document.getElementById('text-size-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const next = nextScale(readScale());
        saveScale(next);
        applyScale(next);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Schedule badges injection
(function () {
  const SCHEDULE_URL = 'config/schedule.json';

  function parseKeyFromHref(href) {
    // subjects/<subject>/chapter-N.html
    const m = href.match(/subjects\/(\w[\w-]*)\/chapter-(\d+)\.html/);
    if (!m) return null;
    return `${m[1]}:chapter-${m[2]}`;
  }

  function currentChapterKey() {
    const p = window.location.pathname;
    const m = p.match(/subjects\/(\w[\w-]*)\/(chapter-(\d+)\.html)/);
    if (!m) return null;
    return `${m[1]}:${m[2].replace('.html','')}`;
  }

  function createPill(text) {
    const span = document.createElement('span');
    span.className = 'date-pill';
    span.textContent = text;
    return span;
  }

  function ensureStyles() {
    if (document.getElementById('schedule-pill-styles')) return;
    const s = document.createElement('style');
    s.id = 'schedule-pill-styles';
    s.textContent = `
      .date-pill { display:inline-block; margin-left:8px; padding:2px 6px; border-radius:999px; font-size:0.75rem; background: var(--bg-accent); color: var(--text-secondary); }
      .chapter-schedule { margin-top: 6px; color: var(--text-secondary); font-size: 0.9rem; }
    `;
    document.head.appendChild(s);
  }

  async function loadSchedule() {
    try {
      const res = await fetch(SCHEDULE_URL, { cache: 'no-store' });
      if (!res.ok) return {};
      return await res.json();
    } catch (_) { return {}; }
  }

  function injectOnDashboard(schedule) {
    document.querySelectorAll('a.chapter-link[href*="subjects/"]').forEach(a => {
      const key = parseKeyFromHref(a.getAttribute('href'));
      if (!key) return;
      const date = schedule[key];
      if (!date) return;
      a.appendChild(createPill(date));
    });
  }

  function injectOnSubjectIndex(schedule) {
    // Find chapter start links in subject index pages
    document.querySelectorAll('a[href^="chapter-"]').forEach(a => {
      const href = a.getAttribute('href');
      const subjectMatch = window.location.pathname.match(/subjects\/(\w[\w-]*)\//);
      if (!subjectMatch) return;
      const key = `${subjectMatch[1]}:${href.replace('.html','')}`;
      const date = schedule[key];
      if (!date) return;
      // Append pill near the start button
      a.parentElement && a.parentElement.appendChild(createPill(date));
    });
  }

  function injectOnChapterPage(schedule) {
    const key = currentChapterKey();
    if (!key) return;
    const date = schedule[key];
    if (!date) return;
    const header = document.querySelector('.chapter-header');
    if (!header) return;
    const div = document.createElement('div');
    div.className = 'chapter-schedule';
    div.textContent = `Scheduled: ${date}`;
    header.appendChild(div);
  }

  async function injectScheduleBadges() {
    ensureStyles();
    const schedule = await loadSchedule();
    injectOnDashboard(schedule);
    injectOnSubjectIndex(schedule);
    injectOnChapterPage(schedule);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectScheduleBadges);
  } else {
    injectScheduleBadges();
  }
})();
