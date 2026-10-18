/**
 * Session Notes — per-session text notes with date + title
 * Persisted in localStorage
 */

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

  function setActive(id) {
    activeId = id;
    persist();
  }

  function getActive() {
    return sessions.find(s => s.id === activeId) || null;
  }

  function getSessions() { return sessions; }
  function getActiveId() { return activeId; }

  return { load, createSession, updateSession, deleteSession, setActive, getActive, getSessions, getActiveId };
})();

// ── UI ─────────────────────────────────────────────────────
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
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter') row.click();
    });
  });

  list.querySelectorAll('.notes-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      Notes.deleteSession(id);
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

  if (!session) {
    editorArea.style.display = 'none';
    return;
  }

  editorArea.style.display = 'block';
  titleEl.value = session.title;
  contentEl.value = session.content;

  // Autosave on changes
  function scheduleSave() {
    clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(() => {
      Notes.updateSession(session.id, {
        title: titleEl.value,
        content: contentEl.value
      });
    }, 600);
  }

  // Remove and re-add listeners to avoid stacking
  titleEl.oninput = scheduleSave;
  contentEl.oninput = scheduleSave;
}

function setupNotesUI() {
  Notes.load();

  document.getElementById('new-session-btn').addEventListener('click', () => {
    Notes.createSession('');
    renderNotesList();
    renderNoteEditor();
    // Focus title
    setTimeout(() => {
      const t = document.getElementById('note-title');
      if (t) { t.focus(); t.select(); }
    }, 50);
  });

  renderNotesList();
  renderNoteEditor();
}
