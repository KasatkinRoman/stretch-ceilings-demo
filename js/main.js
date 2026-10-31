// Mobile menu (keyboard friendly) and the real header height for scroll-padding.

const DESKTOP_QUERY = '(min-width: 1080px)';

function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  toggle.addEventListener('click', () => setOpen(!isOpen()));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (isOpen() && !event.target.closest('.site-header')) setOpen(false);
  });
  window.matchMedia(DESKTOP_QUERY).addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

/** Keeps --header-h equal to the sticky header height (it wraps on narrow screens). */
function trackHeaderHeight() {
  const header = document.querySelector('.site-header');
  if (!header || !('ResizeObserver' in window)) return;
  const row = header.querySelector('.header-row') || header;
  const update = () => document.documentElement.style.setProperty('--header-h', `${row.offsetHeight + 1}px`);
  new ResizeObserver(update).observe(row);
  update();
}

initMenu();
trackHeaderHeight();
