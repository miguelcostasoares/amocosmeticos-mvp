/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — BUSCA DA NAVBAR
   Expande a barra na navbar, esconde os links e abre
   um painel com: pesquisas recentes, sugestões de
   produtos e busca assistida (autocomplete).
   Funciona em qualquer página (index, catálogo...).
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  /* PRODUTOS — mesma base do catálogo (js/catalogo.js).
     Se um dia você centralizar em window.AMO_PRODUCTS,
     este módulo passa a usar essa lista automaticamente. */
  const FALLBACK = [
    { id:'kit-newhair',          name:'Kit Completo New Hair',       brand:'New Hair',       cat:'Kits',            price:129.90, old:189.90, img:'assets/produtos/kit-newhair.jpeg',   pop:98 },
    { id:'perfume-encanto',      name:'Perfume Capilar Encanto',     brand:'New Hair',       cat:'Perfumes',        price:39.90,  old:0,      img:'assets/produtos/perfume-capilar.jpeg', pop:95 },
    { id:'oleo-noturno',         name:'Óleo Reparador Noturno',      brand:'New Hair',       cat:'Óleos',           price:44.90,  old:54.90,  img:'assets/produtos/oleos-newhair.jpeg', pop:90 },
    { id:'shampoo-hidra',        name:'Shampoo Hidratação Intensa',  brand:'Belkit',         cat:'Shampoos',        price:32.90,  old:0,      img:'assets/produtos/shampoo-belkit.jpeg', pop:88 },
    { id:'kit-presente',         name:'Kit Presente Amo Você',       brand:'Amo Cosméticos', cat:'Kits',            price:149.90, old:199.90, img:'assets/produtos/kit-newhair.jpeg',   pop:85 },
    { id:'oleo-finalizador',     name:'Óleo Finalizador Brilho',     brand:'New Hair',       cat:'Óleos',           price:36.90,  old:42.90,  img:'assets/produtos/oleos-newhair.jpeg', pop:74 },
    { id:'perfume-doce',         name:'Perfume Capilar Doce Flor',   brand:'New Hair',       cat:'Perfumes',        price:42.90,  old:0,      img:'assets/produtos/perfume-capilar.jpeg', pop:70 },
    { id:'shampoo-fortalece',    name:'Shampoo Fortalecedor',        brand:'Belkit',         cat:'Shampoos',        price:34.90,  old:39.90,  img:'assets/produtos/shampoo-belkit.jpeg', pop:66 },
    { id:'cond-nutritivo',       name:'Condicionador Nutritivo',     brand:'Belkit',         cat:'Condicionadores', price:29.90,  old:0,      img:'assets/produtos/IMG_0407.jpg',       pop:64 },
    { id:'mascara-reconstrutora',name:'Máscara Reconstrutora',       brand:'New Hair',       cat:'Máscaras',        price:49.90,  old:59.90,  img:'assets/produtos/IMG_0408.jpg',       pop:60 }
  ];
  const PRODUCTS = (Array.isArray(window.AMO_PRODUCTS) && window.AMO_PRODUCTS.length) ? window.AMO_PRODUCTS : FALLBACK;

  const QUICK       = ['Kits', 'Shampoos', 'Óleos', 'Perfumes', 'Máscaras'];
  const CATALOG_URL = 'catalogo.html';   // ajuste se o catálogo tiver outro caminho
  const RECENT_KEY  = 'amo_recent_v1';
  const MAX_RECENT  = 6;
  const MAX_SUGGEST = 5;

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const BRL  = (n) => 'R$' + n.toFixed(2).replace('.', ',');
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esc  = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));

  /* ícones */
  const I_SEARCH = '<svg class="sr-ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const I_ARROW  = '<svg class="sr-arrow" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  const I_CLOCK  = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const I_SPARK  = '<svg viewBox="0 0 24 24"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>';
  const I_BIG    = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  let nav, input, panel, clearBtn, backdrop;
  let items = [], active = -1;

  /* ── recentes ── */
  function getRecent() { try { const a = JSON.parse(localStorage.getItem(RECENT_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function pushRecent(term) {
    term = term.trim(); if (!term) return;
    let a = getRecent().filter((t) => norm(t) !== norm(term));
    a.unshift(term);
    localStorage.setItem(RECENT_KEY, JSON.stringify(a.slice(0, MAX_RECENT)));
  }
  function clearRecent() { localStorage.removeItem(RECENT_KEY); }

  /* ── busca ── */
  function searchProducts(q) {
    const nq = norm(q);
    return PRODUCTS.map((p) => {
      const hay = norm(p.name + ' ' + p.brand + ' ' + p.cat);
      let score = 0;
      if (norm(p.name).startsWith(nq)) score = 3;
      else if (hay.includes(' ' + nq)) score = 2;
      else if (hay.includes(nq)) score = 1;
      return { p, score };
    }).filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.pop - a.p.pop)
      .map((x) => x.p);
  }
  function termSuggestions(q) {
    const nq = norm(q), pool = new Set();
    PRODUCTS.forEach((p) => { pool.add(p.cat); pool.add(p.brand); });
    return Array.from(pool).filter((t) => norm(t).includes(nq)).slice(0, 4);
  }
  function highlight(text, q) {
    const nt = norm(text), nq = norm(q), i = nt.indexOf(nq);
    if (i < 0 || !nq) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  /* ── templates ── */
  function productRow(p, q) {
    return '<a class="sr-item sr-prod" href="' + CATALOG_URL + '?q=' + encodeURIComponent(p.name) + '" data-term="' + esc(p.name) + '">' +
      '<span class="sr-thumb"><img src="' + p.img + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"></span>' +
      '<span class="sr-info"><span class="sr-name">' + (q ? highlight(p.name, q) : esc(p.name)) + '</span><span class="sr-meta">' + esc(p.cat) + '</span></span>' +
      '<span class="sr-price">' + BRL(p.price) + '</span></a>';
  }
  function termRow(term, q) {
    return '<button type="button" class="sr-item sr-term" data-term="' + esc(term) + '">' + I_SEARCH +
      '<span class="sr-name">' + (q ? highlight(term, q) : esc(term)) + '</span>' + I_ARROW + '</button>';
  }
  function chip(term, icon) {
    return '<button type="button" class="sr-chip" data-term="' + esc(term) + '">' + icon + esc(term) + '</button>';
  }

  /* ── renders ── */
  function renderDefault() {
    const recent = getRecent();
    const top = PRODUCTS.slice().sort((a, b) => b.pop - a.pop).slice(0, MAX_SUGGEST);
    let h = '';
    if (recent.length) {
      h += '<section class="sp-sec"><header class="sp-head"><span>Pesquisas recentes</span>' +
           '<button type="button" class="sp-clear">limpar</button></header><div class="sp-chips">' +
           recent.map((t) => chip(t, I_CLOCK)).join('') + '</div></section>';
    }
    h += '<section class="sp-sec"><header class="sp-head"><span>Sugestões para você</span></header><div class="sp-list">' +
         top.map((p) => productRow(p, '')).join('') + '</div></section>';
    h += '<section class="sp-sec"><header class="sp-head"><span>Explorar categorias</span></header><div class="sp-chips">' +
         QUICK.map((c) => chip(c, I_SPARK)).join('') + '</div></section>';
    panel.innerHTML = h;
    resetActive();
  }
  function renderQuery(q) {
    const terms = termSuggestions(q);
    const prods = searchProducts(q).slice(0, 6);
    let h = '';
    if (terms.length) h += '<section class="sp-sec"><div class="sp-list">' + terms.map((t) => termRow(t, q)).join('') + '</div></section>';
    if (prods.length) {
      h += '<section class="sp-sec"><header class="sp-head"><span>Produtos</span></header><div class="sp-list">' +
           prods.map((p) => productRow(p, q)).join('') + '</div></section>';
      h += '<a class="sp-all" href="' + CATALOG_URL + '?q=' + encodeURIComponent(q) + '" data-term="' + esc(q) + '">Ver todos os resultados para “' + esc(q) + '” →</a>';
    }
    if (!terms.length && !prods.length) {
      h += '<div class="sp-empty">' + I_BIG + '<p>Nenhum produto encontrado para <b>“' + esc(q) + '”</b>.</p></div>';
    }
    panel.innerHTML = h;
    resetActive();
  }

  /* ── navegação por teclado ── */
  function resetActive() { items = $$('[data-term]', panel); active = -1; }
  function setActive(i) {
    if (!items.length) return;
    if (active >= 0) items[active].classList.remove('is-active');
    active = (i + items.length) % items.length;
    items[active].classList.add('is-active');
    items[active].scrollIntoView({ block: 'nearest' });
  }

  /* ── ações ── */
  function go(term) {
    term = (term || '').trim(); if (!term) return;
    pushRecent(term);
    window.location.href = CATALOG_URL + '?q=' + encodeURIComponent(term);
  }
  function toggleClear() { clearBtn.hidden = !input.value; }
  function open() {
    if (nav.classList.contains('search-open')) return;
    nav.classList.add('search-open');
    nav.classList.remove('nav-hidden');
    $('#navSearchTrigger').setAttribute('aria-expanded', 'true');
    backdrop.classList.add('is-on');
    input.value = ''; toggleClear(); renderDefault();
    setTimeout(() => input.focus(), 60);
  }
  function close() {
    if (!nav.classList.contains('search-open')) return;
    nav.classList.remove('search-open');
    $('#navSearchTrigger').setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('is-on');
    input.blur();
  }

  function init() {
    nav = $('#nav');
    const trigger = $('#navSearchTrigger');
    const box = $('#navSearch');
    if (!nav || !trigger || !box) return;

    input    = $('#navSearchInput', box);
    panel    = $('#searchPanel', box);
    clearBtn = $('#navSearchClear', box);
    const closeBtn = $('#navSearchClose', box);

    backdrop = document.createElement('div');
    backdrop.className = 'search-backdrop';
    document.body.appendChild(backdrop);

    trigger.addEventListener('click', (e) => { e.preventDefault(); open(); });
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    clearBtn.addEventListener('click', () => { input.value = ''; toggleClear(); renderDefault(); input.focus(); });

    let t;
    input.addEventListener('input', () => {
      toggleClear();
      clearTimeout(t);
      t = setTimeout(() => {
        const q = input.value.trim();
        q ? renderQuery(q) : renderDefault();
      }, 120);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown')      { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter')     { e.preventDefault(); (active >= 0 && items[active]) ? go(items[active].dataset.term) : go(input.value); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('search-open')) close(); });

    panel.addEventListener('click', (e) => {
      if (e.target.closest('.sp-clear')) { clearRecent(); renderDefault(); input.focus(); return; }
      const item = e.target.closest('[data-term]');
      if (item) { e.preventDefault(); go(item.dataset.term); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();