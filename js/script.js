/* ══════════════════════════════════════════════
   AMO COSMÉTICOS — SCRIPT
   ══════════════════════════════════════════════ */

/* ── Hero Slider ── */
(function () {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.hero-ind');
  const counter = document.getElementById('heroCounter');
  let current = 0;
  const total = slides.length;

  function goTo(i) {
    slides[current].classList.remove('active');
    indicators[current].classList.remove('active');
    current = i % total;
    slides[current].classList.add('active');
    indicators[current].classList.add('active');
    counter.textContent = (current + 1) + ' / ' + total;
  }

  indicators.forEach(function (btn) {
    btn.addEventListener('click', function () {
      goTo(+btn.dataset.slide);
    });
  });

  setInterval(function () {
    goTo(current + 1);
  }, 5000);
})();

/* ── Navbar scroll effect ── */
window.addEventListener('scroll', function () {
  document.getElementById('nav').classList.toggle('scrolled', scrollY > 50);
});

/* ── Categories carousel ── */
(function () {
  const grid = document.getElementById('catGrid');
  const prevBtn = document.querySelector('.cat-nav-prev');
  const nextBtn = document.querySelector('.cat-nav-next');
  if (!grid || !prevBtn || !nextBtn) return;

  function cardStep() {
    const card = grid.querySelector('.cat-card');
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

  prevBtn.addEventListener('click', function () {
    grid.scrollBy({ left: -cardStep(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', function () {
    grid.scrollBy({ left: cardStep(), behavior: 'smooth' });
  });

  grid.addEventListener('scroll', updateNavState, { passive: true });
  window.addEventListener('resize', updateNavState);
  updateNavState();
})();

/* ── Newsletter form ── */
document.getElementById('newsletterForm').addEventListener('submit', function (e) {
  e.preventDefault();
});