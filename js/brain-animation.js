/* ============================================
   Brain Neural Network Animation
   Scroll-driven neuron activation with
   anatomically accurate side-profile brain
   ============================================ */

(function() {
  // Cancel previous animation loop (prevents accumulation on SPA page nav)
  if (window._brainAnimFrame) cancelAnimationFrame(window._brainAnimFrame);

  const canvas = document.getElementById('brainCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let nodes = [], connections = [], pulses = [];
  let mouse = { x: 0, y: 0 };
  let currentScroll = 0;

  // Anatomically accurate brain side-profile (front=right, back=left)
  const brainOutline = [
    // === BRAIN STEM (thin stalk, bottom-center) ===
    {x:0.47, y:0.95}, {x:0.45, y:0.92}, {x:0.43, y:0.88},
    {x:0.42, y:0.84}, {x:0.40, y:0.81},
    // === CEREBELLUM (distinct rounded bump, back-bottom) ===
    {x:0.37, y:0.79}, {x:0.33, y:0.78}, {x:0.29, y:0.77},
    {x:0.24, y:0.76}, {x:0.20, y:0.74}, {x:0.17, y:0.71},
    {x:0.15, y:0.67}, {x:0.14, y:0.63},
    {x:0.135, y:0.59}, {x:0.13, y:0.56},
    // === OCCIPITAL LOBE ===
    {x:0.12, y:0.52}, {x:0.11, y:0.48}, {x:0.095, y:0.44},
    {x:0.085, y:0.40}, {x:0.08, y:0.36},
    // === PARIETAL LOBE ===
    {x:0.085, y:0.32}, {x:0.095, y:0.28}, {x:0.11, y:0.24},
    {x:0.13, y:0.21}, {x:0.155, y:0.18}, {x:0.18, y:0.155},
    {x:0.21, y:0.135}, {x:0.24, y:0.118}, {x:0.27, y:0.103},
    {x:0.30, y:0.09}, {x:0.33, y:0.08},
    // === CROWN ===
    {x:0.36, y:0.07}, {x:0.39, y:0.062}, {x:0.42, y:0.055},
    {x:0.45, y:0.05}, {x:0.48, y:0.048},
    // === FRONTAL LOBE (large, bulbous) ===
    {x:0.51, y:0.048}, {x:0.54, y:0.05}, {x:0.57, y:0.055},
    {x:0.60, y:0.063}, {x:0.63, y:0.073},
    {x:0.66, y:0.085}, {x:0.69, y:0.10}, {x:0.72, y:0.12},
    {x:0.75, y:0.145}, {x:0.78, y:0.175},
    {x:0.80, y:0.21}, {x:0.82, y:0.25}, {x:0.835, y:0.29},
    {x:0.845, y:0.33}, {x:0.85, y:0.37},
    // Frontal pole
    {x:0.852, y:0.41}, {x:0.85, y:0.45}, {x:0.845, y:0.48},
    // === ORBITAL/PREFRONTAL ===
    {x:0.835, y:0.51}, {x:0.82, y:0.535}, {x:0.80, y:0.555},
    // === TEMPORAL POLE ===
    {x:0.78, y:0.575}, {x:0.76, y:0.59}, {x:0.74, y:0.605}, {x:0.72, y:0.62},
    // === TEMPORAL LOBE ===
    {x:0.69, y:0.635}, {x:0.66, y:0.65}, {x:0.63, y:0.66},
    {x:0.60, y:0.67}, {x:0.57, y:0.675},
    {x:0.54, y:0.68}, {x:0.51, y:0.69}, {x:0.49, y:0.71},
    // === BACK TO STEM ===
    {x:0.47, y:0.74}, {x:0.46, y:0.77}, {x:0.45, y:0.80},
    {x:0.45, y:0.84}, {x:0.46, y:0.84}, {x:0.47, y:0.95},
  ];

  // Sulci (brain folds)
  const brainFolds = [
    [{x:0.44,y:0.06},{x:0.43,y:0.12},{x:0.42,y:0.20},{x:0.41,y:0.28},{x:0.40,y:0.36},{x:0.40,y:0.44},{x:0.41,y:0.52}],
    [{x:0.38,y:0.54},{x:0.44,y:0.52},{x:0.50,y:0.49},{x:0.56,y:0.46},{x:0.62,y:0.43},{x:0.68,y:0.40},{x:0.74,y:0.36}],
    [{x:0.52,y:0.07},{x:0.51,y:0.14},{x:0.50,y:0.22},{x:0.49,y:0.30},{x:0.48,y:0.38}],
    [{x:0.36,y:0.08},{x:0.34,y:0.16},{x:0.32,y:0.24},{x:0.31,y:0.32},{x:0.32,y:0.40}],
    [{x:0.58,y:0.08},{x:0.62,y:0.14},{x:0.66,y:0.20},{x:0.70,y:0.26}],
    [{x:0.66,y:0.12},{x:0.70,y:0.18},{x:0.74,y:0.24},{x:0.78,y:0.30}],
    [{x:0.28,y:0.13},{x:0.24,y:0.20},{x:0.20,y:0.27},{x:0.18,y:0.34}],
    [{x:0.42,y:0.58},{x:0.48,y:0.57},{x:0.54,y:0.56},{x:0.60,y:0.55},{x:0.66,y:0.54}],
    [{x:0.44,y:0.63},{x:0.50,y:0.63},{x:0.56,y:0.63},{x:0.62,y:0.62}],
    [{x:0.24,y:0.13},{x:0.20,y:0.22},{x:0.16,y:0.30},{x:0.13,y:0.38}],
    [{x:0.12,y:0.44},{x:0.14,y:0.50},{x:0.17,y:0.54}],
    [{x:0.30,y:0.12},{x:0.36,y:0.11},{x:0.42,y:0.11},{x:0.48,y:0.12},{x:0.54,y:0.13},{x:0.60,y:0.15}],
    [{x:0.17,y:0.67},{x:0.21,y:0.69},{x:0.25,y:0.71},{x:0.29,y:0.72}],
    [{x:0.16,y:0.63},{x:0.20,y:0.65},{x:0.24,y:0.67}],
    [{x:0.15,y:0.60},{x:0.19,y:0.62},{x:0.23,y:0.63}],
    [{x:0.72,y:0.15},{x:0.76,y:0.22},{x:0.80,y:0.30}],
    [{x:0.60,y:0.10},{x:0.64,y:0.16},{x:0.68,y:0.22}],
  ];

  const neuronColors = [
    {h:280,s:80,l:65},{h:310,s:75,l:65},{h:340,s:70,l:60},
    {h:180,s:70,l:55},{h:160,s:65,l:50},{h:45,s:90,l:60},
    {h:30,s:85,l:55},{h:200,s:70,l:60},{h:260,s:85,l:70},
    {h:120,s:60,l:50},{h:55,s:80,l:55},
  ];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getBrainTransform(cw, ch) {
    var brainH = ch * 0.88;
    var brainW = brainH * 1.05;
    if (brainW > cw * 0.65) { brainW = cw * 0.65; brainH = brainW / 1.05; }
    var offX = (cw - brainW) / 2;
    var offY = (ch - brainH) / 2 - ch * 0.01;
    return { brainW: brainW, brainH: brainH, offX: offX, offY: offY };
  }

  function isInsideBrain(px, py, cw, ch) {
    const t = getBrainTransform(cw, ch);
    const nx = (px - t.offX) / t.brainW;
    const ny = (py - t.offY) / t.brainH;
    let inside = false;
    for (let i = 0, j = brainOutline.length - 1; i < brainOutline.length; j = i++) {
      const xi = brainOutline[i].x, yi = brainOutline[i].y;
      const xj = brainOutline[j].x, yj = brainOutline[j].y;
      if ((yi > ny) !== (yj > ny) && nx < (xj - xi) * (ny - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function getBrainPath(cw, ch) {
    const t = getBrainTransform(cw, ch);
    return brainOutline.map(function(p) { return { x: t.offX + p.x * t.brainW, y: t.offY + p.y * t.brainH }; });
  }

  function createNodes() {
    nodes = []; connections = [];
    const cw = canvas.parentElement.offsetWidth;
    const ch = canvas.parentElement.offsetHeight;
    var placed = 0, attempts = 0;
    while (placed < 140 && attempts < 5000) {
      var x = Math.random() * cw;
      var y = Math.random() * ch;
      attempts++;
      if (isInsideBrain(x, y, cw, ch)) {
        var color = neuronColors[Math.floor(Math.random() * neuronColors.length)];
        nodes.push({
          x: x, y: y, baseX: x, baseY: y,
          radius: 1.0 + Math.random() * 3.0,
          brightness: 0.0,
          maxBrightness: 0.3 + Math.random() * 0.7,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.3 + Math.random() * 1.2,
          layer: Math.random(),
          color: color,
          activateAt: Math.random(),
        });
        placed++;
      }
    }
    nodes.sort(function(a, b) { return a.activateAt - b.activateAt; });
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && Math.random() > 0.45) {
          connections.push({ from: i, to: j, dist: dist });
        }
      }
    }
  }

  function firePulse() {
    if (connections.length === 0) return;
    var active = connections.filter(function(c) { return nodes[c.from].brightness > 0.1 && nodes[c.to].brightness > 0.1; });
    if (active.length === 0) return;
    var conn = active[Math.floor(Math.random() * active.length)];
    pulses.push({ from: conn.from, to: conn.to, progress: 0, speed: 0.005 + Math.random() * 0.015, color: nodes[conn.from].color });
  }

  function drawSmoothCurve(points) {
    if (points.length < 2) return;
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 2) { ctx.lineTo(points[1].x, points[1].y); return; }
    for (var i = 1; i < points.length - 1; i++) {
      var xc = (points[i].x + points[i + 1].x) / 2;
      var yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    var last = points[points.length - 1];
    var prev = points[points.length - 2];
    ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
  }

  function drawBrainOutline(cw, ch, intensity) {
    var path = getBrainPath(cw, ch);
    if (path.length < 3) return;
    ctx.save();
    for (var g = 4; g >= 0; g--) {
      var alpha = intensity * (g === 0 ? 0.5 : 0.04 / (g * 0.7));
      var lw = g === 0 ? 1.8 : 2 + g * 5;
      ctx.beginPath();
      drawSmoothCurve(path);
      ctx.closePath();
      var hue = 35 + (270 - 35) * Math.min(intensity, 1);
      ctx.strokeStyle = 'hsla(' + hue + ', 70%, 58%, ' + alpha + ')';
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBrainFoldsLayer(cw, ch, intensity) {
    var t = getBrainTransform(cw, ch);
    ctx.save();
    brainFolds.forEach(function(fold, fi) {
      var pts = fold.map(function(p) { return { x: t.offX + p.x * t.brainW, y: t.offY + p.y * t.brainH }; });
      var prominence = fi < 2 ? 1.5 : 1.0;
      var alpha = (0.03 + intensity * 0.08) * prominence;
      ctx.beginPath();
      drawSmoothCurve(pts);
      var hue = 35 + (260 - 35) * intensity;
      ctx.strokeStyle = 'hsla(' + hue + ', 50%, 50%, ' + alpha + ')';
      ctx.lineWidth = fi < 2 ? 1.2 : 0.8;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawBrainInnerGlow(cw, ch, intensity) {
    if (intensity < 0.05) return;
    var t = getBrainTransform(cw, ch);
    var cx = t.offX + 0.48 * t.brainW;
    var cy = t.offY + 0.42 * t.brainH;
    var r = Math.max(t.brainW, t.brainH) * 0.45;
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'hsla(280, 60%, 50%, ' + (intensity * 0.06) + ')');
    grad.addColorStop(0.4, 'hsla(310, 50%, 45%, ' + (intensity * 0.03) + ')');
    grad.addColorStop(1, 'hsla(270, 60%, 40%, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function animate(time) {
    var cw = canvas.parentElement.offsetWidth;
    var ch = canvas.parentElement.offsetHeight;
    ctx.clearRect(0, 0, cw, ch);

    var scrollRatio = Math.min(currentScroll / 1200, 1);
    var outlineIntensity = 0.12 + scrollRatio * 0.88;

    if (Math.random() < 0.01 + scrollRatio * 0.09) firePulse();

    nodes.forEach(function(node) {
      var target = scrollRatio >= node.activateAt ? node.maxBrightness : 0.0;
      node.brightness += (target - node.brightness) * 0.035;
      var t = time * 0.001;
      var float = Math.sin(t * node.pulseSpeed + node.pulsePhase) * 2;
      node.x = node.baseX + float;
      node.y = node.baseY + float * 0.5;
    });

    drawBrainInnerGlow(cw, ch, scrollRatio);
    drawBrainOutline(cw, ch, outlineIntensity);
    drawBrainFoldsLayer(cw, ch, scrollRatio);

    connections.forEach(function(conn) {
      var a = nodes[conn.from], b = nodes[conn.to];
      var minB = Math.min(a.brightness, b.brightness);
      if (minB < 0.05) return;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'hsla(' + a.color.h + ', ' + a.color.s + '%, ' + a.color.l + '%, ' + (minB * 0.12) + ')';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i]; p.progress += p.speed;
      if (p.progress > 1) { pulses.splice(i, 1); continue; }
      var a = nodes[p.from], b = nodes[p.to];
      var x = a.x + (b.x - a.x) * p.progress;
      var y = a.y + (b.y - a.y) * p.progress;
      var glow = Math.sin(p.progress * Math.PI);
      var c = p.color;
      var grad = ctx.createRadialGradient(x, y, 0, x, y, 5 + glow * 16);
      grad.addColorStop(0, 'hsla(' + c.h + ', ' + c.s + '%, ' + (c.l + 20) + '%, ' + (0.95 * glow) + ')');
      grad.addColorStop(0.3, 'hsla(' + c.h + ', ' + c.s + '%, ' + (c.l + 10) + '%, ' + (0.5 * glow) + ')');
      grad.addColorStop(1, 'hsla(' + c.h + ', ' + c.s + '%, ' + c.l + '%, 0)');
      ctx.beginPath(); ctx.arc(x, y, 5 + glow * 16, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(x, y);
      ctx.strokeStyle = 'hsla(' + c.h + ', ' + c.s + '%, ' + c.l + '%, ' + (0.25 * glow) + ')';
      ctx.lineWidth = 1.5; ctx.stroke();
    }

    nodes.forEach(function(node) {
      if (node.brightness < 0.01) return;
      var t = time * 0.001;
      var pulse = 0.5 + 0.5 * Math.sin(t * node.pulseSpeed + node.pulsePhase);
      var alpha = node.brightness * (0.6 + pulse * 0.4);
      var r = node.radius * (0.7 + node.brightness * 0.5 + pulse * 0.3);
      var c = node.color;
      var gr = r * 5;
      var glw = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, gr);
      glw.addColorStop(0, 'hsla(' + c.h + ', ' + c.s + '%, ' + (c.l + 15) + '%, ' + (alpha * 0.5) + ')');
      glw.addColorStop(0.4, 'hsla(' + c.h + ', ' + c.s + '%, ' + c.l + '%, ' + (alpha * 0.15) + ')');
      glw.addColorStop(1, 'hsla(' + c.h + ', ' + c.s + '%, ' + c.l + '%, 0)');
      ctx.beginPath(); ctx.arc(node.x, node.y, gr, 0, Math.PI * 2); ctx.fillStyle = glw; ctx.fill();
      ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + c.h + ', ' + c.s + '%, ' + Math.min(c.l + 25, 92) + '%, ' + alpha + ')';
      ctx.fill();
    });

    // Mouse interaction
    if (mouse.x > 0) {
      nodes.forEach(function(node) {
        var dx = node.x - mouse.x, dy = node.y - mouse.y;
        if (Math.sqrt(dx * dx + dy * dy) < 100) {
          node.brightness = Math.min(node.brightness + 0.025, node.maxBrightness);
        }
      });
      var mgrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100);
      mgrad.addColorStop(0, 'hsla(270, 80%, 65%, 0.05)');
      mgrad.addColorStop(1, 'hsla(270, 80%, 65%, 0)');
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2); ctx.fillStyle = mgrad; ctx.fill();
    }

    window._brainAnimFrame = requestAnimationFrame(animate);
  }

  // Init
  resize(); createNodes(); window._brainAnimFrame = requestAnimationFrame(animate);
  if (!window._brainResizeAttached) {
    window.addEventListener('resize', function() { resize(); createNodes(); });
    window._brainResizeAttached = true;
  }

  // Mouse
  var brainEl = document.querySelector('.brain-header');
  if (brainEl) {
    brainEl.addEventListener('mousemove', function(e) {
      var rect = canvas.parentElement.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    });
    brainEl.addEventListener('mouseleave', function() { mouse.x = 0; mouse.y = 0; });
  }

  // Scroll handlers — works in both standalone and SPA mode
  // In the SPA, spa-router.js overrides window.scrollY to return spaMain.scrollTop
  var headerText = document.getElementById('headerText');
  var spaMainEl = document.getElementById('spaMain');

  function getScrollTop() {
    // SPA mode: read from spaMain; standalone: read from window
    return spaMainEl ? spaMainEl.scrollTop : window.scrollY;
  }
  function getScrollHeight() {
    return spaMainEl ? spaMainEl.scrollHeight : document.body.scrollHeight;
  }
  function getViewportHeight() {
    return spaMainEl ? spaMainEl.clientHeight : window.innerHeight;
  }

  window.addEventListener('scroll', function() {
    currentScroll = getScrollTop();
    var maxScroll = getScrollHeight() - getViewportHeight();
    var prog = document.getElementById('scrollProgress');
    if (prog && maxScroll > 0) prog.style.width = (currentScroll / maxScroll) * 100 + '%';

    // Brain stays visible as fixed background — no shrink/fade.
    // Canvas opacity controlled by CSS, neurons activate via scrollRatio in animate().

    if (headerText) {
      if (currentScroll > 10) headerText.classList.add('hidden');
      else headerText.classList.remove('hidden');
    }
  }, { passive: true });

  // Particles
  var pc = document.getElementById('particles');
  if (pc) {
    for (var i = 0; i < 25; i++) {
      var p = document.createElement('div'); p.className = 'particle';
      p.style.setProperty('--op', 0.3 + Math.random() * 0.7);
      p.style.setProperty('--drift', (20 + Math.random() * 80) + 'px');
      p.style.left = Math.random() * 100 + '%'; p.style.top = Math.random() * 100 + '%';
      p.style.animationDuration = (10 + Math.random() * 15) + 's';
      p.style.animationDelay = (Math.random() * 5) + 's';
      pc.appendChild(p);
    }
  }
})();
