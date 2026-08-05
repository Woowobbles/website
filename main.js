const crop      = document.getElementById('crop');
const logoWhite = document.getElementById('logo-white');

// Start locked
document.documentElement.style.overflow = 'hidden';
document.documentElement.style.height = '100%';
document.body.style.overflow = 'hidden';
document.body.style.height = '100%';

const SCROLL_NEEDED = 600; // px of scroll delta to complete the animation
let accumulated = 0;
let unlocked = false;
let autoScrollRaf = null;

// Apply initial state so white logo is fully clipped at load
applyProgress(0);

function updateLogoClip(wVw, hVh) {
  const cropW = wVw / 100 * window.innerWidth;
  const cropH = hVh / 100 * window.innerHeight;
  const videoLeft   = (window.innerWidth  - cropW) / 2;
  const videoTop    = (window.innerHeight - cropH) / 2;
  const videoRight  = videoLeft + cropW;
  const videoBottom = videoTop  + cropH;

  const r = logoWhite.getBoundingClientRect();
  const clipTop    = Math.max(0, videoTop    - r.top);
  const clipBottom = Math.max(0, r.bottom    - videoBottom);
  const clipLeft   = Math.max(0, videoLeft   - r.left);
  const clipRight  = Math.max(0, r.right     - videoRight);

  logoWhite.style.clipPath =
    `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`;
}

function applyProgress(p) {
  const w = 35 + 65 * p; // 35vw → 100vw
  const h = 60 + 40 * p; // 60vh → 100vh
  crop.style.width  = w + 'vw';
  crop.style.height = h + 'vh';
  updateLogoClip(w, h);
}

function processScroll(delta) {
  accumulated = Math.max(0, Math.min(SCROLL_NEEDED, accumulated + delta));
  const p = accumulated / SCROLL_NEEDED;
  applyProgress(p);

  document.getElementById('scroll-indicator').style.opacity = Math.max(0, 1 - p * 4);

  if (p >= 1 && !unlocked) {
    unlocked = true;
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
  } else if (p < 1 && unlocked) {
    unlocked = false;
    currentSection = 0;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    window.scrollTo(0, 0);
  }
}

document.getElementById('scroll-indicator').addEventListener('click', () => {
  if (unlocked) return;
  if (autoScrollRaf) return;
  const DURATION = 900;
  const startVal = accumulated;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / DURATION, 1);
    const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;
    accumulated = startVal + (SCROLL_NEEDED - startVal) * ease;
    processScroll(0);
    if (t < 1) {
      autoScrollRaf = requestAnimationFrame(step);
    } else {
      autoScrollRaf = null;
    }
  }
  autoScrollRaf = requestAnimationFrame(step);
});

// ── Section snapping ──
const snapSections = [
  document.getElementById('stage'),
  document.getElementById('experience'),
  document.getElementById('gt-omega'),
];
let currentSection = 0;
let isSnapping = false;

function smoothScrollTo(target, duration, onDone) {
  const start = window.scrollY;
  const dist  = target - start;
  if (Math.abs(dist) < 1) { isSnapping = false; if (onDone) onDone(); return; }
  const t0 = performance.now();
  function step(now) {
    const t    = Math.min((now - t0) / duration, 1);
    const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;
    window.scrollTo(0, start + dist * ease);
    if (t < 1) requestAnimationFrame(step);
    else { isSnapping = false; if (onDone) onDone(); }
  }
  requestAnimationFrame(step);
}

function snapToSection(index) {
  if (index < 0 || index >= snapSections.length || isSnapping) return;
  isSnapping = true;
  currentSection = index;

  // Trigger entrance animations for the target section immediately
  // so they complete during the scroll rather than after arrival
  if (index === 1 && !document.getElementById('experience').classList.contains('in-view')) {
    document.getElementById('experience').classList.add('in-view');
    document.getElementById('skills').classList.add('in-view');
  }

  const target = index === snapSections.length - 1
    ? document.documentElement.scrollHeight - window.innerHeight
    : index * window.innerHeight;

  const onDone = index === 2
    ? () => { document.getElementById('gt-omega').classList.add('in-view'); }
    : undefined;

  smoothScrollTo(target, 1800, onDone);
}

window.addEventListener('wheel', (e) => {
  if (!unlocked) {
    e.preventDefault();
    processScroll(e.deltaY);
  } else {
    e.preventDefault();
    if (isSnapping) return;
    if (e.deltaY > 0) {
      if (currentSection < snapSections.length - 1) snapToSection(currentSection + 1);
    } else {
      if (currentSection > 0) {
        snapToSection(currentSection - 1);
      } else if (window.scrollY === 0) {
        processScroll(e.deltaY); // shrink webm
      }
    }
  }
}, { passive: false });

let lastTouchY = null;
window.addEventListener('touchstart', (e) => {
  lastTouchY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const dy = lastTouchY - e.touches[0].clientY;
  lastTouchY = e.touches[0].clientY;
  if (!unlocked) {
    processScroll(dy);
  } else if (!isSnapping) {
    if (dy > 10 && currentSection < snapSections.length - 1)      snapToSection(currentSection + 1);
    else if (dy < -10 && currentSection > 0)                      snapToSection(currentSection - 1);
    else if (dy < -10 && currentSection === 0 && window.scrollY === 0) processScroll(dy);
  }
}, { passive: false });

// Unified parallax: each section's content drifts at 50% while the next slides over at 100%
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  // Stage: content recedes upward at 50% as #experience covers it
  document.getElementById('crop').style.transform = `translateY(${-scrollY * 0.5}px)`;

  // Experience: bg image recedes at 50% as #gt-omega covers it
  const exp     = document.getElementById('experience');
  const expImg  = exp.querySelector('img');
  const expDelta = Math.max(0, scrollY - window.innerHeight);
  expImg.style.transform = `translateY(${-expDelta * 0.5}px)`;

  // GT Omega: no parallax needed (last section)
});

// Experience section + skills cards entrance animation
const experienceObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      experienceObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

experienceObserver.observe(document.getElementById('experience'));
experienceObserver.observe(document.getElementById('skills'));
