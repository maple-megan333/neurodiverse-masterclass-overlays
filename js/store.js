/* ============================================
   MasterClass.store — Unified persistence facade

   Replaces three previously-separate localStorage systems:
     - masterclass-onboarding-state  (onboarding-state.js)
     - masterclass-onboarding        (interactive-elements.js initOnboarding)
     - motion-paused                  (motion-toggle.js)
     - notion-* keys                  (notion-client.js)

   Single namespace: 'mc.v1.<key>'
   One-time migration runs on first load and clears legacy keys.
   ============================================ */
(function () {
  'use strict';
  if (window.MasterClass && window.MasterClass.store) return;

  var NS = 'mc.v1.';
  var MIGRATED_FLAG = NS + '_migrated';

  function key(k) { return NS + k; }

  function get(k, fallback) {
    try {
      var raw = localStorage.getItem(key(k));
      if (raw === null) return fallback === undefined ? null : fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback === undefined ? null : fallback;
    }
  }

  function set(k, value) {
    try {
      localStorage.setItem(key(k), JSON.stringify(value));
      emit(k, value);
      return true;
    } catch (e) {
      console.warn('[store] set failed for ' + k + ':', e);
      return false;
    }
  }

  function remove(k) {
    try {
      localStorage.removeItem(key(k));
      emit(k, null);
      return true;
    } catch (e) { return false; }
  }

  function clear() {
    try {
      var prefix = NS;
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var name = localStorage.key(i);
        if (name && name.indexOf(prefix) === 0) toRemove.push(name);
      }
      toRemove.forEach(function (name) { localStorage.removeItem(name); });
      emit('*', null);
      return true;
    } catch (e) { return false; }
  }

  /* Lightweight observer — components can react when state changes */
  var listeners = {};
  function on(k, fn) {
    listeners[k] = listeners[k] || [];
    listeners[k].push(fn);
    return function off() {
      listeners[k] = (listeners[k] || []).filter(function (f) { return f !== fn; });
    };
  }
  function emit(k, value) {
    (listeners[k] || []).forEach(function (fn) { try { fn(value); } catch (e) {} });
    (listeners['*'] || []).forEach(function (fn) { try { fn(k, value); } catch (e) {} });
  }

  /* One-time migration from legacy keys.
     Keeps user data intact, deletes the legacy keys after copying. */
  function migrateLegacy() {
    if (localStorage.getItem(MIGRATED_FLAG)) return;

    var migrations = [
      { from: 'masterclass-onboarding',       to: 'onboarding', parse: true  },
      { from: 'masterclass-onboarding-state', to: 'onboarding', parse: true  },
      { from: 'motion-paused',                to: 'motionPaused', parse: false },
      { from: 'notion_oauth_state',           to: 'notion.state', parse: false },
      { from: 'notion_token',                 to: 'notion.token', parse: false },
      { from: 'notion_user',                  to: 'notion.user',  parse: true  }
    ];

    migrations.forEach(function (m) {
      try {
        var raw = localStorage.getItem(m.from);
        if (raw === null) return;
        var existing = localStorage.getItem(key(m.to));
        if (existing === null) {
          /* No data in new location yet — copy it across */
          if (m.parse) {
            try { localStorage.setItem(key(m.to), raw.charAt(0) === '{' || raw.charAt(0) === '[' ? raw : JSON.stringify(raw)); }
            catch (e) { localStorage.setItem(key(m.to), JSON.stringify(raw)); }
          } else {
            localStorage.setItem(key(m.to), JSON.stringify(raw === 'true' ? true : raw === 'false' ? false : raw));
          }
        } else if (m.from === 'masterclass-onboarding-state') {
          /* Both legacy onboarding stores existed — merge */
          try {
            var ours = JSON.parse(existing);
            var theirs = JSON.parse(raw);
            Object.keys(theirs).forEach(function (k) {
              if (!(k in ours)) ours[k] = theirs[k];
            });
            localStorage.setItem(key(m.to), JSON.stringify(ours));
          } catch (e) {}
        }
        localStorage.removeItem(m.from);
      } catch (e) {
        console.warn('[store] migration failed for ' + m.from, e);
      }
    });

    try { localStorage.setItem(MIGRATED_FLAG, '1'); } catch (e) {}
  }

  migrateLegacy();

  window.MasterClass = window.MasterClass || {};
  window.MasterClass.store = {
    get: get,
    set: set,
    remove: remove,
    clear: clear,
    on: on,
    _namespace: NS
  };
})();
