// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

// Hamburger menu with slide/fade animation
const btn = document.getElementById('hamburger');
const nav = document.getElementById('primary-nav');

btn.addEventListener('click', () => {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!expanded));

  if (!expanded) {
    nav.hidden = false;
    setTimeout(() => nav.classList.add('show'), 10);
  } else {
    nav.classList.remove('show');
    nav.addEventListener('transitionend', () => nav.hidden = true, { once: true });
  }
});

// Sync nav display on desktop resize
const mq = window.matchMedia('(min-width: 981px)');
function syncForDesktop(e) {
  if (e.matches) {
    nav.hidden = false;
    btn.setAttribute('aria-expanded', 'false');
    nav.classList.remove('show');
  } else {
    nav.hidden = true;
    nav.classList.remove('show');
  }
}
mq.addEventListener('change', syncForDesktop);
syncForDesktop(mq);

// Portfolio scroll animation
const items = document.querySelectorAll('.portfolio-item');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });
items.forEach(item => observer.observe(item));

// Contact links staggered pop-up
const links = document.querySelectorAll('.contact-links a');
window.addEventListener('DOMContentLoaded', () => {
  links.forEach((link, i) => setTimeout(() => link.classList.add('show'), i * 100));
});