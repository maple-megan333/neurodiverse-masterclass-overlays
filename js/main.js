/* ============================================
   Neurodiverse AI MasterClass â Main JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
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
    const saved = sessionStorage.getItem(key);
    if (saved === 'true') cb.checked = true;
    cb.addEventListener('change', () => {
      sessionStorage.setItem(key, cb.checked);
    });
  });
});
