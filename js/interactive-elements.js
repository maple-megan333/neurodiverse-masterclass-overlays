/* ============================================
   Neurodiverse AI MasterClass — Interactive Elements
   Breathing exercise, tool picker, onboarding form
   persistence, voice analysis demo, dopamine tier
   selector.

   Architecture:
   - Wraps in a self-executing setup function stored on
     window._initInteractiveElements so the SPA router
     can call it after every page render.
   - Uses MutationObserver on #content-area to detect
     page changes automatically (no router modifications
     required).
   - Each feature is wrapped in try/catch.
   - All styles are injected once via a guarded <style>
     block; removed only when the script is fully torn
     down.
   - Cleanup references stored on window._ieCleanup[].
   ============================================ */

(function () {
  'use strict';

  /* --------------------------------------------------
     0. STYLE INJECTION (once, guarded by sentinel)
  -------------------------------------------------- */
  var STYLE_ID = 'ie-injected-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    /* eslint-disable */
    style.textContent = [

      /* === Shared utilities === */
      '.ie-hidden { display: none !important; }',
      '.ie-sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0; }',

      /* === Toast === */
      '#ie-toast {',
      '  position: fixed;',
      '  bottom: 24px;',
      '  right: 24px;',
      '  background: var(--green, #22c55e);',
      '  color: #0A0A14;',
      '  padding: 8px 18px;',
      '  border-radius: 8px;',
      '  font-size: .85rem;',
      '  font-weight: 600;',
      '  z-index: 9999;',
      '  opacity: 0;',
      '  transform: translateY(8px);',
      '  transition: opacity .25s, transform .25s;',
      '  pointer-events: none;',
      '}',
      '#ie-toast.ie-toast-visible {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '}',

      /* === Breathing exercise === */
      '#ie-breathing {',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  gap: 24px;',
      '  padding: 40px 20px;',
      '  margin: 32px 0;',
      '}',
      '#ie-breath-circle-wrap {',
      '  position: relative;',
      '  width: 180px;',
      '  height: 180px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '}',
      '#ie-breath-circle {',
      '  width: 100px;',
      '  height: 100px;',
      '  border-radius: 50%;',
      '  background: radial-gradient(circle at 40% 40%, var(--accent, #a855f7), #06b6d4);',
      '  box-shadow: 0 0 40px rgba(168, 85, 247, 0.5), 0 0 80px rgba(6, 182, 212, 0.3);',
      '  transition: transform 4s cubic-bezier(0.45, 0, 0.55, 1);',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  #ie-breath-circle { transition: none; }',
      '}',
      '#ie-breath-circle.ie-expand {',
      '  transform: scale(1.7);',
      '}',
      '#ie-breath-circle.ie-hold {',
      '  transform: scale(1.7);',
      '  transition: transform .1s;',
      '}',
      '#ie-breath-circle.ie-contract {',
      '  transform: scale(1);',
      '  transition: transform 6s cubic-bezier(0.45, 0, 0.55, 1);',
      '}',
      '#ie-breath-timer {',
      '  position: absolute;',
      '  font-size: 1.5rem;',
      '  font-weight: 700;',
      '  color: #F8F8FC;',
      '  text-shadow: 0 0 10px rgba(0,0,0,.8);',
      '  pointer-events: none;',
      '}',
      '#ie-breath-label {',
      '  font-size: 1.1rem;',
      '  color: var(--text-secondary, #a0a0b8);',
      '  letter-spacing: .05em;',
      '  min-height: 1.6em;',
      '  text-align: center;',
      '}',
      '#ie-breath-btn {',
      '  padding: 10px 28px;',
      '  border-radius: 9999px;',
      '  border: 2px solid var(--accent, #a855f7);',
      '  background: transparent;',
      '  color: var(--accent, #a855f7);',
      '  font-size: 1rem;',
      '  font-weight: 600;',
      '  cursor: pointer;',
      '  transition: background .2s, color .2s;',
      '}',
      '#ie-breath-btn:hover {',
      '  background: var(--accent, #a855f7);',
      '  color: #0A0A14;',
      '}',
      '#ie-breath-complete {',
      '  text-align: center;',
      '  color: var(--green, #22c55e);',
      '  font-size: 1rem;',
      '  font-weight: 600;',
      '  display: none;',
      '}',
      '#ie-breath-cycles {',
      '  font-size: .85rem;',
      '  color: var(--text-muted, #6b6b8a);',
      '}',

      /* === Tool picker === */
      '#ie-tool-tabs {',
      '  display: flex;',
      '  gap: 8px;',
      '  flex-wrap: wrap;',
      '  margin-bottom: 24px;',
      '  padding: 4px 0;',
      '}',
      '.ie-tool-tab {',
      '  padding: 7px 20px;',
      '  border-radius: 9999px;',
      '  border: 1.5px solid rgba(168, 85, 247, 0.3);',
      '  background: transparent;',
      '  color: var(--text-secondary, #a0a0b8);',
      '  font-size: .875rem;',
      '  font-weight: 600;',
      '  cursor: pointer;',
      '  transition: border-color .2s, background .2s, color .2s;',
      '}',
      '.ie-tool-tab:hover {',
      '  border-color: var(--accent, #a855f7);',
      '  color: var(--accent, #a855f7);',
      '}',
      '.ie-tool-tab.ie-active {',
      '  background: var(--accent, #a855f7);',
      '  border-color: var(--accent, #a855f7);',
      '  color: #0A0A14;',
      '}',
      '[data-tool] {',
      '  transition: opacity .3s, transform .3s;',
      '}',
      '[data-tool].ie-tool-hiding {',
      '  opacity: 0;',
      '  transform: translateY(6px);',
      '  pointer-events: none;',
      '}',

      /* === Onboarding form === */
      '#ie-onboarding-actions {',
      '  margin-top: 32px;',
      '  display: flex;',
      '  justify-content: flex-end;',
      '}',
      '#ie-clear-btn {',
      '  padding: 8px 20px;',
      '  border-radius: 8px;',
      '  border: 1.5px solid rgba(239, 68, 68, 0.4);',
      '  background: transparent;',
      '  color: var(--red, #ef4444);',
      '  font-size: .875rem;',
      '  font-weight: 600;',
      '  cursor: pointer;',
      '  transition: background .2s, color .2s;',
      '}',
      '#ie-clear-btn:hover {',
      '  background: var(--red, #ef4444);',
      '  color: #F8F8FC;',
      '}',

      /* === Voice analysis === */
      '#ie-voice-widget {',
      '  margin: 24px 0;',
      '  padding: 28px;',
      '  border: 1px solid rgba(168, 85, 247, 0.2);',
      '  border-radius: 16px;',
      '  background: rgba(168, 85, 247, 0.04);',
      '}',
      '#ie-voice-textarea {',
      '  width: 100%;',
      '  min-height: 140px;',
      '  padding: 14px;',
      '  border-radius: 10px;',
      '  border: 1.5px solid rgba(168, 85, 247, 0.25);',
      '  background: rgba(10, 10, 20, 0.6);',
      '  color: #F8F8FC;',
      '  font-size: .95rem;',
      '  resize: vertical;',
      '  box-sizing: border-box;',
      '  font-family: inherit;',
      '  transition: border-color .2s;',
      '}',
      '#ie-voice-textarea:focus {',
      '  outline: none;',
      '  border-color: var(--accent, #a855f7);',
      '}',
      '#ie-analyze-btn {',
      '  margin-top: 12px;',
      '  padding: 10px 28px;',
      '  border-radius: 9999px;',
      '  border: none;',
      '  background: var(--accent, #a855f7);',
      '  color: #0A0A14;',
      '  font-size: .95rem;',
      '  font-weight: 700;',
      '  cursor: pointer;',
      '  transition: opacity .2s;',
      '}',
      '#ie-analyze-btn:disabled { opacity: .5; cursor: default; }',
      '#ie-analyze-btn:hover:not(:disabled) { opacity: .85; }',
      '#ie-voice-results {',
      '  margin-top: 24px;',
      '  display: none;',
      '}',
      '#ie-voice-results h4 {',
      '  font-size: .9rem;',
      '  color: var(--text-muted, #6b6b8a);',
      '  text-transform: uppercase;',
      '  letter-spacing: .08em;',
      '  margin-bottom: 12px;',
      '}',
      '#ie-voice-tags {',
      '  display: flex;',
      '  flex-wrap: wrap;',
      '  gap: 10px;',
      '  margin-bottom: 20px;',
      '}',
      '.ie-voice-tag {',
      '  padding: 6px 16px;',
      '  border-radius: 9999px;',
      '  font-size: .85rem;',
      '  font-weight: 600;',
      '  opacity: 0;',
      '  transform: translateY(8px) scale(.95);',
      '  transition: opacity .35s, transform .35s;',
      '}',
      '.ie-voice-tag.ie-popped {',
      '  opacity: 1;',
      '  transform: translateY(0) scale(1);',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  .ie-voice-tag { transition: none; opacity: 1; transform: none; }',
      '}',
      '#ie-voice-summary {',
      '  font-size: .95rem;',
      '  color: var(--text-secondary, #a0a0b8);',
      '  border-left: 3px solid var(--accent, #a855f7);',
      '  padding-left: 14px;',
      '  font-style: italic;',
      '}',
      '#ie-voice-empty {',
      '  color: var(--red, #ef4444);',
      '  font-size: .875rem;',
      '  margin-top: 8px;',
      '  display: none;',
      '}',

      /* === Dopamine tier selector === */
      '#ie-tier-tabs {',
      '  display: flex;',
      '  gap: 10px;',
      '  flex-wrap: wrap;',
      '  margin-bottom: 24px;',
      '}',
      '.ie-tier-btn {',
      '  padding: 8px 22px;',
      '  border-radius: 9999px;',
      '  border: 2px solid transparent;',
      '  font-size: .875rem;',
      '  font-weight: 700;',
      '  cursor: pointer;',
      '  transition: border-color .2s, background .2s, color .2s;',
      '}',
      '.ie-tier-btn[data-tier="all"] {',
      '  background: rgba(168,85,247,.15);',
      '  border-color: var(--accent, #a855f7);',
      '  color: var(--accent, #a855f7);',
      '}',
      '.ie-tier-btn[data-tier="low"] {',
      '  background: rgba(107,114,128,.15);',
      '  border-color: #6b7280;',
      '  color: #9ca3af;',
      '}',
      '.ie-tier-btn[data-tier="medium"] {',
      '  background: rgba(245,158,11,.15);',
      '  border-color: #f59e0b;',
      '  color: #f59e0b;',
      '}',
      '.ie-tier-btn[data-tier="high"] {',
      '  background: rgba(239,68,68,.15);',
      '  border-color: var(--red, #ef4444);',
      '  color: var(--red, #ef4444);',
      '}',
      '.ie-tier-btn.ie-active {',
      '  filter: brightness(1.15);',
      '  box-shadow: 0 0 14px rgba(168,85,247,.25);',
      '}',
      '[data-energy] {',
      '  transition: opacity .3s, transform .3s;',
      '}',
      '[data-energy].ie-energy-hiding {',
      '  opacity: 0;',
      '  transform: translateY(6px);',
      '  pointer-events: none;',
      '  height: 0;',
      '  overflow: hidden;',
      '  margin: 0;',
      '  padding: 0;',
      '}',

    ].join('\n');
    /* eslint-enable */
    document.head.appendChild(style);
  }

  injectStyles();

  /* --------------------------------------------------
     1. SHARED UTILITIES
  -------------------------------------------------- */

  /** Show a toast notification. */
  function showToast(message) {
    var toast = document.getElementById('ie-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ie-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('ie-toast-visible');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.classList.remove('ie-toast-visible');
    }, 2200);
  }

  /** Simple debounce. */
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(this, args); }, ms);
    };
  }

  /** Get the current page slug from the URL hash. */
  function getCurrentPage() {
    return (window.location.hash || '').replace('#', '') || 'index';
  }

  /* --------------------------------------------------
     2. CLEANUP REGISTRY
     Store teardown functions so re-navigating the same
     page doesn't accumulate duplicate listeners.
  -------------------------------------------------- */
  window._ieCleanups = window._ieCleanups || [];

  function registerCleanup(fn) {
    window._ieCleanups.push(fn);
  }

  function runCleanups() {
    while (window._ieCleanups.length) {
      try { window._ieCleanups.pop()(); } catch (e) { /* ignore */ }
    }
  }

  /* --------------------------------------------------
     A. BREATHING EXERCISE
     Anchor: #breathing-anchor or [data-breathing]
     Page:   emergency-toolkit
  -------------------------------------------------- */
  function initBreathing(contentArea) {
    var anchor = contentArea.querySelector('#breathing-anchor, [data-breathing]');
    if (!anchor) return;

    // Don't double-init
    if (contentArea.querySelector('#ie-breathing')) return;

    var container = document.createElement('div');
    container.id = 'ie-breathing';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Breathing exercise');
    anchor.parentNode.insertBefore(container, anchor.nextSibling);

    /* Build DOM */
    var circleWrap = document.createElement('div');
    circleWrap.id = 'ie-breath-circle-wrap';

    var circle = document.createElement('div');
    circle.id = 'ie-breath-circle';

    var timerEl = document.createElement('div');
    timerEl.id = 'ie-breath-timer';
    timerEl.setAttribute('aria-hidden', 'true');

    circleWrap.appendChild(circle);
    circleWrap.appendChild(timerEl);

    var label = document.createElement('div');
    label.id = 'ie-breath-label';
    label.setAttribute('aria-live', 'polite');
    label.textContent = 'Press Start when you\'re ready';

    var cyclesEl = document.createElement('div');
    cyclesEl.id = 'ie-breath-cycles';
    cyclesEl.textContent = '4 cycles \u00b7 ~64 seconds';

    var btn = document.createElement('button');
    btn.id = 'ie-breath-btn';
    btn.textContent = 'Start';

    var complete = document.createElement('div');
    complete.id = 'ie-breath-complete';
    complete.textContent = 'Well done. You\'ve completed your breathing session. Take a moment to notice how you feel.';

    container.appendChild(circleWrap);
    container.appendChild(label);
    container.appendChild(cyclesEl);
    container.appendChild(btn);
    container.appendChild(complete);

    /* State */
    var PHASES = [
      { name: 'Breathe in...', duration: 4000, circleClass: 'ie-expand'   },
      { name: 'Hold...',       duration: 4000, circleClass: 'ie-hold'     },
      { name: 'Breathe out...', duration: 6000, circleClass: 'ie-contract' },
      { name: '',              duration: 2000, circleClass: ''            },
    ];
    var TOTAL_CYCLES = 4;
    var running = false;
    var timerId = null;
    var counterId = null;
    var phaseIdx = 0;
    var cycleCount = 0;
    var phaseEndTime = 0;

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function tick() {
      if (!running) return;
      var remaining = Math.ceil((phaseEndTime - Date.now()) / 1000);
      if (remaining > 0) timerEl.textContent = remaining;
    }

    function nextPhase() {
      if (!running) return;

      /* Advance phase */
      var phase = PHASES[phaseIdx];

      /* Apply circle state */
      if (!prefersReduced) {
        circle.classList.remove('ie-expand', 'ie-hold', 'ie-contract');
        if (phase.circleClass) {
          /* Force reflow before adding class so transition fires */
          void circle.offsetWidth;
          circle.classList.add(phase.circleClass);
        }
      }

      label.textContent = phase.name;
      phaseEndTime = Date.now() + phase.duration;
      timerEl.textContent = Math.ceil(phase.duration / 1000);

      phaseIdx++;

      if (phaseIdx >= PHASES.length) {
        phaseIdx = 0;
        cycleCount++;
        if (cycleCount >= TOTAL_CYCLES) {
          /* Done after this last phase completes */
          timerId = setTimeout(finish, phase.duration);
          return;
        }
      }

      timerId = setTimeout(nextPhase, phase.duration);
    }

    function start() {
      running = true;
      phaseIdx = 0;
      cycleCount = 0;
      complete.style.display = 'none';
      btn.textContent = 'Stop';
      circle.classList.remove('ie-expand', 'ie-hold', 'ie-contract');
      cyclesEl.textContent = '';
      nextPhase();
      counterId = setInterval(tick, 250);
    }

    function stop() {
      running = false;
      clearTimeout(timerId);
      clearInterval(counterId);
      circle.classList.remove('ie-expand', 'ie-hold', 'ie-contract');
      timerEl.textContent = '';
      label.textContent = 'Press Start when you\'re ready';
      cyclesEl.textContent = '4 cycles \u00b7 ~64 seconds';
      btn.textContent = 'Start';
    }

    function finish() {
      running = false;
      clearTimeout(timerId);
      clearInterval(counterId);
      circle.classList.remove('ie-expand', 'ie-hold', 'ie-contract');
      timerEl.textContent = '';
      label.textContent = '';
      cyclesEl.textContent = '';
      btn.textContent = 'Start again';
      complete.style.display = 'block';
    }

    btn.addEventListener('click', function () {
      if (running) { stop(); } else { start(); }
    });

    registerCleanup(function () {
      running = false;
      clearTimeout(timerId);
      clearInterval(counterId);
    });
  }

  /* --------------------------------------------------
     B. TOOL PICKER
     Anchor: page contains [data-tool] sections
     Page:   setup-your-tools, choose-configure-tools

     ★ Insight: Requires page HTML to have sections
       marked with data-tool="claude|chatgpt|gemini".
       Example: <section data-tool="claude">...</section>
       Elements without a data-tool attribute are always
       visible (e.g., intro paragraphs, headings).
  -------------------------------------------------- */
  function initToolPicker(contentArea) {
    var toolSections = contentArea.querySelectorAll('[data-tool]');
    if (toolSections.length === 0) return;

    /* Find insertion point: before the first tool section's parent or before first section */
    var firstSection = toolSections[0];
    var insertBefore = firstSection;

    /* Collect unique tool values */
    var toolSet = {};
    toolSections.forEach(function (el) {
      toolSet[el.dataset.tool] = true;
    });
    var tools = Object.keys(toolSet);

    /* Build tab bar */
    var tabBar = document.createElement('div');
    tabBar.id = 'ie-tool-tabs';
    tabBar.setAttribute('role', 'tablist');
    tabBar.setAttribute('aria-label', 'Filter by AI tool');

    var allTab = buildToolTab('All', 'all', true);
    tabBar.appendChild(allTab);

    tools.forEach(function (tool) {
      var label = tool.charAt(0).toUpperCase() + tool.slice(1);
      tabBar.appendChild(buildToolTab(label, tool, false));
    });

    insertBefore.parentNode.insertBefore(tabBar, insertBefore);

    function buildToolTab(label, value, active) {
      var btn = document.createElement('button');
      btn.className = 'ie-tool-tab' + (active ? ' ie-active' : '');
      btn.textContent = label;
      btn.dataset.toolFilter = value;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.addEventListener('click', function () {
        setActiveToolFilter(value);
      });
      return btn;
    }

    function setActiveToolFilter(value) {
      /* Update tabs */
      tabBar.querySelectorAll('.ie-tool-tab').forEach(function (tab) {
        var isActive = tab.dataset.toolFilter === value;
        tab.classList.toggle('ie-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      /* Show/hide sections */
      toolSections.forEach(function (el) {
        var matches = (value === 'all') || (el.dataset.tool === value);
        if (matches) {
          el.classList.remove('ie-tool-hiding');
          el.removeAttribute('aria-hidden');
        } else {
          el.classList.add('ie-tool-hiding');
          el.setAttribute('aria-hidden', 'true');
        }
      });
    }

    registerCleanup(function () {
      if (tabBar.parentNode) tabBar.parentNode.removeChild(tabBar);
    });
  }

  /* --------------------------------------------------
     C. ONBOARDING FORM PERSISTENCE
     Anchor: page is onboarding-interview
  -------------------------------------------------- */
  var ONBOARDING_KEY = 'masterclass-onboarding';

  function initOnboarding(contentArea) {
    var fields = contentArea.querySelectorAll('input, select, textarea');
    if (fields.length === 0) return;

    /* Restore saved values */
    var saved = {};
    try {
      var raw = localStorage.getItem(ONBOARDING_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) { /* localStorage unavailable */ }

    fields.forEach(function (field, i) {
      var key = field.name || field.id || ('field-' + i);
      if (saved[key] !== undefined) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          field.checked = saved[key];
        } else {
          field.value = saved[key];
        }
      }
    });

    /* Save on change, debounced */
    var saveAll = debounce(function () {
      var data = {};
      fields.forEach(function (field, i) {
        var key = field.name || field.id || ('field-' + i);
        if (field.type === 'checkbox' || field.type === 'radio') {
          data[key] = field.checked;
        } else {
          data[key] = field.value;
        }
      });
      try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data)); } catch (e) {}
      showToast('Saved');
    }, 1000);

    fields.forEach(function (field) {
      field.addEventListener('input', saveAll);
      field.addEventListener('change', saveAll);
    });

    /* Clear All button */
    var actions = document.createElement('div');
    actions.id = 'ie-onboarding-actions';

    var clearBtn = document.createElement('button');
    clearBtn.id = 'ie-clear-btn';
    clearBtn.textContent = 'Clear All Answers';
    clearBtn.addEventListener('click', function () {
      if (!confirm('Clear all saved answers? This cannot be undone.')) return;
      fields.forEach(function (field) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          field.checked = false;
        } else {
          field.value = '';
        }
      });
      try { localStorage.removeItem(ONBOARDING_KEY); } catch (e) {}
      showToast('Answers cleared');
    });

    actions.appendChild(clearBtn);

    /* Append after last field's closest block-level parent inside contentArea */
    var lastField = fields[fields.length - 1];
    var insertTarget = lastField.closest('form') || lastField.closest('section') || lastField.parentNode;
    insertTarget.appendChild(actions);

    registerCleanup(function () {
      if (actions.parentNode) actions.parentNode.removeChild(actions);
    });
  }

  /* --------------------------------------------------
     D. VOICE ANALYSIS DEMO
     Anchor: [data-voice-demo]
     Page:   writing-voice
  -------------------------------------------------- */
  function initVoiceAnalysis(contentArea) {
    var anchor = contentArea.querySelector('[data-voice-demo]');
    if (!anchor) return;

    var widget = document.createElement('div');
    widget.id = 'ie-voice-widget';
    widget.setAttribute('role', 'region');
    widget.setAttribute('aria-label', 'Voice analysis tool');

    var heading = document.createElement('p');
    heading.style.cssText = 'margin:0 0 14px;font-weight:700;font-size:1rem;color:#F8F8FC';
    heading.textContent = 'Analyze Your Writing Voice';
    widget.appendChild(heading);

    var textarea = document.createElement('textarea');
    textarea.id = 'ie-voice-textarea';
    textarea.placeholder = 'Paste some of your writing here — a paragraph or more works best...';
    textarea.setAttribute('aria-label', 'Paste writing sample for voice analysis');
    widget.appendChild(textarea);

    var emptyMsg = document.createElement('div');
    emptyMsg.id = 'ie-voice-empty';
    emptyMsg.textContent = 'Please paste at least a sentence to analyze.';
    emptyMsg.setAttribute('role', 'alert');
    widget.appendChild(emptyMsg);

    var analyzeBtn = document.createElement('button');
    analyzeBtn.id = 'ie-analyze-btn';
    analyzeBtn.textContent = 'Analyze Voice';
    widget.appendChild(analyzeBtn);

    var results = document.createElement('div');
    results.id = 'ie-voice-results';
    results.setAttribute('aria-live', 'polite');

    var tagsHeading = document.createElement('h4');
    tagsHeading.textContent = 'Your Voice Traits';
    results.appendChild(tagsHeading);

    var tagsContainer = document.createElement('div');
    tagsContainer.id = 'ie-voice-tags';
    results.appendChild(tagsContainer);

    var summary = document.createElement('div');
    summary.id = 'ie-voice-summary';
    results.appendChild(summary);

    widget.appendChild(results);
    anchor.parentNode.insertBefore(widget, anchor.nextSibling);

    /* --- Analysis logic --- */
    var TAG_COLORS = {
      purple: 'background:rgba(168,85,247,.2);color:#c084fc;border:1px solid rgba(168,85,247,.35)',
      teal:   'background:rgba(6,182,212,.2);color:#22d3ee;border:1px solid rgba(6,182,212,.35)',
      green:  'background:rgba(34,197,94,.2);color:#4ade80;border:1px solid rgba(34,197,94,.35)',
      yellow: 'background:rgba(234,179,8,.2);color:#facc15;border:1px solid rgba(234,179,8,.35)',
      red:    'background:rgba(239,68,68,.2);color:#f87171;border:1px solid rgba(239,68,68,.35)',
      blue:   'background:rgba(59,130,246,.2);color:#60a5fa;border:1px solid rgba(59,130,246,.35)',
    };

    function colorForTrait(trait) {
      var map = {
        'concise': 'teal', 'detailed': 'blue', 'flowing': 'purple',
        'simple vocabulary': 'green', 'rich vocabulary': 'purple', 'technical vocabulary': 'blue',
        'curious': 'yellow', 'direct': 'teal',
        'personal': 'purple', 'objective': 'blue',
        'enthusiastic': 'yellow', 'measured': 'green',
      };
      return map[trait] || 'purple';
    }

    function analyze(text) {
      /* Sentences */
      var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      var wordCounts = sentences.map(function (s) { return s.trim().split(/\s+/).length; });
      var avgSentLen = wordCounts.reduce(function (a, b) { return a + b; }, 0) / (wordCounts.length || 1);

      /* Words */
      var words = text.trim().split(/\s+/).filter(Boolean);
      var avgWordLen = words.reduce(function (a, w) { return a + w.replace(/[^a-z]/gi, '').length; }, 0) / (words.length || 1);

      /* Signals */
      var questions  = (text.match(/\?/g) || []).length;
      var exclaims   = (text.match(/!/g) || []).length;
      var firstPerson = (text.match(/\b(I|I'm|I've|I'd|I'll|my|me)\b/gi) || []).length;

      var traits = [];

      /* Sentence length */
      if (avgSentLen < 12)       traits.push({ label: 'concise',  color: colorForTrait('concise') });
      else if (avgSentLen < 22)  traits.push({ label: 'detailed', color: colorForTrait('detailed') });
      else                       traits.push({ label: 'flowing',  color: colorForTrait('flowing') });

      /* Vocabulary complexity */
      if (avgWordLen < 4.5)      traits.push({ label: 'simple vocabulary',   color: colorForTrait('simple vocabulary') });
      else if (avgWordLen < 6)   traits.push({ label: 'rich vocabulary',     color: colorForTrait('rich vocabulary') });
      else                       traits.push({ label: 'technical vocabulary', color: colorForTrait('technical vocabulary') });

      /* Questions */
      var qRate = questions / (sentences.length || 1);
      traits.push({ label: qRate > 0.2 ? 'curious' : 'direct', color: colorForTrait(qRate > 0.2 ? 'curious' : 'direct') });

      /* First-person */
      var fpRate = firstPerson / (words.length || 1);
      traits.push({ label: fpRate > 0.05 ? 'personal' : 'objective', color: colorForTrait(fpRate > 0.05 ? 'personal' : 'objective') });

      /* Exclamations */
      var exRate = exclaims / (sentences.length || 1);
      traits.push({ label: exRate > 0.15 ? 'enthusiastic' : 'measured', color: colorForTrait(exRate > 0.15 ? 'enthusiastic' : 'measured') });

      return traits;
    }

    function buildSummary(traits) {
      var labels = traits.map(function (t) { return t.label; });
      return 'Your writing voice comes across as ' + labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1] + '.';
    }

    analyzeBtn.addEventListener('click', function () {
      var text = textarea.value.trim();
      if (!text) {
        emptyMsg.style.display = 'block';
        return;
      }
      emptyMsg.style.display = 'none';
      analyzeBtn.disabled = true;

      var traits = analyze(text);

      tagsContainer.textContent = '';
      results.style.display = 'block';

      var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      traits.forEach(function (trait, i) {
        var tag = document.createElement('span');
        tag.className = 'ie-voice-tag';
        tag.textContent = trait.label;
        tag.style.cssText = TAG_COLORS[trait.color] || TAG_COLORS.purple;
        tagsContainer.appendChild(tag);

        var delay = prefersReduced ? 0 : i * 120;
        setTimeout(function () { tag.classList.add('ie-popped'); }, delay);
      });

      summary.textContent = buildSummary(traits);
      analyzeBtn.disabled = false;
    });
  }

  /* --------------------------------------------------
     E. DOPAMINE TIER SELECTOR
     Anchor: page has [data-energy] cards
     Page:   life-templates, dopamine-menu

     ★ Insight: Requires HTML activity cards/sections
       to be marked with data-energy="low|medium|high".
       Example: <div class="activity-card" data-energy="low">...</div>
       Elements without data-energy are always visible.
  -------------------------------------------------- */
  function initDopamineTiers(contentArea) {
    var energyCards = contentArea.querySelectorAll('[data-energy]');
    if (energyCards.length === 0) return;

    /* Find insertion point before first energy card */
    var firstCard = energyCards[0];
    var tabBar = document.createElement('div');
    tabBar.id = 'ie-tier-tabs';
    tabBar.setAttribute('role', 'tablist');
    tabBar.setAttribute('aria-label', 'Filter activities by energy level');

    var tiers = [
      { label: 'All',           value: 'all'    },
      { label: 'Low Energy',    value: 'low'    },
      { label: 'Medium Energy', value: 'medium' },
      { label: 'High Energy',   value: 'high'   },
    ];

    tiers.forEach(function (tier) {
      var btn = document.createElement('button');
      btn.className = 'ie-tier-btn' + (tier.value === 'all' ? ' ie-active' : '');
      btn.dataset.tier = tier.value;
      btn.textContent = tier.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', tier.value === 'all' ? 'true' : 'false');
      btn.addEventListener('click', function () {
        setActiveTier(tier.value);
      });
      tabBar.appendChild(btn);
    });

    firstCard.parentNode.insertBefore(tabBar, firstCard);

    function setActiveTier(value) {
      tabBar.querySelectorAll('.ie-tier-btn').forEach(function (btn) {
        var isActive = btn.dataset.tier === value;
        btn.classList.toggle('ie-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      energyCards.forEach(function (card) {
        var matches = (value === 'all') || (card.dataset.energy === value);
        if (matches) {
          card.classList.remove('ie-energy-hiding');
          card.removeAttribute('aria-hidden');
        } else {
          card.classList.add('ie-energy-hiding');
          card.setAttribute('aria-hidden', 'true');
        }
      });
    }

    registerCleanup(function () {
      if (tabBar.parentNode) tabBar.parentNode.removeChild(tabBar);
    });
  }

  /* --------------------------------------------------
     3. PAGE DISPATCHER
     Detects which features to activate based on the
     current page slug and content.
  -------------------------------------------------- */
  function initForPage(contentArea) {
    runCleanups();

    var page = getCurrentPage();

    try { initBreathing(contentArea); } catch (e) { console.warn('[IE] Breathing init failed:', e); }

    /* Tool picker: active on setup-your-tools, but also runs on any page that
       has [data-tool] content (future-proof). */
    if (page === 'setup-your-tools' || page === 'choose-configure-tools' || contentArea.querySelector('[data-tool]')) {
      try { initToolPicker(contentArea); } catch (e) { console.warn('[IE] Tool picker init failed:', e); }
    }

    if (page === 'onboarding-interview') {
      try { initOnboarding(contentArea); } catch (e) { console.warn('[IE] Onboarding init failed:', e); }
    }

    if (page === 'writing-voice' || contentArea.querySelector('[data-voice-demo]')) {
      try { initVoiceAnalysis(contentArea); } catch (e) { console.warn('[IE] Voice analysis init failed:', e); }
    }

    if (page === 'life-templates' || page === 'dopamine-menu' || contentArea.querySelector('[data-energy]')) {
      try { initDopamineTiers(contentArea); } catch (e) { console.warn('[IE] Dopamine tiers init failed:', e); }
    }
  }

  /* --------------------------------------------------
     4. MUTATION OBSERVER HOOK
     Watches #content-area for child-list changes
     (the SPA router replaces children on every nav).
     This is the integration point — no router changes
     needed.
  -------------------------------------------------- */
  var contentArea = document.getElementById('content-area');

  if (!contentArea) {
    /* Non-SPA fallback: run once on DOMContentLoaded */
    document.addEventListener('DOMContentLoaded', function () {
      initForPage(document.body);
    });
    return;
  }

  /* Debounce the observer callback so rapid DOM mutations during
     renderPage() don't fire initForPage multiple times. */
  var debouncedInit = debounce(function () {
    initForPage(contentArea);
  }, 80);

  var observer = new MutationObserver(function (mutations) {
    /* Only react to child-list changes (new page content injected) */
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].type === 'childList' && mutations[i].addedNodes.length > 0) {
        debouncedInit();
        break;
      }
    }
  });

  observer.observe(contentArea, { childList: true, subtree: false });

  /* Store observer so a future re-load of this script tears it down first */
  if (window._ieObserver) {
    try { window._ieObserver.disconnect(); } catch (e) {}
  }
  window._ieObserver = observer;

  /* Run immediately in case the initial page is already rendered */
  if (contentArea.children.length > 0) {
    initForPage(contentArea);
  }

})();
