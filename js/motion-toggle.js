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

  function render(iconEl, labelEl, btn, paused) {
    iconEl.textContent = paused ? '▶' : '⏸';
    labelEl.textContent = paused ? 'Resume motion' : 'Pause motion';
    btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    var aria = paused ? 'Resume animations' : 'Pause animations';
    btn.setAttribute('aria-label', aria);
    btn.setAttribute('title', aria);
  }

  function init() {
    var btn = document.getElementById('motionToggle');
    var iconEl, labelEl;
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'motionToggle';
      btn.className = 'motion-toggle';
      btn.type = 'button';
      iconEl = document.createElement('span');
      iconEl.className = 'motion-toggle-icon';
      iconEl.setAttribute('aria-hidden', 'true');
      labelEl = document.createElement('span');
      labelEl.className = 'motion-toggle-label';
      btn.appendChild(iconEl);
      btn.appendChild(labelEl);
      document.body.appendChild(btn);
    } else {
      iconEl = btn.querySelector('.motion-toggle-icon');
      labelEl = btn.querySelector('.motion-toggle-label');
    }
    var paused = readPaused();
    if (paused) document.body.classList.add('motion-paused');
    render(iconEl, labelEl, btn, paused);
    btn.addEventListener('click', function () {
      var nowPaused = document.body.classList.toggle('motion-paused');
      render(iconEl, labelEl, btn, nowPaused);
      writePaused(nowPaused);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
