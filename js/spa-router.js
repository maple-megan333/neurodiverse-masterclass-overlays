/* ============================================
   SPA Router — Neurodiverse AI MasterClass
   Handles page loading, scroll bridging for
   brain-animation.js, and content enhancements.

   NOTE: innerHTML usage is intentional here —
   we are loading our OWN local HTML pages from
   the same origin (same-origin fetch + DOMParser).
   This is not user-supplied or external content.
   ============================================ */

(function() {
  'use strict';

  var contentArea = document.getElementById('content-area');
  var loader = document.getElementById('loader');
  var sidebar = document.getElementById('sidebar');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var sidebarOverlay = document.getElementById('sidebarOverlay');
  var spaMain = document.getElementById('spaMain');
  var pageCache = {};
  var currentPage = null;
  var firstRender = true;

  // === Sidebar toggle ===
  // On narrow screens (<=768px) sidebar starts collapsed; on wide screens it starts open.
  // We use the .collapsed class as the single source of truth so CSS only describes
  // what "collapsed" looks like — JS owns the open/closed state.
  var MOBILE_BREAKPOINT = 768;
  function isMobile() { return window.innerWidth <= MOBILE_BREAKPOINT; }

  function openSidebar() {
    sidebar.classList.remove('collapsed');
    if (isMobile()) sidebarOverlay.classList.add('active');
    sidebarToggle.setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    sidebar.classList.add('collapsed');
    sidebarOverlay.classList.remove('active');
    sidebarToggle.setAttribute('aria-expanded', 'false');
  }

  // Initial state: collapsed on mobile, open on desktop.
  if (isMobile()) {
    sidebar.classList.add('collapsed');
    sidebarToggle.setAttribute('aria-expanded', 'false');
  }

  sidebarToggle.addEventListener('click', function() {
    if (sidebar.classList.contains('collapsed')) openSidebar();
    else closeSidebar();
  });
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Keep state sensible when resizing across the breakpoint.
  var lastIsMobile = isMobile();
  window.addEventListener('resize', function() {
    var nowMobile = isMobile();
    if (nowMobile !== lastIsMobile) {
      if (nowMobile) closeSidebar();
      else { sidebar.classList.remove('collapsed'); sidebarOverlay.classList.remove('active'); sidebarToggle.setAttribute('aria-expanded', 'true'); }
      lastIsMobile = nowMobile;
    }
  });

  // === Nav click handler ===
  document.getElementById('sidebarNav').addEventListener('click', function(e) {
    var item = e.target.closest('.nav-item');
    if (!item) return;
    var page = item.dataset.page;
    if (page) navigateTo(page);
    if (isMobile()) closeSidebar();
  });

  // === CRITICAL: Scroll bridge ===
  // brain-animation.js uses window.scrollY and listens to window 'scroll'.
  // In the SPA, scrolling happens inside .spa-main, not the window.
  // We bridge that gap so the brain animation responds to real scrolling.
  function setupScrollBridge() {
    Object.defineProperty(window, 'scrollY', {
      get: function() { return spaMain.scrollTop; },
      configurable: true
    });
    Object.defineProperty(window, 'pageYOffset', {
      get: function() { return spaMain.scrollTop; },
      configurable: true
    });

    spaMain.addEventListener('scroll', function() {
      window.dispatchEvent(new Event('scroll'));
    }, { passive: true });
  }
  setupScrollBridge();

  // === Page navigation ===
  function navigateTo(pageName) {
    if (pageName === currentPage) return;
    window.location.hash = pageName;

    document.querySelectorAll('.nav-item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.page === pageName);
    });

    contentArea.classList.add('loading');
    loader.classList.add('active');

    var cached = pageCache[pageName];
    if (cached) {
      renderPage(cached, pageName);
    } else {
      var fileName = pageName === 'index' ? 'index.html' : pageName + '.html';
      fetch(fileName).then(function(resp) {
        if (!resp.ok) throw new Error('Page not found: ' + fileName);
        return resp.text();
      }).then(function(text) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(text, 'text/html');
        var styles = Array.from(doc.querySelectorAll('head style')).map(function(s) {
          return s.outerHTML;
        }).join('');
        var body = doc.querySelector('body');
        // Same-origin HTML from our own pages — safe to use innerHTML
        var pageHtml = body ? styles + body.innerHTML : '<p>Content not found.</p>'; // eslint-disable-line
        pageCache[pageName] = pageHtml;
        renderPage(pageHtml, pageName);
      }).catch(function(err) {
        var errDiv = document.createElement('div');
        errDiv.style.cssText = 'padding:40px;text-align:center';
        var h2 = document.createElement('h2');
        h2.textContent = 'Oops!';
        var p1 = document.createElement('p');
        p1.style.color = 'var(--text-secondary)';
        p1.textContent = 'Could not load this page.';
        var p2 = document.createElement('p');
        p2.style.cssText = 'color:var(--text-muted);font-size:.8rem';
        p2.textContent = err.message;
        errDiv.appendChild(h2);
        errDiv.appendChild(p1);
        errDiv.appendChild(p2);
        contentArea.textContent = '';
        contentArea.appendChild(errDiv);
        contentArea.classList.remove('loading');
        loader.classList.remove('active');
      });
    }
  }

  // === Fix 2b: Header fade on scroll ===
  function wireHeaderFade() {
    var spaMainEl = document.getElementById('spaMain');
    if (!spaMainEl) return;
    spaMainEl.addEventListener('scroll', function() {
      var header = document.querySelector('.brain-header-text');
      if (!header) return;
      if (spaMainEl.scrollTop > 40) header.classList.add('hidden');
      else header.classList.remove('hidden');
    }, { passive: true });
  }

  function renderPage(pageHtml, pageName) {
    // Parse same-origin page HTML into DOM nodes via template element
    var template = document.createElement('template');
    template.innerHTML = pageHtml; // eslint-disable-line -- same-origin content only

    // Clear and populate content area
    contentArea.textContent = '';
    contentArea.appendChild(template.content);

    // Re-execute scripts (brain-animation.js, main.js, inline scripts)
    contentArea.querySelectorAll('script').forEach(function(old) {
      var s = document.createElement('script');
      if (old.src) {
        s.src = old.src;
      } else {
        s.textContent = 'try{' + old.textContent + '}catch(e){console.warn("Page script:",e)}';
      }
      old.parentNode.replaceChild(s, old);
    });

    // Reset scroll
    spaMain.scrollTop = 0;

    // Notify scroll-effects.js (and any other listeners) that new content is live
    window.dispatchEvent(new CustomEvent('spa:rendered', { detail: { pageName: pageName } }));

    // Init enhancements
    initCopyButtons();
    initSmoothScroll();
    interceptNavLinks();
    initMermaid();
    initScrollReveal();
    initInteractiveElements(pageName);
    initNotionEnhancements(pageName);
    currentPage = pageName;

    // Fix 1: Hide sidebar on home page; open on desktop for all other pages.
    if (pageName === 'index' || pageName === '') {
      closeSidebar();
    } else if (!isMobile()) {
      openSidebar();
    }

    // Fix 2b: Wire scroll listener so header fades once per SPA session.
    if (firstRender) {
      wireHeaderFade();
    }

    // Fix 3: Screen reader announcement + focus management on route change.
    var announce = document.getElementById('sr-announce');
    var newH1 = contentArea.querySelector('h1');
    if (announce && newH1) {
      announce.textContent = newH1.textContent + ' — loaded';
      if (!firstRender) {
        newH1.setAttribute('tabindex', '-1');
        newH1.focus({ preventScroll: false });
      }
    }

    firstRender = false;

    contentArea.classList.remove('loading');
    loader.classList.remove('active');
  }

  // === Copy buttons for code blocks ===
  function initCopyButtons() {
    contentArea.querySelectorAll('pre').forEach(function(pre) {
      if (pre.parentElement.classList.contains('code-wrapper')) return;
      var w = document.createElement('div');
      w.className = 'code-wrapper';
      w.style.position = 'relative';
      pre.parentNode.insertBefore(w, pre);
      w.appendChild(pre);
      // If pre already contains an inline copy-btn, skip adding a duplicate
      if (pre.querySelector('.copy-btn')) return;
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.textContent = 'Copy';
      var codeLabel = pre.querySelector('.code-label');
      var labelText = codeLabel ? codeLabel.textContent.trim() : 'code';
      btn.setAttribute('aria-label', 'Copy ' + labelText + ' to clipboard');
      btn.style.cssText = 'position:absolute;top:8px;right:8px;background:var(--purple-surface);color:var(--text-secondary);border:1px solid rgba(245,197,66,.25);border-radius:6px;padding:4px 10px;font-size:.75rem;cursor:pointer';
      btn.addEventListener('click', function() {
        var code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.textContent).then(function() {
          btn.textContent = 'Copied!';
          btn.setAttribute('aria-label', labelText + ' copied to clipboard');
          setTimeout(function() {
            btn.textContent = 'Copy';
            btn.setAttribute('aria-label', 'Copy ' + labelText + ' to clipboard');
          }, 2000);
        });
      });
      w.appendChild(btn);
    });
  }

  // === Smooth scroll for anchor links ===
  function initSmoothScroll() {
    contentArea.querySelectorAll('a[href^="#"]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var target = contentArea.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // === Intercept .html links for SPA navigation ===
  function interceptNavLinks() {
    contentArea.querySelectorAll('a[href]').forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var match = href.match(/^([a-z0-9-]+)\.html$/);
      if (match) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          navigateTo(match[1] === 'index' ? 'index' : match[1]);
        });
      }
    });
  }

  // === Mermaid diagrams ===
  function initMermaid() {
    if (typeof mermaid !== 'undefined') {
      contentArea.querySelectorAll('.mermaid').forEach(function(el) {
        el.removeAttribute('data-processed');
      });
      try { mermaid.init(undefined, contentArea.querySelectorAll('.mermaid')); } catch (e) {}
    }
  }

  // === Scroll Reveal Observer ===
  function initScrollReveal() {
    var els = contentArea.querySelectorAll('.reveal, .reveal-stagger');
    if (els.length === 0 || !('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px', root: spaMain });
    els.forEach(function(el) { obs.observe(el); });
  }

  // === Interactive Elements Loader ===
  // Calls the global initInteractiveForPage(pageName) function if it exists
  // (defined in js/interactive-elements.js, loaded via <script> in app.html)
  function initInteractiveElements(pageName) {
    if (typeof window.initInteractiveForPage === 'function') {
      try { window.initInteractiveForPage(pageName); }
      catch(e) { console.warn('Interactive elements init error:', e); }
    }
  }

  // === Notion Enhancements ===
  // Calls NotionClient.enhancePage if authenticated
  function initNotionEnhancements(pageName) {
    if (typeof window.NotionClient === 'object' && window.NotionClient.isAuthenticated) {
      try { window.NotionClient.enhancePage(pageName, contentArea); }
      catch(e) { console.warn('Notion enhancement error:', e); }
    }
  }

  // === Hash routing ===
  function getPageFromHash() {
    var hash = window.location.hash.replace('#', '');
    return hash || 'index';
  }

  window.addEventListener('hashchange', function() {
    navigateTo(getPageFromHash());
  });

  // Initial load
  navigateTo(getPageFromHash());
})();
