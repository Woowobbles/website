(function () {
  const logoWhite = document.getElementById('logo-white');
  if (!logoWhite) return;

  const header = document.querySelector('header');
  const themedTargets = Array.from(document.querySelectorAll('[data-logo-theme]'));
  if (themedTargets.length === 0) return;

  const normalizeTheme = (value) => {
    if (typeof value !== 'string') return null;
    const theme = value.trim().toLowerCase();
    if (theme === 'light' || theme === 'dark') return theme;
    return null;
  };

  const getProbeY = () => {
    const headerBottom = header ? header.getBoundingClientRect().bottom : 56;
    return Math.max(0, Math.min((window.innerHeight || 1) - 1, headerBottom + 8));
  };

  const getActiveTheme = () => {
    const probeY = getProbeY();
    let activeTheme = null;

    for (const target of themedTargets) {
      const theme = normalizeTheme(target.getAttribute('data-logo-theme'));
      if (!theme) continue;
      const rect = target.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom > probeY) {
        activeTheme = theme;
      }
    }

    if (activeTheme) return activeTheme;

    let nearestTheme = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const target of themedTargets) {
      const theme = normalizeTheme(target.getAttribute('data-logo-theme'));
      if (!theme) continue;
      const rect = target.getBoundingClientRect();
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!isVisible) continue;

      const distance = Math.min(Math.abs(rect.top - probeY), Math.abs(rect.bottom - probeY));
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTheme = theme;
      }
    }

    return nearestTheme;
  };

  const applyTheme = () => {
    const activeTheme = getActiveTheme();
    if (!activeTheme) return;

    const useDarkLogo = activeTheme === 'light';
    document.documentElement.classList.toggle('logo-use-dark', useDarkLogo);
  };

  let ticking = false;
  const requestApplyTheme = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      applyTheme();
    });
  };

  window.addEventListener('scroll', requestApplyTheme, { passive: true });
  window.addEventListener('resize', requestApplyTheme);
  window.addEventListener('pageshow', requestApplyTheme);

  requestApplyTheme();
}());
