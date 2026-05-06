/* ============================================
   SPA Shell Redirect
   When a standalone page is loaded as a top-level
   document, redirect into the SPA shell so users
   get the persistent sidebar + phase indicator.
   No-ops when the page is being injected by the
   SPA router (content-area is already present).
   ============================================ */
(function () {
  'use strict';
  if (document.getElementById('content-area')) return;
  if (window.self !== window.top) return;
  var path = window.location.pathname;
  var match = path.match(/\/([a-z0-9-]+)\.html$/i);
  if (!match) return;
  var page = match[1].toLowerCase();
  if (page === 'app') return;
  window.location.replace('app.html#' + page);
})();
