/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — CATÁLOGO
   Renderiza os produtos, filtra por categoria,
   busca, faixa de preço e ordenação. Os cards são
   os mesmos .pcard da home, então o cart.js liga os
   botões "adicionar à sacola" automaticamente.

   ►► EDITE OS PRODUTOS no array PRODUCTS abaixo. ◄◄
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────── PRODUTOS ────────────────
     cat: Shampoos | Condicionadores | Óleos | Perfumes | Máscaras | Kits
     price: preço atual | old: preço antigo (0 = sem oferta) */
  const PRODUCTS = [
    { id: 'kit-newhair', name: 'Kit Completo New Hair', brand: 'New Hair', cat: 'Kits', price: 129.90, old: 189.90, img: 'assets/produtos/kit-newhair.jpeg', desc: 'O ritual completo: shampoo, máscara e óleo em um só kit.', rating: 4.9, pop: 98 },
    { id: 'perfume-encanto', name: 'Perfume Capilar Encanto', brand: 'New Hair', cat: 'Perfumes', price: 39.90, old: 0, img: 'assets/produtos/perfume-capilar.jpeg', desc: 'Cheirinho irresistível que perfuma e fixa por horas.', rating: 4.9, pop: 95 },
    { id: 'oleo-noturno', name: 'Óleo Reparador Noturno', brand: 'New Hair', cat: 'Óleos', price: 44.90, old: 54.90, img: 'assets/produtos/oleos-newhair.jpeg', desc: 'Nutre enquanto você dorme e controla o frizz.', rating: 5.0, pop: 90 },
    { id: 'shampoo-hidra', name: 'Shampoo Hidratação Intensa', brand: 'Belkit', cat: 'Shampoos', price: 32.90, old: 0, img: 'assets/produtos/shampoo-belkit.jpeg', desc: 'Limpa com suavidade e repõe a hidratação a cada lavagem.', rating: 4.8, pop: 88 },
    { id: 'oleo-finalizador', name: 'Óleo Finalizador Brilho', brand: 'New Hair', cat: 'Óleos', price: 36.90, old: 42.90, img: 'assets/produtos/oleos-newhair.jpeg', desc: 'Toque final de brilho sem pesar nos fios.', rating: 4.7, pop: 74 },
    { id: 'perfume-doce', name: 'Perfume Capilar Doce Flor', brand: 'New Hair', cat: 'Perfumes', price: 42.90, old: 0, img: 'assets/produtos/perfume-capilar.jpeg', desc: 'Fragrância floral e delicada para o dia a dia.', rating: 4.8, pop: 70 },
    { id: 'shampoo-fortalece', name: 'Shampoo Fortalecedor', brand: 'Belkit', cat: 'Shampoos', price: 34.90, old: 39.90, img: 'assets/produtos/shampoo-belkit.jpeg', desc: 'Reduz a quebra e deixa os fios mais resistentes.', rating: 4.6, pop: 66 },
    { id: 'cond-nutritivo', name: 'Condicionador Nutritivo', brand: 'Belkit', cat: 'Condicionadores', price: 29.90, old: 0, img: 'assets/produtos/IMG_0407.jpg', desc: 'Desembaraça e sela a hidratação do banho.', rating: 4.7, pop: 64 },
    { id: 'mascara-reconstrutora', name: 'Máscara Reconstrutora', brand: 'New Hair', cat: 'Máscaras', price: 49.90, old: 59.90, img: 'assets/produtos/IMG_0408.jpg', desc: 'Repõe massa e recupera fios muito danificados.', rating: 4.9, pop: 82 },
    { id: 'kit-cachos', name: 'Kit Cachos Definidos', brand: 'New Hair', cat: 'Kits', price: 99.90, old: 139.90, img: 'assets/produtos/IMG_0425.jpg', desc: 'Creme, gelatina e leave-in para cachos de verdade.', rating: 4.8, pop: 78 },
    { id: 'mascara-matizadora', name: 'Máscara Matizadora', brand: 'Belkit', cat: 'Máscaras', price: 45.90, old: 0, img: 'assets/produtos/IMG_0426.jpg', desc: 'Neutraliza o amarelado dos fios loiros e grisalhos.', rating: 4.6, pop: 58 },
    { id: 'cond-reparador', name: 'Condicionador Reparador', brand: 'New Hair', cat: 'Condicionadores', price: 33.90, old: 38.90, img: 'assets/produtos/IMG_0407.jpg', desc: 'Para cabelos secos que pedem socorro.', rating: 4.7, pop: 60 },
    { id: 'perfume-noite', name: 'Perfume Capilar Noite', brand: 'New Hair', cat: 'Perfumes', price: 46.90, old: 0, img: 'assets/produtos/perfume-capilar.jpeg', desc: 'Notas amadeiradas marcantes para a noite.', rating: 4.9, pop: 55 },
    { id: 'oleo-crescimento', name: 'Óleo de Crescimento', brand: 'Belkit', cat: 'Óleos', price: 52.90, old: 64.90, img: 'assets/produtos/oleos-newhair.jpeg', desc: 'Estimula o couro cabeludo e acelera o crescimento.', rating: 4.8, pop: 72 },
    { id: 'shampoo-antirresiduos', name: 'Shampoo Antirresíduos', brand: 'Belkit', cat: 'Shampoos', price: 31.90, old: 0, img: 'assets/produtos/shampoo-belkit.jpeg', desc: 'Faz a limpeza profunda antes de tratamentos.', rating: 4.5, pop: 48 },
    { id: 'kit-presente', name: 'Kit Presente Amo Você', brand: 'Amo Cosméticos', cat: 'Kits', price: 149.90, old: 199.90, img: 'assets/produtos/kit-newhair.jpeg', desc: 'A seleção especial para presentear com carinho.', rating: 5.0, pop: 85 },
  ];

  const PER_PAGE = 9;

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
  function cardHTML(p) {
    const onSale = p.old && p.old > p.price;
    const off = onSale ? Math.round((1 - p.price / p.old) * 100) : 0;
    return `
      <article class="pcard ${onSale ? 'pcard--sale' : ''}" data-cat="${p.cat}">
        <div class="pcard-frame">
          <div class="pcard-mat">
            <div class="pcard-media">
              <img src="${p.img}" alt="${p.name}" loading="lazy" draggable="false">
              <span class="pcard-glass" aria-hidden="true"></span>
              <span class="pcard-cat">${p.cat}</span>
              ${onSale ? `<span class="pcard-tag pcard-tag--sale"><svg class="ico"><use href="#i-tag"/></svg>-${off}%</span>` : ''}
              <button class="pcard-fav" type="button" aria-label="Favoritar"><svg class="ico"><use href="#i-heart"/></svg></button>
            </div>
          </div>
          <div class="pcard-body">
            <span class="pcard-brand">${p.brand}</span>
            <h4 class="pcard-name">${p.name}</h4>
            <p class="pcard-desc">${p.desc}</p>
            <div class="pcard-foot">
              <span class="pcard-price"><span class="now">${BRL(p.price)}</span>${onSale ? `<span class="old">${BRL(p.old)}</span>` : ''}</span>
              <button class="pcard-add" type="button" aria-label="Adicionar ${p.name} à sacola"><svg class="ico"><use href="#i-plus"/></svg></button>
            </div>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const grid = $('#catalogGrid');
    if (!grid) return;
    const list = apply();
    const page = list.slice(0, shown);

    grid.classList.toggle('is-empty', list.length === 0);
    grid.innerHTML = page.map(cardHTML).join('');

    // contador
    const c = $('#catalogCount');
    if (c) c.innerHTML = `<b>${list.length}</b> produto${list.length === 1 ? '' : 's'} encontrado${list.length === 1 ? '' : 's'}`;

    // botão "carregar mais"
    const more = $('#catalogMore');
    if (more) more.style.display = list.length > shown ? 'flex' : 'none';

    // favoritar (coração)
    $$('.pcard-fav', grid).forEach((btn) => btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation(); btn.classList.toggle('is-fav');
    }));

    // religa os botões de adicionar à sacola (cart.js)
    if (window.AmoCart && window.AmoCart.wire) window.AmoCart.wire();

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