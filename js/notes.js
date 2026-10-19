/**
 * Session Notes — with linked words
 * Anything in the Vault (vault.js) or the party (characters.js) is colored in the notes by type.
 * Tap a colored word → slide-up card where every detail can be edited.
 * Select any word or phrase → ★ Link → pick a type.
 */

/* ── Notes core ─────────────────────────────────────────────── */
const Notes = (() => {
  let sessions = [];
  let nextId = 1;
  let activeId = null;

  function load() {
    try {
      const raw = localStorage.getItem('dmforge_notes');
      if (!raw) return;
      const data = JSON.parse(raw);
      sessions = data.sessions || [];
      nextId = data.nextId || 1;
      activeId = data.activeId || (sessions[0] ? sessions[0].id : null);
    } catch (e) { sessions = []; }
  }

  function persist() {
    try {
      localStorage.setItem('dmforge_notes', JSON.stringify({ sessions, nextId, activeId }));
    } catch (e) { showToast('Could not save notes — phone storage is full.'); }
  }

  function createSession(title) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const session = { id: nextId++, title: title || `Session — ${dateStr}`, date: dateStr, content: '', updatedAt: now.toISOString() };
    sessions.unshift(session);
    activeId = session.id;
    persist();
    return session;
  }

  function updateSession(id, { title, content }) {
    const s = sessions.find(s => s.id === id);
    if (!s) return;
    if (title !== undefined) s.title = title;
    if (content !== undefined) s.content = content;
    s.updatedAt = new Date().toISOString();
    persist();
  }

  function deleteSession(id) {
    sessions = sessions.filter(s => s.id !== id);
    if (activeId === id) activeId = sessions[0] ? sessions[0].id : null;
    persist();
  }

  function setActive(id) { activeId = id; persist(); }
  function getActive() { return sessions.find(s => s.id === activeId) || null; }
  function getSessions() { return sessions; }
  function getActiveId() { return activeId; }

  return { load, createSession, updateSession, deleteSession, setActive, getActive, getSessions, getActiveId };
})();

/* ── Linked-word engine ──────────────────────────────────────── */
const LinkedWords = (() => {
  // Everything that can be linked: player characters + every vault entry
  function getEntities() {
    const pcs = (typeof Characters !== 'undefined' ? Characters.getAll() : []).map(c => ({
      key: 'character:' + c.id, type: 'character', id: c.id, name: c.name || 'Unnamed',
      terms: [c.name].concat(c.aliases || []), subtitle: typeof subtitleOf === 'function' ? subtitleOf(c) : 'Player character'
    }));
    const vault = Vault.getAll().map(e => ({
      key: e.type + ':' + e.id, type: e.type, id: e.id, name: e.name,
      terms: [e.name].concat(e.aliases || []), subtitle: linkType(e.type).label
    }));
    return pcs.concat(vault);
  }

  // Index terms by first letter, longest first, so the longest name wins
  function buildIndex(entities) {
    const all = [];
    entities.forEach(ent => ent.terms.forEach(t => {
      t = String(t || '').trim();
      if (t.length < 2) return;
      all.push({ t, lower: t.toLowerCase(), exact: t.length <= 4, ent });
    }));
    all.sort((a, b) => b.t.length - a.t.length);
    const index = new Map();
    all.forEach(c => {
      const k = c.lower[0];
      if (!index.has(k)) index.set(k, []);
      index.get(k).push(c);
    });
    return index;
  }

  const WORD = /[\p{L}\p{N}_]/u;
  const isWordChar = ch => !!ch && WORD.test(ch);

  // Rules: names of 4 letters or fewer must match case exactly; longer names ignore case.
  // A match must be a whole word (so "Pip" doesn't light up inside "pipe").
  function scan(text, index) {
    const out = [];
    if (!text) return out;
    const lower = text.toLowerCase();
    const sameLen = lower.length === text.length;
    let i = 0;
    while (i < text.length) {
      let hit = null;
      const cands = index.get(lower[i]);
      if (cands && !isWordChar(text[i - 1])) {
        for (const c of cands) {
          const L = c.t.length;
          const seg = c.exact || !sameLen ? text.substr(i, L) : lower.substr(i, L);
          const want = c.exact ? c.t : (sameLen ? c.lower : c.t);
          const ok = c.exact || sameLen ? seg === want : seg.toLowerCase() === c.lower;
          if (ok && !isWordChar(text[i + L])) { hit = { start: i, len: L, ent: c.ent }; break; }
        }
      }
      if (hit) { out.push(hit); i += hit.len; } else i++;
    }
    return out;
  }

  function escPlain(s) {
    return escHtml(s).replace(/\{\{[^}]*\}\}/g, m => '<span class="lw-ph">' + m + '</span>');
  }

  function highlight(text) {
    if (!text) return '';
    const hits = scan(text, buildIndex(getEntities()));
    let html = '', pos = 0;
    hits.forEach(h => {
      html += escPlain(text.slice(pos, h.start));
      html += `<mark class="lw lw-${h.ent.type}" data-lw-type="${h.ent.type}" data-lw-id="${h.ent.id}">${escHtml(text.substr(h.start, h.len))}</mark>`;
      pos = h.start + h.len;
    });
    return html + escPlain(text.slice(pos));
  }

  // Entities mentioned in a text, with counts, in order of first mention
  function countMentions(text, entities) {
    const map = new Map();
    scan(text, buildIndex(entities || getEntities())).forEach(h => {
      const m = map.get(h.ent.key);
      if (m) m.count++; else map.set(h.ent.key, Object.assign({}, h.ent, { count: 1 }));
    });
    return Array.from(map.values());
  }

  function sessionsMentioning(type, id) {
    const index = buildIndex(getEntities());
    const key = type + ':' + id;
    return Notes.getSessions().map(s => {
      const text = (s.id === Notes.getActiveId() && _noteTextarea) ? _noteTextarea.value : s.content;
      const count = scan(text, index).filter(h => h.ent.key === key).length;
      return { session: s, count };
    }).filter(x => x.count > 0);
  }

  function findByTerm(word) {
    const w = word.trim().toLowerCase();
    return getEntities().find(e => e.terms.some(t => String(t || '').trim().toLowerCase() === w)) || null;
  }

  return { getEntities, highlight, countMentions, sessionsMentioning, findByTerm };
})();

/* ── Placeholder helpers ─────────────────────────────────────── */
const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g;

function insertPlaceholder(textarea, label) {
  const ph = `{{${label}}}`;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  textarea.value = val.slice(0, start) + ph + val.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + ph.length;
  textarea.dispatchEvent(new Event('input'));
  textarea.focus();
}

function jumpToNextPlaceholder(textarea) {
  const val = textarea.value;
  PLACEHOLDER_RE.lastIndex = textarea.selectionEnd;
  let m = PLACEHOLDER_RE.exec(val);
  if (!m) { PLACEHOLDER_RE.lastIndex = 0; m = PLACEHOLDER_RE.exec(val); }
  if (m) {
    textarea.selectionStart = m.index;
    textarea.selectionEnd = m.index + m[0].length;
    textarea.focus();
    return true;
  }
  return false;
}

function countPlaceholders(text) {
  return (text.match(PLACEHOLDER_RE) || []).length;
}

/* ── Bottom sheets (shared by cards, link picker, vault) ─────── */
const sheetStack = [];

function openSheet(className, html, onClose) {
  const backdrop = document.createElement('div');
  backdrop.className = 'lw-backdrop';
  const panel = document.createElement('div');
  panel.className = 'lw-panel ' + className;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.innerHTML = '<div class="lw-panel-handle"></div>' + html;
  const z = 700 + sheetStack.length * 20;
  backdrop.style.zIndex = z;
  panel.style.zIndex = z + 1;
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  const sheet = { panel, backdrop, onClose };
  sheetStack.push(sheet);
  backdrop.addEventListener('click', () => closeSheet(sheet));
  panel.querySelectorAll('.lw-panel-close').forEach(b => b.addEventListener('click', () => closeSheet(sheet)));
  requestAnimationFrame(() => { panel.classList.add('lw-panel-open'); backdrop.classList.add('lw-backdrop-visible'); });
  return sheet;
}

function closeSheet(sheet) {
  sheet = sheet || sheetStack[sheetStack.length - 1];
  if (!sheet) return;
  const i = sheetStack.indexOf(sheet);
  if (i < 0) return;
  sheetStack.splice(i, 1);
  sheet.panel.classList.remove('lw-panel-open');
  sheet.backdrop.classList.remove('lw-backdrop-visible');
  setTimeout(() => { sheet.panel.remove(); sheet.backdrop.remove(); }, 280);
  if (sheet.onClose) sheet.onClose();
}

function closeAllSheets() { while (sheetStack.length) closeSheet(sheetStack[sheetStack.length - 1]); }

// After any vault/party change, recolor the note and refresh lists that show names
function linksChanged() {
  refreshHighlight();
  renderEntityChips();
  if (typeof renderSavedNPCs === 'function' && document.getElementById('saved-npcs')) renderSavedNPCs();
  if (typeof chUI !== 'undefined' && chUI.view === 'list' && typeof renderCharList === 'function') renderCharList();
  const vault = sheetStack.find(s => s.panel.classList.contains('lw-vault-sheet'));
  if (vault && vault.refresh) vault.refresh();
}

/* ── Entry cards ─────────────────────────────────────────────── */
function openEntityCard(type, id) {
  if (type === 'character') openCharacterCard(id);
  else openEntryCard(id);
}

function fieldInput(e, f) {
  const def = FIELD_DEFS[f];
  const v = e.fields[f] == null ? '' : e.fields[f];
  if (def.kind === 'select') {
    return `<select class="field-input cr-select" data-field="${f}">${def.options.map(o =>
      `<option value="${escHtml(o)}"${o === v ? ' selected' : ''}>${o ? escHtml(o) : '—'}</option>`).join('')}</select>`;
  }
  return `<input class="field-input" data-field="${f}" type="${def.kind === 'number' ? 'number' : 'text'}" ${def.kind === 'number' ? 'inputmode="numeric"' : ''} value="${escHtml(v)}" maxlength="120" autocomplete="off">`;
}

function hpWidget(cur, max) {
  return `<div class="lw-hp">
    <button class="lw-hp-btn" data-hp="-1" aria-label="Lose 1 HP">−</button>
    <input class="field-input lw-hp-cur" type="number" inputmode="numeric" value="${cur === '' || cur == null ? '' : cur}" aria-label="Current HP" placeholder="—">
    <span class="lw-hp-sep">/</span>
    <input class="field-input lw-hp-max" type="number" inputmode="numeric" value="${max === '' || max == null ? '' : max}" aria-label="Max HP" placeholder="max">
    <button class="lw-hp-btn" data-hp="1" aria-label="Gain 1 HP">+</button>
  </div>`;
}

function openEntryCard(id) {
  const e = Vault.get(id);
  if (!e) { showToast('That entry was deleted.'); return; }
  let saveTimer = null;
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => Vault.update(e.id, {}), 250); };

  const sheet = openSheet('lw-card', '<div class="lw-card-inner"></div>', () => { clearTimeout(saveTimer); Vault.persist(); linksChanged(); });
  const inner = sheet.panel.querySelector('.lw-card-inner');

  function render() {
    const t = linkType(e.type);
    const fields = (TYPE_FIELDS[e.type] || []).slice();
    if (e.type === 'npc') NPC_EXTRA_FIELDS.forEach(f => { if (e.fields[f]) fields.push(f); });
    // short fields (numbers, dropdowns, CR, charges) sit two to a row; text fields get a full row
    const small = fields.filter(f => f !== 'hp' && FIELD_DEFS[f] && (FIELD_DEFS[f].kind !== 'text' || f === 'cr' || f === 'charges'));
    const wide = fields.filter(f => f !== 'hp' && small.indexOf(f) < 0);

    inner.innerHTML = `
      <div class="lw-panel-header" style="--c:${t.color}">
        <div class="lw-card-head">
          <span class="lw-type-pill">${escHtml(t.label)}</span>
          <div class="lw-panel-name">${escHtml(e.name)}</div>
        </div>
        <button class="lw-panel-close lw-x" aria-label="Close">&times;</button>
      </div>
      <div class="lw-panel-body">
        <div class="field-group lw-f"><label>Name</label>
          <input class="field-input" id="lw-e-name" type="text" maxlength="80" value="${escHtml(e.name)}" autocomplete="off"></div>
        <div class="field-group lw-f"><label>Also called <span class="ch-hint">— commas between</span></label>
          <input class="field-input" id="lw-e-alias" type="text" maxlength="160" value="${escHtml(e.aliases.join(', '))}" placeholder="Nicknames, short names" autocomplete="off"></div>
        <div class="field-group lw-f"><label>Type</label>
          <select class="field-input cr-select lw-type-select" id="lw-e-type" style="--c:${t.color}">
            ${VAULT_TYPES.map(k => `<option value="${k}"${k === e.type ? ' selected' : ''}>${escHtml(linkType(k).label)}</option>`).join('')}
          </select></div>
        ${fields.indexOf('hp') >= 0 ? `<div class="field-group lw-f"><label>HP</label>${hpWidget(e.fields.hpCur, e.fields.hpMax)}</div>` : ''}
        ${small.length ? `<div class="lw-fgrid">${small.map(f => `<div class="field-group"><label>${FIELD_DEFS[f].label}</label>${fieldInput(e, f)}</div>`).join('')}</div>` : ''}
        ${wide.map(f => `<div class="field-group lw-f"><label>${FIELD_DEFS[f].label}</label>${fieldInput(e, f)}</div>`).join('')}
        <div class="field-group lw-f"><label>Details</label>
          <textarea class="field-input lw-e-details" id="lw-e-details" rows="4" maxlength="5000" placeholder="Anything worth remembering…">${escHtml(e.details || '')}</textarea></div>
        <div class="lw-card-actions">
          <button class="btn btn-danger" id="lw-e-del">Delete</button>
          <button class="btn btn-primary lw-panel-close">Done</button>
        </div>
      </div>`;
    inner.querySelectorAll('.lw-panel-close').forEach(b => b.addEventListener('click', () => closeSheet(sheet)));

    const $ = s => inner.querySelector(s);
    $('#lw-e-name').addEventListener('input', ev => { e.name = ev.target.value.trim() || 'Unnamed'; $('.lw-panel-name').textContent = e.name; save(); });
    $('#lw-e-alias').addEventListener('input', ev => { e.aliases = ev.target.value.split(',').map(s => s.trim()).filter(Boolean); save(); });
    $('#lw-e-type').addEventListener('change', ev => { e.type = ev.target.value; Vault.update(e.id, {}); render(); });
    $('#lw-e-details').addEventListener('input', ev => { e.details = ev.target.value; save(); });
    inner.querySelectorAll('[data-field]').forEach(inp => {
      inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', ev => { e.fields[inp.dataset.field] = ev.target.value; save(); });
    });
    const cur = $('.lw-hp-cur'), max = $('.lw-hp-max');
    if (cur) {
      cur.addEventListener('input', () => { e.fields.hpCur = cur.value; save(); });
      max.addEventListener('input', () => { e.fields.hpMax = max.value; save(); });
      inner.querySelectorAll('.lw-hp-btn').forEach(b => b.addEventListener('click', () => {
        const base = cur.value === '' ? (Number(max.value) || 0) : Number(cur.value);
        let v = base + Number(b.dataset.hp);
        if (max.value !== '') v = Math.min(v, Number(max.value));
        e.fields.hpCur = String(Math.max(0, v));
        cur.value = e.fields.hpCur;
        save();
      }));
    }
    $('#lw-e-del').addEventListener('click', () => {
      if (!confirm('Delete "' + e.name + '"? It will stop being a link in your notes.')) return;
      Vault.remove(e.id);
      showToast('Deleted.');
      closeSheet(sheet);
    });
  }
  render();
}

function openCharacterCard(id) {
  const ch = Characters.get(id);
  if (!ch) { showToast('That character was deleted.'); return; }
  const d = derived(ch);
  if (ch.hpCur == null || ch.hpCur === '') ch.hpCur = d.hp;
  const t = linkType('character');
  const sheet = openSheet('lw-card', `
    <div class="lw-panel-header" style="--c:${t.color}">
      <div class="lw-card-head">
        <span class="lw-type-pill">${t.label}</span>
        <div class="lw-panel-name">${escHtml(ch.name || 'Unnamed')}</div>
        <div class="lw-panel-sub">${escHtml(subtitleOf(ch))}</div>
      </div>
      <button class="lw-panel-close lw-x" aria-label="Close">&times;</button>
    </div>
    <div class="lw-panel-body">
      <div class="lw-pc-top">
        <span class="lw-pc-portrait">${portraitHTML(ch)}</span>
        <div class="lw-pc-nums">
          <div class="field-group"><label>HP</label>${hpWidget(ch.hpCur, d.hp)}</div>
          <div class="lw-pc-row"><span><b>${d.ac}</b> AC</span><span><b>${fmtMod(d.init)}</b> Init</span><span><b>${d.speed}</b> ft</span></div>
        </div>
      </div>
      <div class="ch-pm-stats">${STATS.map(k => `<span><small>${STAT_LABEL[k]}</small>${d.scores[k]}<i>${fmtMod(modOf(d.scores[k]))}</i></span>`).join('')}</div>
      <div class="field-group lw-f"><label>Name</label>
        <input class="field-input" id="lw-c-name" type="text" maxlength="60" value="${escHtml(ch.name || '')}" autocomplete="off"></div>
      <div class="field-group lw-f"><label>Also called <span class="ch-hint">— commas between</span></label>
        <input class="field-input" id="lw-c-alias" type="text" maxlength="120" value="${escHtml((ch.aliases || []).join(', '))}" autocomplete="off"></div>
      <div class="lw-card-actions">
        <button class="btn btn-secondary lw-panel-close">Close</button>
        <button class="btn btn-primary" id="lw-c-open">Open full sheet</button>
      </div>
    </div>`, () => { Characters.touch(ch); linksChanged(); });
  const p = sheet.panel;
  p.querySelector('.lw-hp-max').readOnly = true;
  const cur = p.querySelector('.lw-hp-cur');
  cur.addEventListener('input', () => { ch.hpCur = cur.value === '' ? null : Number(cur.value); });
  p.querySelectorAll('.lw-hp-btn').forEach(b => b.addEventListener('click', () => {
    ch.hpCur = Math.max(0, Math.min(d.hp, (Number(cur.value) || 0) + Number(b.dataset.hp)));
    cur.value = ch.hpCur;
  }));
  p.querySelector('#lw-c-name').addEventListener('input', ev => { ch.name = ev.target.value; p.querySelector('.lw-panel-name').textContent = ch.name || 'Unnamed'; });
  p.querySelector('#lw-c-alias').addEventListener('input', ev => { ch.aliases = ev.target.value.split(',').map(s => s.trim()).filter(Boolean); });
  p.querySelector('#lw-c-open').addEventListener('click', () => {
    closeAllSheets();
    flushNoteSave();
    openCharacterSheet(ch.id);
  });
}

/* ── ★ Link picker ───────────────────────────────────────────── */
function openLinkPicker(word) {
  const existing = LinkedWords.findByTerm(word);
  const sheet = openSheet('lw-linksheet', `
    <div class="lw-panel-header">
      <div class="lw-card-head"><div class="lw-panel-sub">Link this as…</div>
        <div class="lw-panel-name lw-link-word">“${escHtml(word)}”</div></div>
      <button class="lw-panel-close lw-x" aria-label="Close">&times;</button>
    </div>
    <div class="lw-panel-body">
      ${existing ? `<button class="lw-existing" style="--c:${linkType(existing.type).color}" id="lw-open-existing">
          Already linked as <b>${escHtml(linkType(existing.type).label)}</b> — open card</button>` : ''}
      <div class="lw-type-grid">
        ${LINK_TYPES.map(t => `<button class="lw-type-btn" data-type="${t.key}" style="--c:${t.color}"><span class="lw-dot"></span>${escHtml(t.label)}</button>`).join('')}
      </div>
      <button class="btn btn-ghost btn-full lw-panel-close">Cancel</button>
    </div>`);
  const p = sheet.panel;
  if (existing) p.querySelector('#lw-open-existing').addEventListener('click', () => { closeSheet(sheet); openEntityCard(existing.type, existing.id); });
  p.querySelectorAll('.lw-type-btn').forEach(b => b.addEventListener('click', () => {
    closeSheet(sheet);
    linkWord(word, b.dataset.type);
  }));
}

function linkWord(word, type) {
  const name = word.trim().replace(/\s+/g, ' ');
  if (!name) return;
  if (type === 'character') {
    const ch = createCharacterNamed(name);
    showToast(`Linked "${name}" as a Player Character — stats rolled for you.`);
    linksChanged();
    openCharacterCard(ch.id);
  } else {
    const e = Vault.add(type, name);
    showToast(`Linked "${name}" as ${linkType(type).label}.`);
    linksChanged();
    openEntryCard(e.id);
  }
}

/* ── Vault browser ───────────────────────────────────────────── */
let vaultFilter = 'all';

function openVaultBrowser() {
  const sheet = openSheet('lw-vault-sheet', `
    <div class="lw-panel-header">
      <div class="lw-card-head"><div class="lw-panel-name">Vault</div>
        <div class="lw-panel-sub">Everything you've linked. Tap one to edit.</div></div>
      <button class="lw-panel-close lw-x" aria-label="Close">&times;</button>
    </div>
    <div class="lw-legend" aria-label="Color key">
      ${LINK_TYPES.map(t => `<span style="--c:${t.color}"><i class="lw-dot"></i>${escHtml(t.short)}</span>`).join('')}
    </div>
    <div class="lw-filters" role="tablist"></div>
    <div class="lw-panel-body lw-vault-list"></div>
    <div class="lw-vault-add">
      <input class="field-input" id="lw-v-name" placeholder="New name…" maxlength="80" autocomplete="off">
      <select class="field-input cr-select" id="lw-v-type" aria-label="Type">
        ${LINK_TYPES.map(t => `<option value="${t.key}">${escHtml(t.short)}</option>`).join('')}
      </select>
      <button class="btn btn-primary" id="lw-v-add">Add</button>
    </div>`);
  const p = sheet.panel;

  function items() {
    const pcs = Characters.getAll().map(c => ({ type: 'character', id: c.id, name: c.name || 'Unnamed', aliases: c.aliases || [], sub: subtitleOf(c) }));
    const v = Vault.getAll().map(e => ({ type: e.type, id: e.id, name: e.name, aliases: e.aliases, sub: linkType(e.type).label }));
    return pcs.concat(v);
  }

  function render() {
    const all = items();
    const counts = {};
    all.forEach(x => { counts[x.type] = (counts[x.type] || 0) + 1; });
    p.querySelector('.lw-filters').innerHTML =
      `<button class="lw-filter${vaultFilter === 'all' ? ' on' : ''}" data-f="all">All <b>${all.length}</b></button>` +
      LINK_TYPES.map(t => `<button class="lw-filter${vaultFilter === t.key ? ' on' : ''}" data-f="${t.key}" style="--c:${t.color}"><i class="lw-dot"></i>${escHtml(t.short)} <b>${counts[t.key] || 0}</b></button>`).join('');
    p.querySelectorAll('.lw-filter').forEach(b => b.addEventListener('click', () => {
      vaultFilter = b.dataset.f;
      if (vaultFilter !== 'all') p.querySelector('#lw-v-type').value = vaultFilter;
      render();
    }));
    const shown = vaultFilter === 'all' ? all : all.filter(x => x.type === vaultFilter);
    shown.sort((a, b) => a.name.localeCompare(b.name));
    const list = p.querySelector('.lw-vault-list');
    list.innerHTML = shown.length ? shown.map(x => `
      <button class="lw-vrow" data-type="${x.type}" data-id="${x.id}" style="--c:${linkType(x.type).color}">
        <i class="lw-dot"></i>
        <span class="lw-vrow-text"><span class="lw-vrow-name">${escHtml(x.name)}</span>
          <span class="lw-vrow-sub">${escHtml(x.sub)}${x.aliases.length ? ' · ' + escHtml(x.aliases.join(', ')) : ''}</span></span>
      </button>`).join('')
      : `<p class="saved-empty">Nothing here yet. Select a word in your notes and tap ★ Link, or add one below.</p>`;
    list.querySelectorAll('.lw-vrow').forEach(r => r.addEventListener('click', () => openEntityCard(r.dataset.type, Number(r.dataset.id))));
  }
  sheet.refresh = render;

  p.querySelector('#lw-v-add').addEventListener('click', () => {
    const inp = p.querySelector('#lw-v-name');
    const name = inp.value.trim();
    if (!name) { inp.focus(); return; }
    inp.value = '';
    linkWord(name, p.querySelector('#lw-v-type').value);
  });
  if (vaultFilter !== 'all') p.querySelector('#lw-v-type').value = vaultFilter;
  render();
}

/* ── Editor overlay state ────────────────────────────────────── */
let _noteTextarea = null;
let _highlightDiv = null;

function refreshHighlight() {
  if (!_highlightDiv || !_noteTextarea) return;
  _highlightDiv.innerHTML = LinkedWords.highlight(_noteTextarea.value) + '<br>';
  growNote();
}

function renderEntityChips() {
  const chips = document.getElementById('lw-entity-chips');
  if (!chips || !_noteTextarea) return;
  const mentioned = LinkedWords.countMentions(_noteTextarea.value);
  const label = document.getElementById('lw-chips-label');
  if (label) label.style.display = mentioned.length ? 'block' : 'none';
  chips.innerHTML = mentioned.map(e => `
    <button class="lw-chip lw-chip-${e.type}" data-type="${e.type}" data-id="${e.id}" aria-label="${escHtml(e.name)}, ${e.count} mention${e.count !== 1 ? 's' : ''}">
      ${escHtml(e.name)}<span class="lw-chip-count">${e.count}</span>
    </button>`).join('');
  chips.querySelectorAll('.lw-chip').forEach(chip => {
    chip.addEventListener('click', () => openEntityCard(chip.dataset.type, Number(chip.dataset.id)));
  });
}

/* ── UI ─────────────────────────────────────────────────────── */
let notesSaveTimer = null;
let notesPendingSave = null;

function flushNoteSave() {
  if (notesPendingSave) { clearTimeout(notesSaveTimer); notesPendingSave(); notesPendingSave = null; }
}

function renderNotesList() {
  const list = document.getElementById('notes-list');
  const sessions = Notes.getSessions();
  const activeId = Notes.getActiveId();

  if (sessions.length === 0) {
    list.innerHTML = '<p class="saved-empty">No sessions yet. Create one to begin.</p>';
    return;
  }

  list.innerHTML = sessions.map(s => `
    <div class="notes-row${s.id === activeId ? ' active' : ''}" data-id="${s.id}" role="button" tabindex="0" aria-label="Open ${escHtml(s.title)}">
      <div class="notes-row-info">
        <span class="notes-row-title">${escHtml(s.title)}</span>
        <span class="notes-row-date">${s.date}</span>
      </div>
      <button class="icon-btn remove notes-delete" data-id="${s.id}" aria-label="Delete ${escHtml(s.title)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
      </button>
    </div>
  `).join('');

  list.querySelectorAll('.notes-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.notes-delete')) return;
      flushNoteSave();
      Notes.setActive(Number(row.dataset.id));
      renderNotesList();
      renderNoteEditor();
    });
    row.addEventListener('keydown', e => { if (e.key === 'Enter') row.click(); });
  });

  list.querySelectorAll('.notes-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const s = Notes.getSessions().find(x => x.id === Number(btn.dataset.id));
      if (s && s.content && !confirm('Delete "' + s.title + '" and all its notes?')) return;
      flushNoteSave();
      Notes.deleteSession(Number(btn.dataset.id));
      renderNotesList();
      renderNoteEditor();
    });
  });
}

function renderNoteEditor() {
  const session = Notes.getActive();
  const titleEl = document.getElementById('note-title');
  const contentEl = document.getElementById('note-content');
  const editorArea = document.getElementById('notes-editor-area');
  const toolbar = document.getElementById('lw-toolbar');

  if (!session) {
    editorArea.style.display = 'none';
    if (toolbar) toolbar.style.display = 'none';
    return;
  }

  editorArea.style.display = 'block';
  if (toolbar) toolbar.style.display = 'flex';
  titleEl.value = session.title;
  contentEl.value = session.content;

  _noteTextarea = contentEl;
  _highlightDiv = document.getElementById('lw-highlight');
  refreshHighlight();
  renderEntityChips();
  updatePhBadge();

  function scheduleSave() {
    clearTimeout(notesSaveTimer);
    notesPendingSave = () => {
      Notes.updateSession(session.id, { title: titleEl.value, content: contentEl.value });
      notesPendingSave = null;
    };
    notesSaveTimer = setTimeout(notesPendingSave, 600);
  }

  titleEl.oninput = scheduleSave;

  contentEl.oninput = () => {
    scheduleSave();
    refreshHighlight();
    renderEntityChips();
    updatePhBadge();
    syncScroll();
  };
  contentEl.onscroll = syncScroll;

  // Tap inside a colored name (not at its very edge) to open its card
  contentEl.onclick = () => {
    if (contentEl.selectionStart !== contentEl.selectionEnd) return;
    const pos = contentEl.selectionStart;
    let offset = 0;
    for (const node of _highlightDiv.childNodes) {
      const len = node.nodeName === 'BR' ? 0 : node.textContent.length;
      if (node.nodeType === 1 && node.classList.contains('lw') && pos > offset && pos < offset + len) {
        contentEl.blur();
        openEntityCard(node.dataset.lwType, Number(node.dataset.lwId));
        return;
      }
      offset += len;
    }
  };
}

// Grow the text box to fit its text so the colored overlay never scrolls out of line
function growNote() {
  if (!_noteTextarea) return;
  const y = window.scrollY;
  _noteTextarea.style.height = 'auto';
  _noteTextarea.style.height = _noteTextarea.scrollHeight + 'px';
  window.scrollTo(0, y);
}

function syncScroll() {
  if (!_noteTextarea || !_highlightDiv) return;
  growNote();
  _highlightDiv.scrollTop = _noteTextarea.scrollTop;
}

function updatePhBadge() {
  const badge = document.getElementById('lw-ph-count');
  if (!badge || !_noteTextarea) return;
  const n = countPlaceholders(_noteTextarea.value);
  badge.textContent = n || '';
  badge.style.display = n ? 'inline-flex' : 'none';
}

// Jump to a session and show where an entity is mentioned (used by "Appears in sessions")
function openSessionAt(sessionId, type, id) {
  flushNoteSave();
  closeAllSheets();
  Notes.setActive(sessionId);
  if (typeof activateTab === 'function') activateTab('notes');
  renderNotesList();
  renderNoteEditor();
  requestAnimationFrame(() => {
    const mark = _highlightDiv && _highlightDiv.querySelector(`mark[data-lw-type="${type}"][data-lw-id="${id}"]`);
    const target = mark || document.getElementById('notes-editor-area');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (mark) {
      _highlightDiv.querySelectorAll(`mark[data-lw-type="${type}"][data-lw-id="${id}"]`).forEach(m => m.classList.add('lw-flash'));
      setTimeout(() => _highlightDiv.querySelectorAll('.lw-flash').forEach(m => m.classList.remove('lw-flash')), 2200);
    }
  });
}

function onNotesTabShown() {
  refreshHighlight();
  renderEntityChips();
}

function setupNotesUI() {
  Notes.load();

  document.getElementById('new-session-btn').addEventListener('click', () => {
    flushNoteSave();
    Notes.createSession('');
    renderNotesList();
    renderNoteEditor();
    setTimeout(() => {
      const t = document.getElementById('note-title');
      if (t) { t.focus(); t.select(); }
    }, 50);
  });

  const insertSelect = document.getElementById('lw-insert-ph');
  if (insertSelect) {
    insertSelect.addEventListener('change', () => {
      const val = insertSelect.value;
      if (!val || !_noteTextarea) return;
      insertPlaceholder(_noteTextarea, val);
      insertSelect.value = '';
    });
  }

  const jumpBtn = document.getElementById('lw-jump-ph');
  if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
      if (!_noteTextarea) return;
      if (!jumpToNextPlaceholder(_noteTextarea)) showToast('No placeholders in this note');
    });
  }

  const vaultBtn = document.getElementById('lw-vault-btn');
  if (vaultBtn) vaultBtn.addEventListener('click', openVaultBrowser);

  // ★ Link — keep the selection: on phones, tapping a button can clear it, so remember it first
  const linkWordBtn = document.getElementById('lw-link-word-btn');
  const contentEl = document.getElementById('note-content');
  let lastSel = '';
  const rememberSel = () => {
    if (!_noteTextarea) return;
    const s = _noteTextarea.value.slice(_noteTextarea.selectionStart, _noteTextarea.selectionEnd).trim();
    if (s) lastSel = s;
  };
  if (contentEl) {
    document.addEventListener('selectionchange', () => { if (document.activeElement === contentEl) rememberSel(); });
    contentEl.addEventListener('input', () => { lastSel = ''; });
    contentEl.addEventListener('contextmenu', e => {
      const word = contentEl.value.slice(contentEl.selectionStart, contentEl.selectionEnd).trim();
      if (word) { e.preventDefault(); openLinkPicker(word.slice(0, 80)); }
    });
  }
  if (linkWordBtn) {
    linkWordBtn.addEventListener('pointerdown', rememberSel);
    linkWordBtn.addEventListener('click', () => {
      rememberSel();
      const word = lastSel;
      if (!word) { showToast('Select a word or phrase in your notes first'); return; }
      if (word.length > 80) { showToast('That selection is too long to link'); return; }
      openLinkPicker(word);
    });
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  renderNotesList();
  renderNoteEditor();
}
