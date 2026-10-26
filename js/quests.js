/**
 * Quests (campaigns)
 *
 * Each quest keeps its OWN session notes, linked-word vault, initiative
 * tracker and encounter builder. Player characters live in one shared
 * roster; each quest has a "party" — the characters playing in it.
 *
 * Storage:
 *   dmforge_quests              index { list:[{id,name,createdAt,lastPlayed,party:[charId]}], currentId, nextId }
 *   dmforge_q<id>_<part>        that quest's data (part = initiative | encounter | notes | vault)
 *   dmforge_characters          shared character roster (characters.js)
 *
 * Switching quests reloads the page so every tool starts clean from the
 * chosen quest's saved data. This file must load before the other modules.
 */

const Quests = (() => {
  const INDEX = 'dmforge_quests';
  const PARTS = ['initiative', 'encounter', 'notes', 'vault'];
  let idx = null;

  function now() { return new Date().toISOString(); }
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function write() { try { localStorage.setItem(INDEX, JSON.stringify(idx)); return true; } catch (e) { return false; } }
  function keyFor(id, part) { return 'dmforge_q' + id + '_' + part; }

  function init() {
    idx = read(INDEX);
    if (!idx || !Array.isArray(idx.list) || !idx.list.length) {
      // First run with quests: everything the user already has becomes "My First Quest"
      const chars = read('dmforge_characters');
      idx = {
        list: [{ id: 1, name: 'My First Quest', createdAt: now(), lastPlayed: now(),
                 party: ((chars && chars.list) || []).map(c => c.id), legacy: true }],
        currentId: 1, nextId: 2
      };
      PARTS.forEach(p => {
        const v = localStorage.getItem('dmforge_' + p);    // old single-quest data stays as a backup
        if (v != null) { try { localStorage.setItem(keyFor(1, p), v); } catch (e) {} }
      });
    }
    idx.list.forEach(q => { if (!Array.isArray(q.party)) q.party = []; });
    if (!current()) idx.currentId = idx.list[0].id;
    current().lastPlayed = now();
    write();
  }

  function current() { return idx.list.find(q => q.id === idx.currentId) || null; }
  function get(id) { return idx.list.find(q => q.id === id) || null; }
  function getAll() { return idx.list.slice().sort((a, b) => (b.lastPlayed || '').localeCompare(a.lastPlayed || '')); }
  function key(part) { return keyFor(idx.currentId, part); }
  // Only the quest made from pre-quest data may pull in the very old NPC/place/item stores
  function isLegacy() { const q = current(); return !!(q && q.legacy); }

  function sessionCount(q) {
    const d = read(keyFor(q.id, 'notes'));
    return d && Array.isArray(d.sessions) ? d.sessions.length : 0;
  }

  // ── Party ──
  function partyIds() { const q = current(); return q ? q.party.slice() : []; }
  function inParty(charId) { const q = current(); return !!q && q.party.indexOf(charId) >= 0; }
  function addToParty(charId) {
    const q = current();
    if (q && q.party.indexOf(charId) < 0) { q.party.push(charId); write(); }
  }
  function removeFromParty(charId) {
    const q = current();
    if (q) { q.party = q.party.filter(id => id !== charId); write(); }
  }
  function forgetCharacter(charId) {
    idx.list.forEach(q => { q.party = q.party.filter(id => id !== charId); });
    write();
  }

  // ── Quest management ──
  function create(name, bringIds) {
    const q = { id: idx.nextId++, name: String(name || '').trim() || 'New Quest',
                createdAt: now(), lastPlayed: now(), party: (bringIds || []).slice() };
    idx.list.push(q);
    write();
    return q;
  }
  function rename(id, name) {
    const q = get(id);
    if (q && String(name || '').trim()) { q.name = String(name).trim(); write(); }
  }
  function remove(id) {
    if (idx.list.length <= 1) return false;
    PARTS.forEach(p => { try { localStorage.removeItem(keyFor(id, p)); } catch (e) {} });
    idx.list = idx.list.filter(q => q.id !== id);
    const wasCurrent = idx.currentId === id;
    if (wasCurrent) idx.currentId = getAll()[0].id;
    write();
    return wasCurrent;
  }
  function switchTo(id) {
    if (!get(id)) return;
    idx.currentId = id;
    get(id).lastPlayed = now();
    write();
    location.reload();
  }

  init();
  return { key, current, get, getAll, isLegacy, sessionCount, partyIds, inParty, addToParty,
           removeFromParty, forgetCharacter, create, rename, remove, switchTo };
})();

// Characters playing in the current quest (used by notes linking and initiative)
function partyCharacters() {
  if (typeof Characters === 'undefined') return [];
  return Characters.getAll().filter(c => Quests.inParty(c.id));
}

/* ══════════════════════════════════════════════════════════════
   Quest switcher UI (header button + bottom sheet)
   ══════════════════════════════════════════════════════════════ */
function renderQuestButton() {
  const el = document.getElementById('quest-name');
  const q = Quests.current();
  if (el && q) el.textContent = q.name;
}

function fmtDay(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch (e) { return ''; }
}

function openQuestSheet() {
  const sheet = openSheet('qs-sheet', `
    <div class="lw-panel-header">
      <div><div class="lw-panel-name">Quests</div><div class="lw-panel-sub">Each quest keeps its own notes, vault, initiative and encounters.</div></div>
      <button class="lw-panel-close lw-x" aria-label="Close">&times;</button>
    </div>
    <div class="lw-panel-body" id="qs-body"></div>`);
  const body = sheet.panel.querySelector('#qs-body');

  function renderList() {
    const cur = Quests.current();
    const all = Quests.getAll();
    body.innerHTML = `
      <button class="btn btn-primary btn-full qs-new" id="qs-new">+ New quest${!isProUnlocked() && all.length >= 1 ? ' <span class="ch-pro-tag">PRO</span>' : ''}</button>
      <div class="qs-list">
        ${all.map(q => `
          <div class="qs-row${q.id === cur.id ? ' on' : ''}">
            <button class="qs-main" data-id="${q.id}">
              <span class="qs-name">${escHtml(q.name)}</span>
              <span class="qs-meta">${q.id === cur.id ? '<b class="qs-now">Playing now</b> · ' : ''}Last played ${escHtml(fmtDay(q.lastPlayed))}</span>
              <span class="qs-meta">${q.party.length} in party · ${Quests.sessionCount(q)} session${Quests.sessionCount(q) === 1 ? '' : 's'}</span>
            </button>
            <div class="qs-tools">
              <button class="qs-tool" data-act="rename" data-id="${q.id}">Rename</button>
              ${all.length > 1 ? `<button class="qs-tool qs-del" data-act="delete" data-id="${q.id}">Delete</button>` : ''}
            </div>
          </div>`).join('')}
      </div>`;

    body.querySelector('#qs-new').addEventListener('click', () => {
      if (!isProUnlocked() && Quests.getAll().length >= 1) { renderLocked(); return; }
      renderNew();
    });
    body.querySelectorAll('.qs-main').forEach(b => b.addEventListener('click', () => {
      const id = Number(b.dataset.id);
      if (id === Quests.current().id) { closeSheet(sheet); return; }
      Quests.switchTo(id);
    }));
    body.querySelectorAll('.qs-tool').forEach(b => b.addEventListener('click', () => {
      const q = Quests.get(Number(b.dataset.id));
      if (!q) return;
      if (b.dataset.act === 'rename') {
        const name = prompt('Quest name', q.name);
        if (name && name.trim()) { Quests.rename(q.id, name); renderQuestButton(); renderList(); }
      } else {
        if (!confirm('Delete "' + q.name + '"? Its notes, vault, initiative and encounters are erased. Characters are kept.')) return;
        const wasCurrent = Quests.remove(q.id);
        if (wasCurrent) { location.reload(); return; }
        renderList();
      }
    }));
  }

  function renderLocked() {
    body.innerHTML = `
      <div class="pro-lock-banner">${typeof ICON_LOCK !== 'undefined' ? ICON_LOCK : ''}<span>More than one quest is Pro</span>
        <button class="btn-inline-unlock js-unlock-pro">Unlock — $2.99</button></div>
      <p class="ch-note">The free version keeps one quest. Pro lets you run as many quests as you like and switch between them any time.</p>
      <button class="btn btn-secondary btn-full" id="qs-back">Back to quests</button>`;
    body.querySelector('#qs-back').addEventListener('click', renderList);
  }

  function renderNew() {
    const chars = Characters.getAll();
    const curParty = Quests.partyIds();
    body.innerHTML = `
      <div class="field-group">
        <label for="qs-name">Quest name</label>
        <input class="field-input" id="qs-name" type="text" maxlength="60" placeholder="e.g. The Sunken Temple" autocomplete="off">
      </div>
      <div class="add-form-title" style="margin-top:14px">Bring characters along</div>
      ${chars.length ? `<p class="ch-note">Ticked characters join the new quest. You can add or remove them later on the Heroes tab.</p>
        <div class="qs-pick">
          ${chars.map(c => `<label class="qs-check"><input type="checkbox" value="${c.id}"${curParty.indexOf(c.id) >= 0 ? ' checked' : ''}>
            <span><b>${escHtml(c.name || 'Unnamed')}</b><small>${escHtml(subtitleOf(c))}</small></span></label>`).join('')}
        </div>` : '<p class="ch-note">No characters yet — you can add them on the Heroes tab after starting.</p>'}
      <button class="btn btn-primary btn-full" id="qs-start" style="margin-top:14px">Start quest</button>
      <button class="btn btn-secondary btn-full" id="qs-cancel" style="margin-top:8px">Cancel</button>`;
    const nameIn = body.querySelector('#qs-name');
    setTimeout(() => nameIn.focus(), 50);
    body.querySelector('#qs-cancel').addEventListener('click', renderList);
    body.querySelector('#qs-start').addEventListener('click', () => {
      const name = nameIn.value.trim();
      if (!name) { showToast('Give your quest a name.'); nameIn.focus(); return; }
      const bring = Array.from(body.querySelectorAll('.qs-check input:checked')).map(i => Number(i.value));
      const q = Quests.create(name, bring);
      Quests.switchTo(q.id);
    });
  }

  renderList();
}

function setupQuestsUI() {
  renderQuestButton();
  const btn = document.getElementById('quest-btn');
  if (btn) btn.addEventListener('click', openQuestSheet);
}
