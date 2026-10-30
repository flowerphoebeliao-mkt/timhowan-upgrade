(() => {
  'use strict';
  const toggle = document.getElementById('mobileNavToggle');
  const nav = document.getElementById('nav');
  function setMenu(open, restoreFocus = false) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });
  window.addEventListener('resize', () => { if (innerWidth > 760) setMenu(false); });
  window.addEventListener('pageshow', () => setMenu(false));
  function updateViewport() {
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  }
  updateViewport();
  window.addEventListener('resize', updateViewport);

  // Keep the background stationary on iOS and restore the trigger/scroll on close.
  let savedScroll = 0;
  let bodyStyles = null;
  const stack = [];
  const focusable = root => [...root.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')]
    .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
  function lockBody(scroll = window.scrollY) {
    if (bodyStyles) return;
    savedScroll = scroll;
    bodyStyles = {};
    ['position', 'top', 'left', 'right', 'width'].forEach(key => { bodyStyles[key] = document.body.style[key]; });
    Object.assign(document.body.style, { position: 'fixed', top: `-${savedScroll}px`, left: '0', right: '0', width: '100%' });
  }
  function unlockBody() {
    if (!bodyStyles) return;
    Object.assign(document.body.style, bodyStyles);
    bodyStyles = null;
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, savedScroll);
    root.style.scrollBehavior = previous;
  }
  const dialogs = [
    ['openNewsArticle', 'closeNewsArticle', 'articleOverlay', '.article-dialog'],
    ['openMenuPopup', 'closeMenuPopup', 'menuPopup', '.menu-popup-panel'],
    ['openLocationPopup', 'closeLocationPopup', 'locationModal', '.location-panel']
  ];
  dialogs.forEach(([openName, closeName, id, panelSelector]) => {
    const overlay = document.getElementById(id);
    const panel = overlay.querySelector(panelSelector);
    panel.setAttribute('tabindex', '-1');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    if (id === 'menuPopup') panel.setAttribute('aria-label', '美味菜單');
    overlay.setAttribute('aria-hidden', 'true');
    const originalOpen = window[openName];
    const originalClose = window[closeName];
    window[openName] = function (...args) {
      const trigger = document.activeElement;
      const scroll = window.scrollY;
      originalOpen(...args);
      if (!overlay.classList.contains('is-open')) return;
      if (!stack.some(entry => entry.overlay === overlay)) stack.push({ overlay, panel, trigger, closeName });
      setMenu(false);
      overlay.setAttribute('aria-hidden', 'false');
      lockBody(scroll);
      (focusable(panel)[0] || panel).focus({ preventScroll: true });
    };
    window[closeName] = function (...args) {
      const index = stack.findIndex(entry => entry.overlay === overlay);
      const entry = index >= 0 ? stack.splice(index, 1)[0] : null;
      originalClose(...args);
      overlay.setAttribute('aria-hidden', 'true');
      if (!stack.length) unlockBody();
      if (entry?.trigger?.isConnected) entry.trigger.focus({ preventScroll: true });
    };
  });
  // The privacy dialog keeps its original focus handling; share iOS scroll locking.
  const privacy = document.getElementById('privacyPolicyModal');
  new MutationObserver(() => {
    if (!privacy.hidden) lockBody();
    else if (!stack.length) unlockBody();
  }).observe(privacy, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    const current = stack[stack.length - 1];
    if (!current || !privacy.hidden) return;
    if (event.key === 'Tab') {
      const detail = document.getElementById('menuDishDetail');
      const root = current.overlay.id === 'menuPopup' && detail.classList.contains('active') ? detail : current.panel;
      const elements = focusable(root);
      const first = elements[0] || root;
      const last = elements[elements.length - 1] || root;
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  });
})();
