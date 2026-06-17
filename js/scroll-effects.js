/* ============================================
   Scroll effects — Lenis smooth scroll + GSAP ScrollTrigger.
   Loads only if the CDN globals exist; respects reduced motion.

   Notes:
   - Lenis ticks via GSAP's RAF so the two stay in lockstep.
   - All effects are progressive enhancement: if a CDN fails, nothing
     in the page breaks because we only touch transforms/opacity.
   - setupContentEffects() is idempotent: elements already wired are
     skipped via dataset.parallaxWired / dataset.revealWired markers.
   ============================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  if (typeof window.gsap === 'undefined' ||
      typeof window.ScrollTrigger === 'undefined' ||
      typeof window.Lenis === 'undefined') {
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  /* --- Lenis smooth scroll ---
     In the SPA shell (app.html), scrolling happens inside #spaMain, not the window.
     We must tell Lenis to use that element as the wrapper; otherwise Lenis takes over
     window/html scroll and breaks the SPA's overflow-y:auto container. */
  var spaMainEl = document.getElementById('spaMain');
  var contentAreaEl = document.getElementById('content-area');
  var lenisOpts = {
    duration: 1.05,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
    smoothTouch: false
  };
  if (spaMainEl && contentAreaEl) {
    /* SPA mode: smooth-scroll the sidebar-main panel, not the window */
    lenisOpts.wrapper = spaMainEl;
    lenisOpts.content = contentAreaEl;
    /* Tell ScrollTrigger to watch the SPA container for scroll events */
    ScrollTrigger.defaults({ scroller: spaMainEl });
  }
  var lenis = new window.Lenis(lenisOpts);

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  window.__lenis = lenis;

  /* ============================================================
     setupContentEffects()
     Content-dependent setup: parallax and reveal animations.
     Called on DOMContentLoaded AND on every 'spa:rendered' event.
     Idempotent — uses dataset markers to skip already-wired elements.
     ============================================================ */
  function setupContentEffects() {

    /* --- Hero parallax: layered depth ---
       Three layers, slower → faster movement to give pseudo-3D feel.
       We move backgrounds via yPercent so resize behaves cleanly. */
    var heroHeader = document.querySelector('.brain-header');
    var heroCanvas = document.getElementById('brainCanvas');
    var heroOverlay = document.querySelector('.brain-header-overlay');
    var heroText = document.getElementById('headerText');

    if (heroHeader && !heroHeader.dataset.parallaxWired) {
      heroHeader.dataset.parallaxWired = 'true';

      var heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroHeader,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      if (heroCanvas) heroTl.to(heroCanvas, { yPercent: 20, ease: 'none' }, 0);
      if (heroOverlay) heroTl.to(heroOverlay, { yPercent: 35, ease: 'none' }, 0);
      if (heroText) {
        heroTl.to(heroText, { yPercent: 60, opacity: 0.25, ease: 'none' }, 0);
      }
    }

    /* --- Parallax-depth utility elements ---
       Any element with [data-parallax="0.2"] moves at that speed.
       Adds optional .mesh-orb depth without dictating exact selectors. */
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      if (el.dataset.parallaxWired) return;
      el.dataset.parallaxWired = 'true';

      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      gsap.to(el, {
        yPercent: -100 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    /* --- Section reveals ---
       Reveal energy cards, track cards, and section heads as they enter
       viewport. Stagger for natural rhythm. Use `will-change` only while
       animating to avoid promoting too many layers. */
    function reveal(selector, opts) {
      var els = Array.prototype.filter.call(
        document.querySelectorAll(selector),
        function (el) { return !el.dataset.revealWired; }
      );
      if (!els.length) return;
      opts = opts || {};
      els.forEach(function (el) { el.dataset.revealWired = 'true'; });
      gsap.from(els, {
        y: opts.y || 28,
        opacity: 0,
        duration: opts.duration || 0.7,
        ease: 'power3.out',
        stagger: opts.stagger || 0.06,
        scrollTrigger: {
          trigger: els[0].parentElement,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    }

    reveal('.energy-card', { stagger: 0.08 });
    reveal('.track-card', { stagger: 0.05, y: 22 });
    reveal('.section-head-clean', { stagger: 0, y: 12, duration: 0.5 });
    reveal('.home-lead', { stagger: 0, y: 16, duration: 0.6 });
    reveal('.resume-card', { stagger: 0, y: 16, duration: 0.55 });
    reveal('.meta-line', { stagger: 0, y: 12, duration: 0.5 });

    /* Refresh ScrollTrigger so newly-added content is measured correctly */
    ScrollTrigger.refresh();
  }

  /* --- Wire up calls ---
     1. Run now if content is already present (standalone / DOMContentLoaded).
     2. Re-run every time the SPA router injects new content. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupContentEffects);
  } else {
    setupContentEffects();
  }

  window.addEventListener('spa:rendered', setupContentEffects);

  /* --- Fix-up on full image/font load --- */
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });
})();
