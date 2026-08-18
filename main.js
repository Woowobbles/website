const crop = document.getElementById('crop');
const logoWhite = document.getElementById('logo-white');
const timelineRoot = document.getElementById('timeline-items');

const timelineProjects = [
    {
    type: 'UX Research',
    title: 'Trade Me',
    logo: 'images/Trade Me/Logo.png',
    summary: "Leading and scaling the UX Research function at New Zealand's largest marketplace - Quadrupling the research output of the team in 3 years.",
    image: 'trademe/hero.png',
    alt: 'Trade Me project hero image',
    href: 'trademe/',
    imageZoom: 1.1,
    imagePositionX: 'left',
    imagePositionY: 'center',
    imagePanX: '-400px',
    imagePanY: '0px',
    imageOffsetX: '0px',
    imageOffsetY: '0px'
  },
  {
    type: 'Website Design',
    title: 'GT Omega',
    logo: 'images/GT Omega/logo.png',
    summary: 'Refreshing the brand, and modernising the e-commerce experience for a leading sim racing brand',
    image: 'gtomega/hero.png',
    alt: 'GT Omega website hero image',
    href: 'gtomega/',
    imageZoom: 1.1,
    imagePositionX: 'right',
    imagePositionY: 'center',
    imagePanX: '400px',
    imagePanY: '0px',
    imageOffsetX: '0px',
    imageOffsetY: '0px'
  },
  {
    type: 'App Design',
    title: 'Present Pal',
    logo: 'images/Present Pal/logo.png',
    summary: 'Founding and leading the product and design functions at an accessibility-focused ed-tech startup. Designing a product now being used by over 40,000 students in over 100 universities worldwide.',
    image: 'presentpal/hero.png',
    alt: 'Present Pal project hero image',
    href: 'presentpal/',
    imageZoom: 1.0,
    imagePositionX: 'left',
    imagePositionY: 'center',
    imagePanX: '-200px',
    imagePanY: '0px',
    imageOffsetX: '0px',
    imageOffsetY: '0px'
  },
  {
    type: 'Website Design',
    title: 'This Student Needs',
    logo: 'images/This Student Needs/logo.png',
    summary: 'Redesigning a hub that connects disabled students with the support they need for university - increasing sign-ups, time on site, and conversion.',
    image: 'thisstudentneeds/hero.png',
    alt: 'This Student Needs project hero image',
    href: 'thisstudentneeds/',
    imageZoom: 1.0,
    imagePositionX: 'left',
    imagePositionY: 'center',
    imagePanX: '-200px',
    imagePanY: '0px',
    imageOffsetX: '0px',
    imageOffsetY: '0px'
  }
];

let timelineMediaImages = [];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PROJECT_TRANSITION_KEY = 'timelineProjectTransition';
const PROJECT_RETURN_ANCHOR_KEY = 'projectReturnAnchor';
let fullscreenViewer = null;
let fullscreenImage = null;
let isImageAnimating = false;
const experienceImage = document.querySelector('#experience img');
let experienceImageLoaded = !experienceImage;

if (experienceImage) {
  // Force this asset to load even while out of view so scroll gating cannot deadlock.
  experienceImage.loading = 'eager';
  experienceImage.decoding = 'sync';
  experienceImage.fetchPriority = 'high';

  const onExperienceImageSettled = () => {
    experienceImageLoaded = true;
    if (accumulated >= SCROLL_NEEDED && !unlocked) {
      processScroll(0);
    }
  };

  if (experienceImage.complete) {
    experienceImageLoaded = true;
  } else {
    experienceImage.addEventListener('load', onExperienceImageSettled, { once: true });
    experienceImage.addEventListener('error', onExperienceImageSettled, { once: true });

    const eagerPreload = new Image();
    eagerPreload.addEventListener('load', onExperienceImageSettled, { once: true });
    eagerPreload.addEventListener('error', onExperienceImageSettled, { once: true });
    eagerPreload.src = experienceImage.currentSrc || experienceImage.src;
  }
}

function resetFullscreenViewerState() {
  if (!fullscreenViewer || !fullscreenImage) return;

  fullscreenViewer.classList.remove('is-open', 'is-closing');
  fullscreenViewer.setAttribute('aria-hidden', 'true');
  fullscreenImage.style.left = '';
  fullscreenImage.style.top = '';
  fullscreenImage.style.width = '';
  fullscreenImage.style.height = '';
  fullscreenImage.style.transform = '';
  fullscreenImage.src = '';
  fullscreenImage.alt = '';
  isImageAnimating = false;
  document.body.style.overflow = '';
}

function asCssLength(value) {
  if (typeof value === 'number') return `${value}px`;
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  return '0px';
}

function normalizeObjectPosition(value, axis) {
  if (typeof value !== 'string' || value.trim() === '') {
    return axis === 'x' ? '50%' : '50%';
  }

  const trimmed = value.trim().toLowerCase();
  if (axis === 'x') {
    if (trimmed === 'left') return '0%';
    if (trimmed === 'center') return '50%';
    if (trimmed === 'right') return '100%';
  } else {
    if (trimmed === 'top') return '0%';
    if (trimmed === 'center') return '50%';
    if (trimmed === 'bottom') return '100%';
  }

  return value;
}

function renderTimeline() {
  if (!timelineRoot) return;

  timelineRoot.innerHTML = timelineProjects.map((project, index) => {
    const orientationClass = index % 2 === 0 ? '' : ' is-right';
    const defaultPosX = index % 2 === 0 ? 'right' : 'left';
    const imageZoom = Number.isFinite(project.imageZoom) ? project.imageZoom : 1.24;
    const imagePositionX = normalizeObjectPosition(project.imagePositionX || defaultPosX, 'x');
    const imagePositionY = normalizeObjectPosition(project.imagePositionY || 'center', 'y');
    const imagePanX = asCssLength(project.imagePanX ?? project.imageOffsetX);
    const imagePanY = asCssLength(project.imagePanY ?? project.imageOffsetY);
    const imageOffsetX = asCssLength(project.imageOffsetX);
    const imageOffsetY = asCssLength(project.imageOffsetY);
    const imageOriginX = normalizeObjectPosition(project.imageOriginX || imagePositionX, 'x');
    const imageOriginY = normalizeObjectPosition(project.imageOriginY || 'center', 'y');
    const imageStyle = [
      `--timeline-image-zoom:${imageZoom}`,
      `--timeline-image-pos-x:${imagePositionX}`,
      `--timeline-image-pos-y:${imagePositionY}`,
      `--timeline-image-pan-x:${imagePanX}`,
      `--timeline-image-pan-y:${imagePanY}`,
      `--timeline-image-offset-x:${imageOffsetX}`,
      `--timeline-image-offset-y:${imageOffsetY}`,
      `--timeline-image-origin-x:${imageOriginX}`,
      `--timeline-image-origin-y:${imageOriginY}`
    ].join(';');

    const mediaHref = project.href ? ` data-href="${project.href}"` : '';
    const mediaMarkup = `<div class="timeline-media"${mediaHref}><img src="${project.image}" alt="${project.alt}" loading="lazy" style="${imageStyle}" /></div>`;

    return `
      <article class="timeline-item${orientationClass}">
        <div class="timeline-content">
          <img src="${project.logo}" alt="${project.title} logo" class="timeline-logo" data-project-index="${index}" tabindex="0" role="button" aria-label="View ${project.title} project" />
          <p class="timeline-summary">${project.summary}</p>
        </div>
        ${mediaMarkup}
      </article>
    `;
  }).join('');

  timelineMediaImages = Array.from(document.querySelectorAll('.timeline-media img'));
}

renderTimeline();

function ensureFullscreenViewer() {
  if (fullscreenViewer) return;

  fullscreenViewer = document.createElement('div');
  fullscreenViewer.className = 'timeline-fullscreen-viewer';
  fullscreenViewer.setAttribute('aria-hidden', 'true');

  fullscreenImage = document.createElement('img');
  fullscreenImage.className = 'timeline-fullscreen-image';
  fullscreenImage.alt = '';
  fullscreenImage.setAttribute('draggable', 'false');

  fullscreenViewer.appendChild(fullscreenImage);
  document.body.appendChild(fullscreenViewer);

  const closeViewer = () => {
    if (!fullscreenViewer || !fullscreenViewer.classList.contains('is-open') || isImageAnimating) return;
    isImageAnimating = true;
    fullscreenViewer.classList.add('is-closing');
    fullscreenViewer.classList.remove('is-open');
    document.body.style.overflow = '';

    window.setTimeout(() => {
      fullscreenViewer.classList.remove('is-closing');
      fullscreenViewer.setAttribute('aria-hidden', 'true');
      isImageAnimating = false;
    }, 760);
  };

  fullscreenViewer.addEventListener('click', (event) => {
    if (event.target === fullscreenViewer) {
      closeViewer();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeViewer();
    }
  });
}

function getViewportMetrics() {
  const doc = document.documentElement;
  return {
    left: 0,
    top: 0,
    width: doc ? doc.clientWidth : window.innerWidth,
    height: doc ? doc.clientHeight : window.innerHeight
  };
}

function openImageFullscreen(sourceImage, destinationHref) {
  if (!sourceImage || isImageAnimating) return;
  ensureFullscreenViewer();
  if (!fullscreenViewer || !fullscreenImage) return;

  const openWithMetrics = () => {
    const viewport = getViewportMetrics();
    const sourceRect = sourceImage.getBoundingClientRect();
    const naturalWidth = sourceImage.naturalWidth || sourceRect.width;
    const naturalHeight = sourceImage.naturalHeight || sourceRect.height;
    const aspect = naturalWidth > 0 ? (naturalHeight / naturalWidth) : 1;
    const viewportWidth = Math.ceil(viewport.width);
    const pageTargetWidth = viewportWidth;
    const pageAspectHeight = pageTargetWidth * aspect;
    const pageTargetHeight = Math.max(pageAspectHeight, viewport.height);
    const pageTargetLeft = 0;
    const pageTargetTop = viewport.top + ((viewport.height - pageTargetHeight) * 0.5);
    const targetWidth = viewportWidth;
    const expandedAspectHeight = targetWidth * aspect;
    const targetHeight = Math.max(expandedAspectHeight, viewport.height);
    const targetLeft = 0;
    const targetTop = viewport.top + ((viewport.height - targetHeight) * 0.5);
    const destination = typeof destinationHref === 'string' && destinationHref.trim() !== ''
      ? new URL(destinationHref, window.location.href)
      : null;

    isImageAnimating = true;
    fullscreenViewer.setAttribute('aria-hidden', 'false');
    fullscreenViewer.classList.remove('is-closing');
    fullscreenViewer.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    fullscreenImage.src = sourceImage.currentSrc || sourceImage.src;
    fullscreenImage.alt = sourceImage.alt || '';
    fullscreenImage.style.left = `${sourceRect.left}px`;
    fullscreenImage.style.top = `${sourceRect.top}px`;
    fullscreenImage.style.width = `${sourceRect.width}px`;
    fullscreenImage.style.height = `${sourceRect.height}px`;
    fullscreenImage.style.transform = 'none';

    fullscreenImage.getBoundingClientRect();

    requestAnimationFrame(() => {
      fullscreenImage.style.left = `${targetLeft}px`;
      fullscreenImage.style.top = `${targetTop}px`;
      fullscreenImage.style.width = `${targetWidth}px`;
      fullscreenImage.style.height = `${targetHeight}px`;
    });

    if (destination) {
      try {
        sessionStorage.setItem(PROJECT_TRANSITION_KEY, JSON.stringify({
          path: destination.pathname,
          image: sourceImage.currentSrc || sourceImage.src,
          targetWidth: `${pageTargetWidth}px`,
          targetLeft: `${pageTargetLeft}px`,
          targetHeight: `${pageTargetHeight}px`,
          targetTop: `${pageTargetTop}px`,
          aspect
        }));
      } catch (error) {
        // Ignore storage failures and continue with direct navigation.
      }
    }

    window.setTimeout(() => {
      isImageAnimating = false;

      if (destination) {
        window.location.href = destination.href;
      }
    }, 860);
  };

  if (sourceImage.complete) {
    openWithMetrics();
  } else {
    sourceImage.addEventListener('load', openWithMetrics, { once: true });
  }
}

function setupTimelineImageFullscreen() {
  timelineMediaImages.forEach((img) => {
    img.addEventListener('click', (event) => {
      event.preventDefault();
      const media = img.closest('.timeline-media');
      const destinationHref = media ? media.getAttribute('data-href') : null;
      openImageFullscreen(img, destinationHref);
    });
  });

  document.querySelectorAll('.timeline-logo').forEach((logo) => {
    const projectIndex = Number(logo.dataset.projectIndex);
    const projectImage = timelineMediaImages[projectIndex];
    if (!projectImage) return;

    const openProjectImage = (event) => {
      event.preventDefault();
      const media = projectImage.closest('.timeline-media');
      const destinationHref = media ? media.getAttribute('data-href') : null;
      openImageFullscreen(projectImage, destinationHref);
    };

    logo.addEventListener('click', openProjectImage);
    logo.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        openProjectImage(event);
      }
    });
  });
}

setupTimelineImageFullscreen();

function updateTimelineImageParallax() {
  if (timelineMediaImages.length === 0) return;

  const viewportH = window.innerHeight;
  const viewportCenter = viewportH * 0.5;
  
  let parallaxRange;
  if (prefersReducedMotion) {
    parallaxRange = 70;
  } else if (window.innerWidth < 840) {
    parallaxRange = 60; // Mobile parallax range
  } else {
    parallaxRange = 160;
  }

  timelineMediaImages.forEach((img) => {
    const media = img.closest('.timeline-media');
    if (!media) return;

    const rect = media.getBoundingClientRect();
    const mediaCenter = rect.top + (rect.height * 0.5);
    const normalized = (viewportCenter - mediaCenter) / viewportH;
    const clamped = Math.max(-1, Math.min(1, normalized * 2.2));
    const offsetY = clamped * parallaxRange;

    // Move image opposite to section travel for a clear parallax impression.
    img.style.setProperty('--timeline-image-shift', `${offsetY.toFixed(2)}px`);
  });
}

// Start locked
function lockIntroScroll() {
  // Keep a stable vertical scrollbar gutter so fixed header elements do not shift.
  document.documentElement.style.overflowY = 'scroll';
  document.documentElement.style.overflowX = 'hidden';
  document.documentElement.style.height = '100%';
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100%';
}

function unlockIntroScroll() {
  document.documentElement.style.overflowY = 'scroll';
  document.documentElement.style.overflowX = '';
  document.documentElement.style.height = '';
  document.body.style.overflow = '';
  document.body.style.height = '';
}

function consumeReturnAnchor() {
  let payload = null;
  try {
    const raw = sessionStorage.getItem(PROJECT_RETURN_ANCHOR_KEY);
    if (raw) {
      payload = JSON.parse(raw);
    }
  } catch (error) {
    payload = null;
  }

  try {
    sessionStorage.removeItem(PROJECT_RETURN_ANCHOR_KEY);
  } catch (error) {
    // Ignore storage failures.
  }

  if (!payload || typeof payload.href !== 'string') return null;
  return payload;
}

function isHistoryReturnNavigation() {
  const navEntry = performance.getEntriesByType('navigation')[0];
  return Boolean(navEntry && navEntry.type === 'back_forward');
}

function scrollToTimelineAnchor(href) {
  if (typeof href !== 'string' || href.trim() === '') return;
  const target = document.querySelector(`.timeline-media[data-href="${href}"]`);
  if (!target) return;

  const targetRect = target.getBoundingClientRect();
  const targetTop = window.scrollY + targetRect.top;
  const centeredOffset = (window.innerHeight - targetRect.height) * 0.5;
  const scrollTop = Math.max(0, targetTop - centeredOffset);
  window.scrollTo(0, scrollTop);
}

const SCROLL_NEEDED = 600; // px of scroll delta to complete the animation
let accumulated = 0;
let unlocked = false;
let autoScrollRaf = null;

function restoreFromReturnAnchor(returnAnchor) {
  if (!returnAnchor || typeof returnAnchor.href !== 'string') return;
  accumulated = SCROLL_NEEDED;
  unlocked = true;
  unlockIntroScroll();
  applyProgress(1);
  document.getElementById('scroll-indicator').style.opacity = '0';

  requestAnimationFrame(() => {
    scrollToTimelineAnchor(returnAnchor.href);
    updateTimelineImageParallax();
  });
}

const returnAnchor = isHistoryReturnNavigation() ? consumeReturnAnchor() : null;

// Also check for direct project return (from back button)
let projectReturnAnchor = null;
if (!returnAnchor) {
  try {
    const raw = sessionStorage.getItem('returnToProject');
    if (raw) {
      projectReturnAnchor = JSON.parse(raw);
      sessionStorage.removeItem('returnToProject');
    }
  } catch (error) {
    projectReturnAnchor = null;
  }
}

const finalReturnAnchor = returnAnchor || projectReturnAnchor;

if (finalReturnAnchor) {
  restoreFromReturnAnchor(finalReturnAnchor);
} else {
  lockIntroScroll();
  // Apply initial state so white logo is fully clipped at load
  applyProgress(0);
}

window.addEventListener('pagehide', () => {
  resetFullscreenViewerState();
});

window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  resetFullscreenViewerState();

  const anchor = consumeReturnAnchor();
  if (anchor) {
    restoreFromReturnAnchor(anchor);
  } else {
    updateTimelineImageParallax();
  }
});

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
  const startWidth = window.matchMedia('(max-width: 900px)').matches ? 80 : 35;
  const w = startWidth + (100 - startWidth) * p;
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

  if (p >= 1 && !unlocked && experienceImageLoaded) {
    unlocked = true;
    unlockIntroScroll();
  } else if (p < 1 && unlocked) {
    unlocked = false;
    lockIntroScroll();
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

  if (experienceSnapInProgress) {
    e.preventDefault();
    return;
  }

  if (e.deltaY > 0 && experienceSection && window.innerWidth > 900 && window.scrollY < experienceSection.offsetTop) {
    e.preventDefault();
    startExperienceSnap(experienceSection.offsetTop);
    return;
  }

  if (e.deltaY < 0 && experienceSection && window.innerWidth > 900 && Math.abs(window.scrollY - experienceSection.offsetTop) <= 40) {
    e.preventDefault();
    startExperienceSnap(0);
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

  if (experienceSnapInProgress) {
    e.preventDefault();
    return;
  }

  if (dy > 0 && experienceSection && window.innerWidth > 900 && window.scrollY < experienceSection.offsetTop) {
    e.preventDefault();
    startExperienceSnap(experienceSection.offsetTop);
    return;
  }

  if (dy < 0 && experienceSection && window.innerWidth > 900 && Math.abs(window.scrollY - experienceSection.offsetTop) <= 40) {
    e.preventDefault();
    startExperienceSnap(0);
    return;
  }

  // At very top, reverse swipe transitions back into locked intro expansion.
  if (window.scrollY <= 0 && dy < -10) {
    e.preventDefault();
    processScroll(dy);
  }
}, { passive: false });

function updateExperienceParallax() {
  if (!experienceSection) return;

  const image = experienceSection.querySelector('img');
  if (!image) return;

  if (prefersReducedMotion || window.innerWidth <= 900) {
    image.style.setProperty('--experience-parallax-y', '0px');
    return;
  }

  const sectionStart = experienceSection.offsetTop;
  const scrollDistance = Math.max(0, window.scrollY - sectionStart);
  const offsetY = Math.min(120, scrollDistance * 0.14);
  image.style.setProperty(
    '--experience-parallax-y',
    `${offsetY.toFixed(2)}px`
  );
}

// Scroll effects for the experience and project timeline sections.
const timelineSection = document.getElementById('projects-timeline');

function shouldUpdateTimelineParallax() {
  if (!timelineSection) return false;
  const rect = timelineSection.getBoundingClientRect();
  const viewportH = window.innerHeight || 1;
  return rect.top < (viewportH * 1.5) && rect.bottom > (viewportH * -0.5);
}

function applyScrollEffects() {
  updateExperienceParallax();
  if (!timelineSection) return;

  // Logo wipe: clip white logo based on timeline entering viewport.
  if (unlocked) {
    const r = logoWhite.getBoundingClientRect();
    const timelineTop = timelineSection.getBoundingClientRect().top;
    const clipBottom = Math.max(0, r.bottom - timelineTop);
    logoWhite.style.clipPath = `inset(0px 0px ${clipBottom}px 0px)`;
  }

  if (shouldUpdateTimelineParallax()) {
    updateTimelineImageParallax();
  }
}

let scrollEffectsRaf = null;
let experienceSnapTimer = null;
let previousScrollY = window.scrollY;
let experienceSnapInProgress = false;

function animateScrollTo(target, duration) {
  const start = window.scrollY;
  const distance = target - start;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    window.scrollTo(0, start + (distance * eased));

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

function startExperienceSnap(target = experienceSection?.offsetTop) {
  if (experienceSnapInProgress || !experienceSection || window.innerWidth <= 900) return;

  experienceSnapInProgress = true;
  const snapRoots = [document.documentElement, document.body];
  const previousSnapTypes = snapRoots.map((root) => root.style.scrollSnapType);
  snapRoots.forEach((root) => {
    root.style.scrollSnapType = 'none';
  });
  animateScrollTo(target, 1000);
  window.setTimeout(() => {
    snapRoots.forEach((root, index) => {
      root.style.scrollSnapType = previousSnapTypes[index];
    });
    experienceSnapInProgress = false;
  }, 1050);
}

function scheduleExperienceSnap() {
  if (experienceSnapInProgress) return;
  if (experienceSnapTimer) {
    clearTimeout(experienceSnapTimer);
  }

  experienceSnapTimer = window.setTimeout(() => {
    experienceSnapTimer = null;
    if (!unlocked || !experienceSection || window.innerWidth <= 900) return;

    const viewportHeight = window.innerHeight || 1;
    const experienceStart = experienceSection.offsetTop;
    const currentScrollY = window.scrollY;
    const scrollDirection = currentScrollY >= previousScrollY ? 1 : -1;
    const distanceFromExperience = currentScrollY - experienceStart;
    const snapThreshold = viewportHeight * 0.5;

    if (Math.abs(distanceFromExperience) <= snapThreshold) {
      const target = scrollDirection < 0 && currentScrollY < (experienceStart * 0.5)
        ? 0
        : experienceStart;
      startExperienceSnap(target);
    } else if (scrollDirection < 0 && currentScrollY < snapThreshold) {
      startExperienceSnap(0);
    }

    previousScrollY = currentScrollY;
  }, 140);
}

window.addEventListener('scroll', () => {
  scheduleExperienceSnap();
  if (scrollEffectsRaf) return;
  scrollEffectsRaf = requestAnimationFrame(() => {
    scrollEffectsRaf = null;
    applyScrollEffects();
  });
}, { passive: true });

window.addEventListener('resize', () => {
  applyScrollEffects();
});
updateTimelineImageParallax();

// Experience section + skills cards entrance animation
const skillsSection = document.getElementById('skills');
const experienceSection = document.getElementById('experience');
let skillsRevealTimer = null;

function revealSkillsAfterExperienceText() {
  if (!skillsSection || skillsSection.classList.contains('in-view')) return;

  const revealDelayMs = prefersReducedMotion ? 80 : 1200;
  if (skillsRevealTimer) {
    clearTimeout(skillsRevealTimer);
  }

  skillsRevealTimer = window.setTimeout(() => {
    skillsSection.classList.add('in-view');
    skillsRevealTimer = null;
  }, revealDelayMs);
}

const experienceObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      if (entry.target.id === 'experience') {
        revealSkillsAfterExperienceText();
      }
      experienceObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.01 });

if (experienceSection) {
  experienceObserver.observe(experienceSection);
} else {
  revealSkillsAfterExperienceText();
}

updateExperienceParallax();

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

// Email copy to clipboard
const emailBtn = document.getElementById('email-copy-btn');
if (emailBtn) {
  emailBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('hello@euancolley.com').then(() => {
      const contactInfo = emailBtn.querySelector('.contact-info');
      const originalHTML = contactInfo.innerHTML;
      contactInfo.innerHTML = '<p style="margin: 0; font-size: 0.95rem; font-family: sans-serif; color: #8A8989;">Copied to clipboard!</p>';
      setTimeout(() => {
        contactInfo.innerHTML = originalHTML;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy email address');
    });
  });
}

// Contact section reveal animation
const contactObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      contactObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

const contactSection = document.getElementById('contact');
if (contactSection) {
  contactObserver.observe(contactSection);
}
