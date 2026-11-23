/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — SCRIPT
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ════════════════════════════════════════════
     1. HERO — slider de fundo (crossfade)
     Autoplay simples com 2 fotos. Pausa apenas
     quando a aba sai de foco (sem pausar no hover).
     Navegação por teclado, swipe e parallax na rolagem.
     ════════════════════════════════════════════ */
  function initHero() {
    const hero    = $('#hero');
    if (!hero) return;

    const slides  = $$('.hero-slide', hero);
    const content = $('#heroContent');
    const total   = slides.length;
    if (!total) return;

    const DURATION = 6000;           // tempo de cada slide (ms)
    let current = 0, paused = false, elapsed = 0, last = 0, rafId = null;

    function render(i) {
      slides[current].classList.remove('active');
      current = (i + total) % total;

      // re-dispara o Ken Burns da imagem que entra
      const img = $('.hero-slide-img', slides[current]);
      if (img && !prefersReduced) {
        img.style.animation = 'none';
        void img.offsetWidth;          // força reflow
        img.style.animation = '';
      }

      slides[current].classList.add('active');
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
        if (elapsed >= DURATION) { elapsed = 0; render(current + 1); }
      }
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (prefersReduced) return;      // sem autoplay se o usuário pediu menos movimento
      if (rafId) return;
      last = 0;
      rafId = requestAnimationFrame(tick);
    }

    // pausa somente quando a aba perde o foco (economiza bateria)
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
      if (e.target.closest('.hero-content, .hero-deck')) return;
      startX = e.clientX;
    });
    window.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) (dx < 0 ? next() : prev());
      startX = null;
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
     3. CATEGORIAS — carrossel premium
     Setas laterais, bolinhas sincronizadas, contador,
     arrastar com o mouse, teclado e entrada escalonada.
     ════════════════════════════════════════════ */
  function initCategories() {
    const section  = $('.categories');
    const grid     = $('#catGrid');
    const prevBtn  = $('.cat-nav-prev');
    const nextBtn  = $('.cat-nav-next');
    const dotsWrap = $('#catDots');
    const curEl    = $('#catCurrent');
    const totEl    = $('#catTotal');
    if (!section || !grid || !prevBtn || !nextBtn) return;

    const cards = $$('.cat-card', grid);
    const total = cards.length;
    if (!total) return;

    const pad   = (n) => String(n).padStart(2, '0');
    const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
    const behavior = prefersReduced ? 'auto' : 'smooth';

    /* ── entrada escalonada ── */
    section.classList.add('is-armed');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      section.classList.add('is-in');
    } else {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          section.classList.add('is-in');
          io.disconnect();
        }
      }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
      io.observe(section);
    }

    /* ── medidas ── */
    const padLeft  = () => parseFloat(getComputedStyle(grid).paddingLeft) || 0;
    const padRight = () => parseFloat(getComputedStyle(grid).paddingRight) || 0;
    const maxScroll = () => Math.max(grid.scrollWidth - grid.clientWidth, 0);

    function getStep() {
      if (cards.length > 1) return cards[1].offsetLeft - cards[0].offsetLeft;
      return cards[0].getBoundingClientRect().width;
    }

    function goToIndex(i) {
      const idx = clamp(i, 0, total - 1);
      const left = Math.min(cards[idx].offsetLeft - padLeft(), maxScroll());
      grid.scrollTo({ left: Math.max(left, 0), behavior });
    }

    /* ── bolinhas ── */
    const dots = [];
    if (dotsWrap) {
      cards.forEach((card, i) => {
        const nameEl = $('.cat-card-name', card);
        const label  = nameEl ? nameEl.textContent.trim() : 'categoria ' + (i + 1);
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cat-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Ir para ' + label);
        dot.addEventListener('click', () => goToIndex(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }
    if (totEl) totEl.textContent = pad(total);

    /* ── estado (setas, bolinhas, contador, cards fora da vista) ── */
    let ticking = false;

    function update() {
      ticking = false;
      const max = maxScroll();
      const x = grid.scrollLeft;
      const atStart = x <= 2;
      const atEnd = x >= max - 2;

      section.classList.toggle('is-static', max <= 2);
      prevBtn.disabled = atStart;
      nextBtn.disabled = atEnd;

      let active = Math.round(x / (getStep() || 1));
      if (atEnd) active = total - 1;
      if (atStart) active = 0;
      active = clamp(active, 0, total - 1);

      const vr = grid.getBoundingClientRect();
      const viewLeft  = vr.left + padLeft();
      const viewRight = vr.right - padRight();

      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const overlap = Math.min(r.right, viewRight) - Math.max(r.left, viewLeft);
        const visible = overlap / r.width > 0.6;
        card.classList.toggle('is-out', !visible);
        if (dots[i]) {
          dots[i].classList.toggle('is-visible', visible && i !== active);
          dots[i].classList.toggle('is-active', i === active);
          dots[i].setAttribute('aria-selected', String(i === active));
        }
      });

      if (curEl) curEl.textContent = pad(active + 1);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    /* ── controles ── */
    prevBtn.addEventListener('click', () => grid.scrollBy({ left: -getStep(), behavior }));
    nextBtn.addEventListener('click', () => grid.scrollBy({ left:  getStep(), behavior }));

    grid.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    if ('ResizeObserver' in window) new ResizeObserver(requestUpdate).observe(grid);

    grid.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); grid.scrollBy({ left:  getStep(), behavior }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); grid.scrollBy({ left: -getStep(), behavior }); }
    });

    /* ── arrastar com o mouse (toque usa a rolagem nativa) ── */
    let down = false, moved = false;
    let startX = 0, startLeft = 0, lastX = 0, lastT = 0, vx = 0;

    grid.addEventListener('dragstart', (e) => e.preventDefault());

    grid.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true;
      moved = false;
      startX = lastX = e.clientX;
      startLeft = grid.scrollLeft;
      lastT = performance.now();
      vx = 0;
    });

    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        grid.classList.add('is-dragging');
      }
      if (!moved) return;
      const now = performance.now();
      vx = (e.clientX - lastX) / Math.max(now - lastT, 1);
      lastX = e.clientX;
      lastT = now;
      grid.scrollLeft = startLeft - dx;
    });

    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      grid.classList.remove('is-dragging');
      goToIndex(Math.round((grid.scrollLeft - vx * 220) / (getStep() || 1)));
      setTimeout(() => { moved = false; }, 60);
    });

    // evita abrir o link ao soltar depois de arrastar
    grid.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    update();
  }

  /* ════════════════════════════════════════════
     3b. HERO — deck de cards (destaques em "cartas")
     3 cards de categoria em leque no canto inferior
     direito que alternam entre si. Clicáveis (trazem
     a carta para a frente) e com entrada "distribuída".
     ════════════════════════════════════════════ */
  function initHeroDeck() {
    const deck = $('#heroDeck');
    if (!deck) return;

    const cards = $$('.deck-card', deck);
    const dots  = $$('.deck-dot', deck);
    const total = cards.length;
    if (!total) return;

    const INTERVAL = 3800;   // tempo entre trocas (ms)
    let front = 0;
    let timer = null;

    function layout() {
      cards.forEach((card, i) => {
        const pos = (i - front + total) % total;   // 0 = frente
        card.classList.remove('pos-0', 'pos-1', 'pos-2');
        card.classList.add('pos-' + pos);
        card.setAttribute('aria-hidden', String(pos !== 0));
      });
      dots.forEach((d, i) => {
        d.classList.toggle('is-on', i === front);
        d.setAttribute('aria-selected', String(i === front));
      });
    }

    function goTo(i, byUser) {
      front = ((i % total) + total) % total;
      layout();
      if (byUser) restart();
    }
    const advance = () => goTo(front + 1);

    const play    = () => { if (!timer && !prefersReduced) timer = setInterval(advance, INTERVAL); };
    const pause   = () => { clearInterval(timer); timer = null; };
    const restart = () => { pause(); play(); };

    // clique/teclado no card → traz para a frente (sem link por enquanto)
    cards.forEach((card, i) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.dc-fav')) return;   // favoritar não navega
        goTo(i, true);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(i, true); }
      });
    });

    // favoritar (coração) sem disparar a navegação da carta
    $$('.dc-fav', deck).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.toggle('is-liked');
      });
    });

    // bolinhas
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i, true)));

    // pausa ao passar o mouse (para dar tempo de ler/clicar) e ao sair da aba
    deck.addEventListener('mouseenter', pause);
    deck.addEventListener('mouseleave', play);
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));

    layout();

    // "distribuir as cartas" — entrada do leque
    if (prefersReduced) {
      deck.classList.add('is-dealt');
    } else {
      setTimeout(() => deck.classList.add('is-dealt'), 650);
    }

    play();
  }

  /* ════════════════════════════════════════════
     4. NEWSLETTER
     ════════════════════════════════════════════ */
  function initNewsletter() {
    const form = $('#newsletterForm');
    if (!form) return;
    form.addEventListener('submit', (e) => e.preventDefault());
  }

  /* ════════════════════════════════════════════
     3c. NOSSA HISTÓRIA — entrada no scroll e
     parallax/tilt sutil da foto (só desktop com mouse)
     ════════════════════════════════════════════ */
  function initBrandStory() {
    const section = $('.story');
    const visual  = $('#storyVisual');
    if (!section) return;

    /* ── entrada no scroll ── */
    section.classList.add('is-armed');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      section.classList.add('is-in');
    } else {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          section.classList.add('is-in');
          io.disconnect();
        }
      }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
      io.observe(section);
    }

    /* ── parallax das camadas + tilt contido da foto ── */
    if (!visual || prefersReduced) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 961px)');
    let rafId = null, tx = 0, ty = 0;

    function apply() {
      visual.style.setProperty('--px', tx.toFixed(3));
      visual.style.setProperty('--py', ty.toFixed(3));
      rafId = null;
    }

    visual.addEventListener('pointermove', (e) => {
      if (!fine.matches || e.pointerType !== 'mouse') return;
      const r = visual.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      ty = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      if (!rafId) rafId = requestAnimationFrame(apply);
    });

    visual.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      if (!rafId) rafId = requestAnimationFrame(apply);
    });
  }

    /* ════════════════════════════════════════════
     5. PRODUTOS — troca de abas (queridinhos/vendidos/ofertas)
     ════════════════════════════════════════════ */
  function initProductTabs() {
    const section = $('.products');
    if (!section) return;
    const tabs   = $$('.prod-tab', section);
    const panels = $$('.prod-panel', section);
    if (!tabs.length) return;

    function activate(name) {
      tabs.forEach((t) => {
        const on = t.dataset.tab === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach((p) => {
        const on = p.dataset.panel === name;
        p.classList.toggle('is-active', on);
        p.hidden = !on;
      });
    }
    tabs.forEach((t) => t.addEventListener('click', () => activate(t.dataset.tab)));
  }

  /* ════════════════════════════════════════════
     6. QUERIDINHOS — contagem regressiva semanal
     Conta até a próxima segunda 00h e reinicia sozinha.
     ════════════════════════════════════════════ */
  function initWeekCountdown() {
    const root = $('[data-countdown]');
    if (!root) return;
    const out = { d: $('[data-cd="d"]', root), h: $('[data-cd="h"]', root), m: $('[data-cd="m"]', root), s: $('[data-cd="s"]', root) };
    const pad = (n) => String(n).padStart(2, '0');

    function nextMonday() {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const add = ((8 - d.getDay()) % 7) || 7;
      d.setDate(d.getDate() + add);
      return d;
    }
    let target = nextMonday();

    function tick() {
      let diff = target - Date.now();
      if (diff <= 0) { target = nextMonday(); diff = target - Date.now(); }
      const s = Math.floor(diff / 1000);
      if (out.d) out.d.textContent = pad(Math.floor(s / 86400));
      if (out.h) out.h.textContent = pad(Math.floor((s % 86400) / 3600));
      if (out.m) out.m.textContent = pad(Math.floor((s % 3600) / 60));
      if (out.s) out.s.textContent = pad(s % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ════════════════════════════════════════════
     7. Barra de popularidade/estoque — anima ao carregar
     ════════════════════════════════════════════ */
  function initStockBars() {
    $$('[data-fill]').forEach((bar) => {
      const pct = Math.max(0, Math.min(100, parseFloat(bar.dataset.fill) || 0));
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = pct + '%'; }));
    });
  }

  /* ════════════════════════════════════════════
     8. Favoritar (coração) nos cards
     ════════════════════════════════════════════ */
  function initProductFav() {
    $$('.pcard-fav').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        btn.classList.toggle('is-fav');
      });
    });
  }

    /* ════════════════════════════════════════════
     9. QUERIDINHOS: palco interativo
     Clique no seletor troca o produto em destaque.
     Avança sozinho a cada 7s (pausa com o mouse em cima).
     Os dados vêm dos data-* de cada botão .fav-pick.
     ════════════════════════════════════════════ */
  function initFavorites() {
    const root = $('#favStage');
    if (!root) return;

    const main  = $('#favMain', root);
    const picks = $$('.fav-pick', root);
    if (!main || !picks.length) return;

    const el = {
      img:       $('#favImg', root),
      rank:      $('#favRank', root),
      brand:     $('#favBrand', root),
      name:      $('#favName', root),
      desc:      $('#favDesc', root),
      perks:     $('#favPerks', root),
      now:       $('#favNow', root),
      old:       $('#favOld', root),
      save:      $('#favSave', root),
      soldLabel: $('#favSoldLabel', root),
      soldPct:   $('#favSoldPct', root),
      soldFill:  $('#favSoldFill', root)
    };

    // anima a barra de "já vendido" do produto inicial
    setTimeout(() => {
      el.soldFill.style.width = (parseFloat(el.soldFill.dataset.fill) || 0) + '%';
    }, 120);

    const CHECK = '<span class="perk-ico"><svg class="ico"><use href="#i-check"/></svg></span>';
    let current = 0;
    let swapTimer = null;

    function render(p) {
      const d = p.dataset;
      el.img.src = d.img;
      el.img.alt = d.alt || d.name || '';
      el.rank.textContent  = d.rank || '';
      el.brand.textContent = d.brand || '';
      el.name.textContent  = d.name || '';
      el.desc.textContent  = d.desc || '';

      el.perks.textContent = '';
      (d.perks || '').split('|').forEach((txt) => {
        if (!txt.trim()) return;
        const li = document.createElement('li');
        li.innerHTML = CHECK;
        const span = document.createElement('span');
        span.textContent = txt.trim();
        li.appendChild(span);
        el.perks.appendChild(li);
      });

      el.now.textContent  = d.price || '';
      el.old.textContent  = d.old || '';   el.old.hidden  = !d.old;
      el.save.textContent = d.save || '';  el.save.hidden = !d.save;

      const sold = Math.max(0, Math.min(100, parseFloat(d.sold) || 0));
      el.soldLabel.textContent = d.soldLabel || '';
      el.soldPct.textContent   = sold + '%';
      el.soldFill.style.width  = '0%';
      setTimeout(() => { el.soldFill.style.width = sold + '%'; }, 60);
    }

    function goTo(i) {
      if (i === current) return;
      picks[current].classList.remove('is-active');
      picks[current].setAttribute('aria-current', 'false');
      current = i;
      picks[current].classList.add('is-active');
      picks[current].setAttribute('aria-current', 'true');

      clearTimeout(swapTimer);
      if (prefersReduced) { render(picks[current]); return; }
      main.classList.add('is-swapping');
      swapTimer = setTimeout(() => {
        render(picks[current]);
        main.classList.remove('is-swapping');
      }, 260);
    }

    picks.forEach((p, i) => p.addEventListener('click', () => goTo(i)));

    // a barra de progresso (CSS) termina → próximo produto
    root.addEventListener('animationend', (e) => {
      if (e.animationName === 'favProgress') goTo((current + 1) % picks.length);
    });

    // só roda o autoplay enquanto a seção está visível
    if (!prefersReduced && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        root.classList.toggle('is-playing', entries[0].isIntersecting);
      }, { threshold: 0.35 }).observe(root);
    }
  }

  /* ── bootstrap ── */
  function init() {
    initHero();
    initNav();
    initCategories();
    initHeroDeck();
    initBrandStory();
    initNewsletter();     
    initWeekCountdown();   
    initStockBars();       
    initProductFav();
    initFavorites(); 
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();