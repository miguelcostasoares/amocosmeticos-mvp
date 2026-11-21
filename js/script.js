/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — SCRIPT
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ════════════════════════════════════════════
     1. HERO — slider cinematográfico
     Autoplay com barra de progresso, pausa no hover
     e quando a aba sai de foco, navegação por teclado,
     gesto de arrastar (swipe) e parallax na rolagem.
     ════════════════════════════════════════════ */
  function initHero() {
    const hero    = $('#hero');
    if (!hero) return;

    const slides  = $$('.hero-slide', hero);
    const inds     = $$('.hero-ind', hero);
    const fills    = $$('.hero-ind-fill', hero);
    const counter  = $('#heroCounter');
    const content  = $('#heroContent');
    const total    = slides.length;
    if (!total) return;

    const DURATION = 6000;           // tempo de cada slide (ms)
    let current    = 0;
    let paused     = false;
    let elapsed    = 0;
    let last       = 0;
    let rafId      = null;

    // o progresso é desenhado quadro a quadro via JS (pausa/retoma de verdade)
    fills.forEach(f => { f.style.transition = 'none'; });
    hero.style.setProperty('--autoplay', DURATION + 'ms');

    function render(i) {
      slides[current].classList.remove('active');
      inds[current].classList.remove('active');
      fills[current].style.width = '0%';

      current = (i + total) % total;

      // re-dispara o Ken Burns do slide que entra
      const ph = $('.hero-slide-placeholder', slides[current]);
      if (ph && !prefersReduced) {
        ph.style.animation = 'none';
        void ph.offsetWidth;          // força reflow
        ph.style.animation = '';
      }

      slides[current].classList.add('active');
      inds[current].classList.add('active');
      if (counter) counter.textContent = (current + 1) + ' / ' + total;
    }

    function goTo(i) { elapsed = 0; render(i); }
    function next()  { goTo(current + 1); }
    function prev()  { goTo(current - 1); }

    function tick(now) {
      if (!last) last = now;
      const dt = now - last;
      last = now;

      if (!paused) {
        elapsed += dt;
        const pct = Math.min(elapsed / DURATION, 1);
        if (fills[current]) fills[current].style.width = (pct * 100) + '%';
        if (pct >= 1) { elapsed = 0; render(current + 1); }
      }
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (prefersReduced) return;      // sem autoplay se o usuário pediu menos movimento
      if (rafId) return;
      last = 0;
      rafId = requestAnimationFrame(tick);
    }

    // controles ──────────────────────────────
    inds.forEach((btn, i) => btn.addEventListener('click', () => goTo(i)));

    // pausa ao passar o mouse / tocar
    hero.addEventListener('mouseenter', () => { paused = true; });
    hero.addEventListener('mouseleave', () => { paused = false; });

    // pausa quando a aba perde o foco (economiza bateria e evita "pulos")
    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      last = 0;
    });

    // teclado (quando o hero está visível)
    document.addEventListener('keydown', (e) => {
      const r = hero.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    });

    // swipe / arrastar (mouse e toque via Pointer Events)
    let startX = null;
    hero.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.hero-content, .hero-indicators, .hero-scroll-cue')) return;
      startX = e.clientX;
      paused = true;
    });
    window.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) (dx < 0 ? next() : prev());
      startX = null;
      paused = false;
    });

    // parallax suave do conteúdo ao rolar
    if (content && !prefersReduced) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            content.style.transform = 'translateY(' + (y * 0.18) + 'px)';
            content.style.opacity = String(Math.max(1 - y / 620, 0));
          }
          ticking = false;
        });
      }, { passive: true });
    }

    render(0);
    start();

    // entrada animada do conteúdo
    requestAnimationFrame(() => hero.classList.add('is-loaded'));
  }

  /* ════════════════════════════════════════════
     2. NAVBAR — encolhe ao rolar, esconde ao descer
     e reaparece ao subir. Menu mobile com drawer.
     ════════════════════════════════════════════ */
  function initNav() {
    const nav = $('#nav');
    if (!nav) return;

    const toggle = $('#navToggle');
    const center = $('#navCenter');
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 50);

      // só esconde se o menu mobile estiver fechado
      if (!nav.classList.contains('nav-open')) {
        if (y > lastY && y > 320) nav.classList.add('nav-hidden');
        else                      nav.classList.remove('nav-hidden');
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });

    // menu mobile ────────────────────────────
    function closeMenu() {
      nav.classList.remove('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    if (toggle && center) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
        if (open) nav.classList.remove('nav-hidden');
      });

      $$('a', center).forEach(a => a.addEventListener('click', closeMenu));

      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
      document.addEventListener('click', (e) => {
        if (nav.classList.contains('nav-open') && !nav.contains(e.target)) closeMenu();
      });
      window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(); });
    }
  }

  /* ════════════════════════════════════════════
     3. CATEGORIAS — carrossel horizontal
     ════════════════════════════════════════════ */
  function initCategories() {
    const grid    = $('#catGrid');
    const prevBtn = $('.cat-nav-prev');
    const nextBtn = $('.cat-nav-next');
    if (!grid || !prevBtn || !nextBtn) return;

    function cardStep() {
      const card = $('.cat-card', grid);
      if (!card) return grid.clientWidth;
      const style = getComputedStyle(grid);
      const gap = parseFloat(style.columnGap || style.gap || '0');
      return card.getBoundingClientRect().width + gap;
    }

    function updateNavState() {
      const maxScroll = grid.scrollWidth - grid.clientWidth - 2;
      prevBtn.disabled = grid.scrollLeft <= 2;
      nextBtn.disabled = grid.scrollLeft >= maxScroll;
    }

    prevBtn.addEventListener('click', () => grid.scrollBy({ left: -cardStep(), behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => grid.scrollBy({ left:  cardStep(), behavior: 'smooth' }));
    grid.addEventListener('scroll', updateNavState, { passive: true });
    window.addEventListener('resize', updateNavState);
    updateNavState();
  }

  /* ════════════════════════════════════════════
     4. NEWSLETTER
     ════════════════════════════════════════════ */
  function initNewsletter() {
    const form = $('#newsletterForm');
    if (!form) return;
    form.addEventListener('submit', (e) => e.preventDefault());
  }

  /* ── bootstrap ── */
  function init() {
    initHero();
    initNav();
    initCategories();
    initNewsletter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();