/* ============================================
   Brain Header — Scroll-Driven Strand Draw-In
   ============================================

   THE EFFECT:
   1. Brain-dim.png is the base (always visible)
   2. As you scroll, colored neural strands are drawn
      progressively from start to end — like a pen
      drawing each line in real time
   3. Strands activate in a staggered sequence keyed
      to scroll progress (0–1)
   4. Once fully drawn, strands stay and gently pulse
   5. At scrollProgress 0.85–1.0, canvas crossfades
      to brain-lit.png as the final polished state

   STRAND MAP (normalized 0–1 coords):
   All x/y values derived from visual analysis of
   the 1376×768 lit brain image. Brain sits at
   roughly x:0.08–0.87, y:0.04–0.96.
   Brain center ≈ (0.48, 0.46). Stem ≈ (0.47, 0.90).
   ============================================ */

(function () {
  'use strict';

  // ── Reduced Motion / User Pause Guard ──────────────────────────
  // Honors OS-level prefers-reduced-motion and a manual pause flag set
  // by the motion-toggle button. When either is active, we draw the
  // dim brain image once (static) and skip all animation work.
  var motionDisabled = function () {
    if (document.body && document.body.classList.contains('motion-paused')) return true;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    return false;
  };

  // ── Cleanup previous instance ──────────────────────────────────
  if (window._brainAnimFrame) {
    cancelAnimationFrame(window._brainAnimFrame);
    window._brainAnimFrame = null;
  }
  if (window._brainScrollHandler) {
    window.removeEventListener('scroll', window._brainScrollHandler);
    var _sc = document.getElementById('spaMain');
    if (_sc) _sc.removeEventListener('scroll', window._brainScrollHandler);
  }
  if (window._brainIO) { try { window._brainIO.disconnect(); } catch (e) {} }

  var brainHeader = document.querySelector('.brain-header');
  if (!brainHeader) return;

  // ── DOM Surgery ────────────────────────────────────────────────
  var overlayCanvas;
  var oldCanvas = document.getElementById('brainCanvas');
  if (oldCanvas) {
    oldCanvas.removeAttribute('id');
    oldCanvas.className = 'brain-canvas-overlay';
    overlayCanvas = oldCanvas;
  } else {
    overlayCanvas = brainHeader.querySelector('.brain-canvas-overlay');
    if (!overlayCanvas) {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'brain-canvas-overlay';
      brainHeader.appendChild(overlayCanvas);
    }
  }
  // Hide all img-based brain elements — canvas handles everything
  var toHide = brainHeader.querySelectorAll('.brain-img, .brain-glow');
  for (var h = 0; h < toHide.length; h++) toHide[h].style.display = 'none';

  var ctx = overlayCanvas.getContext('2d');

  // ── Load images ────────────────────────────────────────────────
  var dimImg = new Image(); dimImg.src = 'img/brain-dim.png';
  var litImg = new Image(); litImg.src = 'img/brain-lit.png';
  var dimLoaded = false, litLoaded = false;
  dimImg.onload = function () { dimLoaded = true; };
  litImg.onload = function () { litLoaded = true; };

  // ── Config ─────────────────────────────────────────────────────
  var SCROLL_RANGE = 1200;
  var scrollProgress = 0;

  // ── Strand Definitions ─────────────────────────────────────────
  // Each strand: { points, color, thickness, glowWidth,
  //                startAt, endAt, pulse }
  //
  // points: array of {x,y} normalized 0–1 over the full image
  //   x=0 is left edge of image, x=1 is right edge
  //   y=0 is top edge, y=1 is bottom edge
  //
  // startAt/endAt: scroll progress 0–1 when this strand
  //   begins / finishes drawing in
  //
  // Colors matched to what's visible in the actual image.

  // All strand coords are in BRAIN-LOCAL space:
  // (0,0) = brain top-left, (1,1) = brain bottom-right
  // Center of brain = (0.5, 0.5). Stem = (0.49, 0.76)
  // Everything between 0.05 and 0.95 is safely inside.
  var STRANDS = [

    // ── 0. WHITE BRAIN STEM ──────────────────────────────────────
    {
      id: 'stem',
      points: [
        {x:0.49,y:0.60},{x:0.49,y:0.66},{x:0.48,y:0.72},{x:0.48,y:0.76}
      ],
      color:{h:0,s:0,l:96}, thickness:3, glowWidth:14,
      startAt:0.00, endAt:0.05, pulse:true, dotInterval:0
    },

    // ── 1. MAGENTA HERO LOOP ─────────────────────────────────────
    {
      id: 'magenta-hero',
      points: [
        {x:0.49,y:0.72},
        {x:0.50,y:0.62},
        {x:0.52,y:0.54},
        {x:0.55,y:0.47},
        {x:0.58,y:0.42},
        {x:0.62,y:0.37},
        {x:0.66,y:0.33},
        {x:0.70,y:0.32},
        {x:0.72,y:0.35},
        {x:0.71,y:0.40},
        {x:0.68,y:0.44},
        {x:0.64,y:0.47},
        {x:0.59,y:0.49},
        {x:0.54,y:0.50},
        {x:0.50,y:0.49},
        {x:0.46,y:0.47},
        {x:0.42,y:0.45},
        {x:0.38,y:0.44},
        {x:0.34,y:0.43},
        {x:0.30,y:0.44}
      ],
      color:{h:310,s:90,l:72}, thickness:3, glowWidth:16,
      startAt:0.05, endAt:0.25, pulse:true, dotInterval:0.06
    },

    // ── 2. CYAN TOP CONTOUR ──────────────────────────────────────
    {
      id: 'cyan-top',
      points: [
        {x:0.15,y:0.45},
        {x:0.13,y:0.38},
        {x:0.14,y:0.30},
        {x:0.18,y:0.22},
        {x:0.24,y:0.15},
        {x:0.32,y:0.10},
        {x:0.40,y:0.08},
        {x:0.48,y:0.08},
        {x:0.56,y:0.10},
        {x:0.63,y:0.15},
        {x:0.70,y:0.22},
        {x:0.75,y:0.30},
        {x:0.78,y:0.40}
      ],
      color:{h:185,s:88,l:68}, thickness:2.5, glowWidth:14,
      startAt:0.15, endAt:0.35, pulse:true, dotInterval:0
    },

    // ── 3. GREEN ARC — top frontal ───────────────────────────────
    {
      id: 'green-arc',
      points: [
        {x:0.60,y:0.12},{x:0.66,y:0.11},{x:0.72,y:0.14},{x:0.76,y:0.20},{x:0.78,y:0.28}
      ],
      color:{h:138,s:88,l:62}, thickness:2, glowWidth:12,
      startAt:0.20, endAt:0.40, pulse:false, dotInterval:0
    },

    // ── 4. GOLD/AMBER BAND — temporal ────────────────────────────
    {
      id: 'gold-band',
      points: [
        {x:0.50,y:0.68},
        {x:0.55,y:0.64},
        {x:0.60,y:0.60},
        {x:0.65,y:0.56},
        {x:0.70,y:0.53},
        {x:0.75,y:0.51},
        {x:0.80,y:0.50}
      ],
      color:{h:42,s:95,l:62}, thickness:2.5, glowWidth:14,
      startAt:0.20, endAt:0.40, pulse:true, dotInterval:0
    },

    // ── 5. PURPLE INNER CURVES ───────────────────────────────────
    {
      id: 'purple-upper',
      points: [
        {x:0.28,y:0.40},{x:0.34,y:0.35},{x:0.40,y:0.32},{x:0.47,y:0.30},
        {x:0.54,y:0.32},{x:0.60,y:0.35},{x:0.66,y:0.40}
      ],
      color:{h:275,s:82,l:68}, thickness:2, glowWidth:10,
      startAt:0.30, endAt:0.50, pulse:false, dotInterval:0
    },
    {
      id: 'purple-lower',
      points: [
        {x:0.30,y:0.54},{x:0.36,y:0.50},{x:0.42,y:0.48},{x:0.48,y:0.47},
        {x:0.54,y:0.48},{x:0.60,y:0.51},{x:0.65,y:0.55}
      ],
      color:{h:268,s:78,l:65}, thickness:1.5, glowWidth:8,
      startAt:0.32, endAt:0.52, pulse:false, dotInterval:0
    },

    // ── 6. MAGENTA CEREBELLUM ────────────────────────────────────
    {
      id: 'magenta-cerebellum',
      points: [
        {x:0.47,y:0.72},{x:0.42,y:0.70},{x:0.37,y:0.67},{x:0.32,y:0.62},
        {x:0.27,y:0.56},{x:0.24,y:0.50},{x:0.22,y:0.44}
      ],
      color:{h:322,s:88,l:68}, thickness:2, glowWidth:10,
      startAt:0.35, endAt:0.55, pulse:false, dotInterval:0
    },

    // ── 7. ORANGE CENTER BURST ───────────────────────────────────
    {
      id: 'orange-a',
      points: [{x:0.52,y:0.46},{x:0.58,y:0.44},{x:0.64,y:0.42},{x:0.68,y:0.41}],
      color:{h:28,s:92,l:65}, thickness:2, glowWidth:12,
      startAt:0.40, endAt:0.56, pulse:true, dotInterval:0
    },
    {
      id: 'orange-b',
      points: [{x:0.52,y:0.46},{x:0.54,y:0.40},{x:0.55,y:0.35},{x:0.56,y:0.30}],
      color:{h:35,s:90,l:62}, thickness:1.5, glowWidth:10,
      startAt:0.42, endAt:0.56, pulse:true, dotInterval:0
    },
    {
      id: 'orange-c',
      points: [{x:0.52,y:0.46},{x:0.48,y:0.44},{x:0.44,y:0.42},{x:0.40,y:0.41}],
      color:{h:22,s:94,l:67}, thickness:1.5, glowWidth:9,
      startAt:0.41, endAt:0.56, pulse:false, dotInterval:0
    },
    {
      id: 'orange-d',
      points: [{x:0.52,y:0.46},{x:0.55,y:0.50},{x:0.58,y:0.53},{x:0.62,y:0.56}],
      color:{h:32,s:88,l:60}, thickness:1.5, glowWidth:8,
      startAt:0.43, endAt:0.56, pulse:false, dotInterval:0
    },

    // ── 8. PINK OUTER BACK ───────────────────────────────────────
    {
      id: 'pink-outer-back',
      points: [
        {x:0.20,y:0.52},{x:0.18,y:0.46},{x:0.17,y:0.40},{x:0.19,y:0.33},
        {x:0.23,y:0.26},{x:0.28,y:0.20},{x:0.34,y:0.15}
      ],
      color:{h:318,s:86,l:70}, thickness:2, glowWidth:10,
      startAt:0.45, endAt:0.63, pulse:false, dotInterval:0
    },

    // ── 9. PINK LOWER ────────────────────────────────────────────
    {
      id: 'pink-outer-lower',
      points: [
        {x:0.22,y:0.58},{x:0.27,y:0.62},{x:0.33,y:0.66},{x:0.38,y:0.69},
        {x:0.43,y:0.71},{x:0.47,y:0.72}
      ],
      color:{h:305,s:84,l:67}, thickness:1.5, glowWidth:8,
      startAt:0.48, endAt:0.63, pulse:false, dotInterval:0
    },

    // ── 10. PINK INNER FOLD ──────────────────────────────────────
    {
      id: 'pink-inner-mid',
      points: [
        {x:0.25,y:0.46},{x:0.32,y:0.42},{x:0.38,y:0.39},{x:0.44,y:0.38},
        {x:0.50,y:0.38},{x:0.56,y:0.40},{x:0.62,y:0.44}
      ],
      color:{h:330,s:80,l:71}, thickness:1.5, glowWidth:8,
      startAt:0.50, endAt:0.63, pulse:false, dotInterval:0
    },

    // ── 11. CYAN INNER BAND ──────────────────────────────────────
    {
      id: 'cyan-inner',
      points: [
        {x:0.28,y:0.50},{x:0.34,y:0.46},{x:0.40,y:0.43},{x:0.46,y:0.42},
        {x:0.52,y:0.43},{x:0.58,y:0.46},{x:0.64,y:0.50}
      ],
      color:{h:192,s:85,l:65}, thickness:1.5, glowWidth:8,
      startAt:0.52, endAt:0.63, pulse:false, dotInterval:0
    }
  ];

  // ── Scattered bright dots (neuron sparks) ──────────────────────
  // Drawn as points that fade in during scrollProgress 0.70–0.85
  // Brain-local coords (0-1 within brain body). Keep all values 0.15-0.85 to stay safely inside.
  var SPARK_DOTS = [
    {x:0.35,y:0.18},{x:0.44,y:0.15},{x:0.53,y:0.17},{x:0.62,y:0.22},
    {x:0.70,y:0.30},{x:0.73,y:0.38},{x:0.72,y:0.46},{x:0.68,y:0.52},
    {x:0.62,y:0.56},{x:0.55,y:0.54},{x:0.48,y:0.52},{x:0.42,y:0.50},
    {x:0.36,y:0.47},{x:0.30,y:0.44},{x:0.27,y:0.50},{x:0.25,y:0.55},
    {x:0.28,y:0.60},{x:0.34,y:0.64},{x:0.40,y:0.66},{x:0.46,y:0.60},
    {x:0.58,y:0.35},{x:0.50,y:0.32},{x:0.43,y:0.30},{x:0.37,y:0.35},
    {x:0.32,y:0.40},{x:0.50,y:0.45},{x:0.57,y:0.42},{x:0.64,y:0.40},
    {x:0.42,y:0.55},{x:0.49,y:0.40}
  ];

  // Each dot gets a random hue from the palette
  var DOT_HUES = [310, 185, 138, 42, 275, 322, 28, 318, 330, 192];
  var sparkHues = SPARK_DOTS.map(function (_, i) {
    return DOT_HUES[i % DOT_HUES.length];
  });

  // ── Path utilities ─────────────────────────────────────────────
  // Precompute cumulative arc-lengths for each strand so we can
  // do accurate "t = 0…1 along the path" sampling.

  var strandMeta = STRANDS.map(function (strand) {
    var pts = strand.points;
    var segs = [];
    var total = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var dx = pts[i + 1].x - pts[i].x;
      var dy = pts[i + 1].y - pts[i].y;
      var len = Math.sqrt(dx * dx + dy * dy);
      segs.push(len);
      total += len;
    }
    return { segs: segs, total: total };
  });

  function getPointOnStrand(strandIdx, t) {
    var pts = STRANDS[strandIdx].points;
    var meta = strandMeta[strandIdx];
    if (t <= 0) return pts[0];
    if (t >= 1) return pts[pts.length - 1];
    var target = t * meta.total;
    var acc = 0;
    for (var i = 0; i < meta.segs.length; i++) {
      if (acc + meta.segs[i] >= target) {
        var s = (target - acc) / meta.segs[i];
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * s,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * s
        };
      }
      acc += meta.segs[i];
    }
    return pts[pts.length - 1];
  }

  // ── Canvas coordinate mapping ──────────────────────────────────
  // The brain image sits roughly in the center of the canvas.
  // We draw brain-dim.png at ~80% canvas width maintaining aspect.
  // Normalized (0,0)–(1,1) maps directly to full image coordinates.
  // So a point at x=0.48 → 48% of the image width, scaled.

  function getImageRect(cw, ch) {
    // Reference dimensions are the brain image: 1376×768
    var IMG_W = 1376, IMG_H = 768;
    var aspect = IMG_W / IMG_H;
    // Match the CSS brain-img sizing: 80% max-width, centered
    var w = cw * 0.80;
    var hh = w / aspect;
    if (hh > ch * 0.85) { hh = ch * 0.85; w = hh * aspect; }
    return {
      x: (cw - w) / 2,
      y: (ch - hh) / 2,
      w: w,
      h: hh
    };
  }

  // The brain body sits at x:0.277-0.722, y:0.158-0.841 within the image
  // (from pixel-scanning brain-dim.png at threshold 80).
  // Strand coords are in IMAGE space (0-1 = full image), so this maps correctly.
  // But to make strand authoring easier, we use BRAIN-LOCAL coords where
  // (0,0) = brain top-left and (1,1) = brain bottom-right.
  var BRAIN_X = 0.277, BRAIN_Y = 0.158, BRAIN_W = 0.722 - 0.277, BRAIN_H = 0.841 - 0.158;

  function toCanvas(brainPt, rect) {
    // Convert brain-local (0-1) to image-normalized, then to canvas pixels
    var imgX = BRAIN_X + brainPt.x * BRAIN_W;
    var imgY = BRAIN_Y + brainPt.y * BRAIN_H;
    return {
      x: rect.x + imgX * rect.w,
      y: rect.y + imgY * rect.h
    };
  }

  // ── Canvas sizing ──────────────────────────────────────────────
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    var cw = brainHeader.offsetWidth;
    var ch = brainHeader.offsetHeight;
    if (!cw || !ch) return;
    overlayCanvas.width  = cw * DPR;
    overlayCanvas.height = ch * DPR;
    overlayCanvas.style.width  = cw + 'px';
    overlayCanvas.style.height = ch + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ── Draw utilities ─────────────────────────────────────────────

  // Draw a strand up to parameter t (0–1) with pen-draw effect.
  // t=0: nothing drawn. t=1: full strand drawn. Smooth progress.
  function drawStrand(strandIdx, t, rect, time) {
    if (t <= 0) return;
    var strand = STRANDS[strandIdx];
    var c = strand.color;
    var pts = strand.points;
    if (pts.length < 2) return;

    // Clamp t to [0,1]
    var drawT = Math.min(Math.max(t, 0), 1);

    // How many points to include
    // Instead of full bezier reparametrization, we linearly
    // interpolate the last segment for the "pen tip" effect.
    var totalPts = pts.length;
    var rawIdx   = drawT * (totalPts - 1);  // float index
    var endIdx   = Math.floor(rawIdx);       // last complete segment
    var fracPart = rawIdx - endIdx;           // fraction into next

    // Build canvas points for segments [0 .. endIdx]
    var cpts = [];
    for (var i = 0; i <= Math.min(endIdx + 1, totalPts - 1); i++) {
      cpts.push(toCanvas(pts[i], rect));
    }
    // Interpolate the tip
    if (endIdx < totalPts - 1 && fracPart > 0) {
      var tip = toCanvas({
        x: pts[endIdx].x + (pts[endIdx + 1].x - pts[endIdx].x) * fracPart,
        y: pts[endIdx].y + (pts[endIdx + 1].y - pts[endIdx].y) * fracPart
      }, rect);
      cpts[cpts.length - 1] = tip;
    }

    if (cpts.length < 2) return;

    // Pulse on fully-drawn strands
    var pulse = 1.0;
    if (strand.pulse && drawT >= 1) {
      pulse = 1 + 0.12 * Math.sin(time * 0.002 + strandIdx * 0.7);
    }

    var alpha = Math.min(drawT * 3, 1); // fade in during first 33% of draw

    // ── Outer glow ───────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cpts[0].x, cpts[0].y);
    for (var g = 1; g < cpts.length; g++) ctx.lineTo(cpts[g].x, cpts[g].y);
    ctx.strokeStyle = 'hsla(' + c.h + ',' + c.s + '%,' + c.l + '%,' + (0.18 * alpha) + ')';
    ctx.lineWidth   = (strand.glowWidth * 2.2) * pulse;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // ── Mid glow ─────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cpts[0].x, cpts[0].y);
    for (var m = 1; m < cpts.length; m++) ctx.lineTo(cpts[m].x, cpts[m].y);
    ctx.strokeStyle = 'hsla(' + c.h + ',' + c.s + '%,' + c.l + '%,' + (0.38 * alpha) + ')';
    ctx.lineWidth   = strand.glowWidth * pulse;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // ── Core bright line ─────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cpts[0].x, cpts[0].y);
    for (var k = 1; k < cpts.length; k++) ctx.lineTo(cpts[k].x, cpts[k].y);
    ctx.strokeStyle = 'hsla(' + c.h + ',' + c.s + '%,' + Math.min(c.l + 18, 96) + '%,' + (0.92 * alpha) + ')';
    ctx.lineWidth   = strand.thickness * pulse;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // ── Bright pen-tip glow (only while drawing in) ───────────────
    if (drawT < 1) {
      var tip = cpts[cpts.length - 1];
      var gr = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, strand.glowWidth);
      gr.addColorStop(0, 'hsla(' + c.h + ',' + (c.s - 10) + '%,98%,' + alpha + ')');
      gr.addColorStop(0.3, 'hsla(' + c.h + ',' + c.s + '%,' + (c.l + 10) + '%,' + (0.6 * alpha) + ')');
      gr.addColorStop(1, 'hsla(' + c.h + ',' + c.s + '%,' + c.l + '%,0)');
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, strand.glowWidth, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();

      // White hot center
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fill();
    }

    // ── Dots along strand ─────────────────────────────────────────
    if (strand.dotInterval > 0 && drawT > 0) {
      var di = strand.dotInterval;
      for (var dt = di; dt <= drawT - di * 0.5; dt += di) {
        var dotPt = toCanvas(getPointOnStrand(strandIdx, dt), rect);
        var dotGr = ctx.createRadialGradient(dotPt.x, dotPt.y, 0, dotPt.x, dotPt.y, 5);
        dotGr.addColorStop(0, 'hsla(' + c.h + ',60%,98%,' + (0.9 * alpha) + ')');
        dotGr.addColorStop(1, 'hsla(' + c.h + ',' + c.s + '%,' + c.l + '%,0)');
        ctx.beginPath();
        ctx.arc(dotPt.x, dotPt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = dotGr;
        ctx.fill();
      }
    }
  }

  function drawSparks(opacity, rect) {
    if (opacity <= 0) return;
    for (var i = 0; i < SPARK_DOTS.length; i++) {
      var dot = SPARK_DOTS[i];
      var cp = toCanvas(dot, rect);
      var hue = sparkHues[i];
      var r = 4 + (i % 3) * 2;

      // Outer glow
      var sg = ctx.createRadialGradient(cp.x, cp.y, 0, cp.x, cp.y, r * 3);
      sg.addColorStop(0, 'hsla(' + hue + ',90%,95%,' + (0.85 * opacity) + ')');
      sg.addColorStop(0.5, 'hsla(' + hue + ',88%,72%,' + (0.35 * opacity) + ')');
      sg.addColorStop(1, 'hsla(' + hue + ',80%,60%,0)');
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (opacity * 0.95) + ')';
      ctx.fill();
    }
  }

  // ── Strand progress calculator ─────────────────────────────────
  // Returns 0–1 draw progress for a strand given scroll progress
  function strandProgress(strand, sp) {
    var sa = strand.startAt, ea = strand.endAt;
    if (sp <= sa) return 0;
    if (sp >= ea) return 1;
    return (sp - sa) / (ea - sa);
  }

  // ── Main animation loop ────────────────────────────────────────
  function animate(time) {
    var cw = brainHeader.offsetWidth;
    var ch = brainHeader.offsetHeight;
    if (!cw || !ch) {
      window._brainAnimFrame = requestAnimationFrame(animate);
      return;
    }

    // Ensure canvas size matches
    if (overlayCanvas.width !== cw * DPR || overlayCanvas.height !== ch * DPR) {
      resize();
    }

    ctx.clearRect(0, 0, cw, ch);

    var rect = getImageRect(cw, ch);

    // ── 1. Base layer: dim brain ───────────────────────────────────
    if (dimLoaded) {
      ctx.globalAlpha = 1;
      ctx.drawImage(dimImg, rect.x, rect.y, rect.w, rect.h);
    }

    // ── 2. Draw all strands at their current progress ─────────────
    for (var i = 0; i < STRANDS.length; i++) {
      var t = strandProgress(STRANDS[i], scrollProgress);
      if (t > 0) {
        ctx.globalAlpha = 1;
        drawStrand(i, t, rect, time);
      }
    }

    // ── 3. Scattered spark dots (scrollProgress 0.70–0.85) ────────
    var sparksIn = scrollProgress >= 0.70 && scrollProgress < 0.85
      ? (scrollProgress - 0.70) / 0.15
      : (scrollProgress >= 0.85 ? 1 : 0);
    if (sparksIn > 0) {
      ctx.globalAlpha = 1;
      drawSparks(sparksIn, rect);
    }

    // ── 4. Crossfade to brain-lit.png (scrollProgress 0.85–1.0) ──
    if (litLoaded && scrollProgress >= 0.85) {
      var litAlpha = (scrollProgress - 0.85) / 0.15;
      litAlpha = Math.min(litAlpha, 1);
      ctx.globalAlpha = litAlpha;
      ctx.drawImage(litImg, rect.x, rect.y, rect.w, rect.h);
      ctx.globalAlpha = 1;
    }

    window._brainAnimFrame = requestAnimationFrame(animate);
  }

  // ── Scroll handling ────────────────────────────────────────────
  var spaMainEl = document.getElementById('spaMain');
  var headerText = document.getElementById('headerText');

  function getScrollTop() {
    return spaMainEl ? spaMainEl.scrollTop : window.scrollY;
  }
  function getMaxScroll() {
    return spaMainEl
      ? spaMainEl.scrollHeight - spaMainEl.clientHeight
      : document.body.scrollHeight - window.innerHeight;
  }

  var scrollHandler = function () {
    var st = getScrollTop();
    var ms = getMaxScroll();

    // Update progress bar
    var prog = document.getElementById('scrollProgress');
    if (prog && ms > 0) prog.style.width = (st / ms) * 100 + '%';

    // Hide header text on scroll
    if (headerText) {
      if (st > 10) headerText.classList.add('hidden');
      else headerText.classList.remove('hidden');
    }

    // Drive strand reveal via scroll
    scrollProgress = Math.min(Math.max(st / SCROLL_RANGE, 0), 1);
  };

  window._brainScrollHandler = scrollHandler;
  window.addEventListener('scroll', scrollHandler, { passive: true });
  if (spaMainEl) spaMainEl.addEventListener('scroll', scrollHandler, { passive: true });
  scrollHandler(); // run once to set initial state

  // IntersectionObserver fallback: if header scrolls out of view
  // jump to fully-drawn state so it looks good on return
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) scrollProgress = 1;
      });
    }, { threshold: 0 });
    io.observe(brainHeader);
    window._brainIO = io;
  }

  // ── Init ───────────────────────────────────────────────────────
  resize();
  window._brainAnimFrame = requestAnimationFrame(animate);

  if (!window._brainResizeAttached) {
    window.addEventListener('resize', resize);
    window._brainResizeAttached = true;
  }

  // ── DOM particles ──────────────────────────────────────────────
  var pc = document.getElementById('particles');
  if (pc && !pc.dataset.brainInit) {
    pc.dataset.brainInit = '1';
    for (var pi = 0; pi < 25; pi++) {
      var p = document.createElement('div');
      p.className = 'particle';
      p.style.setProperty('--op', (0.3 + Math.random() * 0.7).toFixed(2));
      p.style.setProperty('--drift', Math.round(20 + Math.random() * 80) + 'px');
      p.style.left = (Math.random() * 100).toFixed(1) + '%';
      p.style.top  = (Math.random() * 100).toFixed(1) + '%';
      p.style.animationDuration = (10 + Math.random() * 15).toFixed(1) + 's';
      p.style.animationDelay    = (Math.random() * 5).toFixed(2) + 's';
      pc.appendChild(p);
    }
  }

})();
