/**
 * Vault — one store for every linkable thing in DM Forge except player characters
 * (those live in characters.js). Each entry:
 *   { id, type, name, aliases[], details, fields{}, createdAt, updatedAt }
 *
 * Replaces the old separate stores (dmforge_npcs, dmforge_locations, dmforge_items).
 * On first load their data is copied in; the old keys are left untouched as a backup.
 */

// Every link type, in the order they appear in menus. Colors are tuned to read on the dark forge background.
const LINK_TYPES = [
  { key: 'character', label: 'Player Character', short: 'PC',       color: '#e8735a' },
  { key: 'npc',       label: 'NPC',              short: 'NPC',      color: '#e8b04a' },
  { key: 'location',  label: 'Place',            short: 'Place',    color: '#7cc3b2' },
  { key: 'item',      label: 'Item',             short: 'Item',     color: '#a9b8c9' },
  { key: 'magic',     label: 'Magic Item',       short: 'Magic',    color: '#b9a0e0' },
  { key: 'creature',  label: 'Creature',         short: 'Creature', color: '#8fcf6a' },
  { key: 'faction',   label: 'Faction',          short: 'Faction',  color: '#6fa8e8' },
  { key: 'lore',      label: 'Lore / Note',      short: 'Lore',     color: '#cdbf9f' }
];
const VAULT_TYPES = LINK_TYPES.filter(t => t.key !== 'character').map(t => t.key);

function linkType(key) {
  return LINK_TYPES.find(t => t.key === key) || LINK_TYPES[LINK_TYPES.length - 1];
}

// Quick fields each type offers on its card. Values are kept when the type changes,
// so switching back and forth never loses anything.
const TYPE_FIELDS = {
  npc:      ['hp', 'ac', 'attitude', 'race', 'occupation', 'secret'],
  creature: ['hp', 'ac', 'attitude', 'cr'],
  location: ['region'],
  item:     ['owner', 'charges', 'rarity'],
  magic:    ['owner', 'charges', 'rarity', 'attunement'],
  faction:  ['leader', 'attitude'],
  lore:     []
};
// NPC personality fields only show when they have something in them (e.g. from the generator)
const NPC_EXTRA_FIELDS = ['trait', 'ideal', 'bond', 'flaw'];

const FIELD_DEFS = {
  ac:         { label: 'AC', kind: 'number' },
  attitude:   { label: 'Attitude', kind: 'select', options: ['', 'Friendly', 'Neutral', 'Wary', 'Hostile'] },
  race:       { label: 'Race', kind: 'text' },
  occupation: { label: 'Occupation', kind: 'text' },
  secret:     { label: 'Secret', kind: 'text' },
  trait:      { label: 'Trait', kind: 'text' },
  ideal:      { label: 'Ideal', kind: 'text' },
  bond:       { label: 'Bond', kind: 'text' },
  flaw:       { label: 'Flaw', kind: 'text' },
  cr:         { label: 'CR', kind: 'text' },
  region:     { label: 'Region', kind: 'text' },
  owner:      { label: 'Owner', kind: 'text' },
  charges:    { label: 'Charges', kind: 'text' },
  rarity:     { label: 'Rarity', kind: 'select', options: ['', 'Common', 'Uncommon', 'Rare', 'Very rare', 'Legendary', 'Artifact'] },
  attunement: { label: 'Attunement', kind: 'select', options: ['', 'No', 'Yes', 'Yes — attuned'] },
  leader:     { label: 'Leader', kind: 'text' }
};

const Vault = (() => {
  const KEY = 'dmforge_vault';
  let entries = [];
  let nextId = 1;

  function now() { return new Date().toISOString(); }

  function readOld(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }

  // Copy the old NPC / location / item stores into the vault (runs once)
  function migrate() {
    const npcs = readOld('dmforge_npcs');
    (npcs && npcs.saved || []).forEach(n => {
      entries.push({
        id: nextId++, type: 'npc', name: n.name || 'Unnamed NPC', aliases: [],
        details: n.description || '',
        fields: { race: n.race ? n.race[0].toUpperCase() + n.race.slice(1) : '', occupation: n.occupation || '',
          trait: n.trait || '', ideal: n.ideal || '', bond: n.bond || '', flaw: n.flaw || '', secret: n.secret || '' },
        createdAt: now(), updatedAt: now()
      });
    });
    [['dmforge_locations', 'location'], ['dmforge_items', 'item']].forEach(([key, type]) => {
      const d = readOld(key);
      (d && d.items || []).forEach(x => {
        entries.push({ id: nextId++, type, name: x.name || 'Unnamed', aliases: [], details: x.notes || '',
          fields: {}, createdAt: x.createdAt || now(), updatedAt: now() });
      });
    });
  }

  function load() {
    const d = readOld(KEY);
    if (d && Array.isArray(d.entries)) {
      entries = d.entries;
      nextId = d.nextId || (entries.reduce((m, e) => Math.max(m, e.id), 0) + 1);
    } else {
      entries = []; nextId = 1;
      migrate();
      persist();
    }
    entries.forEach(e => {
      if (!Array.isArray(e.aliases)) e.aliases = [];
      if (!e.fields) e.fields = {};
      if (VAULT_TYPES.indexOf(e.type) < 0) e.type = 'lore';
    });
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ entries, nextId }));
      return true;
    } catch (e) {
      if (typeof showToast === 'function') showToast('Could not save — phone storage is full.');
      return false;
    }
  }

  function add(type, name, extra) {
    const e = Object.assign({
      id: nextId++, type: VAULT_TYPES.indexOf(type) >= 0 ? type : 'lore',
      name: String(name || '').trim() || 'Unnamed', aliases: [], details: '', fields: {},
      createdAt: now(), updatedAt: now()
    }, extra || {});
    entries.unshift(e);
    persist();
    return e;
  }

  function update(id, changes) {
    const e = get(id);
    if (!e) return null;
    Object.assign(e, changes, { updatedAt: now() });
    persist();
    return e;
  }

  function remove(id) { entries = entries.filter(e => e.id !== id); persist(); }
  function get(id) { return entries.find(e => e.id === id) || null; }
  function getAll() { return entries; }
  function byType(type) { return entries.filter(e => e.type === type); }

  return { load, add, update, remove, get, getAll, byType, persist };
})();
