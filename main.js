const crop = document.getElementById('crop');
const logoWhite = document.getElementById('logo-white');
const timelineRoot = document.getElementById('timeline-items');

const timelineProjects = [
  {
    type: 'Website',
    title: 'GT Omega',
    summary: 'Modernising the e-commerce experience for a leading sim racing brand.',
    image: 'gtomega/hero.png',
    alt: 'GT Omega website hero image',
    href: 'gtomega/'
  },
  {
    type: 'Website',
    title: 'Trade Me',
    summary: 'Improving listing and buying journeys through product and UX collaboration.',
    image: 'trademe/hero.png',
    alt: 'Trade Me project hero image',
    href: 'trademe/'
  }
];

let timelineMediaImages = [];

function renderTimeline() {
  if (!timelineRoot) return;

  timelineRoot.innerHTML = timelineProjects.map((project, index) => {
    const orientationClass = index % 2 === 0 ? '' : ' is-right';
    const mediaMarkup = project.href
      ? `<a class="timeline-media" href="${project.href}"><img src="${project.image}" alt="${project.alt}" loading="lazy" /></a>`
      : `<div class="timeline-media"><img src="${project.image}" alt="${project.alt}" loading="lazy" /></div>`;

    return `
      <article class="timeline-item${orientationClass}">
        <div class="timeline-content">
          <p class="timeline-type">${project.type}</p>
          <h2 class="timeline-title">${project.title}</h2>
          <p class="timeline-summary">${project.summary}</p>
        </div>
        ${mediaMarkup}
      </article>
    `;
  }).join('');

  timelineMediaImages = Array.from(document.querySelectorAll('.timeline-media img'));
}

renderTimeline();

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
  const videoLeft = (window.innerWidth - cropW) / 2;
  const videoTop = (window.innerHeight - cropH) / 2;
  const videoRight = videoLeft + cropW;
  const videoBottom = videoTop + cropH;

  const r = logoWhite.getBoundingClientRect();
  const clipTop = Math.max(0, videoTop - r.top);
  const clipBottom = Math.max(0, r.bottom - videoBottom);
  const clipLeft = Math.max(0, videoLeft - r.left);
  const clipRight = Math.max(0, r.right - videoRight);

  logoWhite.style.clipPath =
    `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`;
}

function applyProgress(p) {
  const w = 35 + 65 * p; // 35vw -> 100vw
  const h = 60 + 40 * p; // 60vh -> 100vh
  crop.style.width = p >= 1 ? '100%' : w + 'vw';
  crop.style.height = p >= 1 ? '100%' : h + 'vh';
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
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

window.addEventListener('wheel', (e) => {
  if (!unlocked) {
    e.preventDefault();
    processScroll(e.deltaY);
    return;
  }

  // At very top, reverse scroll transitions back into locked intro expansion.
  if (window.scrollY <= 0 && e.deltaY < 0) {
    e.preventDefault();
    processScroll(e.deltaY);
  }
}, { passive: false });

let lastTouchY = null;
window.addEventListener('touchstart', (e) => {
  lastTouchY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  const dy = lastTouchY - e.touches[0].clientY;
  lastTouchY = e.touches[0].clientY;

  if (!unlocked) {
    e.preventDefault();
    processScroll(dy);
    return;
  }

  // At very top, reverse swipe transitions back into locked intro expansion.
  if (window.scrollY <= 0 && dy < -10) {
    e.preventDefault();
    processScroll(dy);
  }
}, { passive: false });

// Scroll effects without parallax motion.
window.addEventListener('scroll', () => {
  const timelineSection = document.getElementById('projects-timeline');

  // Logo wipe: clip white logo based on timeline entering viewport.
  if (unlocked) {
    const r = logoWhite.getBoundingClientRect();
    const timelineTop = timelineSection.getBoundingClientRect().top;
    const clipBottom = Math.max(0, r.bottom - timelineTop);
    logoWhite.style.clipPath = `inset(0px 0px ${clipBottom}px 0px)`;
  }
});

// Experience section + skills cards entrance animation
const experienceObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      experienceObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

experienceObserver.observe(document.getElementById('experience'));
experienceObserver.observe(document.getElementById('skills'));

// Timeline reveal animation
const timelineObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      timelineObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.timeline-item').forEach((item) => timelineObserver.observe(item));
