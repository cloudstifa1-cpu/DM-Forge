/**
 * Initiative Tracker module
 * Manages combatant list, sort order, turn progression
 */

const Initiative = (() => {
  let combatants = [];
  let currentIndex = 0;
  let round = 1;
  let nextId = 1;

  // ── Persistence ──────────────────────────────────────────
  function save() {
    try {
      localStorage.setItem('dmforge_initiative', JSON.stringify({ combatants, currentIndex, round, nextId }));
    } catch (e) { /* storage unavailable */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem('dmforge_initiative');
      if (!raw) return;
      const data = JSON.parse(raw);
      combatants = data.combatants || [];
      currentIndex = data.currentIndex || 0;
      round = data.round || 1;
      nextId = data.nextId || 1;
    } catch (e) {
      combatants = [];
    }
  }

  // ── Combatant CRUD ────────────────────────────────────────
  function addCombatant({ name, initiative, hp, type = 'character' }) {
    const c = {
      id: nextId++,
      name: name.trim() || 'Unknown',
      initiative: parseInt(initiative) || 0,
      hp: parseInt(hp) || null,
      maxHp: parseInt(hp) || null,
      type, // 'character' | 'monster' | 'npc'
    };
    combatants.push(c);
    combatants.sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name));
    // If we insert before or at currentIndex after sort, adjust
    save();
    return c;
  }

  function removeCombatant(id) {
    const idx = combatants.findIndex(c => c.id === id);
    if (idx === -1) return;
    combatants.splice(idx, 1);
    if (currentIndex >= combatants.length && combatants.length > 0) {
      currentIndex = 0;
    }
    save();
  }

  function updateHp(id, newHp) {
    const c = combatants.find(c => c.id === id);
    if (c) { c.hp = parseInt(newHp); save(); }
  }

  // ── Turn Control ──────────────────────────────────────────
  function nextTurn() {
    if (combatants.length === 0) return;
    currentIndex = (currentIndex + 1) % combatants.length;
    if (currentIndex === 0) round++;
    save();
  }

  function prevTurn() {
    if (combatants.length === 0) return;
    if (currentIndex === 0) {
      currentIndex = combatants.length - 1;
      round = Math.max(1, round - 1);
    } else {
      currentIndex--;
    }
    save();
  }

  function resetCombat() {
    currentIndex = 0;
    round = 1;
    save();
  }

  function clearAll() {
    combatants = [];
    currentIndex = 0;
    round = 1;
    save();
  }

  // ── Getters ───────────────────────────────────────────────
  function getState() {
    return { combatants, currentIndex, round };
  }

  return { load, save, addCombatant, removeCombatant, updateHp, nextTurn, prevTurn, resetCombat, clearAll, getState };
})();

// ── UI ──────────────────────────────────────────────────────
function renderInitiative() {
  const { combatants, currentIndex, round } = Initiative.getState();

  // Round counter
  document.getElementById('round-num').textContent = round;

  // Combatant list
  const list = document.getElementById('combatant-list');
  list.innerHTML = '';

  if (combatants.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <p>No combatants yet.<br>Add creatures below to begin tracking.</p>
      </div>`;
    return;
  }

  combatants.forEach((c, idx) => {
    const isActive = idx === currentIndex;
    const isDone = idx < currentIndex;

    const card = document.createElement('div');
    card.className = `combatant-card${isActive ? ' active-turn' : ''}${isDone ? ' done-turn' : ''}`;
    card.dataset.id = c.id;

    const typeLabel = c.type === 'monster' ? 'Monster' : c.type === 'npc' ? 'NPC' : 'Character';
    const hpDisplay = c.hp !== null
      ? `<span class="combatant-hp">
           HP <input class="hp-input" type="number" value="${c.hp}" min="0" max="999"
                     data-id="${c.id}" aria-label="HP for ${c.name}">
           <span>/ ${c.maxHp ?? '—'}</span>
         </span>`
      : '';

    card.innerHTML = `
      <span class="initiative-badge">${c.initiative}</span>
      <div class="combatant-info">
        <div class="combatant-name">${escHtml(c.name)}</div>
        <div class="combatant-type">${typeLabel}${hpDisplay ? ' · ' : ''}${hpDisplay}</div>
      </div>
      <div class="combatant-actions">
        <button class="icon-btn remove" data-id="${c.id}" aria-label="Remove ${escHtml(c.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>
    `;
    list.appendChild(card);

    // HP input listener
    if (c.hp !== null) {
      const inp = card.querySelector('.hp-input');
      inp.addEventListener('change', e => {
        Initiative.updateHp(c.id, e.target.value);
        renderInitiative();
      });
    }

    // Remove button
    card.querySelector('.icon-btn.remove').addEventListener('click', () => {
      Initiative.removeCombatant(c.id);
      renderInitiative();
    });
  });
}

function setupInitiativeUI() {
  Initiative.load();
  renderInitiative();

  // Add combatant form
  document.getElementById('add-combatant-btn').addEventListener('click', () => {
    const name = document.getElementById('c-name').value;
    const init = document.getElementById('c-init').value;
    const hp   = document.getElementById('c-hp').value;
    const type = document.getElementById('c-type').value;

    if (!name.trim() && !init) {
      showToast('Enter a name and initiative roll.');
      return;
    }

    Initiative.addCombatant({ name, initiative: init, hp, type });
    renderInitiative();

    // Clear fields
    document.getElementById('c-name').value = '';
    document.getElementById('c-init').value = '';
    document.getElementById('c-hp').value = '';
    document.getElementById('c-name').focus();
  });

  // Allow Enter key in form
  ['c-name','c-init','c-hp'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('add-combatant-btn').click();
    });
  });

  document.getElementById('next-turn-btn').addEventListener('click', () => {
    Initiative.nextTurn();
    renderInitiative();
  });

  document.getElementById('prev-turn-btn').addEventListener('click', () => {
    Initiative.prevTurn();
    renderInitiative();
  });

  document.getElementById('reset-combat-btn').addEventListener('click', () => {
    Initiative.resetCombat();
    renderInitiative();
    showToast('Combat reset to round 1.');
  });

  document.getElementById('clear-combat-btn').addEventListener('click', () => {
    if (Initiative.getState().combatants.length === 0) return;
    if (confirm('Clear all combatants?')) {
      Initiative.clearAll();
      renderInitiative();
    }
  });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
