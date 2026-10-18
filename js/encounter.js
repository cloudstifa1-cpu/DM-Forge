/**
 * Encounter Builder module
 * Monster CR → XP, difficulty thresholds by party level
 * Based on D&D 5e SRD encounter building rules
 */

const Encounter = (() => {
  // XP values per CR (0–30)
  const CR_XP = {
    '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
    '1': 200, '2': 450, '3': 700, '4': 1100,
    '5': 1800, '6': 2300, '7': 2900, '8': 3900,
    '9': 5000, '10': 5900, '11': 7200, '12': 8400,
    '13': 10000, '14': 11500, '15': 13000, '16': 15000,
    '17': 18000, '18': 20000, '19': 22000, '20': 25000,
    '21': 33000, '22': 41000, '23': 50000, '24': 62000,
    '25': 75000, '26': 90000, '27': 105000, '28': 120000,
    '29': 135000, '30': 155000
  };

  // XP thresholds per character level [easy, medium, hard, deadly]
  const XP_THRESHOLDS = [
    null,
    [25, 50, 75, 100],      // 1
    [50, 100, 150, 200],    // 2
    [75, 150, 225, 400],    // 3
    [125, 250, 375, 500],   // 4
    [250, 500, 750, 1100],  // 5
    [300, 600, 900, 1400],  // 6
    [350, 750, 1100, 1700], // 7
    [450, 900, 1400, 2100], // 8
    [550, 1100, 1600, 2400],// 9
    [600, 1200, 1900, 2800],// 10
    [800, 1600, 2400, 3600],// 11
    [1000,2000,3000,4500],  // 12
    [1100,2200,3400,5100],  // 13
    [1250,2500,3800,5700],  // 14
    [1400,2800,4300,6400],  // 15
    [1600,3200,4800,7200],  // 16
    [2000,3900,5900,8800],  // 17
    [2100,4200,6300,9500],  // 18
    [2400,4900,7300,10900], // 19
    [2800,5700,8500,12700], // 20
  ];

  // Monster multiplier by count
  function getMultiplier(count) {
    if (count === 1) return 1;
    if (count === 2) return 1.5;
    if (count <= 6) return 2;
    if (count <= 10) return 2.5;
    if (count <= 14) return 3;
    return 4;
  }

  let monsters = [];
  let party = { size: 4, level: 5 };
  let nextId = 1;

  function save() {
    try {
      localStorage.setItem('dmforge_encounter', JSON.stringify({ monsters, party, nextId }));
    } catch (e) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem('dmforge_encounter');
      if (!raw) return;
      const data = JSON.parse(raw);
      monsters = data.monsters || [];
      party = data.party || { size: 4, level: 5 };
      nextId = data.nextId || 1;
    } catch (e) {
      monsters = [];
    }
  }

  function addMonster({ name, cr }) {
    const xp = CR_XP[cr] ?? 0;
    monsters.push({ id: nextId++, name: name.trim() || 'Unknown Monster', cr, xp });
    save();
  }

  function removeMonster(id) {
    monsters = monsters.filter(m => m.id !== id);
    save();
  }

  function setParty(size, level) {
    party.size = Math.max(1, parseInt(size) || 4);
    party.level = Math.min(20, Math.max(1, parseInt(level) || 5));
    save();
  }

  function getDifficulty() {
    if (monsters.length === 0) return { label: 'No Monsters', cls: 'diff-trivial', xp: 0, adjustedXp: 0 };

    const rawXp = monsters.reduce((sum, m) => sum + m.xp, 0);
    const multiplier = getMultiplier(monsters.length);
    const adjustedXp = Math.floor(rawXp * multiplier);

    const lvl = Math.min(20, Math.max(1, party.level));
    const thresh = XP_THRESHOLDS[lvl];
    if (!thresh) return { label: 'Unknown', cls: 'diff-medium', xp: rawXp, adjustedXp };

    const partyAdj = adjustedXp; // compared against thresholds × party size
    const [easy, medium, hard, deadly] = thresh.map(t => t * party.size);

    let label, cls;
    if (partyAdj === 0)          { label = 'No threat';  cls = 'diff-trivial'; }
    else if (partyAdj < easy)    { label = 'Trivial';    cls = 'diff-trivial'; }
    else if (partyAdj < medium)  { label = 'Easy';       cls = 'diff-easy'; }
    else if (partyAdj < hard)    { label = 'Medium';     cls = 'diff-medium'; }
    else if (partyAdj < deadly)  { label = 'Hard';       cls = 'diff-hard'; }
    else                         { label = 'Deadly';     cls = 'diff-deadly'; }

    return { label, cls, xp: rawXp, adjustedXp };
  }

  function clearAll() {
    monsters = [];
    save();
  }

  function getState() {
    return { monsters, party, crOptions: Object.keys(CR_XP) };
  }

  return { load, save, addMonster, removeMonster, setParty, getDifficulty, clearAll, getState };
})();

// ── UI ──────────────────────────────────────────────────────
function renderEncounter() {
  const { monsters, party } = Encounter.getState();
  const diff = Encounter.getDifficulty();

  // Party inputs
  document.getElementById('party-size').value = party.size;
  document.getElementById('party-level').value = party.level;

  // Difficulty badge
  const badge = document.getElementById('diff-badge');
  badge.textContent = diff.label;
  badge.className = `difficulty-badge ${diff.cls}`;

  document.getElementById('xp-raw').textContent = diff.xp.toLocaleString();
  document.getElementById('xp-adjusted').textContent = diff.adjustedXp.toLocaleString();

  // Monster list
  const list = document.getElementById('monster-list');
  list.innerHTML = '';

  if (monsters.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2a5 5 0 015 5c0 2-1 3.5-2.5 4.5L16 20H8l1.5-8.5C8 10.5 7 9 7 7a5 5 0 015-5z"/>
          <path d="M9 20h6"/>
        </svg>
        <p>No monsters added.<br>Build your encounter below.</p>
      </div>`;
    return;
  }

  monsters.forEach(m => {
    const card = document.createElement('div');
    card.className = 'monster-card';
    card.innerHTML = `
      <span class="monster-cr">CR ${m.cr}</span>
      <span class="monster-name">${escHtml(m.name)}</span>
      <span class="monster-xp">${m.xp.toLocaleString()} XP</span>
      <button class="icon-btn remove" data-id="${m.id}" aria-label="Remove ${escHtml(m.name)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;
    card.querySelector('.icon-btn.remove').addEventListener('click', () => {
      Encounter.removeMonster(m.id);
      renderEncounter();
    });
    list.appendChild(card);
  });
}

function setupEncounterUI() {
  Encounter.load();

  // Populate CR select
  const crSel = document.getElementById('monster-cr');
  const { crOptions } = Encounter.getState();
  crOptions.forEach(cr => {
    const opt = document.createElement('option');
    opt.value = cr;
    opt.textContent = `CR ${cr}`;
    crSel.appendChild(opt);
  });
  crSel.value = '1';

  renderEncounter();

  // Party config
  ['party-size', 'party-level'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      Encounter.setParty(
        document.getElementById('party-size').value,
        document.getElementById('party-level').value
      );
      renderEncounter();
    });
  });

  // Add monster
  document.getElementById('add-monster-btn').addEventListener('click', () => {
    const name = document.getElementById('monster-name').value;
    const cr = document.getElementById('monster-cr').value;

    if (!name.trim()) {
      showToast('Enter a monster name.');
      return;
    }

    Encounter.addMonster({ name, cr });
    renderEncounter();
    document.getElementById('monster-name').value = '';
    document.getElementById('monster-name').focus();
  });

  document.getElementById('monster-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('add-monster-btn').click();
  });

  document.getElementById('clear-encounter-btn').addEventListener('click', () => {
    if (Encounter.getState().monsters.length === 0) return;
    if (confirm('Clear all monsters from this encounter?')) {
      Encounter.clearAll();
      renderEncounter();
    }
  });
}
