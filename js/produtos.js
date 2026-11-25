/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — BASE ÚNICA DE PRODUTOS
   Este arquivo é a fonte de tudo que mostra produto:
   landing (vitrines), catálogo, página de produto e busca.

   ►► EDITE OS PRODUTOS SÓ AQUI, no array PRODUCTS. ◄◄

   Campos de cada produto:
     id        identificador único (vira o endereço: produto.html?id=...)
     name      nome           brand   marca
     cat       Shampoos | Condicionadores | Óleos | Perfumes | Máscaras | Kits
     price     preço atual    old     preço antigo (0 = sem oferta)
     img       foto principal imgs    [opcional] fotos extras da galeria
     desc      frase curta do card
     about     descrição completa (página do produto)
     benefits  lista de benefícios
     howTo     modo de uso    size    conteúdo (ex: 300 ml)
     rating    nota (0–5)     pop     popularidade (ordena "Mais vendidos")
     stock     estoque (0 = esgotado, bloqueia a compra)
     variants  [opcional] { label: 'Tamanho', options: [{ name, price, old, stock }] }

   Deve ser carregado ANTES de cart.js, search.js e catalogo.js.
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  const PRODUCTS = [
    {
      id: 'kit-newhair', name: 'Kit Completo New Hair', brand: 'New Hair', cat: 'Kits',
      price: 129.90, old: 189.90, img: 'assets/produtos/kit-newhair.jpeg',
      imgs: ['assets/modelos/modelo-produtos-02.jpeg'],
      desc: 'O ritual completo: shampoo, máscara e óleo em um só kit.',
      about: 'O ritual completo para fios macios, brilhantes e perfumados. Shampoo, máscara nutritiva e óleo finalizador trabalham juntos do banho ao finalizar — e saem mais em conta do que comprar cada um separado.',
      benefits: ['Rotina completa em um só kit', 'Brilho, maciez e perfume que duram', 'Mais econômico que comprar separado'],
      howTo: 'Lave com o shampoo, aplique a máscara mecha a mecha e deixe agir de 3 a 5 minutos. Enxágue e finalize com 2 a 3 gotas do óleo nas pontas.',
      size: 'Shampoo 300 ml · Máscara 300 g · Óleo 60 ml', rating: 4.9, pop: 98, stock: 14
    },
    {
      id: 'perfume-encanto', name: 'Perfume Capilar Encanto', brand: 'New Hair', cat: 'Perfumes',
      price: 39.90, old: 0, img: 'assets/produtos/perfume-capilar.jpeg',
      desc: 'Cheirinho irresistível que perfuma e fixa por horas.',
      about: 'Um cheirinho irresistível que perfuma os fios e fixa por horas, sem pesar e sem deixar oleosidade. Cabe na bolsa para retocar ao longo do dia.',
      benefits: ['Fragrância marcante e delicada', 'Toque leve, sem pesar nos fios', 'Perfeito para retocar durante o dia'],
      howTo: 'Borrife a cerca de 20 cm dos cabelos secos ou úmidos, das mechas às pontas.',
      size: '120 ml', rating: 4.9, pop: 95, stock: 22,
      variants: { label: 'Tamanho', options: [
        { name: '60 ml', price: 24.90, old: 0, stock: 10 },
        { name: '120 ml', price: 39.90, old: 0, stock: 22 }
      ] }
    },
    {
      id: 'oleo-noturno', name: 'Óleo Reparador Noturno', brand: 'New Hair', cat: 'Óleos',
      price: 44.90, old: 54.90, img: 'assets/produtos/oleos-newhair.jpeg',
      desc: 'Nutre enquanto você dorme e controla o frizz.',
      about: 'Tratamento noturno que nutre enquanto você dorme, controla o frizz e devolve o brilho natural dos fios. Textura leve, de rápida absorção.',
      benefits: ['Nutrição intensa durante a noite', 'Controle de frizz e pontas ressecadas', 'Textura leve, não mancha o travesseiro'],
      howTo: 'À noite, espalhe 3 a 4 gotas nas palmas e aplique do meio às pontas. Pela manhã, finalize normalmente.',
      size: '60 ml', rating: 5.0, pop: 90, stock: 4
    },
    {
      id: 'shampoo-hidra', name: 'Shampoo Hidratação Intensa', brand: 'Belkit', cat: 'Shampoos',
      price: 32.90, old: 0, img: 'assets/produtos/shampoo-belkit.jpeg',
      desc: 'Limpa com suavidade e repõe a hidratação a cada lavagem.',
      about: 'Limpa com suavidade e repõe a hidratação a cada lavagem, deixando os fios leves e fáceis de pentear. Ideal para o uso diário.',
      benefits: ['Limpeza suave, sem agredir', 'Hidratação a cada lavagem', 'Indicado para uso diário'],
      howTo: 'Aplique no couro cabeludo molhado, massageie até formar espuma e enxágue. Repita se necessário.',
      size: '300 ml', rating: 4.8, pop: 88, stock: 30,
      variants: { label: 'Tamanho', options: [
        { name: '300 ml', price: 32.90, old: 0, stock: 30 },
        { name: '1 litro', price: 69.90, old: 79.90, stock: 6 }
      ] }
    },
    {
      id: 'oleo-finalizador', name: 'Óleo Finalizador Brilho', brand: 'New Hair', cat: 'Óleos',
      price: 36.90, old: 42.90, img: 'assets/produtos/oleos-newhair.jpeg',
      desc: 'Toque final de brilho sem pesar nos fios.',
      about: 'O toque final de brilho para qualquer penteado. Sela as pontas e protege do calor do secador sem deixar os fios pesados.',
      benefits: ['Brilho imediato', 'Sela as pontas', 'Protege do calor do secador'],
      howTo: 'Aplique 2 gotas nas pontas, com o cabelo úmido ou seco.',
      size: '60 ml', rating: 4.7, pop: 74, stock: 18
    },
    {
      id: 'perfume-doce', name: 'Perfume Capilar Doce Flor', brand: 'New Hair', cat: 'Perfumes',
      price: 42.90, old: 0, img: 'assets/produtos/perfume-capilar.jpeg',
      desc: 'Fragrância floral e delicada para o dia a dia.',
      about: 'Fragrância floral e delicada para usar todos os dias. Perfuma sem pesar e deixa um rastro suave por onde você passa.',
      benefits: ['Notas florais suaves', 'Não deixa oleosidade', 'Ótimo para o dia a dia'],
      howTo: 'Borrife a cerca de 20 cm dos cabelos, das mechas às pontas.',
      size: '120 ml', rating: 4.8, pop: 70, stock: 12
    },
    {
      id: 'shampoo-fortalece', name: 'Shampoo Fortalecedor', brand: 'Belkit', cat: 'Shampoos',
      price: 34.90, old: 39.90, img: 'assets/produtos/shampoo-belkit.jpeg',
      desc: 'Reduz a quebra e deixa os fios mais resistentes.',
      about: 'Fórmula fortalecedora que reduz a quebra e deixa os fios mais resistentes a cada lavagem.',
      benefits: ['Reduz a quebra', 'Fios mais resistentes', 'Limpeza equilibrada'],
      howTo: 'Aplique no couro cabeludo molhado, massageie e enxágue.',
      size: '300 ml', rating: 4.6, pop: 66, stock: 9
    },
    {
      id: 'cond-nutritivo', name: 'Condicionador Nutritivo', brand: 'Belkit', cat: 'Condicionadores',
      price: 29.90, old: 0, img: 'assets/produtos/IMG_0407.jpg',
      desc: 'Desembaraça e sela a hidratação do banho.',
      about: 'Desembaraça na hora e sela a hidratação do banho, deixando os fios macios e com toque sedoso.',
      benefits: ['Desembaraça na hora', 'Sela a hidratação', 'Toque sedoso'],
      howTo: 'Após o shampoo, aplique do comprimento às pontas, deixe agir 2 minutos e enxágue.',
      size: '300 ml', rating: 4.7, pop: 64, stock: 0
    },
    {
      id: 'mascara-reconstrutora', name: 'Máscara Reconstrutora', brand: 'New Hair', cat: 'Máscaras',
      price: 49.90, old: 59.90, img: 'assets/produtos/IMG_0408.jpg',
      desc: 'Repõe massa e recupera fios muito danificados.',
      about: 'Reposição de massa para fios muito danificados por química, calor ou descoloração. Devolve a resistência e o corpo dos cabelos.',
      benefits: ['Repõe massa capilar', 'Recupera fios danificados', 'Mais corpo e resistência'],
      howTo: 'Aplique mecha a mecha no cabelo lavado, deixe agir 10 minutos e enxágue. Use 1 vez por semana.',
      size: '300 g', rating: 4.9, pop: 82, stock: 11
    },
    {
      id: 'kit-cachos', name: 'Kit Cachos Definidos', brand: 'New Hair', cat: 'Kits',
      price: 99.90, old: 139.90, img: 'assets/produtos/IMG_0425.jpg',
      desc: 'Creme, gelatina e leave-in para cachos de verdade.',
      about: 'Tudo para definir e manter os cachos: creme de pentear, gelatina e leave-in pensados para usar juntos.',
      benefits: ['Definição que dura', 'Menos frizz', 'Cachos soltinhos e com movimento'],
      howTo: 'Com o cabelo úmido, aplique o leave-in, depois o creme e finalize com a gelatina. Amasse os cachos e deixe secar.',
      size: 'Creme 300 g · Gelatina 300 g · Leave-in 200 ml', rating: 4.8, pop: 78, stock: 7
    },
    {
      id: 'mascara-matizadora', name: 'Máscara Matizadora', brand: 'Belkit', cat: 'Máscaras',
      price: 45.90, old: 0, img: 'assets/produtos/IMG_0426.jpg',
      desc: 'Neutraliza o amarelado dos fios loiros e grisalhos.',
      about: 'Pigmentos violeta que neutralizam o amarelado dos fios loiros, platinados e grisalhos, enquanto hidratam.',
      benefits: ['Neutraliza o amarelado', 'Hidrata enquanto matiza', 'Para loiros e grisalhos'],
      howTo: 'Aplique no cabelo lavado, deixe agir de 3 a 5 minutos e enxágue. Teste antes numa mecha.',
      size: '250 g', rating: 4.6, pop: 58, stock: 16
    },
    {
      id: 'cond-reparador', name: 'Condicionador Reparador', brand: 'New Hair', cat: 'Condicionadores',
      price: 33.90, old: 38.90, img: 'assets/produtos/IMG_0407.jpg',
      desc: 'Para cabelos secos que pedem socorro.',
      about: 'Para cabelos secos e opacos que pedem socorro. Repara as pontas e devolve a maciez.',
      benefits: ['Repara as pontas', 'Devolve a maciez', 'Ideal para fios secos'],
      howTo: 'Após o shampoo, aplique do comprimento às pontas, deixe agir 2 minutos e enxágue.',
      size: '300 ml', rating: 4.7, pop: 60, stock: 13
    },
    {
      id: 'perfume-noite', name: 'Perfume Capilar Noite', brand: 'New Hair', cat: 'Perfumes',
      price: 46.90, old: 0, img: 'assets/produtos/perfume-capilar.jpeg',
      desc: 'Notas amadeiradas marcantes para a noite.',
      about: 'Notas amadeiradas e marcantes para sair à noite. Fixação prolongada sem pesar nos fios.',
      benefits: ['Notas amadeiradas', 'Fixação prolongada', 'Não pesa nos fios'],
      howTo: 'Borrife a cerca de 20 cm dos cabelos, das mechas às pontas.',
      size: '120 ml', rating: 4.9, pop: 55, stock: 8
    },
    {
      id: 'oleo-crescimento', name: 'Óleo de Crescimento', brand: 'Belkit', cat: 'Óleos',
      price: 52.90, old: 64.90, img: 'assets/produtos/oleos-newhair.jpeg',
      desc: 'Estimula o couro cabeludo e acelera o crescimento.',
      about: 'Blend de óleos que estimula o couro cabeludo e ajuda os fios a crescerem mais fortes.',
      benefits: ['Estimula o couro cabeludo', 'Fios mais fortes', 'Aplicação prática com conta-gotas'],
      howTo: 'Aplique algumas gotas no couro cabeludo e massageie por 2 minutos. Use 3 vezes por semana.',
      size: '60 ml', rating: 4.8, pop: 72, stock: 3
    },
    {
      id: 'shampoo-antirresiduos', name: 'Shampoo Antirresíduos', brand: 'Belkit', cat: 'Shampoos',
      price: 31.90, old: 0, img: 'assets/produtos/shampoo-belkit.jpeg',
      desc: 'Faz a limpeza profunda antes de tratamentos.',
      about: 'Limpeza profunda que remove resíduos de cremes e poluição, preparando os fios para receber tratamentos.',
      benefits: ['Limpeza profunda', 'Prepara para tratamentos', 'Couro cabeludo leve'],
      howTo: 'Use 1 vez por semana, antes da máscara. Massageie e enxágue bem.',
      size: '300 ml', rating: 4.5, pop: 48, stock: 20
    },
    {
      id: 'kit-presente', name: 'Kit Presente Amo Você', brand: 'Amo Cosméticos', cat: 'Kits',
      price: 149.90, old: 199.90, img: 'assets/produtos/kit-newhair.jpeg',
      desc: 'A seleção especial para presentear com carinho.',
      about: 'Uma seleção especial montada pela Amo Cosméticos, em embalagem de presente, para quem você ama.',
      benefits: ['Embalagem de presente', 'Seleção da casa', 'Cartão com mensagem'],
      howTo: 'Cada item acompanha o próprio modo de uso.',
      size: 'Kit com 4 itens', rating: 5.0, pop: 85, stock: 5
    }
  ];

  /* ──────────────── helpers ──────────────── */
  const BRL = (n) => 'R$' + (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const LIKES_KEY = 'amo_likes_v1';           // mesmo do account.js
  const LOW_STOCK = 5;                         // "últimas unidades" a partir daqui
  const WHATSAPP = '5599999999999';            // ►► TROQUE pelo número real (o mesmo do cart.js)

  const find = (id) => PRODUCTS.find((p) => p.id === id) || null;
  const url = (p) => 'produto.html?id=' + encodeURIComponent(p.id);
  const onSale = (p) => !!(p.old && p.old > p.price);
  const off = (p) => (onSale(p) ? Math.round((1 - p.price / p.old) * 100) : 0);
  const stockOf = (p) => (p.variants ? p.variants.options.reduce((s, o) => s + (o.stock || 0), 0) : (p.stock == null ? 99 : p.stock));

  function likedNames() {
    try { const a = JSON.parse(localStorage.getItem(LIKES_KEY)); return Array.isArray(a) ? a.map((x) => x.name) : []; }
    catch (e) { return []; }
  }

  /* ──────────────── O CARD (moldura simples) ────────────────
     Mantém as classes .pcard-* porque cart.js e account.js
     leem nome, marca, preço e foto por elas. */
  function cardHTML(p, opts) {
    opts = opts || {};
    const sale = onSale(p);
    const out = stockOf(p) <= 0;
    const fav = (opts.liked || likedNames()).includes(p.name);
    let tag = '';
    if (out) tag = '<span class="pcard-tag pcard-tag--out">Esgotado</span>';
    else if (sale) tag = `<span class="pcard-tag pcard-tag--sale">-${off(p)}%</span>`;
    else if (opts.rank) tag = `<span class="pcard-tag">Nº ${opts.rank}</span>`;

    return `
      <article class="pcard${sale ? ' pcard--sale' : ''}${out ? ' pcard--out' : ''}" data-id="${esc(p.id)}" data-cat="${esc(p.cat)}">
        <div class="pcard-media">
          <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" draggable="false">
          ${tag}
          <button class="pcard-fav${fav ? ' is-fav' : ''}" type="button" aria-label="Favoritar ${esc(p.name)}" aria-pressed="${fav}"><svg class="ico" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
        </div>
        <div class="pcard-body">
          <span class="pcard-brand">${esc(p.brand)}</span>
          <h3 class="pcard-name"><a class="pcard-link" href="${url(p)}">${esc(p.name)}</a></h3>
          ${opts.noDesc ? '' : `<p class="pcard-desc">${esc(p.desc)}</p>`}
          <div class="pcard-foot">
            <span class="pcard-price"><span class="now">${BRL(p.price)}</span>${sale ? `<span class="old">${BRL(p.old)}</span>` : ''}</span>
            <button class="pcard-add" type="button" aria-label="Adicionar ${esc(p.name)} à sacola"${out ? ' disabled' : ''}><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
          </div>
        </div>
      </article>`;
  }

  function renderInto(el, list, opts) {
    if (!el) return;
    const liked = likedNames();
    el.innerHTML = list.map((p, i) => cardHTML(p, Object.assign({ liked }, opts, opts && opts.ranked ? { rank: i + 1 } : {}))).join('');
    if (window.AmoCart && window.AmoCart.wire) window.AmoCart.wire();
  }

  /* listas prontas */
  const lists = {
    'mais-vendidos': () => PRODUCTS.filter((p) => stockOf(p) > 0).sort((a, b) => b.pop - a.pop),
    'ofertas': () => PRODUCTS.filter((p) => onSale(p) && stockOf(p) > 0).sort((a, b) => off(b) - off(a)),
    'lancamentos': () => PRODUCTS.slice().reverse()
  };

  /* <div class="prod-grid" data-vitrine="mais-vendidos" data-limit="4"></div>
     em qualquer página vira uma vitrine automática */
  function renderVitrines() {
    document.querySelectorAll('[data-vitrine]').forEach((el) => {
      const kind = el.dataset.vitrine;
      if (!lists[kind] || el.dataset.rendered) return;
      el.dataset.rendered = '1';
      const limit = parseInt(el.dataset.limit, 10) || 4;
      renderInto(el, lists[kind]().slice(0, limit), { ranked: kind === 'mais-vendidos' });
    });
  }

  /* coração: se nenhum outro script tratou o clique (script.js
     liga só os cards que já existiam), alterna aqui */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pcard-fav');
    if (!btn) return;
    e.preventDefault();
    btn.classList.toggle('is-fav');
  });
  // mantém aria-pressed em dia, venha o clique de onde vier
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pcard-fav');
    if (btn) setTimeout(() => btn.setAttribute('aria-pressed', btn.classList.contains('is-fav')), 0);
  }, true);

  /* Queridinhos da semana (landing): preço vem da base única.
     Casa cada .fav-pick pelo data-name; o resto (texto, selo) segue no HTML. */
  function syncQueridinhos() {
    const picks = document.querySelectorAll('.fav-pick[data-name]');
    picks.forEach((b) => {
      const p = PRODUCTS.find((x) => x.name === b.dataset.name);
      if (!p) return;
      b.dataset.price = BRL(p.price);
      b.dataset.old = onSale(p) ? BRL(p.old) : '';
      b.dataset.save = onSale(p) ? '-' + off(p) + '%' : '';
      const i = b.querySelector('.fav-pick-txt i');
      if (i) i.textContent = BRL(p.price);
      if (b.classList.contains('is-active')) {
        const set = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };
        set('#favNow', b.dataset.price); set('#favOld', b.dataset.old); set('#favSave', b.dataset.save);
      }
    });
  }

  /* botão flutuante do WhatsApp (em todas as páginas) */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.whatsapp-float')) return;
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Olá! Vim pelo site da Amo Cosméticos.'), '_blank', 'noopener');
  });

  /* ──────────────── API PÚBLICA ──────────────── */
  window.AMO_PRODUCTS = PRODUCTS;
  window.Amo = { BRL, esc, find, url, onSale, off, stockOf, LOW_STOCK, WHATSAPP, cardHTML, renderInto, lists, likedNames };

  // vitrines já presentes no HTML acima deste <script> renderizam na hora,
  // antes do script.js/account.js, para que eles enxerguem os cards.
  renderVitrines();
  syncQueridinhos();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderVitrines);
})();
