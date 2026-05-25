/* ============================================
   Motion Toggle — User-controlled animation pause
   Works on standalone pages AND inside the SPA shell.
   Idempotent: creates the button once, persists state
   via MasterClass.store, never duplicates listeners.

   The button is fixed-positioned bottom-right with
   safe-area-inset support so it stays visible on mobile
   and inside the Notion iframe.
   ============================================ */
(function () {
  'use strict';
  if (window._motionToggleInit) return;
  window._motionToggleInit = true;

  /* Resolve store. If not loaded yet, fall back to localStorage with the
     same legacy key — store.js's migration will pick it up on next load. */
  function readPaused() {
    if (window.MasterClass && window.MasterClass.store) {
      return window.MasterClass.store.get('motionPaused', false) === true;
    }
    try { return localStorage.getItem('motion-paused') === 'true'; } catch (e) { return false; }
  }
  function writePaused(paused) {
    if (window.MasterClass && window.MasterClass.store) {
      window.MasterClass.store.set('motionPaused', paused);
      return;
    }
    try { localStorage.setItem('motion-paused', paused ? 'true' : 'false'); } catch (e) {}
  }

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
    var paused = readPaused();
    if (paused) {
      document.body.classList.add('motion-paused');
      btn.textContent = '▶';
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', 'Resume animations');
    }
    btn.addEventListener('click', function () {
      var nowPaused = document.body.classList.toggle('motion-paused');
      btn.textContent = nowPaused ? '▶' : '⏸';
      btn.setAttribute('aria-pressed', nowPaused ? 'true' : 'false');
      btn.setAttribute('aria-label', nowPaused ? 'Resume animations' : 'Pause animations');
      writePaused(nowPaused);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
