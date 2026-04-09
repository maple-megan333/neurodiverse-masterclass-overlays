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

  // === Sidebar toggle ===
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    sidebarOverlay.classList.toggle('active');
  });
  sidebarOverlay.addEventListener('click', function() {
    sidebar.classList.add('collapsed');
    sidebarOverlay.classList.remove('active');
  });

  // === Nav click handler ===
  document.getElementById('sidebarNav').addEventListener('click', function(e) {
    var item = e.target.closest('.nav-item');
    if (!item) return;
    var page = item.dataset.page;
    if (page) navigateTo(page);
    if (window.innerWidth <= 768) {
      sidebar.classList.add('collapsed');
      sidebarOverlay.classList.remove('active');
    }
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

    // Init enhancements
    initCopyButtons();
    initSmoothScroll();
    interceptNavLinks();
    initMermaid();
    currentPage = pageName;

    // Brain header stays sticky (from brain-header.css). Content covers it via opaque background + z-index:10.

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
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.style.cssText = 'position:absolute;top:8px;right:8px;background:var(--purple-surface);color:var(--text-secondary);border:1px solid rgba(168,85,247,.2);border-radius:6px;padding:4px 10px;font-size:.75rem;cursor:pointer';
      btn.addEventListener('click', function() {
        var code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.textContent).then(function() {
          btn.textContent = 'Copied!';
          setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
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
