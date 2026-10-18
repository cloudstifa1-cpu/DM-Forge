/**
 * DM Forge — Main application entry point
 * Tab routing, PWA registration, shared utilities
 */

// ── Toast notifications ────────────────────────────────────
function showToast(msg, duration = 2500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ── Landing / app shell toggle ────────────────────────────
function setupLanding() {
  // If user has launched before, skip landing and go straight to app
  let hasLaunched = false;
  try { hasLaunched = localStorage.getItem('dmforge_launched') === '1'; } catch (e) {}

  // Also skip if a ?tab= param is in the URL (deep link from PWA shortcut)
  const params = new URLSearchParams(window.location.search);
  if (hasLaunched || params.get('tab')) {
    document.body.classList.add('app-launched');
  }

  const launchBtn = document.getElementById('launch-app-btn');
  if (launchBtn) {
    launchBtn.addEventListener('click', () => {
      document.body.classList.add('app-launched');
      try { localStorage.setItem('dmforge_launched', '1'); } catch (e) {}
    });
  }
}

// ── Tab routing ────────────────────────────────────────────
function activateTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const panel = document.getElementById(`tab-${tabId}`);
  const tabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);

  if (panel) panel.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');

  try { localStorage.setItem('dmforge_tab', tabId); } catch (e) {}
}

function setupTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (btn.classList.contains('locked')) {
        showToast('Unlock DM Forge Pro to access this feature.');
        return;
      }
      activateTab(tab);
    });
  });

  // Restore last tab or check URL param
  const params = new URLSearchParams(window.location.search);
  const urlTab = params.get('tab');
  let startTab = 'initiative';
  try {
    startTab = urlTab || localStorage.getItem('dmforge_tab') || 'initiative';
  } catch (e) {}

  activateTab(startTab);
}

// ── Pro unlock (placeholder) ───────────────────────────────
function setupProUnlock() {
  document.querySelectorAll('.js-unlock-pro').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('Payment integration coming soon — stay tuned!');
      // TODO: integrate payment (Stripe, PayPal, or in-app purchase)
    });
  });
}

// ── Service Worker ─────────────────────────────────────────
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/service-worker.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('App updated — reload to get the latest version.');
        }
      });
    });
  }).catch(err => {
    console.warn('Service worker registration failed:', err);
  });
}

// ── App init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupLanding();
  setupTabs();
  setupProUnlock();
  setupInitiativeUI();
  setupEncounterUI();
  registerServiceWorker();
});
