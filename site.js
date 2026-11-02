// The shell's behaviour: a copy control on every command block, the quick start's current step, the 404 page's path.
(() => {
  for (const fig of document.querySelectorAll('[data-copy]')) {
    const cap = fig.querySelector('figcaption');
    if (!cap || !navigator.clipboard) continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.textContent = 'Copy';
    b.setAttribute('aria-label', 'Copy the command');
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(fig.dataset.copy); b.textContent = 'Copied'; b.classList.add('done'); }
      catch { b.textContent = 'Select and copy'; }
      setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done'); }, 1600);
    });
    cap.append(b);
  }

  const toc = [...document.querySelectorAll('.toc a')];
  if (toc.length && 'IntersectionObserver' in window) {
    const on = (id) => toc.forEach((a) => a.classList.toggle('on', a.hash === '#' + id));
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) on(e.target.id); }, { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('.qs-step').forEach((s) => io.observe(s));
  }

  const nf = document.querySelector('.nf-path');
  if (nf) nf.textContent = location.pathname;
})();
