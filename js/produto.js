/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — PÁGINA DE PRODUTO
   Uma página só (produto.html) serve todos os produtos:
     produto.html?id=kit-newhair
     produto.html?id=perfume-encanto  ...
   Os dados vêm de js/produtos.js (carregue-o antes).
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  const A = window.Amo;
  if (!A) return;
  const { BRL, esc } = A;

  const PIX_OFF = 0.05;          // igual ao cart.js (CONFIG.pixDiscount)
  const MAX_PARC = 12;           // igual ao cart.js (CONFIG.maxInstallments)
  const MIN_PARC = 20;           // igual ao cart.js (CONFIG.minInstallment)
  const REVIEWS_KEY = 'amo_reviews_v1';

  const $ = (s, c) => (c || document).querySelector(s);
  const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem espaço */ } };

  const id = new URLSearchParams(location.search).get('id');
  const p = A.find(id);

  /* ──────────────── não encontrado ──────────────── */
  if (!p) {
    document.querySelectorAll('.pdp > :not(#pdpMissing)').forEach((el) => { el.hidden = true; });
    $('#pdpMissing').hidden = false;
    $('#pdpBar').remove();
    document.title = 'Produto não encontrado — Amo Cosméticos';
    return;
  }

  /* estado da compra */
  const opts = p.variants ? p.variants.options : null;
  let variant = opts
    ? (opts.find((o) => o.price === p.price && (o.stock || 0) > 0) || opts.find((o) => (o.stock || 0) > 0) || opts[0])
    : null;
  let qty = 1;

  const cur = () => ({
    price: variant ? variant.price : p.price,
    old: variant ? (variant.old || 0) : p.old,
    stock: variant ? (variant.stock || 0) : A.stockOf(p)
  });

  /* ──────────────── textos fixos ──────────────── */
  function fillStatic() {
    const catUrl = '/catalogo.html?cat=' + encodeURIComponent(p.cat);
    $('#pdpCrumbCat').textContent = p.cat;
    $('#pdpCrumbCat').href = catUrl;
    $('#pdpCrumbName').textContent = p.name;

    $('#pdpBrand').textContent = p.brand;
    $('#pdpBrand').href = '/catalogo.html?q=' + encodeURIComponent(p.brand);
    $('#pdpName').textContent = p.name;
    $('#pdpLead').textContent = p.desc;
    $('#pdpBarName').textContent = p.name;

    const full = Math.round(p.rating || 0);
    $('#pdpRating').innerHTML =
      `<span class="pdp-stars" aria-hidden="true">${'★'.repeat(full)}<i>${'★'.repeat(5 - full)}</i></span>` +
      `<span><b>${String(p.rating.toFixed(1)).replace('.', ',')}</b> de 5</span>`;
    $('#pdpRating').setAttribute('aria-label', `Nota ${String(p.rating).replace('.', ',')} de 5. Ver avaliações`);

    $('#pdpAbout').textContent = p.about || p.desc;
    $('#pdpBenefits').innerHTML = (p.benefits || []).map((b) =>
      `<li><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>${esc(b)}</li>`).join('');
    $('#pdpHowTo').textContent = p.howTo || 'Siga as instruções da embalagem.';

    const spec = [['Marca', p.brand], ['Categoria', p.cat], ['Conteúdo', p.size], ['Código', p.id]].filter((r) => r[1]);
    $('#pdpSpec').innerHTML = spec.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');

    $('#pdpRelLink').href = catUrl;

    // WhatsApp com o produto já na mensagem
    const msg = encodeURIComponent(`Olá! Tenho uma dúvida sobre o produto ${p.name}: ${location.href}`);
    $('#pdpWa').href = `https://wa.me/${A.WHATSAPP}?text=${msg}`;
    $('#pdpNotify').href = `https://wa.me/${A.WHATSAPP}?text=${encodeURIComponent(`Olá! Quero ser avisada quando o ${p.name} voltar ao estoque.`)}`;

    // favoritos (mesma lista do account.js)
    const fav = $('#pdpFav');
    if (A.likedNames().includes(p.name)) { fav.classList.add('is-fav'); fav.setAttribute('aria-pressed', 'true'); }
    fav.setAttribute('aria-label', 'Favoritar ' + p.name);
    fav.addEventListener('click', () => setTimeout(() => {
      const key = 'amo_likes_v1';
      const rest = read(key, []).filter((x) => x.name !== p.name);
      write(key, fav.classList.contains('is-fav')
        ? [{ name: p.name, brand: p.brand, img: p.img, price: BRL(p.price) }].concat(rest).slice(0, 20)
        : rest);
    }, 0));
  }

  /* ──────────────── galeria ──────────────── */
  function gallery() {
    const imgs = [p.img].concat(p.imgs || []);
    const main = $('#pdpImg');
    main.src = imgs[0];
    main.alt = p.name;
    const box = $('#pdpThumbs');
    if (imgs.length < 2) { box.hidden = true; return; }
    box.innerHTML = imgs.map((src, i) =>
      `<button type="button" class="pdp-thumb${i === 0 ? ' is-active' : ''}" aria-label="Foto ${i + 1} de ${imgs.length}" aria-pressed="${i === 0}">
         <img src="${esc(src)}" alt="" loading="lazy" draggable="false"></button>`).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.pdp-thumb');
      if (!b) return;
      box.querySelectorAll('.pdp-thumb').forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-pressed', 'false'); });
      b.classList.add('is-active');
      b.setAttribute('aria-pressed', 'true');
      main.src = b.querySelector('img').getAttribute('src');
    });
  }

  /* ──────────────── variações ──────────────── */
  function variants() {
    if (!opts) return;
    $('#pdpVariants').hidden = false;
    const chips = $('#pdpChips');
    chips.setAttribute('aria-label', p.variants.label);
    const paint = () => {
      $('#pdpVariantsLabel').innerHTML = `${esc(p.variants.label)}: <b>${esc(variant.name)}</b>`;
      chips.innerHTML = opts.map((o, i) => {
        const out = (o.stock || 0) <= 0;
        const on = o === variant;
        return `<button type="button" role="radio" class="pdp-chip${on ? ' is-on' : ''}${out ? ' is-out' : ''}" data-i="${i}" aria-checked="${on}"${out ? ' aria-disabled="true"' : ''}>${esc(o.name)}</button>`;
      }).join('');
    };
    paint();
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('.pdp-chip');
      if (!b || b.classList.contains('is-out')) return;
      variant = opts[+b.dataset.i];
      qty = 1;
      paint();
      update();
    });
  }

  /* ──────────────── preço / estoque / botões ──────────────── */
  function update() {
    const c = cur();
    const sale = c.old && c.old > c.price;
    $('#pdpNow').textContent = BRL(c.price);
    $('#pdpBarNow').textContent = BRL(c.price);
    $('#pdpOld').textContent = sale ? BRL(c.old) : '';
    $('#pdpOff').textContent = sale ? `-${Math.round((1 - c.price / c.old) * 100)}%` : '';
    $('#pdpOff').hidden = !sale;
    $('#pdpPix').innerHTML = `<b>${BRL(c.price * (1 - PIX_OFF))}</b> no Pix (${Math.round(PIX_OFF * 100)}% de desconto)`;
    const n = Math.max(1, Math.min(MAX_PARC, Math.floor(c.price / MIN_PARC)));
    $('#pdpParc').textContent = n > 1 ? `ou em até ${n}x de ${BRL(c.price / n)} no cartão` : 'no cartão de crédito';

    const badge = $('#pdpBadge');
    if (c.stock <= 0) { badge.hidden = false; badge.textContent = 'Esgotado'; badge.className = 'pdp-badge is-out'; }
    else if (sale) { badge.hidden = false; badge.textContent = `-${Math.round((1 - c.price / c.old) * 100)}%`; badge.className = 'pdp-badge is-sale'; }
    else badge.hidden = true;

    const st = $('#pdpStock');
    const out = c.stock <= 0;
    if (out) { st.textContent = 'Esgotado no momento'; st.className = 'pdp-stock is-out'; }
    else if (c.stock <= A.LOW_STOCK) { st.textContent = c.stock === 1 ? 'Última unidade' : `Últimas ${c.stock} unidades`; st.className = 'pdp-stock is-low'; }
    else { st.textContent = 'Em estoque, pronto para envio'; st.className = 'pdp-stock is-ok'; }

    const max = Math.max(1, Math.min(10, c.stock));
    qty = Math.min(qty, max);
    $('#pdpQty').value = qty;
    $('#pdpQty').max = max;
    $('#pdpMinus').disabled = out || qty <= 1;
    $('#pdpPlus').disabled = out || qty >= max;
    $('#pdpQty').disabled = out;

    ['#pdpAdd', '#pdpBarAdd'].forEach((s) => { $(s).disabled = out; });
    $('#pdpAdd').textContent = out ? 'Produto esgotado' : 'Adicionar à sacola';
    $('#pdpBuyNow').hidden = out;
    $('#pdpNotify').hidden = !out;
  }

  /* ──────────────── sacola ──────────────── */
  function addToBag(fromEl) {
    const c = cur();
    if (c.stock <= 0 || !window.AmoCart) return false;
    const name = variant ? `${p.name} (${variant.name})` : p.name;
    const item = {
      id: slug(name),                        // mesmo id que os cards geram
      name, brand: p.brand,
      price: BRL(c.price), old: c.old ? BRL(c.old) : '',
      img: p.img
    };
    for (let i = 0; i < qty; i++) window.AmoCart.add(item, i === 0 ? fromEl : null);
    return true;
  }

  function bind() {
    $('#pdpMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); update(); });
    $('#pdpPlus').addEventListener('click', () => { qty += 1; update(); });
    $('#pdpQty').addEventListener('change', (e) => { qty = Math.max(1, parseInt(e.target.value, 10) || 1); update(); });

    $('#pdpAdd').addEventListener('click', (e) => addToBag(e.currentTarget));
    $('#pdpBarAdd').addEventListener('click', (e) => addToBag(e.currentTarget));
    $('#pdpBuyNow').addEventListener('click', (e) => { if (addToBag(null)) window.AmoCart.open(); });

    // barra fixa no celular: aparece quando o botão principal sai da tela
    const bar = $('#pdpBar');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        const show = !en.isIntersecting && en.boundingClientRect.top < 0;
        bar.classList.toggle('is-on', show);
        bar.setAttribute('aria-hidden', String(!show));
        $('#pdpBarAdd').tabIndex = show ? 0 : -1;
      }).observe($('#pdpBuy'));
    }
  }

  /* ──────────────── avaliações (salvas neste navegador) ────────────────
     Quando houver backend, troque read/write por chamadas à API. */
  function reviews() {
    const all = read(REVIEWS_KEY, {});
    const list = all[p.id] || [];
    $('#pdpRevScore').innerHTML =
      `<b>${String(p.rating.toFixed(1)).replace('.', ',')}</b><span class="pdp-stars" aria-hidden="true">${'★'.repeat(Math.round(p.rating))}<i>${'★'.repeat(5 - Math.round(p.rating))}</i></span><span>nota média</span>`;
    $('#pdpRevList').innerHTML = list.length
      ? list.map((r) => `
          <article class="pdp-rev">
            <header><b>${esc(r.nome)}</b><span class="pdp-stars" aria-label="${r.nota} de 5">${'★'.repeat(r.nota)}<i>${'★'.repeat(5 - r.nota)}</i></span></header>
            <p>${esc(r.texto)}</p>
            <time datetime="${esc(r.data)}">${new Date(r.data).toLocaleDateString('pt-BR')}</time>
          </article>`).join('')
      : '<p class="pdp-rev-empty">Ainda não há comentários sobre este produto. Comprou? Deixe o seu abaixo.</p>';
  }

  function bindReviews() {
    const form = $('#pdpRevForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const nome = String(fd.get('nome') || '').trim();
      const texto = String(fd.get('texto') || '').trim();
      if (!nome || !texto) { $('#pdpRevHint').textContent = 'Preencha seu nome e o comentário para publicar.'; return; }
      const all = read(REVIEWS_KEY, {});
      (all[p.id] = all[p.id] || []).unshift({ nome, texto, nota: +fd.get('nota') || 5, data: new Date().toISOString() });
      write(REVIEWS_KEY, all);
      form.reset();
      $('#pdpRevHint').textContent = 'Avaliação publicada. Obrigada!';
      reviews();
    });
  }

  /* ──────────────── relacionados ──────────────── */
  function related() {
    const others = window.AMO_PRODUCTS.filter((x) => x.id !== p.id && A.stockOf(x) > 0);
    const same = others.filter((x) => x.cat === p.cat).sort((a, b) => b.pop - a.pop);
    const rest = others.filter((x) => x.cat !== p.cat).sort((a, b) => b.pop - a.pop);
    A.renderInto($('#pdpRelated'), same.concat(rest).slice(0, 4));
  }

  /* ──────────────── SEO ──────────────── */
  function seo() {
    document.title = `${p.name} — ${p.brand} | Amo Cosméticos`;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', `${p.name}: ${p.desc} Compre na Amo Cosméticos.`);
    const c = cur();
    $('#pdpLd').textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      image: [new URL(p.img, location.href).href],
      description: p.about || p.desc,
      sku: p.id,
      brand: { '@type': 'Brand', name: p.brand },
      offers: {
        '@type': 'Offer',
        url: location.href,
        priceCurrency: 'BRL',
        price: c.price.toFixed(2),
        availability: c.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    });
  }

  /* registra "visto recentemente" (mesma lista do account.js) */
  function trackView() {
    const key = 'amo_recent_products_v1';
    const item = { name: p.name, brand: p.brand, img: p.img, price: BRL(p.price) };
    write(key, [item].concat(read(key, []).filter((x) => x.name !== p.name)).slice(0, 8));
  }

  function init() {
    fillStatic();
    gallery();
    variants();
    update();
    bind();
    reviews();
    bindReviews();
    related();
    seo();
    trackView();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
