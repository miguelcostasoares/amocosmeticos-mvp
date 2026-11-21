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

/* ── Newsletter form ── */
document.getElementById('newsletterForm').addEventListener('submit', function (e) {
  e.preventDefault();
});