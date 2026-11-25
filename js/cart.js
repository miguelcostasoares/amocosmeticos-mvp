/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — CARRINHO / SACOLA
   Módulo independente. Funciona em qualquer página
   (index, catálogo...). Guarda o estado no
   localStorage e injeta o próprio drawer na página.

   COMO USAR NOS BOTÕES:
   - Qualquer <button class="pcard-add"> dentro de um
     .pcard é ligado automaticamente (lê nome, marca,
     preço e imagem do próprio card).
   - Para ligar outros botões manualmente, adicione:
       data-cart-add
       data-id / data-name / data-brand / data-price
       data-old (opcional) / data-img
   - Para abrir a sacola: data-cart-open (ou a própria
     .nav-bag / .nav-cta já são ligadas).

   AJUSTES RÁPIDOS: veja o bloco CONFIG abaixo.
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────── CONFIG ──────────────── */
  const CONFIG = {
    storeName: 'Amo Cosméticos',
    freeShippingFrom: 149,          // frete grátis (PAC) a partir de R$
    pixDiscount: 0.05,              // 5% no Pix
    maxInstallments: 12,            // parcelas no cartão
    minInstallment: 20,            // valor mínimo da parcela (R$)
    whatsapp: '5599999999999',      // ►► TROQUE pelo número real (DDI+DDD+numero)
    // Cupons de exemplo — troque/expanda à vontade:
    coupons: {
      AMO10:       { type: 'percent', value: 10, label: '10% de desconto' },
      BEMVINDA:    { type: 'fixed',   value: 15, label: 'R$15 de desconto', min: 80 },
      FRETEGRATIS: { type: 'ship',    value: 0,  label: 'Frete grátis' }
    }
  };

  const STORAGE_KEY = 'amo_cart_v1';
  const BRL = (n) => 'R$' + (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ──────────────── ESTADO ──────────────── */
  let state = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        items: Array.isArray(raw && raw.items) ? raw.items : [],
        coupon: (raw && raw.coupon) || null,
        cep: (raw && raw.cep) || '',
        shipping: (raw && raw.shipping) || null,   // opção escolhida
        payment: (raw && raw.payment) || 'pix'
      };
    } catch (e) {
      return { items: [], coupon: null, cep: '', shipping: null, payment: 'pix' };
    }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  /* ──────────────── CÁLCULOS ──────────────── */
  const parsePrice = (txt) => {
    if (typeof txt === 'number') return txt;
    if (!txt) return 0;
    const n = parseFloat(String(txt).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };
  const count = () => state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal = () => state.items.reduce((s, i) => s + i.price * i.qty, 0);

  function discount() {
    const c = state.coupon && CONFIG.coupons[state.coupon];
    if (!c) return 0;
    const sub = subtotal();
    if (c.min && sub < c.min) return 0;
    if (c.type === 'percent') return sub * (c.value / 100);
    if (c.type === 'fixed')   return Math.min(c.value, sub);
    return 0;
  }
  function shippingCost() {
    if (!state.shipping) return 0;
    // cupom "frete grátis" ou meta de frete grátis zeram o PAC
    const couponFree = state.coupon && CONFIG.coupons[state.coupon] && CONFIG.coupons[state.coupon].type === 'ship';
    if (couponFree) return 0;
    if (state.shipping.free) return 0;
    return state.shipping.price;
  }
  function total() {
    return Math.max(0, subtotal() - discount()) + shippingCost();
  }
  function pixTotal() { return total() * (1 - CONFIG.pixDiscount); }

  /* ──────────────── FRETE (SIMULAÇÃO) ────────────────
     MVP sem backend: estimativa client-side por região
     do CEP + peso. Troque initFreightQuote() por uma
     chamada real à API dos Correios / Melhor Envio.
     ───────────────────────────────────────────────── */
  function quoteFreight(cep) {
    const clean = String(cep).replace(/\D/g, '');
    if (clean.length !== 8) return null;

    // fator por região (1º dígito do CEP) — distância relativa a partir de SP
    const region = parseInt(clean[0], 10);
    const factorByRegion = [1.0, 1.0, 1.15, 1.25, 1.35, 1.45, 1.55, 1.6, 1.7, 1.3];
    const daysByRegion   = [2, 2, 3, 4, 5, 6, 7, 7, 8, 5];
    const f = factorByRegion[region] || 1.4;
    const baseDays = daysByRegion[region] || 6;

    const weight = Math.max(0.3, count() * 0.3);   // ~300g por item
    const sub = subtotal();

    const pacPrice = (11.9 + weight * 3.8) * f;
    const sedexPrice = (19.9 + weight * 6.2) * f;
    const freePac = sub >= CONFIG.freeShippingFrom;

    return [
      {
        id: 'pac',
        name: 'PAC — Correios',
        eta: `${baseDays + 2} a ${baseDays + 4} dias úteis`,
        price: Math.round(pacPrice * 100) / 100,
        free: freePac
      },
      {
        id: 'sedex',
        name: 'SEDEX — Correios',
        eta: `${baseDays} a ${baseDays + 1} dias úteis`,
        price: Math.round(sedexPrice * 100) / 100,
        free: false
      }
    ];
  }

  /* ──────────────── AÇÕES ──────────────── */
  function addItem(prod, fromEl) {
    const id = prod.id || slug(prod.name);
    const found = state.items.find((i) => i.id === id);
    if (found) found.qty += 1;
    else state.items.push({
      id, name: prod.name, brand: prod.brand || '',
      price: parsePrice(prod.price), old: parsePrice(prod.old) || 0,
      img: prod.img || '', qty: 1
    });
    save();
    render();
    bumpBag();
    if (fromEl && !prefersReduced) flyToBag(fromEl);
    toast(prod.name);
  }
  function setQty(id, qty) {
    const it = state.items.find((i) => i.id === id);
    if (!it) return;
    it.qty = qty;
    if (it.qty <= 0) return removeItem(id);
    save(); render(); bumpBag();
  }
  function removeItem(id) {
    const row = $(`.cart-item[data-id="${cssEsc(id)}"]`);
    if (row && !prefersReduced) {
      row.classList.add('is-leaving');
      setTimeout(() => commitRemove(id), 300);
    } else commitRemove(id);
  }
  function commitRemove(id) {
    state.items = state.items.filter((i) => i.id !== id);
    if (!state.items.length) { state.shipping = null; }
    save(); render(); bumpBag();
  }
  function applyCoupon(code) {
    const key = String(code).trim().toUpperCase();
    const c = CONFIG.coupons[key];
    const hint = $('#cartCouponHint');
    if (!c) { setHint(hint, 'Cupom inválido ou expirado.', 'error'); return; }
    if (c.min && subtotal() < c.min) {
      setHint(hint, `Válido em compras acima de ${BRL(c.min)}.`, 'error'); return;
    }
    state.coupon = key; save(); render();
  }
  function removeCoupon() { state.coupon = null; save(); render(); }

  function chooseShipping(opt) { state.shipping = opt; save(); render(); }
  function choosePayment(p) { state.payment = p; save(); render(); }

  /* ──────────────── CHECKOUT ──────────────── */
  function checkout() {
    if (!state.items.length) return;
    const lines = state.items.map((i) => `• ${i.qty}x ${i.name} — ${BRL(i.price * i.qty)}`);
    const payLabel = { pix: 'Pix', card: 'Cartão de crédito', boleto: 'Boleto' }[state.payment];
    let msg = `Olá, ${CONFIG.storeName}! 💜%0AQuero finalizar meu pedido:%0A%0A`;
    msg += lines.join('%0A');
    msg += `%0A%0ASubtotal: ${BRL(subtotal())}`;
    if (discount() > 0) msg += `%0ADesconto (${state.coupon}): -${BRL(discount())}`;
    if (state.shipping) msg += `%0AFrete (${state.shipping.name}): ${shippingCost() === 0 ? 'Grátis' : BRL(shippingCost())}`;
    if (state.cep) msg += `%0ACEP: ${state.cep}`;
    msg += `%0APagamento: ${payLabel}`;
    if (state.payment === 'pix') msg += `%0ATotal no Pix: ${BRL(pixTotal())}`;
    else msg += `%0ATotal: ${BRL(total())}`;
    
        // registra o pedido em "Minha conta"
    if (window.AmoUser) {
      const totalPago = state.payment === 'pix' ? pixTotal() : total();
      window.AmoUser.recordOrder({
        total: BRL(totalPago),
        count: count(),
        items: state.items.map((i) => ({
          id: i.id, name: i.name, brand: i.brand,
          price: i.price, old: i.old, img: i.img, qty: i.qty
        }))
      });
    }
    
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${msg}`, '_blank');
  }

  /* ──────────────── RENDER ──────────────── */
  function render() {
    const cart = $('#amoCart');
    if (!cart) return;

    const n = count();
    cart.classList.toggle('is-empty', n === 0);

    // contador do cabeçalho do drawer
    const hc = $('#cartHeadCount'); if (hc) hc.textContent = n + (n === 1 ? ' item' : ' itens');

    // lista de itens
    const list = $('#cartItems');
    if (list) {
      list.innerHTML = state.items.map((i) => `
        <div class="cart-item" data-id="${escAttr(i.id)}">
          <div class="cart-item-media"><img src="${escAttr(i.img)}" alt="${escAttr(i.name)}"></div>
          <div class="cart-item-info">
            ${i.brand ? `<span class="cart-item-brand">${escHtml(i.brand)}</span>` : ''}
            <span class="cart-item-name">${escHtml(i.name)}</span>
            <span class="cart-item-price">${BRL(i.price)}${i.old && i.old > i.price ? `<s>${BRL(i.old)}</s>` : ''}</span>
          </div>
          <div class="cart-item-right">
            <button class="cart-item-remove" data-remove="${escAttr(i.id)}" aria-label="Remover ${escAttr(i.name)}">
              <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <div class="cart-qty">
              <button data-dec="${escAttr(i.id)}" aria-label="Diminuir">−</button>
              <span>${i.qty}</span>
              <button data-inc="${escAttr(i.id)}" aria-label="Aumentar">+</button>
            </div>
          </div>
        </div>`).join('');
    }

    // barra de frete grátis
    const sub = subtotal();
    const remaining = Math.max(0, CONFIG.freeShippingFrom - sub);
    const fbText = $('#cartFreebarText');
    const fbFill = $('#cartFreebarFill');
    if (fbText && fbFill) {
      if (remaining > 0) fbText.innerHTML = `Faltam <b>${BRL(remaining)}</b> para o frete grátis 🚚`;
      else fbText.innerHTML = `🎉 Você ganhou <b>frete grátis</b> no PAC!`;
      fbFill.style.width = Math.min(100, (sub / CONFIG.freeShippingFrom) * 100) + '%';
    }

    // frete: opções
    renderShipping();

    // cupom
    const tag = $('#cartCouponTag');
    if (tag) {
      const c = state.coupon && CONFIG.coupons[state.coupon];
      tag.classList.toggle('is-on', !!c);
      if (c) {
        $('#cartCouponCode').textContent = state.coupon;
        $('#cartCouponLabel').textContent = c.label;
      }
    }

    // pagamento (seleção + parcelas)
    $$('.cart-pay-opt').forEach((o) => o.classList.toggle('is-selected', o.dataset.pay === state.payment));
    const r = $(`.cart-pay-opt input[value="${state.payment}"]`); if (r) r.checked = true;
    const inst = $('#cartInstallments');
    if (inst) {
      const t = total();
      const maxP = Math.max(1, Math.min(CONFIG.maxInstallments, Math.floor(t / CONFIG.minInstallment) || 1));
      inst.textContent = t > 0 ? `em até ${maxP}x de ${BRL(t / maxP)} sem juros` : 'parcele em até 12x';
    }
    const pixNote = $('#cartPixNote');
    if (pixNote) pixNote.innerHTML = `<b>-${(CONFIG.pixDiscount * 100).toFixed(0)}%</b> à vista`;

    // resumo
    setText('#cartSubtotal', BRL(sub));
    const dRow = $('#cartDiscountRow');
    if (dRow) {
      const d = discount();
      dRow.style.display = d > 0 ? 'flex' : 'none';
      setText('#cartDiscount', '-' + BRL(d));
    }
    const shRow = $('#cartShippingRow');
    if (shRow) {
      shRow.style.display = state.shipping ? 'flex' : 'none';
      setText('#cartShipping', shippingCost() === 0 ? 'Grátis' : BRL(shippingCost()));
    }
    setText('#cartTotal', BRL(total()));
    const pixLine = $('#cartPixLine');
    if (pixLine) {
      pixLine.style.display = state.payment === 'pix' && total() > 0 ? 'block' : 'none';
      pixLine.textContent = `ou ${BRL(pixTotal())} no Pix`;
    }

    // navbar: contador + trava
    syncBag(n);
    save();
  }

  function renderShipping() {
    const box = $('#cartShipOptions');
    if (!box) return;
    const opts = state.cep ? quoteFreight(state.cep) : null;
    if (!opts) { box.innerHTML = ''; return; }
    // revalida a opção escolhida com os preços atuais
    if (state.shipping) {
      const match = opts.find((o) => o.id === state.shipping.id);
      state.shipping = match || null;
    }
    box.innerHTML = opts.map((o) => `
      <label class="cart-ship-opt ${state.shipping && state.shipping.id === o.id ? 'is-selected' : ''}">
        <input type="radio" name="amoShip" value="${o.id}" ${state.shipping && state.shipping.id === o.id ? 'checked' : ''}>
        <span class="cart-ship-opt-info">
          <span class="cart-ship-opt-name">${o.name}</span>
          <span class="cart-ship-opt-eta">${o.eta}</span>
        </span>
        <span class="cart-ship-opt-price ${o.free ? 'is-free' : ''}">${o.free ? 'Grátis' : BRL(o.price)}</span>
      </label>`).join('');
    box.dataset.opts = JSON.stringify(opts);
  }

  /* ──────────────── NAVBAR (contador + trava + anim) ──────────────── */
  function syncBag(n) {
    const badge = $('.nav-bag-count');
    const bag = $('.nav-bag');
    if (badge) {
      badge.textContent = n;
      badge.classList.toggle('is-zero', n === 0);
    }
    // TRAVA: body.cart-has-items faz a navbar não sumir ao rolar
    document.body.classList.toggle('cart-has-items', n > 0);
    if (bag) bag.setAttribute('aria-label', n > 0 ? `Sacola — ${n} ${n === 1 ? 'item' : 'itens'}` : 'Sacola');
  }
  function bumpBag() {
    const badge = $('.nav-bag-count');
    const bag = $('.nav-bag');
    if (!badge || prefersReduced) return;
    badge.classList.remove('is-bump'); void badge.offsetWidth; badge.classList.add('is-bump');
    if (bag) { bag.classList.remove('is-bump'); void bag.offsetWidth; bag.classList.add('is-bump'); }
    setTimeout(() => { badge.classList.remove('is-bump'); if (bag) bag.classList.remove('is-bump'); }, 500);
  }

  /* "voo" da imagem do produto até a sacola */
  function flyToBag(fromEl) {
    const bag = $('.nav-bag');
    const img = fromEl.closest('.pcard, .cat-prod, article, .fav')?.querySelector('img');
    if (!bag || !img) return;
    const s = img.getBoundingClientRect();
    const t = bag.getBoundingClientRect();
    const fly = img.cloneNode();
    fly.className = 'cart-fly';
    fly.style.left = s.left + 'px'; fly.style.top = s.top + 'px';
    fly.style.width = s.width + 'px'; fly.style.height = s.height + 'px';
    document.body.appendChild(fly);
    requestAnimationFrame(() => {
      fly.style.transform = `translate(${t.left - s.left + 10}px, ${t.top - s.top + 6}px) scale(0.12)`;
      fly.style.opacity = '0.2';
      fly.style.width = s.width + 'px'; fly.style.height = s.height + 'px';
    });
    setTimeout(() => fly.remove(), 800);
  }

  /* ──────────────── TOAST ──────────────── */
  let toastTimer = null;
  function toast(name) {
    const t = $('#cartToast');
    if (!t) return;
    $('#cartToastName').textContent = name;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
  }

  /* ──────────────── ABRIR / FECHAR ──────────────── */
  function open() {
    $('#amoCart').classList.add('is-open');
    $('#amoCartOverlay').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    $('#amoCart').classList.remove('is-open');
    $('#amoCartOverlay').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ──────────────── DOM DO DRAWER ──────────────── */
  function buildDOM() {
    if ($('#amoCart')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="cart-overlay" id="amoCartOverlay"></div>
      <aside class="cart cart-drawer" id="amoCart" role="dialog" aria-modal="true" aria-label="Sacola de compras">
        <header class="cart-head">
          <div class="cart-head-title">
            <svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Sua sacola
            <span class="cart-head-count" id="cartHeadCount">0 itens</span>
          </div>
          <button class="cart-close" id="cartClose" aria-label="Fechar sacola">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </header>

        <div class="cart-freebar">
          <p class="cart-freebar-text" id="cartFreebarText"></p>
          <div class="cart-freebar-track"><span class="cart-freebar-fill" id="cartFreebarFill"></span></div>
        </div>

        <div class="cart-body">
          <!-- vazio -->
          <div class="cart-empty">
            <svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <h3>Sua sacola está vazia</h3>
            <p>Que tal dar uma olhada nos nossos queridinhos? Tem beleza esperando por você 💜</p>
            <button class="cart-empty-btn" id="cartEmptyBtn">Ver produtos</button>
          </div>

          <!-- itens -->
          <div id="cartItems"></div>

          <!-- FRETE -->
          <div class="cart-block">
            <div class="cart-block-title">
              <svg viewBox="0 0 24 24"><path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/></svg>
              Calcular frete e prazo
            </div>
            <div class="cart-inline">
              <input type="text" id="cartCep" inputmode="numeric" maxlength="9" placeholder="Seu CEP (ex: 01001-000)" autocomplete="postal-code">
              <button id="cartCepBtn" type="button">Calcular</button>
            </div>
            <p class="cart-hint" id="cartCepHint">Não sabe seu CEP? <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener">Consultar</a></p>
            <div class="cart-ship-options" id="cartShipOptions"></div>
          </div>

          <!-- CUPOM -->
          <div class="cart-block">
            <div class="cart-block-title">
              <svg viewBox="0 0 24 24"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.6" cy="7.6" r="1.2"/></svg>
              Cupom de desconto
            </div>
            <div class="cart-inline">
              <input type="text" id="cartCoupon" placeholder="Digite seu cupom" autocomplete="off" style="text-transform:uppercase">
              <button id="cartCouponBtn" type="button">Aplicar</button>
            </div>
            <p class="cart-hint" id="cartCouponHint">Experimente: <strong>AMO10</strong></p>
            <div class="cart-coupon-tag" id="cartCouponTag">
              <span><b id="cartCouponCode">—</b> · <span id="cartCouponLabel"></span></span>
              <button class="cart-coupon-remove" id="cartCouponRemove" type="button">remover</button>
            </div>
          </div>

          <!-- PAGAMENTO -->
          <div class="cart-block">
            <div class="cart-block-title">
              <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              Forma de pagamento
            </div>
            <div class="cart-pay">
              <label class="cart-pay-opt" data-pay="pix">
                <input type="radio" name="amoPay" value="pix">
                <span class="cart-pay-ico">Pix</span>
                <span class="cart-pay-opt-info">
                  <span class="cart-pay-opt-name">Pix</span>
                  <span class="cart-pay-opt-note" id="cartPixNote"></span>
                </span>
              </label>
              <label class="cart-pay-opt" data-pay="card">
                <input type="radio" name="amoPay" value="card">
                <span class="cart-pay-ico"><svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg></span>
                <span class="cart-pay-opt-info">
                  <span class="cart-pay-opt-name">Cartão de crédito</span>
                  <span class="cart-pay-opt-note" id="cartInstallments">parcele em até 12x</span>
                </span>
              </label>
              <label class="cart-pay-opt" data-pay="boleto">
                <input type="radio" name="amoPay" value="boleto">
                <span class="cart-pay-ico"><svg viewBox="0 0 24 24"><path d="M4 5v14M8 5v14M11 5v14M14 5v14M17 5v14M20 5v14"/></svg></span>
                <span class="cart-pay-opt-info">
                  <span class="cart-pay-opt-name">Boleto bancário</span>
                  <span class="cart-pay-opt-note">compensa em até 2 dias úteis</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- RODAPÉ -->
        <footer class="cart-foot">
          <div class="cart-summary">
            <div class="cart-summary-row"><span>Subtotal</span><span id="cartSubtotal">R$0,00</span></div>
            <div class="cart-summary-row is-discount" id="cartDiscountRow" style="display:none"><span>Desconto</span><span id="cartDiscount">-R$0,00</span></div>
            <div class="cart-summary-row" id="cartShippingRow" style="display:none"><span>Frete</span><span id="cartShipping">—</span></div>
            <div class="cart-summary-row is-total"><span>Total</span><b id="cartTotal">R$0,00</b></div>
          </div>
          <p class="cart-summary-pix" id="cartPixLine" style="display:none"></p>
          <button class="cart-checkout" id="cartCheckout" type="button">
            Finalizar compra
            <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </button>
          <div class="cart-foot-safe">
            <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
            Ambiente 100% seguro · Pix, cartão e boleto
          </div>
        </footer>
      </aside>

      <!-- TOAST -->
      <div class="cart-toast" id="cartToast" role="status" aria-live="polite">
        <span class="cart-toast-ico"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></span>
        <span class="cart-toast-text"><b id="cartToastName">Produto</b> adicionado à sacola</span>
        <button class="cart-toast-link" id="cartToastOpen">Ver sacola</button>
      </div>`;
    document.body.appendChild(wrap);
  }

  /* ──────────────── EVENTOS ──────────────── */
  function bindEvents() {
    // abrir pela sacola / CTA "Comprar" da navbar / qualquer [data-cart-open]
    $$('.nav-bag, .nav-cta, [data-cart-open]').forEach((b) =>
      b.addEventListener('click', (e) => { e.preventDefault(); open(); }));

    $('#amoCartOverlay').addEventListener('click', close);
    $('#cartClose').addEventListener('click', close);
    $('#cartEmptyBtn').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // delegação dentro do drawer (itens, cupom etc.)
    $('#amoCart').addEventListener('click', (e) => {
      const inc = e.target.closest('[data-inc]');
      const dec = e.target.closest('[data-dec]');
      const rm  = e.target.closest('[data-remove]');
      if (inc) { const it = state.items.find((i) => i.id === inc.dataset.inc); if (it) setQty(it.id, it.qty + 1); }
      if (dec) { const it = state.items.find((i) => i.id === dec.dataset.dec); if (it) setQty(it.id, it.qty - 1); }
      if (rm)  removeItem(rm.dataset.remove);
    });

    // frete
    const cep = $('#cartCep');
    cep.addEventListener('input', () => {
      let v = cep.value.replace(/\D/g, '').slice(0, 8);
      if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
      cep.value = v;
    });
    $('#cartCepBtn').addEventListener('click', () => {
      const clean = cep.value.replace(/\D/g, '');
      const hint = $('#cartCepHint');
      if (clean.length !== 8) { setHint(hint, 'Digite um CEP válido com 8 dígitos.', 'error'); return; }
      state.cep = cep.value;
      // seleciona a opção mais barata por padrão
      const opts = quoteFreight(state.cep);
      state.shipping = opts ? opts.reduce((a, b) => (shipPriceVal(a) <= shipPriceVal(b) ? a : b)) : null;
      setHint(hint, 'Fretes calculados para o seu CEP ✓', 'ok');
      save(); render();
    });
    cep.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#cartCepBtn').click(); });

    // escolher frete
    $('#cartShipOptions').addEventListener('change', (e) => {
      const r = e.target.closest('input[name="amoShip"]');
      if (!r) return;
      const opts = JSON.parse($('#cartShipOptions').dataset.opts || '[]');
      const opt = opts.find((o) => o.id === r.value);
      if (opt) chooseShipping(opt);
    });

    // cupom
    const coupon = $('#cartCoupon');
    $('#cartCouponBtn').addEventListener('click', () => coupon.value.trim() && applyCoupon(coupon.value));
    coupon.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#cartCouponBtn').click(); });
    $('#cartCouponRemove').addEventListener('click', removeCoupon);

    // pagamento
    $$('.cart-pay-opt').forEach((o) => o.addEventListener('click', () => choosePayment(o.dataset.pay)));

    // checkout
    $('#cartCheckout').addEventListener('click', checkout);

    // toast
    $('#cartToastOpen').addEventListener('click', () => { $('#cartToast').classList.remove('is-on'); open(); });

    // preenche CEP salvo
    if (state.cep) cep.value = state.cep;

    wireAddButtons();
  }

  /* liga TODOS os botões de "adicionar à sacola" da página */
  function wireAddButtons() {
    // 1) botões .pcard-add dentro de um .pcard (home + afins)
    $$('.pcard-add').forEach((btn) => {
      if (btn.dataset.cartBound) return;
      btn.dataset.cartBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const card = btn.closest('.pcard');
        if (!card) return;
        addItem({
          name:  text('.pcard-name', card),
          brand: text('.pcard-brand', card),
          price: text('.pcard-price .now', card),
          old:   text('.pcard-price .old', card),
          img:   attr('img', 'src', card)
        }, btn);
      });
    });

    // 2) botão "Comprar agora" dos Queridinhos (.fav-cta)
    $$('.fav-cta').forEach((btn) => {
      if (btn.dataset.cartBound) return;
      btn.dataset.cartBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const root = document;
        addItem({
          name:  text('#favName', root),
          brand: text('#favBrand', root),
          price: text('#favNow', root),
          old:   text('#favOld', root),
          img:   attr('#favImg', 'src', root)
        }, btn);
      });
    });

    // 3) botões manuais [data-cart-add]
    $$('[data-cart-add]').forEach((btn) => {
      if (btn.dataset.cartBound) return;
      btn.dataset.cartBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        addItem({
          id: btn.dataset.id, name: btn.dataset.name, brand: btn.dataset.brand,
          price: btn.dataset.price, old: btn.dataset.old, img: btn.dataset.img
        }, btn);
      });
    });
  }

  /* ──────────────── HELPERS ──────────────── */
  function slug(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
  function text(sel, ctx) { const el = $(sel, ctx); return el ? el.textContent.trim() : ''; }
  function attr(sel, a, ctx) { const el = $(sel, ctx); return el ? el.getAttribute(a) : ''; }
  function setText(sel, v) { const el = $(sel); if (el) el.textContent = v; }
  function setHint(el, msg, kind) { if (!el) return; el.textContent = msg; el.classList.toggle('is-error', kind === 'error'); el.classList.toggle('is-ok', kind === 'ok'); }
  function shipPriceVal(o) { return o.free ? 0 : o.price; }
  function escHtml(s) { return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function escAttr(s) { return escHtml(s); }
  function cssEsc(s) { return String(s).replace(/"/g, '\\"'); }

  /* ──────────────── API PÚBLICA ──────────────── */
  window.AmoCart = {
    add: addItem, open, close, count, wire: wireAddButtons, state: () => state
  };

  /* ──────────────── BOOT ──────────────── */
  function init() {
    buildDOM();
    bindEvents();
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();