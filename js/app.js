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

// ── Pro state ──────────────────────────────────────────────
const PRO_TABS = ['npc','loot','notes','spells'];

let proUnlocked = false;
let proTapCount = 0;
let proTapTimer = null;

function isProUnlocked() {
  if (proUnlocked) return true;
  try { return localStorage.getItem('dmforge_pro') === '1'; } catch (e) { return false; }
}

function unlockPro(silent = false) {
  proUnlocked = true;
  try { localStorage.setItem('dmforge_pro', '1'); } catch (e) {}
  applyProState();
  if (!silent) showToast('Pro unlocked! All features are now available.');
}

function lockPro() {
  proUnlocked = false;
  try { localStorage.removeItem('dmforge_pro'); } catch (e) {}
  applyProState();
  showToast('Pro locked. Dev mode off.');
}

function applyProState() {
  const unlocked = isProUnlocked();
  // Show/hide lock banners
  PRO_TABS.forEach(tab => {
    const banner = document.getElementById(`${tab}-lock-banner`);
    if (banner) banner.hidden = unlocked;
  });
  // Style pro tabs
  document.querySelectorAll('.nav-tab.pro-tab').forEach(t => {
    t.classList.toggle('pro-locked', !unlocked);
  });
  // Characters tab is free, but its portrait builder and pre-made heroes are Pro
  if (typeof onCharactersProChange === 'function') onCharactersProChange();
  // Update dev badge
  const badge = document.getElementById('dev-pro-badge');
  if (badge) {
    badge.textContent = unlocked ? 'Pro ON' : 'Pro OFF';
    badge.classList.toggle('pro-on', unlocked);
  }
}

// Dev toggle: tap the lock icon 5 times
function setupDevProToggle() {
  const badge = document.getElementById('dev-pro-badge');
  if (!badge) return;
  badge.addEventListener('click', () => {
    if (isProUnlocked()) {
      lockPro();
    } else {
      proTapCount++;
      clearTimeout(proTapTimer);
      if (proTapCount >= 5) {
        proTapCount = 0;
        unlockPro();
      } else {
        showToast(`Tap ${5 - proTapCount} more time${5 - proTapCount !== 1 ? 's' : ''} to toggle Pro.`, 1500);
        proTapTimer = setTimeout(() => { proTapCount = 0; }, 3000);
      }
    }
  });
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

  // Names may have been added or changed on another tab
  if (tabId === 'notes' && typeof onNotesTabShown === 'function') onNotesTabShown();
  if (tabId === 'characters' && typeof onCharactersTabShown === 'function') onCharactersTabShown();
}

function setupTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      // Pro tabs: navigate but show lock banner if not unlocked
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
  document.addEventListener('click', e => {
    if (e.target.closest('.js-unlock-pro')) {
      showToast('Payment integration coming soon — stay tuned!');
    }
  });
}

// ── Service Worker ─────────────────────────────────────────
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('service-worker.js').then(reg => {
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
  Vault.load();          // shared NPC / place / item / … store (migrates old data once)
  Characters.load();
  setupLanding();
  setupTabs();
  setupProUnlock();
  setupDevProToggle();
  // Apply Pro state on load (restores from localStorage)
  if (isProUnlocked()) unlockPro(true);
  else applyProState();
  setupInitiativeUI();
  setupEncounterUI();
  setupCharactersUI();
  setupNPCUI();
  setupLootUI();
  setupNotesUI();
  setupSpellsUI();
  registerServiceWorker();
});
