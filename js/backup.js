/**
 * Backup & Restore
 *
 * Everything DM Forge saves lives in this phone's browser storage under keys
 * that start with "dmforge_". If the browser clears its data, it's gone.
 * Backup writes every one of those keys into one .json file the DM keeps.
 * Restore reads that file back in.
 *
 * The pure parts (collect / validate / restore) take a storage object so
 * they can be tested without a browser — see tests/backup.test.js.
 */

const Backup = (() => {
  const PREFIX = 'dmforge_';
  const LAST_KEY = 'dmforge_last_backup';
  const FIRST_KEY = 'dmforge_first_use';
  // Device-only keys that should never be copied between phones
  const SKIP = ['dmforge_launched', 'dmforge_tab', LAST_KEY, FIRST_KEY];
  const REMIND_DAYS = 7;

  function keysOf(storage) {
    const out = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.indexOf(PREFIX) === 0 && SKIP.indexOf(k) < 0) out.push(k);
    }
    return out.sort();
  }

  function collect(storage, when) {
    const data = {};
    keysOf(storage).forEach(k => { data[k] = storage.getItem(k); });
    return { app: 'DM Forge', format: 1, savedAt: when || new Date().toISOString(), data };
  }

  // Returns an error message, or '' when the file is a good DM Forge backup
  function validate(obj) {
    if (!obj || typeof obj !== 'object') return 'That file is not a DM Forge backup.';
    if (obj.app !== 'DM Forge' || !obj.data || typeof obj.data !== 'object') return 'That file is not a DM Forge backup.';
    const keys = Object.keys(obj.data);
    if (!keys.length) return 'That backup is empty.';
    for (const k of keys) {
      if (k.indexOf(PREFIX) !== 0) return 'That backup has data DM Forge does not use.';
      if (typeof obj.data[k] !== 'string') return 'That backup file is damaged.';
    }
    return '';
  }

  // Replaces this device's DM Forge data with the backup's. Returns how many items were restored.
  function restore(storage, obj) {
    const err = validate(obj);
    if (err) throw new Error(err);
    keysOf(storage).forEach(k => storage.removeItem(k));
    const keys = Object.keys(obj.data);
    keys.forEach(k => storage.setItem(k, obj.data[k]));
    return keys.length;
  }

  function daysSince(iso, nowMs) {
    if (!iso) return Infinity;
    const t = Date.parse(iso);
    if (isNaN(t)) return Infinity;
    return Math.floor(((nowMs || Date.now()) - t) / 86400000);
  }

  function needsReminder(storage, nowMs) {
    if (!keysOf(storage).length) return false;           // nothing to lose yet
    // Count from the last backup, or from first use if there has never been one
    const since = storage.getItem(LAST_KEY) || storage.getItem(FIRST_KEY);
    return daysSince(since, nowMs) >= REMIND_DAYS;
  }

  function markFirstUse(storage, when) {
    if (!storage.getItem(FIRST_KEY)) storage.setItem(FIRST_KEY, when || new Date().toISOString());
  }

  function fileName(when) {
    return 'dm-forge-backup-' + String(when || new Date().toISOString()).slice(0, 10) + '.json';
  }

  return { PREFIX, LAST_KEY, FIRST_KEY, markFirstUse, REMIND_DAYS, keysOf, collect, validate, restore, daysSince, needsReminder, fileName };
})();

if (typeof module !== 'undefined') module.exports = Backup;

/* ── Browser side ──────────────────────────────────────────── */

function backupLastText() {
  let last = null;
  try { last = localStorage.getItem(Backup.LAST_KEY); } catch (e) {}
  if (!last) return 'You have never made a backup.';
  const d = Backup.daysSince(last);
  return 'Last backup: ' + (d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago') + '.';
}

function renderBackupStatus() {
  const el = document.getElementById('backup-status');
  if (el) el.textContent = backupLastText();
}

async function runBackup() {
  const snap = Backup.collect(localStorage);
  const text = JSON.stringify(snap);
  const name = Backup.fileName(snap.savedAt);
  const blob = new Blob([text], { type: 'application/json' });
  let done = false;
  // Phones: the share sheet lets the DM save to Files, Drive or email
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'DM Forge backup' });
      done = true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') { showToast('Backup cancelled.'); return; }
  }
  if (!done) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  try { localStorage.setItem(Backup.LAST_KEY, snap.savedAt); } catch (e) {}
  renderBackupStatus();
  hideBackupReminder();
  showToast('Backup saved: ' + name);
}

function runRestore(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let obj = null;
    try { obj = JSON.parse(reader.result); } catch (e) {}
    const err = Backup.validate(obj);
    if (err) { showToast(err, 3500); return; }
    const when = obj.savedAt ? new Date(obj.savedAt).toLocaleDateString() : 'an unknown date';
    if (!confirmRestore(when)) return;
    try {
      const n = Backup.restore(localStorage, obj);
      try { localStorage.setItem(Backup.LAST_KEY, obj.savedAt || new Date().toISOString()); } catch (e) {}
      showToast('Restored ' + n + ' saved items. Reloading…');
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      showToast('Restore failed: ' + e.message, 3500);
    }
  };
  reader.readAsText(file);
}

// Uses the app's own sheet instead of a browser pop-up dialog
let restorePending = null;
function confirmRestore(when) {
  if (restorePending === when) { restorePending = null; return true; }
  restorePending = when;
  const box = document.getElementById('restore-confirm');
  if (box) {
    box.hidden = false;
    box.querySelector('.restore-when').textContent = when;
  }
  return false;
}

function hideBackupReminder() {
  const r = document.getElementById('backup-reminder');
  if (r) r.hidden = true;
}

function setupBackupUI() {
  const input = document.getElementById('restore-file');
  let pendingFile = null;
  const backupBtn = document.getElementById('backup-btn');
  if (backupBtn) backupBtn.addEventListener('click', runBackup);
  const restoreBtn = document.getElementById('restore-btn');
  if (restoreBtn) restoreBtn.addEventListener('click', () => input && input.click());
  if (input) input.addEventListener('change', () => {
    pendingFile = input.files && input.files[0];
    input.value = '';
    if (pendingFile) { restorePending = null; runRestore(pendingFile); }
  });
  const yes = document.getElementById('restore-yes');
  if (yes) yes.addEventListener('click', () => {
    document.getElementById('restore-confirm').hidden = true;
    if (pendingFile) runRestore(pendingFile);     // second pass: restorePending matches, so it goes ahead
  });
  const no = document.getElementById('restore-no');
  if (no) no.addEventListener('click', () => {
    document.getElementById('restore-confirm').hidden = true;
    restorePending = null; pendingFile = null;
  });

  // Weekly nudge banner at the top of the app
  const remind = document.getElementById('backup-reminder');
  let show = false;
  try { Backup.markFirstUse(localStorage); show = Backup.needsReminder(localStorage); } catch (e) {}
  if (remind && show) remind.hidden = false;
  const remindBtn = document.getElementById('backup-reminder-btn');
  if (remindBtn) remindBtn.addEventListener('click', runBackup);
  const remindX = document.getElementById('backup-reminder-x');
  if (remindX) remindX.addEventListener('click', hideBackupReminder);
  renderBackupStatus();
}
