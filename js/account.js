/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — MINHA CONTA
   Drawer com dados do cliente, últimas compras,
   vistos recentemente, favoritos e edição de dados.
   Tudo salvo no localStorage (sem backend, sem foto).
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  const PROFILE_KEY = 'amo_user_v1';             // { name, email, phone }
  const ORDERS_KEY  = 'amo_orders_v1';           // [{ id, date, total, count, items }]
  const VIEWS_KEY   = 'amo_recent_products_v1';  // [{ name, brand, price, img }]
  const LIKES_KEY   = 'amo_likes_v1';            // [{ name, brand, price, img }]
  const MAX_VIEWS = 8, MAX_LIKES = 20, MAX_ORDERS = 6;

  const $ = (s, c) => (c || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));
  const read = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const priceOf = (el) => { if (!el) return ''; const m = String(el.textContent).match(/R\$\s?[\d.,]+/); return m ? m[0] : ''; };

  const getProfile = () => Object.assign({ name: '', email: '', phone: '' }, read(PROFILE_KEY, {}));

  /* lê um produto de um card (.pcard ou .deck-card) */
  function readCard(card) {
    if (!card) return null;
    const isDeck = card.classList.contains('deck-card');
    const nameEl = card.querySelector(isDeck ? '.dc-name' : '.pcard-name');
    if (!nameEl) return null;
    const brandEl = card.querySelector(isDeck ? '.dc-brand' : '.pcard-brand');
    const imgEl   = card.querySelector(isDeck ? '.dc-media img' : '.pcard-media img');
    const price   = priceOf(card.querySelector(isDeck ? '.dc-price' : '.pcard-price .now'));
    return {
      name:  nameEl.textContent.trim(),
      brand: brandEl ? brandEl.textContent.trim() : '',
      img:   imgEl ? (imgEl.getAttribute('src') || '') : '',
      price: price
    };
  }

  function pushUnique(key, p, max) {
    let a = read(key, []).filter((x) => x.name !== p.name);
    a.unshift(p);
    write(key, a.slice(0, max));
  }

  /* ──────────────── drawer ──────────────── */
  let overlay, drawer, body, ui = { editing: false, saved: false };

  function build() {
    if ($('#accDrawer')) return;
    overlay = document.createElement('div');
    overlay.className = 'acc-overlay'; overlay.id = 'accOverlay';
    drawer = document.createElement('aside');
    drawer.className = 'acc-drawer'; drawer.id = 'accDrawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Minha conta');
    drawer.setAttribute('aria-modal', 'true');
    drawer.innerHTML =
      '<header class="acc-head"><div>' +
        '<span class="acc-hello">Olá,</span>' +
        '<strong class="acc-hello-name" id="accHelloName">visitante</strong>' +
      '</div><button class="acc-close" id="accClose" aria-label="Fechar">' +
        '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
      '</button></header><div class="acc-body" id="accBody"></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    body = $('#accBody', drawer);
    overlay.addEventListener('click', close);
    $('#accClose', drawer).addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) close(); });

    // delegação de cliques do corpo
    body.addEventListener('click', (e) => {
      const rb = e.target.closest('[data-rebuy]');
      if (rb) { buyAgain(rb.dataset.rebuy); return; }

      const act = e.target.closest('[data-act]');
      if (!act) return;
      const a = act.dataset.act;
      if (a === 'edit')   { ui.editing = true;  render(); }
      if (a === 'cancel') { ui.editing = false; render(); }
      if (a === 'clearViews') { write(VIEWS_KEY, []); render(); }
    });

    // salvar dados
    body.addEventListener('submit', (e) => {
      if (!e.target.closest('#accForm')) return;
      e.preventDefault();
      const f = e.target;
      write(PROFILE_KEY, {
        name:  f.name.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.trim()
      });
      ui.editing = false; ui.saved = true;
      render();
      setTimeout(() => { ui.saved = false; if (drawer.classList.contains('is-open')) render(); }, 2800);
    });
  }

  /* ──────────────── render ──────────────── */
  function render() {
    const p = getProfile();
    const first = (p.name || '').trim().split(' ')[0] || 'visitante';
    $('#accHelloName', drawer).textContent = first;

    body.innerHTML =
      sectionProfile(p) +
      sectionOrders() +
      sectionList('Vistos recentemente', read(VIEWS_KEY, []), true) +
      sectionList('Favoritos', read(LIKES_KEY, []), false);
  }

  function sectionProfile(p) {
    if (ui.editing) {
      return '<section class="acc-sec"><div class="acc-sec-head"><h3>Editar dados</h3></div>' +
        '<form class="acc-form" id="accForm">' +
        field('Nome', 'name', 'text', p.name) +
        field('E-mail', 'email', 'email', p.email) +
        field('Telefone', 'phone', 'tel', p.phone) +
        '<div class="acc-form-btns">' +
          '<button type="button" class="acc-btn-ghost" data-act="cancel">Cancelar</button>' +
          '<button type="submit" class="acc-btn">Salvar</button>' +
        '</div></form></section>';
    }
    const saved = ui.saved ? '<div class="acc-saved"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Dados atualizados!</div>' : '';
    return '<section class="acc-sec">' + saved +
      '<div class="acc-sec-head"><h3>Meus dados</h3><button class="acc-edit" data-act="edit">Editar</button></div>' +
      '<ul class="acc-data">' +
        row('Nome', p.name) + row('E-mail', p.email) + row('Telefone', p.phone) +
      '</ul></section>';
  }
  function field(label, name, type, val) {
    return '<label>' + label + '<input type="' + type + '" name="' + name + '" value="' + esc(val) + '" placeholder="' + esc(label) + '"></label>';
  }
  function row(label, val) { return '<li><span>' + label + '</span><b>' + (val ? esc(val) : '—') + '</b></li>'; }

  function sectionOrders() {
    const orders = read(ORDERS_KEY, []).slice(0, MAX_ORDERS);
    let inner;
    if (!orders.length) {
      inner = '<p class="acc-empty">Você ainda não fez nenhuma compra. Suas próximas aparecem aqui. 💜</p>';
    } else {
      inner = orders.map((o) => {
        const d = o.date ? new Date(o.date) : null;
        const ds = d ? d.toLocaleDateString('pt-BR') : '';
        const n = o.count || 0;
        const btn = (o.items && o.items.length)
          ? '<button class="acc-rebuy" data-rebuy="' + esc(o.id) + '">' +
              '<svg viewBox="0 0 24 24"><path d="M3 2v6h6"/><path d="M3.5 9a9 9 0 1 0 2.2-3.6"/></svg> Comprar novamente</button>'
          : '';
        return '<div class="acc-order"><div class="acc-order-top"><b>Pedido ' + esc(o.id) + '</b><span>' + ds + '</span></div>' +
          '<div class="acc-order-sub">' + n + ' ' + (n === 1 ? 'item' : 'itens') + ' · <b>' + esc(o.total || '') + '</b></div>' +
          btn + '</div>';
      }).join('');
    }
    return '<section class="acc-sec"><div class="acc-sec-head"><h3>Últimas compras</h3></div>' + inner + '</section>';
  }

  function sectionList(title, list, clearable) {
    const head = '<div class="acc-sec-head"><h3>' + title + '</h3>' +
      (clearable && list.length ? '<button class="acc-clear" data-act="clearViews">limpar</button>' : '') + '</div>';
    let inner;
    if (!list.length) {
      inner = '<p class="acc-empty">' + (clearable ? 'Os produtos que você abrir aparecem aqui.' : 'Toque no coração dos produtos para salvá-los aqui.') + '</p>';
    } else {
      inner = '<div class="acc-prods">' + list.map(prodRow).join('') + '</div>';
    }
    return '<section class="acc-sec">' + head + inner + '</section>';
  }
  function prodRow(p) {
    return '<a class="acc-prod" href="catalogo.html?q=' + encodeURIComponent(p.name) + '">' +
      '<span class="acc-prod-thumb"><img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"></span>' +
      '<span class="acc-prod-info"><span class="acc-prod-name">' + esc(p.name) + '</span>' +
      (p.brand ? '<span class="acc-prod-meta">' + esc(p.brand) + '</span>' : '') + '</span>' +
      (p.price ? '<span class="acc-prod-price">' + esc(p.price) + '</span>' : '') + '</a>';
  }

  function open()  { build(); ui.editing = false; render(); overlay.classList.add('is-on'); drawer.classList.add('is-open'); }
  function close() { if (drawer) { overlay.classList.remove('is-on'); drawer.classList.remove('is-open'); } }

  /* ──────────────── rastreio automático ──────────────── */
  // vistos: clique em qualquer card de produto
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.pcard, .deck-card');
    if (!card || e.target.closest('.pcard-fav, .dc-fav, .pcard-add')) return;
    const p = readCard(card);
    if (p) pushUnique(VIEWS_KEY, p, MAX_VIEWS);
  }, true);

  // favoritos: lê o estado final do coração após o toggle existente
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pcard-fav, .dc-fav');
    if (!btn) return;
    const card = btn.closest('.pcard, .deck-card');
    const p = card ? readCard(card) : null;
    if (!p) return;
    setTimeout(() => {
      const liked = btn.classList.contains('is-fav') || btn.classList.contains('is-liked');
      if (liked) pushUnique(LIKES_KEY, p, MAX_LIKES);
      else write(LIKES_KEY, read(LIKES_KEY, []).filter((x) => x.name !== p.name));
      if (drawer && drawer.classList.contains('is-open')) render();
    }, 0);
  }, true);

  /* reflete os favoritos salvos nos corações ao carregar a página */
  function applyLikes() {
    const names = read(LIKES_KEY, []).map((x) => x.name);
    document.querySelectorAll('.pcard').forEach((card) => {
      const el = card.querySelector('.pcard-name');
      const b = card.querySelector('.pcard-fav');
      if (el && b && names.includes(el.textContent.trim())) b.classList.add('is-fav');
    });
    document.querySelectorAll('.deck-card').forEach((card) => {
      const el = card.querySelector('.dc-name');
      const b = card.querySelector('.dc-fav');
      if (el && b && names.includes(el.textContent.trim())) b.classList.add('is-liked');
    });
  }

  /* recompra: devolve os itens do pedido à sacola e abre o carrinho */
  function buyAgain(id) {
    const order = read(ORDERS_KEY, []).find((o) => String(o.id) === String(id));
    if (!order || !order.items || !order.items.length) return;
    if (!window.AmoCart) { alert('Carrinho indisponível nesta página.'); return; }
    order.items.forEach((it) => {
      const qty = Math.max(1, it.qty || 1);
      for (let k = 0; k < qty; k++) {
        window.AmoCart.add({ id: it.id, name: it.name, brand: it.brand, price: it.price, old: it.old, img: it.img });
      }
    });
    close();
    window.AmoCart.open();
  }

  /* ──────────────── API pública ──────────────── */
  window.AmoUser = {
    open: open,
    close: close,
    applyLikes: applyLikes,
    trackView: (p) => { if (p && p.name) pushUnique(VIEWS_KEY, p, MAX_VIEWS); },
    recordOrder: (o) => {
      o = o || {};
      const order = {
        id: o.id || ('#' + Date.now().toString().slice(-6)),
        date: o.date || new Date().toISOString(),
        total: o.total || '',
        count: o.count || 0,
        items: Array.isArray(o.items) ? o.items : []
      };
      write(ORDERS_KEY, [order].concat(read(ORDERS_KEY, [])).slice(0, 20));
    }
  };

  function init() {
    const trigger = $('#navAccountTrigger');
    if (trigger) trigger.addEventListener('click', (e) => { e.preventDefault(); open(); });
    applyLikes();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();