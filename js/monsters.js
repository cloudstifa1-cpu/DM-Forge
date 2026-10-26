/**
 * Monsters — the free-rules monster list (SRD 5.1), homemade monsters,
 * and one-tap adding to the encounter, the initiative tracker or the notes vault.
 *
 * The monster list (data/monsters.json, ~330 monsters) only loads the first
 * time the Monsters tab is opened, so the app starts fast on small phones.
 * Homemade monsters are shared by every quest: localStorage 'dmforge_monsters_custom'.
 */

const Monsters = (() => {
  const CUSTOM_KEY = 'dmforge_monsters_custom';
  let srd = null;            // array once loaded
  let loading = null;
  let custom = [];
  let nextId = 1;

  function loadCustom() {
    try {
      const d = JSON.parse(localStorage.getItem(CUSTOM_KEY) || 'null');
      if (d && Array.isArray(d.list)) { custom = d.list; nextId = d.nextId || 1; }
    } catch (e) { custom = []; }
  }
  function saveCustom() {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify({ list: custom, nextId })); return true; }
    catch (e) { showToast('Could not save — phone storage is full.'); return false; }
  }

  function loadSRD() {
    if (srd) return Promise.resolve(srd);
    if (loading) return loading;
    loading = fetch('data/monsters.json')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(list => { srd = list.map((m, i) => Object.assign(m, { key: 's' + i })); return srd; })
      .catch(err => { loading = null; throw err; });
    return loading;
  }

  function all() { return custom.map(m => Object.assign(m, { key: 'c' + m.id, mine: true })).concat(srd || []); }
  function byKey(key) {
    if (!key) return null;
    if (key[0] === 'c') return custom.find(m => 'c' + m.id === key) || null;
    return srd ? srd.find(m => m.key === key) || null : null;
  }
  function addCustom(m) {
    const c = Object.assign({}, m, { id: nextId++, mine: true });
    delete c.key;
    custom.unshift(c);
    saveCustom();
    c.key = 'c' + c.id;
    return c;
  }
  function updateCustom(id, m) {
    const i = custom.findIndex(x => x.id === id);
    if (i < 0) return null;
    custom[i] = Object.assign({}, m, { id, mine: true, key: 'c' + id });
    saveCustom();
    return custom[i];
  }
  function removeCustom(id) { custom = custom.filter(x => x.id !== id); saveCustom(); }

  return { loadCustom, loadSRD, all, byKey, addCustom, updateCustom, removeCustom, isLoaded: () => !!srd };
})();

/* ── Helpers ─────────────────────────────────────────────────── */
const MON_STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const MON_SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
const MON_TYPES = ['aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental', 'fey', 'fiend',
  'giant', 'humanoid', 'monstrosity', 'ooze', 'plant', 'undead'];
const MON_CR_BANDS = [
  ['', 'Any CR'], ['0-1', 'CR 0 – 1'], ['2-4', 'CR 2 – 4'], ['5-10', 'CR 5 – 10'], ['11-16', 'CR 11 – 16'], ['17-30', 'CR 17+']
];

function crText(cr) {
  if (cr === 0.125) return '1/8';
  if (cr === 0.25) return '1/4';
  if (cr === 0.5) return '1/2';
  return String(cr);
}
function crNum(text) {
  const t = String(text).trim();
  if (t === '1/8') return 0.125;
  if (t === '1/4') return 0.25;
  if (t === '1/2') return 0.5;
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}
function monMod(score) { const m = Math.floor(((score || 10) - 10) / 2); return (m >= 0 ? '+' : '−') + Math.abs(m); }
function monDexMod(m) { return Math.floor((((m.st && m.st[1]) || 10) - 10) / 2); }
function monSub(m) { return (m.z || '') + ' ' + (m.t || '') + (m.al ? ', ' + m.al : ''); }

const monUI = { view: 'list', q: '', band: '', type: '', limit: 40 };

/* ── Tab rendering ───────────────────────────────────────────── */
function setMonView(view) {
  monUI.view = view;
  document.querySelectorAll('.mon-seg-btn').forEach(b => {
    const on = b.dataset.view === view;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
  document.getElementById('mon-root').hidden = view === 'encounter';
  document.getElementById('enc-view').hidden = view !== 'encounter';
  if (view === 'list') renderMonList();
  else if (view === 'mine') renderMyMonsters();
  else renderEncounter();
  updateEncCount();
}

function updateEncCount() {
  const el = document.getElementById('mon-enc-count');
  if (el) el.textContent = Encounter.getState().monsters.length || '';
}

function monTabActive() { const t = document.getElementById('tab-encounter'); return !!t && t.classList.contains('active'); }

function renderMonList() {
  const root = document.getElementById('mon-root');
  if (!Monsters.isLoaded() && !monTabActive()) { root.innerHTML = '<p class="ch-note">Loading monsters…</p>'; return; }  // load only when the tab is opened
  if (!Monsters.isLoaded()) {
    root.innerHTML = '<p class="ch-note">Loading monsters…</p>';
    Monsters.loadSRD().then(() => { if (monUI.view === 'list') renderMonList(); })
      .catch(() => { root.innerHTML = '<p class="ch-note">The monster list could not load. Open the app once while online so it can be saved for offline use.</p>'; });
    return;
  }
  root.innerHTML = `
    <div class="field-group">
      <label for="mon-q">Search monsters</label>
      <input class="field-input" id="mon-q" type="search" placeholder="Goblin, wolf, dragon…" autocomplete="off" value="${escHtml(monUI.q)}">
    </div>
    <div class="ch-grid2">
      <div class="field-group"><label for="mon-band">Challenge</label>
        <select class="field-input cr-select" id="mon-band">${MON_CR_BANDS.map(([v, l]) => `<option value="${v}"${v === monUI.band ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field-group"><label for="mon-type">Type</label>
        <select class="field-input cr-select" id="mon-type"><option value="">Any type</option>${MON_TYPES.map(t => `<option value="${t}"${t === monUI.type ? ' selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}</select></div>
    </div>
    <div id="mon-results"></div>
    <p class="mon-credit">Monsters from the System Reference Document 5.1 by Wizards of the Coast LLC, used under the Creative Commons Attribution 4.0 license.</p>`;
  const q = document.getElementById('mon-q');
  let t = null;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { monUI.q = q.value; monUI.limit = 40; fillMonResults(); }, 150); });
  document.getElementById('mon-band').addEventListener('change', e => { monUI.band = e.target.value; monUI.limit = 40; fillMonResults(); });
  document.getElementById('mon-type').addEventListener('change', e => { monUI.type = e.target.value; monUI.limit = 40; fillMonResults(); });
  fillMonResults();
}

function monMatches(m) {
  const q = monUI.q.trim().toLowerCase();
  if (q && m.n.toLowerCase().indexOf(q) < 0 && (m.t || '').toLowerCase().indexOf(q) < 0) return false;
  if (monUI.type && (m.t || '').toLowerCase().indexOf(monUI.type) !== 0) return false;
  if (monUI.band) {
    const [lo, hi] = monUI.band.split('-').map(Number);
    const cr = m.cr || 0;
    if (cr < lo || cr > hi) return false;
  }
  return true;
}

function monRowHTML(m) {
  return `<button class="mon-row" data-key="${m.key}">
    <span class="mon-cr">CR<b>${crText(m.cr)}</b></span>
    <span class="mon-info">
      <span class="mon-name">${escHtml(m.n)}${m.mine ? ' <span class="mon-tag">Homemade</span>' : ''}</span>
      <span class="mon-sub">${escHtml(monSub(m))}</span>
    </span>
    <span class="mon-nums"><b>${m.hp}</b> HP<br><b>${m.ac}</b> AC</span>
  </button>`;
}

function fillMonResults() {
  const box = document.getElementById('mon-results');
  if (!box) return;
  const q = monUI.q.trim().toLowerCase();
  const rank = m => { const n = m.n.toLowerCase(); return !q ? 1 : n === q ? 0 : n.indexOf(q) === 0 ? 1 : n.indexOf(q) >= 0 ? 2 : 3; };
  const hits = Monsters.all().filter(monMatches).sort((a, b) => rank(a) - rank(b) || a.n.localeCompare(b.n));
  const shown = hits.slice(0, monUI.limit);
  box.innerHTML = `<div class="mon-count">${hits.length} monster${hits.length === 1 ? '' : 's'}</div>` +
    (shown.length ? shown.map(monRowHTML).join('') : '<p class="saved-empty">No monsters match. Try fewer filters.</p>') +
    (hits.length > shown.length ? `<button class="btn btn-secondary btn-full" id="mon-more">Show more (${hits.length - shown.length} left)</button>` : '');
  box.querySelectorAll('.mon-row').forEach(r => r.addEventListener('click', () => openMonsterSheet(r.dataset.key)));
  const more = document.getElementById('mon-more');
  if (more) more.addEventListener('click', () => { monUI.limit += 60; fillMonResults(); });
}

function renderMyMonsters() {
  const root = document.getElementById('mon-root');
  const pro = isProUnlocked();
  const mine = Monsters.all().filter(m => m.mine);
  root.innerHTML = `
    <p class="ch-note">Make your own enemies — or copy one from the monster list and change it. Homemade monsters can be used in every quest.</p>
    ${pro ? '<button class="btn btn-primary btn-full ch-big-btn" id="mon-new">+ Make a monster</button>'
          : `<div class="pro-lock-banner">${typeof ICON_LOCK !== 'undefined' ? ICON_LOCK : ''}<span>Homemade monsters are Pro</span><button class="btn-inline-unlock js-unlock-pro">Unlock — $2.99</button></div>`}
    <div id="mon-mine-list" style="margin-top:14px">
      ${mine.length ? mine.map(monRowHTML).join('') : '<p class="saved-empty">No homemade monsters yet.</p>'}
    </div>`;
  const nb = document.getElementById('mon-new');
  if (nb) nb.addEventListener('click', () => openMonsterForm(null));
  root.querySelectorAll('.mon-row').forEach(r => r.addEventListener('click', () => openMonsterSheet(r.dataset.key)));
}

/* ── Stat block sheet ────────────────────────────────────────── */
function monSection(title, list) {
  if (!list || !list.length) return '';
  return `<div class="mon-sec">${title}</div>` +
    list.map(([n, d]) => `<p class="mon-act"><b>${escHtml(n)}.</b> ${escHtml(d)}</p>`).join('');
}
function monLine(label, v) { return v ? `<div class="mon-line"><b>${label}</b> ${escHtml(String(v))}</div>` : ''; }

function openMonsterSheet(key) {
  const m = Monsters.byKey(key);
  if (!m) return;
  let count = 1;
  const pro = isProUnlocked();
  const sheet = openSheet('mon-sheet', `
    <div class="lw-panel-header" style="--c:#8fcf6a">
      <div><div class="lw-panel-name mon-title">${escHtml(m.n)}</div><div class="lw-panel-sub">${escHtml(monSub(m))}</div></div>
      <button class="lw-panel-close lw-x" aria-label="Close">&times;</button>
    </div>
    <div class="lw-panel-body">
      <div class="mon-boxes">
        <div class="ch-dbox"><span class="ch-dval">${m.ac}</span><span class="ch-dlab">AC</span></div>
        <div class="ch-dbox"><span class="ch-dval">${m.hp}</span><span class="ch-dlab">HP</span></div>
        <div class="ch-dbox"><span class="ch-dval">${crText(m.cr)}</span><span class="ch-dlab">CR</span></div>
        <div class="ch-dbox"><span class="ch-dval">${(m.xp || Encounter.xpFor(crText(m.cr))).toLocaleString()}</span><span class="ch-dlab">XP</span></div>
      </div>
      ${monLine('Armor', m.acn)}${monLine('Hit dice', m.hd)}${monLine('Speed', m.sp)}
      <div class="mon-abil">${MON_STATS.map((s, i) => `<div><small>${s}</small><b>${(m.st || [])[i] || 10}</b><span>${monMod((m.st || [])[i])}</span></div>`).join('')}</div>
      ${monLine('Saves', m.sv)}${monLine('Skills', m.sk)}${monLine('Vulnerable', m.vu)}${monLine('Resists', m.re)}
      ${monLine('Immune', m.im)}${monLine('Condition immunities', m.ci)}${monLine('Senses', m.se)}${monLine('Languages', m.la)}
      ${monSection('Traits', m.sa)}${monSection('Actions', m.a)}${monSection('Reactions', m.r)}${monSection('Legendary actions', m.lg)}
      ${m.notes ? `<div class="mon-sec">Notes</div><p class="mon-act">${escHtml(m.notes)}</p>` : ''}

      <div class="mon-add">
        <div class="mon-count-row">
          <span>How many?</span>
          <button class="ch-step" id="mon-minus" aria-label="Fewer">−</button>
          <span class="ch-level-num" id="mon-n">1</span>
          <button class="ch-step" id="mon-plus" aria-label="More">+</button>
        </div>
        <button class="btn btn-primary btn-full" id="mon-to-init">Add to fight (initiative)</button>
        <button class="btn btn-secondary btn-full" id="mon-to-enc">Add to encounter</button>
        <button class="btn btn-secondary btn-full" id="mon-to-vault">Save to notes vault</button>
        ${m.mine
          ? `<div class="mon-two"><button class="btn btn-secondary" id="mon-edit">Edit</button><button class="btn btn-danger" id="mon-del">Delete</button></div>`
          : `<button class="btn btn-secondary btn-full" id="mon-copy">Copy &amp; change it${pro ? '' : ' <span class="ch-pro-tag">PRO</span>'}</button>`}
      </div>
    </div>`);
  const p = sheet.panel;
  const $ = id => p.querySelector('#' + id);
  const setN = n => { count = Math.max(1, Math.min(20, n)); $('mon-n').textContent = count; };
  $('mon-minus').addEventListener('click', () => setN(count - 1));
  $('mon-plus').addEventListener('click', () => setN(count + 1));
  $('mon-to-init').addEventListener('click', () => {
    const names = addMonstersToInitiative(m, count);
    showToast(names.length === 1 ? names[0] + ' joined the fight.' : names.length + ' ' + m.n + 's joined the fight.');
    closeSheet(sheet);
  });
  $('mon-to-enc').addEventListener('click', () => {
    for (let i = 0; i < count; i++) Encounter.addMonster({ name: m.n, cr: crText(m.cr), ref: m.key, hp: m.hp, ac: m.ac, dex: monDexMod(m) });
    updateEncCount();
    if (monUI.view === 'encounter') renderEncounter();
    const d = Encounter.getDifficulty();
    showToast('Added ' + count + ' to the encounter — now ' + d.label + '.');
  });
  $('mon-to-vault').addEventListener('click', () => {
    const existing = Vault.getAll().find(e => e.type === 'creature' && e.name.toLowerCase() === m.n.toLowerCase());
    if (existing) { showToast(m.n + ' is already in this quest\'s vault.'); return; }
    Vault.add('creature', m.n, {
      details: monSub(m) + '. Speed ' + (m.sp || '—') + '. ' + (m.a || []).map(a => a[0] + ': ' + a[1]).join(' '),
      fields: { hpCur: String(m.hp), hpMax: String(m.hp), ac: String(m.ac), cr: crText(m.cr), attitude: 'Hostile' }
    });
    if (typeof linksChanged === 'function') linksChanged();
    showToast(m.n + ' saved. Its name now links in your notes.');
  });
  if ($('mon-copy')) $('mon-copy').addEventListener('click', () => {
    if (!isProUnlocked()) { showToast('Homemade monsters are part of Pro.'); return; }
    closeSheet(sheet);
    const copy = JSON.parse(JSON.stringify(m));
    delete copy.key; copy.n = m.n + ' (copy)';
    openMonsterForm(copy);
  });
  if ($('mon-edit')) $('mon-edit').addEventListener('click', () => { closeSheet(sheet); openMonsterForm(m); });
  if ($('mon-del')) $('mon-del').addEventListener('click', () => {
    if (!confirm('Delete ' + m.n + '?')) return;
    Monsters.removeCustom(m.id);
    closeSheet(sheet);
    if (monUI.view === 'mine') renderMyMonsters(); else if (monUI.view === 'list') fillMonResults();
  });
}

// Adds count copies, numbered so each has its own HP: Goblin 1, Goblin 2…
function addMonstersToInitiative(m, count) {
  const existing = Initiative.getState().combatants.map(c => c.name);
  const base = m.n;
  const re = new RegExp('^' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?: (\\d+))?$', 'i');
  let maxN = 0, plain = false;
  existing.forEach(n => { const x = n.match(re); if (x) { if (x[1]) maxN = Math.max(maxN, +x[1]); else plain = true; } });
  const numbered = count > 1 || maxN > 0 || plain;
  const names = [];
  let k = Math.max(maxN, plain ? 1 : 0);
  for (let i = 0; i < count; i++) {
    const name = numbered ? base + ' ' + (++k) : base;
    const roll = 1 + Math.floor(Math.random() * 20) + monDexMod(m);
    Initiative.addCombatant({ name, initiative: roll, hp: m.hp, type: 'monster' });
    names.push(name);
  }
  renderInitiative();
  return names;
}

/* ── Homemade monster form (Pro) ─────────────────────────────── */
function openMonsterForm(src) {
  const editing = src && src.mine && src.id != null;
  const m = src || { n: '', z: 'Medium', t: 'humanoid', al: '', ac: 12, hp: 10, hd: '', sp: '30 ft.', st: [10, 10, 10, 10, 10, 10], cr: 0.25 };
  const actText = (m.a || []).map(a => a[0] + ': ' + a[1]).join('\n');
  const traitText = (m.sa || []).map(a => a[0] + ': ' + a[1]).join('\n');
  const crOpts = Encounter.getState().crOptions;
  const sheet = openSheet('mon-sheet', `
    <div class="lw-panel-header">
      <div><div class="lw-panel-name">${editing ? 'Edit monster' : 'Make a monster'}</div><div class="lw-panel-sub">Only the name is needed.</div></div>
      <button class="lw-panel-close lw-x" aria-label="Close">&times;</button>
    </div>
    <div class="lw-panel-body">
      <div class="field-group"><label for="mf-n">Name</label><input class="field-input" id="mf-n" type="text" maxlength="60" value="${escHtml(m.n)}" placeholder="e.g. Bog Hag" autocomplete="off"></div>
      <div class="ch-grid2">
        <div class="field-group"><label for="mf-z">Size</label><select class="field-input cr-select" id="mf-z">${MON_SIZES.map(s => `<option${s === m.z ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="field-group"><label for="mf-t">Type</label><input class="field-input" id="mf-t" type="text" maxlength="40" list="mf-types" value="${escHtml(m.t || '')}"><datalist id="mf-types">${MON_TYPES.map(t => `<option value="${t}">`).join('')}</datalist></div>
      </div>
      <div class="ch-grid3">
        <div class="field-group"><label for="mf-cr">CR</label><select class="field-input cr-select" id="mf-cr">${crOpts.map(c => `<option${c === crText(m.cr) ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field-group"><label for="mf-ac">AC</label><input class="field-input en-num" id="mf-ac" type="number" inputmode="numeric" min="1" max="40" value="${m.ac}"></div>
        <div class="field-group"><label for="mf-hp">HP</label><input class="field-input en-num" id="mf-hp" type="number" inputmode="numeric" min="1" max="999" value="${m.hp}"></div>
      </div>
      <div class="field-group"><label for="mf-sp">Speed</label><input class="field-input" id="mf-sp" type="text" maxlength="60" value="${escHtml(m.sp || '')}" placeholder="30 ft., fly 60 ft."></div>
      <div class="ch-grid3">
        ${MON_STATS.map((s, i) => `<div class="field-group"><label for="mf-s${i}">${s}</label><input class="field-input en-num" id="mf-s${i}" type="number" inputmode="numeric" min="1" max="30" value="${(m.st || [])[i] || 10}"></div>`).join('')}
      </div>
      <div class="field-group"><label for="mf-a">Attacks &amp; actions <span class="ch-hint">— one per line, "Name: what it does"</span></label>
        <textarea class="field-input ch-ta" id="mf-a" rows="4" placeholder="Bite: +4 to hit, 7 (1d10 + 2) piercing damage.">${escHtml(actText)}</textarea></div>
      <div class="field-group"><label for="mf-sa">Special abilities <span class="ch-hint">— one per line</span></label>
        <textarea class="field-input ch-ta" id="mf-sa" rows="3" placeholder="Pack Tactics: advantage when an ally is nearby.">${escHtml(traitText)}</textarea></div>
      <div class="field-group"><label for="mf-notes">Notes</label>
        <textarea class="field-input ch-ta" id="mf-notes" rows="2">${escHtml(m.notes || '')}</textarea></div>
      <button class="btn btn-primary btn-full ch-big-btn" id="mf-save">${editing ? 'Save changes' : 'Save monster'}</button>
    </div>`);
  const p = sheet.panel;
  const $ = id => p.querySelector('#' + id);
  setTimeout(() => $('mf-n').focus(), 60);
  const lines = txt => txt.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf(':');
    return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['', l];
  });
  $('mf-save').addEventListener('click', () => {
    const n = $('mf-n').value.trim();
    if (!n) { showToast('Give your monster a name.'); $('mf-n').focus(); return; }
    const num = (id, lo, hi, d) => { const v = parseInt($(id).value, 10); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); };
    const cr = crNum($('mf-cr').value);
    const data = Object.assign({}, m, {
      n, z: $('mf-z').value, t: $('mf-t').value.trim() || 'monstrosity', ac: num('mf-ac', 1, 40, 10), hp: num('mf-hp', 1, 999, 10),
      sp: $('mf-sp').value.trim(), st: MON_STATS.map((s, i) => num('mf-s' + i, 1, 30, 10)),
      cr, xp: Encounter.xpFor(crText(cr)), a: lines($('mf-a').value), sa: lines($('mf-sa').value), notes: $('mf-notes').value.trim()
    });
    delete data.key; delete data.mine;
    const saved = editing ? Monsters.updateCustom(m.id, data) : Monsters.addCustom(data);
    closeSheet(sheet);
    showToast(saved.n + ' saved.');
    setMonView('mine');
    openMonsterSheet(saved.key);
  });
}

function setupMonstersUI() {
  Monsters.loadCustom();
  document.querySelectorAll('.mon-seg-btn').forEach(b => b.addEventListener('click', () => setMonView(b.dataset.view)));
  setMonView('list');
  const nav = document.querySelector('.nav-tab[data-tab="encounter"]');
  if (nav) nav.addEventListener('click', () => { if (monUI.view === 'list' && !Monsters.isLoaded()) setTimeout(renderMonList, 0); });
  setTimeout(() => { if (monUI.view === 'list' && monTabActive() && !Monsters.isLoaded()) renderMonList(); }, 0);
}
// The Monsters tab redraws itself when Pro turns on/off
function onMonstersProChange() { if (monUI.view === 'mine') renderMyMonsters(); }
