/* ============================================
   Notion Client — Auth + Data Integration
   ============================================

   Connects the static workshop to the user's Notion
   workspace via OAuth. Exposes window.NotionClient.

   Features:
   - Auth check on load (cookie-based, httpOnly)
   - Login via popup (avoids iframe cookie issues)
   - Data fetchers with 60s cache
   - Sidebar completion checkmarks
   - Custom event: 'notion:auth-ready'

   Graceful degradation: everything works without
   auth. Personalization is additive only.
   ============================================ */

(function () {
  'use strict';

  var CACHE_TTL = 60000; // 60 seconds
  var cache = {};

  function cachedFetch(url) {
    var now = Date.now();
    if (cache[url] && (now - cache[url].time) < CACHE_TTL) {
      return Promise.resolve(cache[url].data);
    }
    return fetch(url, { credentials: 'include' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        cache[url] = { data: data, time: now };
        return data;
      });
  }

  /** Safely create a text element */
  function textEl(tag, text, styles) {
    var el = document.createElement(tag);
    el.textContent = text;
    if (styles) el.style.cssText = styles;
    return el;
  }

  // ── Styles ──────────────────────────────────────────────────────
  var STYLE_ID = 'notion-client-styles';
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.nc-connect-btn {',
      '  display: flex; align-items: center; gap: 8px;',
      '  padding: 10px 16px; margin: 12px 16px;',
      '  background: rgba(245,197,66, 0.15);',
      '  border: 1px solid rgba(245,197,66, 0.3);',
      '  border-radius: 8px; color: #F5C542;',
      '  font-size: 0.82rem; font-weight: 600;',
      '  cursor: pointer; transition: all 0.2s;',
      '  font-family: inherit; width: calc(100% - 32px);',
      '}',
      '.nc-connect-btn:hover {',
      '  background: rgba(245,197,66, 0.25);',
      '  border-color: #F5C542;',
      '}',
      '.nc-user-badge {',
      '  display: flex; align-items: center; gap: 8px;',
      '  padding: 10px 16px; margin: 12px 16px;',
      '  background: rgba(245,197,66, 0.1);',
      '  border: 1px solid rgba(245,197,66, 0.2);',
      '  border-radius: 8px; font-size: 0.8rem;',
      '  color: rgba(255,255,255,0.7);',
      '}',
      '.nc-user-badge img {',
      '  width: 24px; height: 24px; border-radius: 50%;',
      '}',
      '.nc-user-name { font-weight: 600; color: #F5C542; }',
      '.nc-logout { color: rgba(255,255,255,0.4); cursor: pointer; margin-left: auto; font-size: 0.7rem; }',
      '.nc-logout:hover { color: rgba(255,255,255,0.7); }',
      '.nav-check {',
      '  margin-left: auto; font-size: 0.75rem; color: #F5C542;',
      '  opacity: 0; transition: opacity 0.3s;',
      '}',
      '.nav-item.nc-completed .nav-check { opacity: 1; }',
      '.nc-completion-badge {',
      '  display: inline-flex; align-items: center; gap: 4px;',
      '  padding: 2px 10px; border-radius: 100px;',
      '  background: rgba(245,197,66, 0.15);',
      '  border: 1px solid rgba(245,197,66, 0.3);',
      '  color: #F5C542; font-size: 0.7rem; font-weight: 600;',
      '  margin-left: 8px; letter-spacing: 0.03em;',
      '}',
      '.nc-progress-card {',
      '  background: rgba(10, 10, 20, 0.85);',
      '  border: 1px solid rgba(245,197,66, 0.2);',
      '  border-radius: 10px; padding: 1.25rem;',
      '  margin-bottom: 1rem;',
      '}',
      '.nc-progress-bar {',
      '  width: 100%; height: 8px; background: rgba(245,197,66, 0.15);',
      '  border-radius: 4px; overflow: hidden; margin: 8px 0;',
      '}',
      '.nc-progress-fill {',
      '  height: 100%; border-radius: 4px;',
      '  background: linear-gradient(90deg, #F5C542, #F5C542);',
      '  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);',
      '}',
      '.nc-stat { display: flex; justify-content: space-between; font-size: 0.85rem; color: rgba(255,255,255,0.6); margin: 4px 0; }',
      '.nc-stat-value { color: #F5EADC; font-weight: 600; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── NotionClient API ────────────────────────────────────────────
  var NC = {
    isAuthenticated: false,
    user: null,
    ready: false,

    init: function () {
      return cachedFetch('/api/auth/me').then(function (data) {
        NC.isAuthenticated = data.authenticated;
        NC.user = data.user || null;
        NC.ready = true;
        window.dispatchEvent(new CustomEvent('notion:auth-ready', { detail: data }));
        NC._renderAuthUI();
        if (NC.isAuthenticated) NC._loadSidebarProgress();
        return data;
      }).catch(function () {
        NC.ready = true;
        NC.isAuthenticated = false;
        window.dispatchEvent(new CustomEvent('notion:auth-ready', { detail: { authenticated: false } }));
        // Even when the auth check fails (endpoint down / offline), still render the
        // "Connect Notion" button so the CTA is always visible and does something.
        NC._renderAuthUI();
      });
    },

    login: function () {
      var popup = window.open('/api/auth/login', 'notion-auth', 'width=600,height=700');
      if (!popup) {
        window.location.href = '/api/auth/login';
        return;
      }
      window.addEventListener('message', function onMsg(e) {
        // Only trust messages from our own origin — prevents arbitrary frames forging auth-complete
        if (e.origin !== window.location.origin) return;
        if (e.data && e.data.type === 'notion-auth-complete') {
          window.removeEventListener('message', onMsg);
          cache = {};
          NC.init();
        }
      });
    },

    logout: function () {
      fetch('/api/auth/logout', { credentials: 'include' }).then(function () {
        NC.isAuthenticated = false;
        NC.user = null;
        cache = {};
        NC._renderAuthUI();
        NC._clearSidebarProgress();
      });
    },

    getProgress: function () { return cachedFetch('/api/notion/progress'); },
    getLessons: function () { return cachedFetch('/api/notion/lessons'); },
    getProfile: function () { return cachedFetch('/api/notion/profile'); },
    getPrompts: function () { return cachedFetch('/api/notion/prompts'); },

    // ── Internal UI methods ─────────────────────────────────────
    _renderAuthUI: function () {
      var sidebar = document.getElementById('sidebar');
      if (!sidebar) return;

      var existing = sidebar.querySelector('.nc-auth-area');
      if (existing) existing.remove();

      var area = document.createElement('div');
      area.className = 'nc-auth-area';
      area.style.cssText = 'margin-top: auto; border-top: 1px solid rgba(245,197,66,0.1); padding-top: 4px;';

      if (NC.isAuthenticated && NC.user) {
        var badge = document.createElement('div');
        badge.className = 'nc-user-badge';

        if (NC.user.avatar_url) {
          var img = document.createElement('img');
          img.src = NC.user.avatar_url;
          img.alt = '';
          badge.appendChild(img);
        }

        var name = document.createElement('span');
        name.className = 'nc-user-name';
        name.textContent = NC.user.name || 'Connected';
        badge.appendChild(name);

        var logout = document.createElement('span');
        logout.className = 'nc-logout';
        logout.textContent = 'Disconnect';
        logout.addEventListener('click', NC.logout);
        badge.appendChild(logout);

        area.appendChild(badge);
      } else {
        var btn = document.createElement('button');
        btn.className = 'nc-connect-btn';
        btn.textContent = 'Connect Notion';
        btn.addEventListener('click', NC.login);
        var icon = document.createElement('span');
        icon.textContent = '\uD83D\uDD17'; // link emoji
        btn.insertBefore(icon, btn.firstChild);
        area.appendChild(btn);
      }

      sidebar.appendChild(area);
    },

    _loadSidebarProgress: function () {
      NC.getLessons().then(function (data) {
        if (!data.lessons) return;
        var navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(function (item) {
          if (!item.querySelector('.nav-check')) {
            var check = document.createElement('span');
            check.className = 'nav-check';
            check.textContent = '\u2713'; // checkmark
            item.appendChild(check);
          }
        });

        var completedSlugs = {};
        data.lessons.forEach(function (lesson) {
          if (lesson.status !== 'completed') return;
          NC._slugCandidates(lesson).forEach(function (s) {
            if (s) completedSlugs[s] = true;
          });
        });

        navItems.forEach(function (item) {
          var page = (item.dataset.page || '').toLowerCase();
          var labelText = (item.querySelector('.nav-label') || {}).textContent || '';
          var label = NC._slugify(labelText);

          if (completedSlugs[page] || completedSlugs[label]) {
            item.classList.add('nc-completed');
          }
        });
      }).catch(function () { /* silently fail */ });
    },

    // Lesson titles in Notion don't always derive cleanly to nav slugs.
    // "Writing & Voice" \u2192 "writing-voice" works via slugify; but
    // "F1: How AI Actually Thinks" \u2192 "first-ai-conversation" needs an
    // explicit mapping. Override per lesson by adding a "Slug" rich-text
    // property in Notion \u2014 that takes precedence over everything here.
    _titleToNavMap: {
      'how-ai-actually-thinks': 'first-ai-conversation',
      'talking-to-ai': 'prompt-basics',
      'prompt-as-conversation': 'prompt-basics',
      'your-ai-toolbox': 'setup-your-tools',
      'building-your-system': 'connect-ai',
      'mcp': 'track-plugins',
      'plugins-and-mcp': 'track-plugins',
      'expert-panels': 'track-councils',
      'councils': 'track-councils',
      'multi-ai': 'track-multi-ai',
      'rag-and-knowledge': 'track-rag',
      'rag': 'track-rag',
    },

    // Two slug variants: ampersandMode 'and' \u2192 "writing-and-voice",
    // 'drop' \u2192 "writing-voice". Nav slugs use either; emit both.
    _slugify: function (s, ampersandMode) {
      var ampersand = ampersandMode === 'and' ? ' and ' : ' ';
      return String(s || '')
        .toLowerCase()
        .replace(/&/g, ampersand)
        .replace(/[^a-z0-9 ]/g, ' ')
        .trim()
        .split(/\s+/)
        .join('-');
    },

    _stripModulePrefix: function (s) {
      // "F1: How AI Actually Thinks" \u2192 "How AI Actually Thinks"
      return String(s || '').replace(/^\s*[A-Za-z]\d+\s*[:.\-]\s*/, '');
    },

    _slugCandidates: function (lesson) {
      var out = [];
      if (lesson.slug) out.push(String(lesson.slug).toLowerCase().trim());
      var title = lesson.title || '';
      var stripped = NC._stripModulePrefix(title);
      ['and', 'drop'].forEach(function (mode) {
        var full = NC._slugify(title, mode);
        var stripSlug = NC._slugify(stripped, mode);
        out.push(full, stripSlug);
        if (NC._titleToNavMap[full]) out.push(NC._titleToNavMap[full]);
        if (NC._titleToNavMap[stripSlug]) out.push(NC._titleToNavMap[stripSlug]);
      });
      return out;
    },

    _clearSidebarProgress: function () {
      document.querySelectorAll('.nav-item.nc-completed').forEach(function (item) {
        item.classList.remove('nc-completed');
      });
    },

    /** Called by interactive-elements.js after page render */
    enhancePage: function (pageName, contentArea) {
      if (!NC.isAuthenticated || !contentArea) return;

      // Completion badge on lesson pages
      NC.getLessons().then(function (data) {
        if (!data.lessons) return;
        var match = data.lessons.find(function (l) {
          return l.slug && l.slug.toLowerCase() === pageName.toLowerCase();
        });
        if (match && match.status === 'completed') {
          var h1 = contentArea.querySelector('.brain-header-text h1');
          if (h1 && !h1.querySelector('.nc-completion-badge')) {
            var badge = document.createElement('span');
            badge.className = 'nc-completion-badge';
            badge.textContent = '\u2713 Completed';
            h1.appendChild(badge);
          }
        }
      }).catch(function () {});

      // AI Profile — inject live data
      if (pageName === 'ai-profile') {
        NC.getProfile().then(function (data) {
          if (!data.profile) return;
          var placeholders = contentArea.querySelectorAll('[data-notion-section]');
          placeholders.forEach(function (el) {
            var sectionName = el.dataset.notionSection.toLowerCase();
            var match = data.profile.find(function (s) {
              return s.heading.toLowerCase().includes(sectionName);
            });
            if (match && match.content.length > 0) {
              el.textContent = ''; // Clear placeholder
              match.content.forEach(function (text) {
                el.appendChild(textEl('p', text, 'color:rgba(255,255,255,0.8);margin:0.25rem 0'));
              });
            }
          });
        }).catch(function () {});
      }

      // Progress page — inject real stats
      if (pageName === 'your-progress') {
        NC.getProgress().then(function (stats) {
          var anchor = contentArea.querySelector('[data-notion-progress]');
          if (!anchor) return;

          var card = document.createElement('div');
          card.className = 'nc-progress-card';

          var lessons = stats.lessons || { total: 0, completed: 0 };
          var pct = lessons.total > 0 ? Math.round((lessons.completed / lessons.total) * 100) : 0;

          card.appendChild(textEl('h3', 'Your Progress', 'color:#F5C542;margin:0 0 8px;font-size:1rem'));

          var barOuter = document.createElement('div');
          barOuter.className = 'nc-progress-bar';
          var barFill = document.createElement('div');
          barFill.className = 'nc-progress-fill';
          barFill.style.width = pct + '%';
          barOuter.appendChild(barFill);
          card.appendChild(barOuter);

          function addStat(label, value) {
            var row = document.createElement('div');
            row.className = 'nc-stat';
            row.appendChild(textEl('span', label));
            row.appendChild(textEl('span', value, 'color:#F5EADC;font-weight:600'));
            row.lastChild.className = 'nc-stat-value';
            card.appendChild(row);
          }

          addStat('Lessons', lessons.completed + ' / ' + lessons.total);
          if (stats.prompts) addStat('Prompts saved', String(stats.prompts.count));
          if (stats.tools) addStat('Tools configured', String(stats.tools.count));
          if (stats.portfolio) addStat('Portfolio items', String(stats.portfolio.count));
          if (stats.workflows) addStat('Workflows', String(stats.workflows.count));

          anchor.parentNode.insertBefore(card, anchor);
        }).catch(function () {});
      }
    },
  };

  // ── Initialize ──────────────────────────────────────────────────
  window.NotionClient = NC;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { NC.init(); });
  } else {
    NC.init();
  }
})();
