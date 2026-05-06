/* ============================================
   Onboarding State Persistence
   Auto-saves all checkbox + textarea state on the
   onboarding page so users can close and resume.
   No accounts, no servers — localStorage only.
   ============================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'masterclass-onboarding-state';
  var SAVE_INDICATOR_ID = 'onboarding-save-indicator';

  function getRoot() {
    return document.getElementById('main-content') || document.querySelector('.page-wrapper') || document.body;
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      flashSavedIndicator();
    } catch (e) {
      console.warn('Onboarding save failed:', e);
    }
  }

  function flashSavedIndicator() {
    var el = document.getElementById(SAVE_INDICATOR_ID);
    if (!el) return;
    el.textContent = '✓ Saved';
    el.style.opacity = '1';
    clearTimeout(el._fadeTimer);
    el._fadeTimer = setTimeout(function () {
      el.style.opacity = '0';
    }, 1400);
  }

  function ensureIndicator(root) {
    if (document.getElementById(SAVE_INDICATOR_ID)) return;
    var el = document.createElement('div');
    el.id = SAVE_INDICATOR_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = [
      'position:fixed', 'bottom:16px', 'right:16px', 'z-index:200',
      'padding:8px 14px', 'border-radius:8px',
      'background:rgba(5,150,105,0.15)', 'border:1px solid rgba(52,211,153,0.4)',
      'color:#34d399', 'font-size:0.8rem', 'font-weight:600',
      'opacity:0', 'transition:opacity 0.3s ease',
      'pointer-events:none'
    ].join(';');
    el.textContent = '✓ Saved';
    document.body.appendChild(el);
  }

  function restoreState(root, state) {
    var inputs = root.querySelectorAll('input[id], textarea[id]');
    inputs.forEach(function (input) {
      var key = input.id;
      if (!(key in state)) return;
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = state[key] === true;
      } else {
        input.value = state[key];
      }
    });
  }

  function captureState(root) {
    var state = {};
    var inputs = root.querySelectorAll('input[id], textarea[id]');
    inputs.forEach(function (input) {
      var key = input.id;
      if (input.type === 'checkbox' || input.type === 'radio') {
        state[key] = input.checked;
      } else if (input.value && input.value.length > 0) {
        state[key] = input.value;
      }
    });
    return state;
  }

  function init() {
    var root = getRoot();
    if (!root) return;

    var hasOnboardingInputs = root.querySelector('input[type="checkbox"][id], textarea[id]');
    if (!hasOnboardingInputs) return;

    ensureIndicator(root);

    var saved = loadState();
    if (Object.keys(saved).length > 0) {
      restoreState(root, saved);
      flashSavedIndicator();
    }

    var debounceTimer;
    var handler = function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        saveState(captureState(root));
      }, 350);
    };

    root.addEventListener('change', handler);
    root.addEventListener('input', handler);

    window.addEventListener('beforeunload', function () {
      clearTimeout(debounceTimer);
      saveState(captureState(root));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
