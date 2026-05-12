/* ============================================
   Motion Toggle — User-controlled animation pause
   Works on standalone pages AND inside the SPA shell.
   Idempotent: creates the button once, persists state
   in localStorage, never duplicates listeners.
   ============================================ */
(function () {
  'use strict';
  if (window._motionToggleInit) return;
  window._motionToggleInit = true;

  function init() {
    var btn = document.getElementById('motionToggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'motionToggle';
      btn.className = 'motion-toggle';
      btn.setAttribute('aria-label', 'Pause animations');
      btn.setAttribute('title', 'Pause animations');
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = '⏸';
      document.body.appendChild(btn);
    }
    var saved = localStorage.getItem('motion-paused') === 'true';
    if (saved) {
      document.body.classList.add('motion-paused');
      btn.textContent = '▶';
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', 'Resume animations');
    }
    btn.addEventListener('click', function () {
      var paused = document.body.classList.toggle('motion-paused');
      btn.textContent = paused ? '▶' : '⏸';
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
      localStorage.setItem('motion-paused', paused ? 'true' : 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
