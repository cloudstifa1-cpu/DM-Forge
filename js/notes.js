/**
 * Session Notes — linked-word system
 * NPC names auto-highlighted, tap → slide-up card
 * Select any word → Link as NPC / Location / Item
 * Color coding: NPC #e8b04a  Location #7cc3b2  Item #b9a0e0
 */

/* ── Vault stores ──────────────────────────────────────────── */
const Locations = (() => {
  let items = []; let nextId = 1;
  function load() {
    try { const d = JSON.parse(localStorage.getItem('dmforge_locations') || '{}');
      items = d.items || []; nextId = d.nextId || 1; } catch(e) { items = []; }
  }
  function persist() {
    try { localStorage.setItem('dmforge_locations', JSON.stringify({items, nextId})); } catch(e) {}
  }
  function add(name, notes) {
    const e = {id: nextId++, name: name.trim(), notes: notes || '', createdAt: new Date().toISOString()};
    items.unshift(e); persist(); return e;
  }
  function update(id, {name, notes}) {
    const e = items.find(x => x.id === id); if (!e) return;
    if (name !== undefined) e.name = name.trim();
    if (notes !== undefined) e.notes = notes;
    persist();
  }
  function remove(id) { items = items.filter(x => x.id !== id); persist(); }
  function getAll() { return items; }
  return {load, add, update, remove, getAll};
})();

const Items = (() => {
  let items = []; let nextId = 1;
  function load() {
    try { const d = JSON.parse(localStorage.getItem('dmforge_items') || '{}');
      items = d.items || []; nextId = d.nextId || 1; } catch(e) { items = []; }
  }
  function persist() {
    try { localStorage.setItem('dmforge_items', JSON.stringify({items, nextId})); } catch(e) {}
  }
  function add(name, notes) {
    const e = {id: nextId++, name: name.trim(), notes: notes || '', createdAt: new Date().toISOString()};
    items.unshift(e); persist(); return e;
  }
  function update(id, {name, notes}) {
    const e = items.find(x => x.id === id); if (!e) return;
    if (name !== undefined) e.name = name.trim();
    if (notes !== undefined) e.notes = notes;
    persist();
  }
  function remove(id) { items = items.filter(x => x.id !== id); persist(); }
  function getAll() { return items; }
  return {load, add, update, remove, getAll};
})();

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
    } catch (e) {}
  }

  function createSession(title) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const session = {
      id: nextId++,
      title: title || `Session — ${dateStr}`,
      date: dateStr,
      content: '',
      updatedAt: now.toISOString()
    };
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
  // Build entity list from all three vaults
  function getEntities() {
    const npcs = (typeof NPC !== 'undefined' ? NPC.getSaved() : []).map(n => ({
      id: n.id, type: 'npc', name: n.name,
      subtitle: [n.race, n.occupation].filter(Boolean).join(' · '),
      details: [n.trait, n.ideal, n.bond, n.flaw].filter(Boolean).join('\n'),
      secret: n.secret || ''
    }));
    const locs = Locations.getAll().map(l => ({
      id: l.id, type: 'location', name: l.name,
      subtitle: 'Location',
      details: l.notes || '', secret: ''
    }));
    const itms = Items.getAll().map(i => ({
      id: i.id, type: 'item', name: i.name,
      subtitle: 'Item',
      details: i.notes || '', secret: ''
    }));
    return [...npcs, ...locs, ...itms];
  }

  // Longest-match: ≤4 chars exact, >4 chars case-insensitive
  function buildPattern(entities) {
    if (!entities.length) return null;
    // Sort by name length desc so longest matches win
    const sorted = [...entities].sort((a, b) => b.name.length - a.name.length);
    const escaped = sorted.map(e => {
      const esc = e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return esc;
    });
    // We'll match word boundaries
    return {sorted, re: new RegExp('(' + escaped.join('|') + ')', 'g')};
  }

  // Returns HTML string with spans around entity matches
  function highlight(text) {
    if (!text) return escHtml(text || '');
    const entities = getEntities();
    if (!entities.length) return escHtml(text);

    const {sorted} = buildPattern(entities);

    // Walk through text, find earliest + longest match at each position
    let result = '';
    let i = 0;
    const lower = text.toLowerCase();

    while (i < text.length) {
      let bestMatch = null;
      let bestLen = 0;

      for (const ent of sorted) {
        const n = ent.name;
        const len = n.length;
        let match = false;

        if (len <= 4) {
          // exact case
          match = text.substr(i, len) === n;
        } else {
          // case-insensitive
          match = lower.substr(i, len) === n.toLowerCase();
        }

        if (match && len > bestLen) {
          bestLen = len;
          bestMatch = ent;
        }
      }

      if (bestMatch) {
        const raw = text.substr(i, bestLen);
        result += `<mark class="lw lw-${bestMatch.type}" data-lw-type="${bestMatch.type}" data-lw-id="${bestMatch.id}" tabindex="0" role="button" aria-label="View ${escHtml(bestMatch.name)}">${escHtml(raw)}</mark>`;
        i += bestLen;
      } else {
        // Encode one char
        const ch = text[i];
        if (ch === '&') result += '&amp;';
        else if (ch === '<') result += '&lt;';
        else if (ch === '>') result += '&gt;';
        else result += ch;
        i++;
      }
    }
    return result;
  }

  // Count mentions of each entity in text
  function countMentions(text, entities) {
    const lower = text.toLowerCase();
    return entities.map(ent => {
      const n = ent.name;
      const needle = n.length <= 4 ? n : n.toLowerCase();
      const haystack = n.length <= 4 ? text : lower;
      let count = 0, idx = 0;
      while ((idx = haystack.indexOf(needle, idx)) !== -1) { count++; idx += needle.length; }
      return {...ent, count};
    }).filter(e => e.count > 0);
  }

  return {getEntities, highlight, countMentions};
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
  const from = textarea.selectionEnd;
  // Find next after cursor
  PLACEHOLDER_RE.lastIndex = from;
  let m = PLACEHOLDER_RE.exec(val);
  if (!m) {
    // Wrap around
    PLACEHOLDER_RE.lastIndex = 0;
    m = PLACEHOLDER_RE.exec(val);
  }
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

/* ── Slide-up panel ──────────────────────────────────────────── */
let slidePanel = null;

function openSlidePanel(entity) {
  closeSlidePanel();
  const panel = document.createElement('div');
  panel.className = 'lw-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', entity.name);
  panel.setAttribute('aria-modal', 'true');

  const typeLabel = {npc: 'NPC', location: 'Location', item: 'Item'}[entity.type] || entity.type;
  const colorClass = `lw-panel-${entity.type}`;

  panel.innerHTML = `
    <div class="lw-panel-handle"></div>
    <div class="lw-panel-header ${colorClass}">
      <div>
        <div class="lw-panel-name">${escHtml(entity.name)}</div>
        <div class="lw-panel-sub">${escHtml(entity.subtitle)}</div>
      </div>
      <button class="lw-panel-close" aria-label="Close">&times;</button>
    </div>
    <div class="lw-panel-body">
      ${entity.details ? `<p class="lw-panel-details">${escHtml(entity.details).replace(/\n/g,'<br>')}</p>` : ''}
      ${entity.secret ? `<div class="lw-panel-secret"><span class="lw-secret-label">Secret</span> ${escHtml(entity.secret)}</div>` : ''}
      ${entity.type !== 'npc' ? `
        <div class="lw-panel-edit">
          <div class="field-group" style="margin-bottom:8px">
            <label>Notes</label>
            <textarea class="field-input lw-edit-notes" rows="4" placeholder="Add notes…">${escHtml(entity.details)}</textarea>
          </div>
          <button class="btn btn-secondary btn-full lw-save-entity-btn" data-type="${entity.type}" data-id="${entity.id}">Save Notes</button>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(panel);
  slidePanel = panel;

  panel.querySelector('.lw-panel-close').addEventListener('click', closeSlidePanel);

  const saveBtn = panel.querySelector('.lw-save-entity-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const notes = panel.querySelector('.lw-edit-notes').value;
      if (entity.type === 'location') Locations.update(entity.id, {notes});
      if (entity.type === 'item') Items.update(entity.id, {notes});
      entity.details = notes;
      showToast('Saved');
      closeSlidePanel();
      refreshHighlight();
      renderEntityChips();
    });
  }

  // Animate in
  requestAnimationFrame(() => panel.classList.add('lw-panel-open'));

  // Close on backdrop tap (outside panel)
  const backdrop = document.createElement('div');
  backdrop.className = 'lw-backdrop';
  backdrop.addEventListener('click', closeSlidePanel);
  document.body.insertBefore(backdrop, panel);
  slidePanel._backdrop = backdrop;

  requestAnimationFrame(() => backdrop.classList.add('lw-backdrop-visible'));
}

function closeSlidePanel() {
  if (!slidePanel) return;
  const panel = slidePanel;
  const backdrop = panel._backdrop;
  panel.classList.remove('lw-panel-open');
  if (backdrop) backdrop.classList.remove('lw-backdrop-visible');
  setTimeout(() => {
    if (panel.parentNode) panel.parentNode.removeChild(panel);
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }, 300);
  slidePanel = null;
}

/* ── Vault browser overlay ──────────────────────────────────── */
let vaultOverlay = null;

function openVaultBrowser() {
  closeVaultBrowser();
  const ov = document.createElement('div');
  ov.className = 'lw-vault-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-label', 'Entity Vault');
  ov.setAttribute('aria-modal', 'true');

  ov.innerHTML = `
    <div class="lw-vault-inner">
      <div class="lw-vault-header">
        <span class="lw-vault-title">Entity Vault</span>
        <button class="lw-panel-close" aria-label="Close vault">&times;</button>
      </div>
      <div class="lw-vault-tabs" role="tablist">
        <button class="lw-vault-tab active" data-vtab="npc">NPCs</button>
        <button class="lw-vault-tab" data-vtab="location">Locations</button>
        <button class="lw-vault-tab" data-vtab="item">Items</button>
      </div>
      <div class="lw-vault-body" id="lw-vault-body"></div>
      <div class="lw-vault-add">
        <input class="field-input" id="lw-vault-add-name" placeholder="New name…" maxlength="60">
        <button class="btn btn-primary" id="lw-vault-add-btn">Add</button>
      </div>
    </div>
  `;

  document.body.appendChild(ov);
  vaultOverlay = ov;
  ov._activeTab = 'npc';

  function renderVaultTab(tab) {
    ov._activeTab = tab;
    const body = ov.querySelector('#lw-vault-body');
    ov.querySelectorAll('.lw-vault-tab').forEach(b => b.classList.toggle('active', b.dataset.vtab === tab));

    let entities = [];
    if (tab === 'npc') entities = (typeof NPC !== 'undefined' ? NPC.getSaved() : []);
    if (tab === 'location') entities = Locations.getAll();
    if (tab === 'item') entities = Items.getAll();

    if (!entities.length) {
      body.innerHTML = `<p class="saved-empty">${tab === 'npc' ? 'Save NPCs from the NPC tab.' : `No ${tab}s yet.`}</p>`;
      return;
    }

    body.innerHTML = entities.map(e => `
      <div class="lw-vault-row lw-vault-row-${tab}">
        <div class="lw-vault-row-name">${escHtml(e.name)}</div>
        ${tab !== 'npc' ? `<button class="icon-btn remove lw-vault-delete" data-id="${e.id}" aria-label="Delete ${escHtml(e.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>` : ''}
      </div>
    `).join('');

    body.querySelectorAll('.lw-vault-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        if (tab === 'location') Locations.remove(id);
        if (tab === 'item') Items.remove(id);
        renderVaultTab(tab);
        refreshHighlight();
        renderEntityChips();
      });
    });
  }

  ov.querySelectorAll('.lw-vault-tab').forEach(btn => {
    btn.addEventListener('click', () => renderVaultTab(btn.dataset.vtab));
  });

  ov.querySelector('.lw-panel-close').addEventListener('click', closeVaultBrowser);

  ov.querySelector('#lw-vault-add-btn').addEventListener('click', () => {
    const nameEl = ov.querySelector('#lw-vault-add-name');
    const name = nameEl.value.trim();
    if (!name) return;
    if (ov._activeTab === 'location') Locations.add(name, '');
    if (ov._activeTab === 'item') Items.add(name, '');
    if (ov._activeTab === 'npc') { showToast('Add NPCs via the NPC Generator tab'); return; }
    nameEl.value = '';
    renderVaultTab(ov._activeTab);
    refreshHighlight();
    renderEntityChips();
    showToast('Added');
  });

  renderVaultTab('npc');
  requestAnimationFrame(() => ov.classList.add('lw-vault-open'));
}

function closeVaultBrowser() {
  if (!vaultOverlay) return;
  const ov = vaultOverlay;
  ov.classList.remove('lw-vault-open');
  setTimeout(() => { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 300);
  vaultOverlay = null;
}

/* ── Link-word toolbar state ─────────────────────────────────── */
let _noteTextarea = null;
let _highlightDiv = null;

// Refresh the highlight overlay content from the current textarea value
function refreshHighlight() {
  if (!_highlightDiv || !_noteTextarea) return;
  const text = _noteTextarea.value;
  _highlightDiv.innerHTML = LinkedWords.highlight(text) + '<br>';
  // Attach tap handlers to marks
  _highlightDiv.querySelectorAll('.lw').forEach(mark => {
    mark.addEventListener('click', () => {
      const type = mark.dataset.lwType;
      const id = Number(mark.dataset.lwId);
      const entities = LinkedWords.getEntities();
      const ent = entities.find(e => e.type === type && e.id === id);
      if (ent) openSlidePanel(ent);
    });
    mark.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mark.click(); }
    });
  });
}

// Render entity chips below textarea
function renderEntityChips() {
  const chips = document.getElementById('lw-entity-chips');
  if (!chips || !_noteTextarea) return;
  const text = _noteTextarea.value;
  const entities = LinkedWords.getEntities();
  const mentioned = LinkedWords.countMentions(text, entities);

  const label = document.getElementById('lw-chips-label');
  if (!mentioned.length) {
    chips.innerHTML = '';
    if (label) label.style.display = 'none';
    return;
  }
  if (label) label.style.display = 'block';

  chips.innerHTML = mentioned.map(e => `
    <button class="lw-chip lw-chip-${e.type}" data-type="${e.type}" data-id="${e.id}" title="${escHtml(e.name)} — ${e.count} mention${e.count !== 1 ? 's' : ''}">
      ${escHtml(e.name)}
      <span class="lw-chip-count">${e.count}</span>
    </button>
  `).join('');

  chips.querySelectorAll('.lw-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.type;
      const id = Number(chip.dataset.id);
      const ent = LinkedWords.getEntities().find(e => e.type === type && e.id === id);
      if (ent) openSlidePanel(ent);
    });
  });
}

/* ── Selection → Link-as popup ──────────────────────────────── */
let _linkPopup = null;

function hideLinkPopup() {
  if (_linkPopup && _linkPopup.parentNode) _linkPopup.parentNode.removeChild(_linkPopup);
  _linkPopup = null;
}

function showLinkPopup(word, x, y) {
  hideLinkPopup();
  const pop = document.createElement('div');
  pop.className = 'lw-link-popup';
  pop.innerHTML = `
    <div class="lw-link-popup-word">"${escHtml(word)}"</div>
    <button class="lw-link-btn lw-link-npc" data-ltype="npc">Link as NPC</button>
    <button class="lw-link-btn lw-link-location" data-ltype="location">Link as Location</button>
    <button class="lw-link-btn lw-link-item" data-ltype="item">Link as Item</button>
    <button class="lw-link-cancel">Cancel</button>
  `;
  pop.style.left = Math.min(x, window.innerWidth - 200) + 'px';
  pop.style.top = (y - 8) + 'px';
  document.body.appendChild(pop);
  _linkPopup = pop;

  pop.querySelectorAll('.lw-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ltype = btn.dataset.ltype;
      linkWord(word, ltype);
      hideLinkPopup();
    });
  });
  pop.querySelector('.lw-link-cancel').addEventListener('click', hideLinkPopup);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', hideLinkPopupOnOutside, {once: true, capture: true});
  }, 10);
}

function hideLinkPopupOnOutside(e) {
  if (_linkPopup && !_linkPopup.contains(e.target)) hideLinkPopup();
}

function linkWord(word, type) {
  const name = word.trim();
  if (!name) return;
  // Check if already exists
  const entities = LinkedWords.getEntities();
  const existing = entities.find(e => e.type === type && e.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    showToast(`"${name}" already linked as ${type}`);
    refreshHighlight(); renderEntityChips(); return;
  }

  if (type === 'location') Locations.add(name, '');
  else if (type === 'item') Items.add(name, '');
  else if (type === 'npc') {
    showToast('To link as NPC: save from NPC Generator tab first');
    return;
  }
  showToast(`Linked "${name}" as ${type}`);
  refreshHighlight();
  renderEntityChips();
}

/* ── UI ─────────────────────────────────────────────────────── */
let notesSaveTimer = null;

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
      Notes.setActive(Number(row.dataset.id));
      renderNotesList();
      renderNoteEditor();
    });
    row.addEventListener('keydown', e => { if (e.key === 'Enter') row.click(); });
  });

  list.querySelectorAll('.notes-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
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

  // Set up highlight div
  _highlightDiv = document.getElementById('lw-highlight');
  refreshHighlight();
  renderEntityChips();

  // Update placeholder count badge
  updatePhBadge();

  function scheduleSave() {
    clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(() => {
      Notes.updateSession(session.id, {
        title: titleEl.value,
        content: contentEl.value
      });
    }, 600);
  }

  titleEl.oninput = scheduleSave;

  // Textarea input: autosave + refresh highlight
  contentEl.oninput = () => {
    scheduleSave();
    refreshHighlight();
    renderEntityChips();
    updatePhBadge();
    syncScroll();
  };
  contentEl.onscroll = syncScroll;
}

function syncScroll() {
  if (!_noteTextarea || !_highlightDiv) return;
  _highlightDiv.scrollTop = _noteTextarea.scrollTop;
}

function updatePhBadge() {
  const badge = document.getElementById('lw-ph-count');
  if (!badge || !_noteTextarea) return;
  const n = countPlaceholders(_noteTextarea.value);
  badge.textContent = n || '';
  badge.style.display = n ? 'inline-flex' : 'none';
}

function setupNotesUI() {
  Notes.load();
  Locations.load();
  Items.load();

  /* New session button */
  document.getElementById('new-session-btn').addEventListener('click', () => {
    Notes.createSession('');
    renderNotesList();
    renderNoteEditor();
    setTimeout(() => {
      const t = document.getElementById('note-title');
      if (t) { t.focus(); t.select(); }
    }, 50);
  });

  /* Toolbar: Insert placeholder dropdown */
  const insertSelect = document.getElementById('lw-insert-ph');
  if (insertSelect) {
    insertSelect.addEventListener('change', () => {
      const val = insertSelect.value;
      if (!val || !_noteTextarea) return;
      insertPlaceholder(_noteTextarea, val);
      insertSelect.value = '';
      refreshHighlight();
      renderEntityChips();
      updatePhBadge();
    });
  }

  /* Toolbar: Jump to next placeholder */
  const jumpBtn = document.getElementById('lw-jump-ph');
  if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
      if (!_noteTextarea) return;
      const found = jumpToNextPlaceholder(_noteTextarea);
      if (!found) showToast('No placeholders in note');
    });
  }

  /* Toolbar: Vault browser */
  const vaultBtn = document.getElementById('lw-vault-btn');
  if (vaultBtn) {
    vaultBtn.addEventListener('click', openVaultBrowser);
  }

  /* Selection → Link-as NPC/Location/Item via toolbar button */
  const linkWordBtn = document.getElementById('lw-link-word-btn');
  if (linkWordBtn) {
    linkWordBtn.addEventListener('click', () => {
      if (!_noteTextarea) return;
      const start = _noteTextarea.selectionStart;
      const end = _noteTextarea.selectionEnd;
      const word = _noteTextarea.value.slice(start, end).trim();
      if (!word) { showToast('Select a word or phrase first'); return; }
      const rect = linkWordBtn.getBoundingClientRect();
      showLinkPopup(word, rect.left, rect.bottom + window.scrollY + 8);
    });
  }

  /* Also allow right-click / long-press on textarea to link selection */
  const contentEl = document.getElementById('note-content');
  if (contentEl) {
    contentEl.addEventListener('contextmenu', e => {
      const start = contentEl.selectionStart;
      const end = contentEl.selectionEnd;
      const word = contentEl.value.slice(start, end).trim();
      if (word) {
        e.preventDefault();
        showLinkPopup(word, e.clientX, e.clientY + window.scrollY);
      }
    });
  }

  /* Close link popup on Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideLinkPopup();
      closeSlidePanel();
      closeVaultBrowser();
    }
  });

  renderNotesList();
  renderNoteEditor();
}
