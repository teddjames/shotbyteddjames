/* ======================================================================
   SHOTBYTJ / INTERACTIONS
   1. Scroll reveals + progress
   2. Draggable CSS-3D photo sculpture with explode / reassemble
   3. Keyboard-accessible, draggable 3D project carousel
   4. Live project filtering and responsive navigation
   No frameworks and no external JavaScript dependencies.
   ====================================================================== */
'use strict';

document.documentElement.classList.add('has-js');

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// A quick, quiet intro that exits as soon as the initial page is usable.
// The percentage is a visual transition, not a claim about bytes downloaded.
document.body.classList.add('is-loading');
const siteLoader = $('#siteLoader');
const loaderBar = $('#loaderProgressBar');
const loaderPercent = $('#loaderPercent');
const loaderStatus = $('#loaderStatus');
const loaderStatement = $('#loaderStatement');
const loaderEnter = $('#loaderEnter');
const loadingStarted = performance.now();
let loadingFinished = false;
let loaderFrameId = 0;
function updateLoaderProgress(value) {
  const n = Math.max(0, Math.min(100, Math.round(value)));
  loaderBar.style.width = `${n}%`;
  loaderPercent.textContent = `${String(n).padStart(2,'0')}%`;
}
function animateLoader(now) {
  if (loadingFinished) return;
  const elapsed = Math.max(0, now - loadingStarted);
  updateLoaderProgress(Math.min(94, 94 * (1 - Math.exp(-elapsed / 530))));
  loaderFrameId = requestAnimationFrame(animateLoader);
}
loaderFrameId = requestAnimationFrame(animateLoader);
function finishLoading() {
  if (loadingFinished) return;
  loadingFinished = true;
  cancelAnimationFrame(loaderFrameId);
  updateLoaderProgress(100);
  loaderStatus.textContent = 'Ready to explore';
  window.setTimeout(() => {
    siteLoader.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
  }, reducedMotion.matches ? 0 : 140);
  window.setTimeout(() => siteLoader.remove(), reducedMotion.matches ? 120 : 1250);
}
window.addEventListener('load', () => {
  window.setTimeout(finishLoading, Math.max(0, 700 - (performance.now() - loadingStarted)));
}, { once:true });
// The intro never blocks the portfolio indefinitely if a remote asset stalls.
window.setTimeout(finishLoading, 3600);
loaderEnter.addEventListener('click', finishLoading);
if (!reducedMotion.matches && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  siteLoader.addEventListener('pointermove', (event) => {
    if (loadingFinished) return;
    const x = (event.clientX / window.innerWidth - .5) * 12;
    const y = (event.clientY / window.innerHeight - .5) * 9;
    loaderStatement.style.setProperty('--loader-x', `${x.toFixed(1)}px`);
    loaderStatement.style.setProperty('--loader-y', `${y.toFixed(1)}px`);
  }, { passive:true });
}

$('#year').textContent = String(new Date().getFullYear());

// Mobile navigation
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  mainNav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}
menuToggle.addEventListener('click', () => {
  const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
  mainNav.classList.toggle('is-open', opening);
  document.body.classList.toggle('menu-open', opening);
});
$$('a', mainNav).forEach(anchor => anchor.addEventListener('click', closeMenu));
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});
window.matchMedia('(min-width: 821px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

// Progressive reveal: no hidden content if IntersectionObserver isn't available.
const revealNodes = $$('[data-reveal]');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  revealNodes.forEach(node => revealObserver.observe(node));
} else {
  revealNodes.forEach(node => node.classList.add('in-view'));
}

// Reading-progress stripe
const progressBar = $('#progressBar');
let scrollQueued = false;
function renderScroll() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const percent = total > 0 ? (window.scrollY / total) * 100 : 0;
  progressBar.style.width = `${clamp(percent, 0, 100)}%`;
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(renderScroll);
}, { passive: true });
window.addEventListener('resize', renderScroll);
renderScroll();

// 3D hero photo sculpture. CSS transform-style: preserve-3d on all pieces.
const sculpture = $('#heroSculpture');
const sculptureSpace = $('#sculptureSpace');
const explodeToggle = $('#explodeToggle');
const explodeLabel = $('#explodeLabel');
let sculptureDragging = false;
let pointerStartX = 0, pointerStartY = 0;
let rotationAtStartX = 0, rotationAtStartY = 0;
let rotationX = 0, rotationY = 0;

function setSculptureRotation(x, y) {
  rotationX = clamp(x, -17, 17);
  rotationY = clamp(y, -27, 27);
  sculptureSpace.style.setProperty('--rotate-x', `${rotationX}deg`);
  sculptureSpace.style.setProperty('--rotate-y', `${rotationY}deg`);
}

sculpture.addEventListener('pointerdown', event => {
  if (event.target.closest('button')) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  sculptureDragging = true;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  rotationAtStartX = rotationX;
  rotationAtStartY = rotationY;
  sculpture.classList.add('dragging');
  sculpture.setPointerCapture(event.pointerId);
});
sculpture.addEventListener('pointermove', event => {
  if (reducedMotion.matches) return;
  if (sculptureDragging) {
    setSculptureRotation(rotationAtStartX - (event.clientY - pointerStartY) * .085,
      rotationAtStartY + (event.clientX - pointerStartX) * .11);
  } else if (event.pointerType === 'mouse') {
    const bounds = sculpture.getBoundingClientRect();
    const nx = (event.clientX - bounds.left) / bounds.width - .5;
    const ny = (event.clientY - bounds.top) / bounds.height - .5;
    setSculptureRotation(-ny * 11, nx * 16);
  }
});
function stopSculptureDragging() {
  sculptureDragging = false;
  sculpture.classList.remove('dragging');
}
sculpture.addEventListener('pointerup', stopSculptureDragging);
sculpture.addEventListener('pointercancel', stopSculptureDragging);
sculpture.addEventListener('lostpointercapture', stopSculptureDragging);
sculpture.addEventListener('pointerleave', event => {
  if (!sculptureDragging && event.pointerType === 'mouse' && !reducedMotion.matches) setSculptureRotation(0, 0);
});
explodeToggle.addEventListener('click', () => {
  const exploded = sculpture.classList.toggle('is-exploded');
  explodeToggle.setAttribute('aria-pressed', String(exploded));
  explodeLabel.textContent = exploded ? 'REASSEMBLE THE FRAME' : 'EXPLODE THE FRAME';
});

// Portfolio metadata, preserved from the existing nine Pixieset gallery links.
const projects = [
  { title: "Ciza's Palace",      category: 'LIVE MUSIC & NIGHTLIFE',    photo: '96-DSC_0251.jpg',   alt: 'DJ illuminated in pink and blue light',                 url: 'https://teddjames.pixieset.com/cizaspalace/' },
  { title: 'MC Uncool',          category: 'LIVE MUSIC & NIGHTLIFE',    photo: 'DSC_0454.jpg',      alt: 'DJ playing through atmospheric stage smoke',          url: 'https://Shotbyteddjames.pixieset.com/keystotheblock/' },
  { title: 'Car Photography',    category: 'AUTOMOTIVE & DETAILS',     photo: '11-DSC_0116.jpg',   alt: 'Close-up golden Porsche crest',                      url: 'https://teddjames.pixieset.com/carphotography/' },
  { title: 'Event Photography',  category: 'LIFE IN THE CROWD',       photo: 'DSC_0376.jpg',      alt: 'Three friends enjoying a performance',                url: 'https://teddjames.pixieset.com/naturephotography/' },
  { title: 'Cinematics',         category: 'MOTION & EXPERIMENTATION', photo: '3-DSC_0186.jpg',    alt: 'Colourful motion-blurred night lights',               url: 'https://teddjames.pixieset.com/streetandurbanphotography/' },
  { title: 'Palms & Piano',      category: 'NIGHTLIFE & PEOPLE',      photo: '120-DSC_0409.jpg',  alt: 'Party crowd with hands in the air',                   url: 'https://shotbyteddjames.pixieset.com/palmsandpiano2/' },
  { title: 'Costa World',        category: 'FESTIVAL CULTURE',         photo: 'costaworldpfp.jpg', alt: 'Festival friends with a Costa World sign',            url: 'https://shotbyteddjames.pixieset.com/costaworld/' },
  { title: 'Abantu × Xfest',     category: 'LIVE MUSIC & FESTIVALS',   photo: 'DSC_0173.jpg',      alt: 'Smoky concert stage with ABANTU on the screen',       url: 'https://teddjames.pixieset.com/redroomabantuxxfest/' },
  { title: 'The Playground — SOS', category: 'CULTURE & COMMUNITY',   photo: 'SOS1.jpg',          alt: 'Two people smiling with shirts at an outdoor event',  url: 'https://teddjames.pixieset.com/soundsofserengeti/' }
];

// Construct buttons rather than writing raw strings into HTML.
const stage = $('#galleryStage');
const projectTitle = $('#projectTitle');
const projectCategory = $('#projectCategory');
const projectCounter = $('#projectCounter');
const galleryOpen = $('#galleryOpen');
const galleryProgressFill = $('#galleryProgressFill');
let activeProject = 0;
let slideDragging = false;
let galleryStartX = 0;
let galleryStartY = 0;
let movedDuringDrag = false;
let ignoreClickUntil = 0;

const cards = projects.map((project, index) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'gallery-card';
  card.dataset.index = String(index);
  card.setAttribute('aria-label', `View ${project.title}, project ${index + 1} of ${projects.length}`);
  const photo = document.createElement('img');
  photo.src = `images/${project.photo}`;
  photo.alt = project.alt;
  photo.loading = index < 3 ? 'eager' : 'lazy';
  photo.decoding = 'async';
  const number = document.createElement('span');
  number.className = 'gallery-card-number';
  number.textContent = `SHOTBYTJ / ${String(index + 1).padStart(2, '0')}`;
  card.append(photo, number);
  card.addEventListener('click', () => {
    if (performance.now() < ignoreClickUntil) return;
    if (activeProject !== index) setActiveProject(index);
    else window.open(project.url, '_blank', 'noopener,noreferrer');
  });
  stage.appendChild(card);
  return card;
});

function setActiveProject(next) {
  activeProject = (next + projects.length) % projects.length;
  cards.forEach((card, index) => {
    const half = Math.floor(projects.length / 2);
    const distance = ((index - activeProject + projects.length + half) % projects.length) - half;
    card.dataset.pos = Math.abs(distance) <= 2 ? String(distance) : 'hidden';
    card.tabIndex = Math.abs(distance) <= 1 ? 0 : -1;
    card.setAttribute('aria-hidden', String(Math.abs(distance) > 2));
  });
  const project = projects[activeProject];
  projectTitle.textContent = project.title;
  projectCategory.textContent = project.category;
  projectCounter.textContent = `${String(activeProject + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
  galleryOpen.href = project.url;
  galleryOpen.setAttribute('aria-label', `Open the ${project.title} Pixieset gallery in a new tab`);
  galleryProgressFill.style.width = `${((activeProject + 1) / projects.length) * 100}%`;
}
setActiveProject(0);
$('#galleryPrev').addEventListener('click', () => setActiveProject(activeProject - 1));
$('#galleryNext').addEventListener('click', () => setActiveProject(activeProject + 1));
stage.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    setActiveProject(activeProject + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

stage.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  galleryStartX = event.clientX;
  galleryStartY = event.clientY;
  movedDuringDrag = false;
  slideDragging = true;
});
stage.addEventListener('pointermove', event => {
  if (!slideDragging) return;
  const deltaX = event.clientX - galleryStartX;
  const deltaY = event.clientY - galleryStartY;
  if (Math.abs(deltaX) > 14 && Math.abs(deltaX) > Math.abs(deltaY)) {
    movedDuringDrag = true;
    stage.classList.add('is-dragging');
  }
});
stage.addEventListener('pointerup', event => {
  if (!slideDragging) return;
  const distanceX = event.clientX - galleryStartX;
  const distanceY = event.clientY - galleryStartY;
  if (movedDuringDrag && Math.abs(distanceX) > 42 && Math.abs(distanceX) > Math.abs(distanceY)) {
    setActiveProject(activeProject + (distanceX < 0 ? 1 : -1));
    ignoreClickUntil = performance.now() + 350;
  }
  slideDragging = false;
  stage.classList.remove('is-dragging');
});
stage.addEventListener('pointercancel', () => {
  slideDragging = false;
  stage.classList.remove('is-dragging');
});
// Native vertical scrolling remains intact; horizontal trackpad swipes navigate slides.
let lastWheelChange = 0;
stage.addEventListener('wheel', event => {
  const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.3;
  if (!horizontal || Math.abs(event.deltaX) < 12) return;
  if (performance.now() - lastWheelChange > 450) {
    setActiveProject(activeProject + (event.deltaX > 0 ? 1 : -1));
    lastWheelChange = performance.now();
  }
}, { passive: true });

// Archive filtering, without sacrificing the original direct Pixieset links.
const filters = $$('.filter-button');
const archiveCards = $$('.archive-card');
filters.forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    archiveCards.forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});

// Subtle desktop pointer halo (nonessential, disabled for coarse pointers).
const cursorHalo = $('#cursorHalo');
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    cursorHalo.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0) translate(-50%,-50%)`;
    cursorHalo.classList.add('is-visible');
    cursorHalo.classList.toggle('is-active', Boolean(event.target.closest('a,button,.hero-sculpture,.gallery-stage')));
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget) cursorHalo.classList.remove('is-visible');
  });
}
