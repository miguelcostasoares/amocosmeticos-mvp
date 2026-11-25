/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — CATÁLOGO
   Renderiza os produtos, filtra por categoria,
   busca, faixa de preço e ordenação. Os cards são
   os mesmos .pcard da home, então o cart.js liga os
   botões "adicionar à sacola" automaticamente.

   ►► Produtos e card ficam em js/produtos.js ◄◄
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Os produtos agora vêm de js/produtos.js (base única).
     Edite-os lá — landing, catálogo e página de produto atualizam juntos. */
  const PRODUCTS = window.AMO_PRODUCTS || [];

  const PER_PAGE = 12;

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const BRL = (n) => 'R$' + n.toFixed(2).replace('.', ',');
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const PRICE_MIN = 0;
  const PRICE_MAX = Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)) / 10) * 10;

  const filters = {
    cat: 'Todos',
    search: '',
    sort: 'relevance',
    saleOnly: false,
    priceMax: PRICE_MAX
  };
  let shown = PER_PAGE;

  /* ──────────────── categorias + contagem ──────────────── */
  function categories() {
    const map = {};
    PRODUCTS.forEach((p) => { map[p.cat] = (map[p.cat] || 0) + 1; });
    return [['Todos', PRODUCTS.length], ...Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))];
  }

  function renderCategories() {
    const box = $('#filterCats');
    if (!box) return;
    box.innerHTML = categories().map(([name, n]) => `
      <button class="filter-cat ${name === filters.cat ? 'is-active' : ''}" data-cat="${name}">
        ${name} <span>${n}</span>
      </button>`).join('');
  }

  /* ──────────────── aplicar filtros ──────────────── */
  function apply() {
    let list = PRODUCTS.slice();

    if (filters.cat !== 'Todos') list = list.filter((p) => p.cat === filters.cat);
    if (filters.saleOnly) list = list.filter((p) => p.old && p.old > p.price);
    list = list.filter((p) => p.price <= filters.priceMax);

    if (filters.search.trim()) {
      const q = norm(filters.search);
      list = list.filter((p) => norm(p.name + ' ' + p.brand + ' ' + p.cat + ' ' + p.desc).includes(q));
    }

    switch (filters.sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'name':       list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break;
      default:           list.sort((a, b) => b.pop - a.pop);   // relevância
    }
    return list;
  }

  /* ──────────────── render do grid ──────────────── */
  function render() {
    const grid = $('#catalogGrid');
    if (!grid) return;
    const list = apply();
    const page = list.slice(0, shown);

    grid.classList.toggle('is-empty', list.length === 0);
    window.Amo.renderInto(grid, page);

    // contador
    const c = $('#catalogCount');
    if (c) c.innerHTML = `<b>${list.length}</b> produto${list.length === 1 ? '' : 's'} encontrado${list.length === 1 ? '' : 's'}`;

    // botão "carregar mais"
    const more = $('#catalogMore');
    if (more) more.style.display = list.length > shown ? 'flex' : 'none';

    // (favoritar e "adicionar à sacola" são ligados por produtos.js/cart.js)
    renderCategories();
  }

  /* ──────────────── eventos ──────────────── */
  function bind() {
    // categorias (delegação)
    $('#filterCats').addEventListener('click', (e) => {
      const b = e.target.closest('.filter-cat');
      if (!b) return;
      filters.cat = b.dataset.cat;
      shown = PER_PAGE;
      render();
    });

    // busca
    const search = $('#catalogSearch');
    let t = null;
    search.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { filters.search = search.value; shown = PER_PAGE; render(); }, 180);
    });

    // ordenar
    $('#catalogSort').addEventListener('change', (e) => { filters.sort = e.target.value; render(); });

    // só ofertas
    $('#filterSale').addEventListener('change', (e) => { filters.saleOnly = e.target.checked; shown = PER_PAGE; render(); });

    // faixa de preço
    const range = $('#filterPrice');
    range.min = PRICE_MIN; range.max = PRICE_MAX; range.value = PRICE_MAX;
    $('#filterPriceMaxLabel').textContent = BRL(PRICE_MAX);
    $('#filterPriceMinLabel').textContent = BRL(PRICE_MIN);
    updateRangeFill();
    range.addEventListener('input', () => {
      filters.priceMax = parseFloat(range.value);
      $('#filterPriceMaxLabel').textContent = BRL(filters.priceMax);
      updateRangeFill();
      render();
    });

    // limpar filtros
    $('#filterClear').addEventListener('click', () => {
      filters.cat = 'Todos'; filters.search = ''; filters.sort = 'relevance';
      filters.saleOnly = false; filters.priceMax = PRICE_MAX; shown = PER_PAGE;
      search.value = ''; $('#catalogSort').value = 'relevance';
      $('#filterSale').checked = false; range.value = PRICE_MAX;
      $('#filterPriceMaxLabel').textContent = BRL(PRICE_MAX);
      updateRangeFill();
      render();
    });

    // carregar mais
    $('#catalogMoreBtn').addEventListener('click', () => { shown += PER_PAGE; render(); });

    // filtros no mobile (drawer)
    const aside = $('#catalogAside');
    const overlay = $('#catalogAsideOverlay');
    const openF = () => { aside.classList.add('is-open'); overlay.classList.add('is-open'); };
    const closeF = () => { aside.classList.remove('is-open'); overlay.classList.remove('is-open'); };
    $('#catalogFilterBtn').addEventListener('click', openF);
    $('#catalogAsideClose').addEventListener('click', closeF);
    overlay.addEventListener('click', closeF);
  }

  function updateRangeFill() {
    const range = $('#filterPrice');
    const pct = ((range.value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
    const fill = $('#filterRangeFill');
    if (fill) fill.style.width = pct + '%';
  }

  /* pré-seleciona categoria vinda da URL (ex: catalogo.html?cat=Óleos) */
  function readURL() {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat');
    if (cat && PRODUCTS.some((p) => p.cat === cat)) filters.cat = cat;
    if (params.get('ofertas') === '1') filters.saleOnly = true;
    const q = params.get('q');
    if (q) filters.search = q;
  }

  function init() {
    readURL();
    renderCategories();
    bind();
    if (filters.saleOnly) $('#filterSale').checked = true;
    if (filters.search) { const s = $('#catalogSearch'); if (s) s.value = filters.search; }
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();