/* ============================================
   Neurodiverse AI MasterClass — Main JS
   Particles, animations, scroll progress,
   and interactive enhancements.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Generate particles ---
  const particlesContainer = document.querySelector('.particles');
  if (particlesContainer && particlesContainer.children.length === 0) {
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const duration = 10 + Math.random() * 15;
      const delay = Math.random() * 5;
      const opacity = 0.3 + Math.random() * 0.7;
      const drift = 20 + Math.random() * 80;
      particle.style.setProperty('--op', opacity);
      particle.style.setProperty('--drift', drift + 'px');
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDuration = duration + 's';
      particle.style.animationDelay = delay + 's';
      particlesContainer.appendChild(particle);
    }
  }

  // --- Scroll progress bar ---
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.width = progress + '%';
    }, { passive: true });
  }

  // --- Entrance animations via IntersectionObserver ---
  const animateElements = document.querySelectorAll('.callout, details, .mermaid-container, .nav-footer, h2, .card, .gallery');
  if (animateElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

    animateElements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ' + (i % 5) * 0.06 + 's, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ' + (i % 5) * 0.06 + 's';
      observer.observe(el);
    });

    // Add the CSS for the visible state
    const style = document.createElement('style');
    style.textContent = '.animate-visible { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);
  }

  // --- Copy buttons for code blocks ---
  document.querySelectorAll('pre').forEach(pre => {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code') || pre;
      navigator.clipboard.writeText(code.textContent).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
    wrapper.appendChild(btn);
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Checkbox persistence (session only) ---
  document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach((cb, i) => {
    const key = `mc-cb-${window.location.pathname}-${i}`;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved === 'true') cb.checked = true;
      cb.addEventListener('change', () => {
        sessionStorage.setItem(key, cb.checked);
      });
    } catch(e) { /* sessionStorage not available */ }
  });
});
