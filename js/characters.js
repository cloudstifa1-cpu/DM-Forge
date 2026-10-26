/**
 * Characters — player characters (separate from NPCs)
 *  FREE: dice generator (4d6 drop lowest / standard array / point buy), sheet, party list
 *  PRO:  portrait builder + photo upload, pre-made heroes
 * Stored in localStorage 'dmforge_characters'. Portraits are kept as builder settings
 * (a few bytes) — only uploaded photos are stored as images, shrunk to 300px.
 */

/* ── 5e rules data ─────────────────────────────────────────── */
const STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const STAT_LABEL = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
const STAT_NAME = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

const CH_RACES = {
  human:      { label: 'Human',      speed: 30, bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 } },
  elf:        { label: 'Elf',        speed: 30, bonus: { dex: 2 } },
  dwarf:      { label: 'Dwarf',      speed: 25, bonus: { con: 2 } },
  halfling:   { label: 'Halfling',   speed: 25, bonus: { dex: 2 } },
  dragonborn: { label: 'Dragonborn', speed: 30, bonus: { str: 2, cha: 1 } },
  gnome:      { label: 'Gnome',      speed: 25, bonus: { int: 2 } },
  'half-elf': { label: 'Half-Elf',   speed: 30, bonus: { cha: 2 }, flex: 2 },
  'half-orc': { label: 'Half-Orc',   speed: 30, bonus: { str: 2, con: 1 } },
  tiefling:   { label: 'Tiefling',   speed: 30, bonus: { cha: 2, int: 1 } }
};
const CH_CLASSES = {
  barbarian: { label: 'Barbarian', hd: 12, saves: ['str', 'con'], prio: ['str', 'con', 'dex', 'wis', 'cha', 'int'] },
  bard:      { label: 'Bard',      hd: 8,  saves: ['dex', 'cha'], prio: ['cha', 'dex', 'con', 'wis', 'int', 'str'] },
  cleric:    { label: 'Cleric',    hd: 8,  saves: ['wis', 'cha'], prio: ['wis', 'con', 'str', 'cha', 'dex', 'int'] },
  druid:     { label: 'Druid',     hd: 8,  saves: ['int', 'wis'], prio: ['wis', 'con', 'dex', 'int', 'cha', 'str'] },
  fighter:   { label: 'Fighter',   hd: 10, saves: ['str', 'con'], prio: ['str', 'con', 'dex', 'wis', 'cha', 'int'] },
  monk:      { label: 'Monk',      hd: 8,  saves: ['str', 'dex'], prio: ['dex', 'wis', 'con', 'str', 'int', 'cha'] },
  paladin:   { label: 'Paladin',   hd: 10, saves: ['wis', 'cha'], prio: ['str', 'cha', 'con', 'wis', 'dex', 'int'] },
  ranger:    { label: 'Ranger',    hd: 10, saves: ['str', 'dex'], prio: ['dex', 'wis', 'con', 'str', 'int', 'cha'] },
  rogue:     { label: 'Rogue',     hd: 8,  saves: ['dex', 'int'], prio: ['dex', 'con', 'int', 'cha', 'wis', 'str'] },
  sorcerer:  { label: 'Sorcerer',  hd: 6,  saves: ['con', 'cha'], prio: ['cha', 'con', 'dex', 'wis', 'int', 'str'] },
  warlock:   { label: 'Warlock',   hd: 8,  saves: ['wis', 'cha'], prio: ['cha', 'con', 'dex', 'wis', 'int', 'str'] },
  wizard:    { label: 'Wizard',    hd: 6,  saves: ['int', 'wis'], prio: ['int', 'con', 'dex', 'wis', 'cha', 'str'] }
};
const CH_BACKGROUNDS = ['Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero', 'Guild Artisan', 'Hermit',
  'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin'];
const CH_ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral',
  'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUDGET = 27;

const PC_TRAITS = [
  'I quote old proverbs for every situation.', 'I am always calm, no matter what.', 'I cannot resist a good mystery.',
  'I make friends with every animal I meet.', 'I tell tall tales about my past.', 'I am blunt and say what I think.',
  'I keep a journal of everything that happens.', 'I laugh loudly and often.', 'I am suspicious of anyone too friendly.',
  'I hum songs from home when I am nervous.', 'I collect a small keepsake from every place I visit.',
  'I always put others before myself.', 'I love a fair fight and hate cheaters.', 'I am terrible at keeping secrets.',
  'I think through every plan three times.', 'I talk to my weapon like an old friend.'
];

// Extra name tables for races the NPC generator doesn't cover
const CH_NAMES = {
  dragonborn: {
    first: ['Arjhan', 'Balasar', 'Bharash', 'Donaar', 'Ghesh', 'Heskan', 'Kriv', 'Medrash', 'Nadarr', 'Patrin', 'Rhogar',
      'Akra', 'Biri', 'Daar', 'Farideh', 'Harann', 'Kava', 'Korinn', 'Mishann', 'Nala', 'Perra', 'Sora', 'Surina', 'Thava'],
    last: ['Clethtinthiallor', 'Daardendrian', 'Delmirev', 'Kerrhylon', 'Kimbatuul', 'Myastan', 'Nemmonis', 'Norixius',
      'Turnuroth', 'Yarjerit', 'Brightscale', 'Ashclaw']
  },
  gnome: {
    first: ['Alston', 'Alvyn', 'Boddynock', 'Brocc', 'Dimble', 'Eldon', 'Fonkin', 'Gimble', 'Glim', 'Jebeddo', 'Orryn',
      'Roondar', 'Seebo', 'Sindri', 'Wrenn', 'Zook', 'Bimpnottin', 'Breena', 'Caramip', 'Donella', 'Ellywick', 'Lilli',
      'Nissa', 'Nyx', 'Roywyn', 'Tana', 'Waywocket', 'Zanna'],
    last: ['Beren', 'Daergel', 'Folkor', 'Garrick', 'Glimmerstone', 'Nackle', 'Murnig', 'Ningel', 'Raulnor', 'Scheppen', 'Timbers', 'Turen']
  },
  'half-orc': {
    first: ['Dench', 'Feng', 'Gell', 'Henk', 'Holg', 'Imsh', 'Keth', 'Krusk', 'Mhurren', 'Ront', 'Shump', 'Thokk', 'Grosh',
      'Baggi', 'Emen', 'Engong', 'Kansif', 'Myev', 'Neega', 'Ovak', 'Ownka', 'Shautha', 'Sutha', 'Vola', 'Volen', 'Yevelda'],
    last: ['Thornhide', 'Skullsplitter', 'Ironjaw', 'Ashford', 'Blackwood', 'Greystone', 'Redvale', 'Underhill']
  }
};

/* ── Portrait builder (ported from Raven's Immortal Art Studios charcreate.html) ── */
const P_SKIN = ['#f6d7c3', '#eac0a0', '#d9a07b', '#c68642', '#a0673e', '#7c4a2d', '#5a3420', '#9bb8a0', '#a9b4d6', '#c9c4bd', '#b04a3f', '#b5652e'];
const P_HAIRC = ['#1c1a1a', '#5a3825', '#8d3b1f', '#d8b25a', '#b5371f', '#e8e4dc', '#8a8a8a', '#3a5fb0', '#6b3fa0', '#2f6b45'];
const P_EYEC = ['#5b3a1e', '#8a6d2e', '#3f7a3a', '#3b6fb6', '#8a96a0', '#d4a017', '#b3261e', '#7a4bb5', '#e8e4dc'];
const P_CLOTHC = ['#7a1f2b', '#1f2f5a', '#24503a', '#1a1a1f', '#5a3b22', '#5c5f66', '#b08a2e', '#d8d2c4', '#4a2a5e'];
const P_BGC = ['#05080f', '#1b2440', '#2a1e3a', '#3a2418', '#18352c', '#5a4a2a', '#3a3f4a', '#5a1f24'];

const P_GROUPS = [
  { k: 'sex', label: 'Sex', opts: [['female', 'Female'], ['male', 'Male'], ['other', 'Other']] },
  { k: 'skin', label: 'Skin', colors: P_SKIN },
  { k: 'face', label: 'Face shape', opts: [['oval', 'Oval'], ['round', 'Round'], ['square', 'Square'], ['long', 'Long']] },
  { k: 'hair', label: 'Hair', opts: [['bald', 'Bald'], ['short', 'Short'], ['long', 'Long'], ['curly', 'Curly'], ['ponytail', 'Ponytail'], ['spiky', 'Spiky']] },
  { k: 'hairColor', label: 'Hair color', colors: P_HAIRC },
  { k: 'eyes', label: 'Eyes', opts: [['normal', 'Normal'], ['narrow', 'Narrow'], ['wide', 'Wide']] },
  { k: 'eyeColor', label: 'Eye color', colors: P_EYEC },
  { k: 'mouth', label: 'Mouth', opts: [['smile', 'Smile'], ['neutral', 'Neutral'], ['frown', 'Frown']] },
  { k: 'facial', label: 'Facial hair', opts: [['none', 'None'], ['stubble', 'Stubble'], ['mustache', 'Mustache'], ['beard', 'Beard']] },
  { k: 'clothes', label: 'Clothes', opts: [['tunic', 'Tunic'], ['robe', 'Robe'], ['armor', 'Armor'], ['cloak', 'Hooded cloak']] },
  { k: 'clothesColor', label: 'Clothes color', colors: P_CLOTHC },
  { k: 'extras', label: 'Extras', multi: true, opts: [['elf', 'Pointed ears'], ['horns', 'Horns'], ['tusks', 'Tusks'], ['freckles', 'Freckles'], ['scar', 'Scar'], ['eyepatch', 'Eyepatch'], ['glasses', 'Glasses'], ['crown', 'Crown']] },
  { k: 'bg', label: 'Background', colors: P_BGC }
];
const P_DEFAULT = { sex: 'other', skin: '#d9a07b', face: 'oval', hair: 'short', hairColor: '#5a3825', eyes: 'normal',
  eyeColor: '#5b3a1e', mouth: 'smile', facial: 'none', clothes: 'tunic', clothesColor: '#7a1f2b', extras: [], bg: '#1b2440' };

function pShade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = c => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}

// Only allow known option values / hex colors into the SVG
function cleanPortrait(p) {
  const out = JSON.parse(JSON.stringify(P_DEFAULT));
  if (!p || typeof p !== 'object') return out;
  P_GROUPS.forEach(g => {
    if (g.multi) {
      const ok = g.opts.map(o => o[0]);
      out.extras = Array.isArray(p.extras) ? p.extras.filter(x => ok.indexOf(x) >= 0) : [];
    } else if (g.colors) {
      if (typeof p[g.k] === 'string' && /^#[0-9a-fA-F]{6}$/.test(p[g.k])) out[g.k] = p[g.k];
    } else if (g.opts.some(o => o[0] === p[g.k])) out[g.k] = p[g.k];
  });
  return out;
}

function portraitSVG(raw) {
  const c = cleanPortrait(raw);
  const has = x => c.extras.indexOf(x) >= 0;
  const skinD = pShade(c.skin, -0.18), hairD = pShade(c.hairColor, -0.25), clothD = pShade(c.clothesColor, -0.3);
  const hw = { oval: 42, round: 46, square: 42, long: 37 }[c.face] || 42;
  const s = [];
  s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">');
  s.push('<rect width="200" height="240" fill="' + c.bg + '"/>');
  s.push('<ellipse cx="100" cy="120" rx="90" ry="100" fill="#ffffff" opacity="0.05"/>');
  if (c.clothes === 'cloak') s.push('<ellipse cx="100" cy="104" rx="62" ry="74" fill="' + clothD + '"/>');
  if (c.hair === 'long') s.push('<path d="M54 90 Q52 44 100 43 Q148 44 146 90 L150 182 Q136 194 122 178 L118 130 L82 130 L78 178 Q64 194 50 182 Z" fill="' + hairD + '"/>');
  if (c.hair === 'ponytail') s.push('<path d="M128 66 Q182 78 162 176 Q152 146 132 112 Z" fill="' + hairD + '"/>');
  if (c.hair === 'curly') {
    for (let i = 0; i < 7; i++) {
      s.push('<circle cx="' + (58 - (i % 2) * 4) + '" cy="' + (78 + i * 13) + '" r="13" fill="' + hairD + '"/>');
      s.push('<circle cx="' + (142 + (i % 2) * 4) + '" cy="' + (78 + i * 13) + '" r="13" fill="' + hairD + '"/>');
    }
  }
  const shoulders = 'M22 240 C24 200 56 186 88 182 L112 182 C144 186 176 200 178 240 Z';
  if (c.clothes === 'armor') {
    s.push('<path d="' + shoulders + '" fill="#7d828c"/>');
    s.push('<path d="M70 240 L76 196 L124 196 L130 240 Z" fill="#9aa0aa"/>');
    s.push('<path d="M76 210 L124 210 M74 224 L126 224" stroke="#5f646c" stroke-width="2"/>');
    s.push('<circle cx="42" cy="206" r="22" fill="#9aa0aa" stroke="#5f646c" stroke-width="2"/>');
    s.push('<circle cx="158" cy="206" r="22" fill="#9aa0aa" stroke="#5f646c" stroke-width="2"/>');
    s.push('<path d="M86 184 L100 196 L114 184" fill="none" stroke="' + c.clothesColor + '" stroke-width="5"/>');
  } else {
    s.push('<path d="' + shoulders + '" fill="' + c.clothesColor + '"/>');
    if (c.clothes === 'tunic') s.push('<path d="M86 182 L100 206 L114 182 Z" fill="' + skinD + '"/>');
    if (c.clothes === 'robe') {
      s.push('<path d="M84 182 L100 240 L74 240 L60 192 Z" fill="' + clothD + '"/>');
      s.push('<path d="M116 182 L100 240 L126 240 L140 192 Z" fill="' + clothD + '"/>');
      s.push('<path d="M100 200 L100 240" stroke="#d4a017" stroke-width="2"/>');
    }
    if (c.clothes === 'cloak') {
      s.push('<path d="M60 192 Q100 214 140 192" fill="none" stroke="' + clothD + '" stroke-width="6"/>');
      s.push('<circle cx="100" cy="204" r="6" fill="#d4a017" stroke="#8a6a10" stroke-width="1.5"/>');
    }
  }
  s.push('<path d="M88 148 L88 186 Q100 194 112 186 L112 148 Z" fill="' + skinD + '"/>');
  if (has('elf')) {
    s.push('<path d="M' + (100 - hw + 4) + ' 98 L' + (100 - hw - 22) + ' 78 L' + (100 - hw + 2) + ' 122 Z" fill="' + c.skin + '" stroke="' + skinD + '"/>');
    s.push('<path d="M' + (100 + hw - 4) + ' 98 L' + (100 + hw + 22) + ' 78 L' + (100 + hw - 2) + ' 122 Z" fill="' + c.skin + '" stroke="' + skinD + '"/>');
  } else {
    s.push('<ellipse cx="' + (100 - hw) + '" cy="110" rx="7" ry="11" fill="' + c.skin + '" stroke="' + skinD + '"/>');
    s.push('<ellipse cx="' + (100 + hw) + '" cy="110" rx="7" ry="11" fill="' + c.skin + '" stroke="' + skinD + '"/>');
  }
  const hs = ' fill="' + c.skin + '" stroke="' + skinD + '" stroke-width="1.5"';
  if (c.face === 'round') s.push('<ellipse cx="100" cy="106" rx="46" ry="47"' + hs + '/>');
  else if (c.face === 'square') s.push('<path d="M58 70 Q58 52 80 52 L120 52 Q142 52 142 70 L142 128 Q142 158 100 160 Q58 158 58 128 Z"' + hs + '/>');
  else if (c.face === 'long') s.push('<ellipse cx="100" cy="102" rx="37" ry="57"' + hs + '/>');
  else s.push('<ellipse cx="100" cy="104" rx="42" ry="52"' + hs + '/>');
  s.push('<ellipse cx="78" cy="126" rx="8" ry="5" fill="#e06a6a" opacity="0.12"/>');
  s.push('<ellipse cx="122" cy="126" rx="8" ry="5" fill="#e06a6a" opacity="0.12"/>');
  const browC = c.hair === 'bald' ? pShade(c.skin, -0.45) : hairD;
  s.push('<path d="M74 94 Q83 89 92 93 M108 93 Q117 89 126 94" fill="none" stroke="' + browC + '" stroke-width="' + (c.sex === 'male' ? 4.2 : c.sex === 'female' ? 2.4 : 3) + '" stroke-linecap="round"/>');
  const ry = { normal: 6, narrow: 3.6, wide: 8 }[c.eyes] || 6;
  [83, 117].forEach(x => {
    if (has('eyepatch') && x === 117) return;
    s.push('<ellipse cx="' + x + '" cy="107" rx="9" ry="' + ry + '" fill="#f4f1ea"/>');
    s.push('<circle cx="' + x + '" cy="107" r="' + Math.min(4.6, ry - 0.4) + '" fill="' + c.eyeColor + '"/>');
    s.push('<circle cx="' + x + '" cy="107" r="' + Math.min(2.2, ry / 2) + '" fill="#111"/>');
    s.push('<circle cx="' + (x + 1.6) + '" cy="105.4" r="1" fill="#fff"/>');
    if (c.sex === 'female') {
      const o = x < 100 ? -1 : 1, top = 107 - ry;
      s.push('<path d="M' + (x - 9.5) + ' 107.5 Q' + x + ' ' + (top - 1.5) + ' ' + (x + 9.5) + ' 107.5" fill="none" stroke="#1a1414" stroke-width="2" stroke-linecap="round"/>');
      s.push('<path d="M' + (x + o * 9) + ' 106.5 L' + (x + o * 13) + ' 103.5" stroke="#1a1414" stroke-width="1.8" stroke-linecap="round"/>');
    }
  });
  s.push('<path d="M100 112 Q95 125 99 129 Q102 130 106 128" fill="none" stroke="' + skinD + '" stroke-width="2" stroke-linecap="round"/>');
  const mouth = { smile: 'M88 136 Q100 146 112 136', neutral: 'M89 139 L111 139', frown: 'M88 142 Q100 134 112 142' }[c.mouth] || 'M88 136 Q100 146 112 136';
  s.push('<path d="' + mouth + '" fill="none" stroke="' + (c.sex === 'female' ? '#a8494a' : '#7a3a35') + '" stroke-width="' + (c.sex === 'female' ? 3.2 : 2.6) + '" stroke-linecap="round"/>');
  if (has('freckles')) {
    [[72, 120], [77, 124], [81, 119], [119, 119], [123, 124], [128, 120], [96, 119], [104, 119]].forEach(p => {
      s.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.3" fill="' + pShade(c.skin, -0.4) + '" opacity="0.7"/>');
    });
  }
  if (has('scar')) s.push('<path d="M70 92 L86 124 M74 100 L80 98 M78 108 L84 106 M82 116 L88 114" stroke="#9a4a46" stroke-width="2" stroke-linecap="round"/>');
  if (c.facial === 'stubble') s.push('<path d="M62 118 Q64 160 100 162 Q136 160 138 118 Q128 148 100 150 Q72 148 62 118 Z" fill="' + c.hairColor + '" opacity="0.28"/>');
  if (c.facial === 'mustache' || c.facial === 'beard') s.push('<path d="M84 131 Q100 123 116 131 Q108 136 100 132 Q92 136 84 131 Z" fill="' + c.hairColor + '"/>');
  if (c.facial === 'beard') s.push('<path d="M60 116 Q58 176 100 186 Q142 176 140 116 Q132 150 114 146 Q100 154 86 146 Q68 150 60 116 Z" fill="' + c.hairColor + '"/>');
  if (has('tusks')) {
    s.push('<path d="M88 141 L90 129 L94 140 Z" fill="#f4efe2" stroke="#b8ad94" stroke-width="1"/>');
    s.push('<path d="M106 140 L110 129 L112 141 Z" fill="#f4efe2" stroke="#b8ad94" stroke-width="1"/>');
  }
  const hf = ' fill="' + c.hairColor + '"';
  const cap = '<path d="M57 104 Q54 46 100 45 Q146 46 143 104 Q136 72 100 68 Q66 70 57 104 Z"' + hf + '/>';
  if (c.hair === 'short' || c.hair === 'long' || c.hair === 'ponytail') s.push(cap);
  if (c.hair === 'spiky') s.push('<path d="M56 102 L50 70 L66 62 L60 40 L80 52 L86 30 L100 47 L113 28 L121 50 L140 40 L135 62 L151 72 L144 102 Q134 72 100 68 Q66 72 56 102 Z"' + hf + '/>');
  if (c.hair === 'curly') {
    for (let a = 0; a <= 10; a++) {
      const ang = Math.PI * (1.05 + a * 0.09);
      s.push('<circle cx="' + (100 + Math.cos(ang) * 44).toFixed(1) + '" cy="' + (84 + Math.sin(ang) * 40).toFixed(1) + '" r="14"' + hf + '/>');
    }
  }
  if (c.hair === 'bald') s.push('<ellipse cx="84" cy="66" rx="13" ry="6" fill="#ffffff" opacity="0.18" transform="rotate(-18 84 66)"/>');
  if (c.clothes === 'cloak') s.push('<path d="M44 160 Q36 28 100 26 Q164 28 156 160 Q152 58 100 50 Q48 58 44 160 Z" fill="' + c.clothesColor + '"/>');
  if (has('eyepatch')) {
    s.push('<path d="M56 98 L144 84" stroke="#111" stroke-width="3"/>');
    s.push('<ellipse cx="117" cy="107" rx="11" ry="9" fill="#151515"/>');
  }
  if (has('glasses')) s.push('<g fill="none" stroke="#2a2a2a" stroke-width="2.4"><circle cx="83" cy="107" r="11"/><circle cx="117" cy="107" r="11"/><path d="M94 106 Q100 102 106 106"/></g>');
  if (has('horns')) {
    s.push('<path d="M70 64 Q50 42 58 16 Q66 40 82 56 Z" fill="#e8dcc8" stroke="#8a7a60" stroke-width="1.5"/>');
    s.push('<path d="M130 64 Q150 42 142 16 Q134 40 118 56 Z" fill="#e8dcc8" stroke="#8a7a60" stroke-width="1.5"/>');
  }
  if (has('crown')) {
    s.push('<path d="M68 58 L72 30 L86 46 L100 22 L114 46 L128 30 L132 58 Z" fill="#d4a017" stroke="#8a6a10" stroke-width="1.5"/>');
    s.push('<circle cx="100" cy="46" r="4" fill="#b3261e"/>');
  }
  s.push('</svg>');
  return s.join('');
}

/* ── Small helpers ─────────────────────────────────────────── */
function chPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function d6() { return 1 + Math.floor(Math.random() * 6); }
function modOf(score) { return Math.floor((score - 10) / 2); }
function fmtMod(n) { return (n >= 0 ? '+' : '−') + Math.abs(n); }
function chClone(o) { return JSON.parse(JSON.stringify(o)); }

// 4d6, drop the lowest. Returns the four dice; the dropped one is the first lowest.
function roll4d6() { return [d6(), d6(), d6(), d6()]; }
function droppedIndex(dice) {
  let lo = 0;
  for (let i = 1; i < dice.length; i++) if (dice[i] < dice[lo]) lo = i;
  return lo;
}
function diceTotal(dice) { return dice.reduce((a, b) => a + b, 0) - dice[droppedIndex(dice)]; }

// Look that fits the race: ears, horns, tusks, skin, beards
function applyRaceLook(p, race) {
  p.extras = (p.extras || []).filter(x => ['elf', 'horns', 'tusks'].indexOf(x) < 0);
  if (race === 'elf' || race === 'half-elf') p.extras.push('elf');
  if (race === 'tiefling') p.extras.push('horns');
  if (race === 'half-orc') p.extras.push('tusks');
  return p;
}

function randomLook(race, sex) {
  const p = chClone(P_DEFAULT);
  p.sex = sex || chPick(['female', 'male']);
  P_GROUPS.forEach(g => {
    if (g.k === 'sex' || g.multi) return;
    if (g.k === 'facial') {
      const r = Math.random();
      p.facial = p.sex === 'female' ? 'none' : r < 0.3 ? 'none' : r < 0.55 ? 'stubble' : r < 0.7 ? 'mustache' : 'beard';
      return;
    }
    if (g.k === 'skin') { p.skin = chPick(P_SKIN.slice(0, 10)); return; }
    const arr = g.colors || g.opts.map(o => o[0]);
    p[g.k] = chPick(arr);
  });
  p.extras = ['freckles', 'scar', 'eyepatch', 'glasses'].filter(() => Math.random() < 0.12);
  if (p.extras.indexOf('eyepatch') >= 0) p.extras = p.extras.filter(x => x !== 'glasses');
  if (race === 'tiefling') p.skin = chPick(['#b04a3f', '#a9b4d6', '#c68642', '#7c4a2d']);
  if (race === 'half-orc') p.skin = chPick(['#9bb8a0', '#c9c4bd', '#a0673e']);
  if (race === 'dragonborn') { p.skin = chPick(['#b5652e', '#b04a3f', '#9bb8a0', '#c9c4bd', '#c68642']); p.hair = 'bald'; p.facial = 'none'; }
  if (race === 'dwarf' && p.sex === 'male') p.facial = 'beard';
  return applyRaceLook(p, race);
}

function nameFor(race) {
  const T = (typeof NPC !== 'undefined' && NPC.tables) ? NPC.tables.NAMES : {};
  let table = CH_NAMES[race] || T[race];
  if (race === 'half-elf' && T.human && T.elf) {
    table = { first: T.human.first.concat(T.elf.first), last: T.human.last.concat(T.elf.last) };
  }
  if (!table) table = T.human || { first: ['Ash'], last: ['Wanderer'] };
  return chPick(table.first) + ' ' + chPick(table.last);
}

function npcTable(k, fallback) {
  return (typeof NPC !== 'undefined' && NPC.tables && NPC.tables[k]) ? NPC.tables[k] : fallback;
}

/* ── Rules: derived numbers ────────────────────────────────── */
function racialBonus(ch) {
  if (ch.method === 'entered') return {};      // typed-in scores already include racial bonuses
  const r = CH_RACES[ch.race] || CH_RACES.human;
  const b = Object.assign({}, r.bonus);
  if (r.flex) {
    // Half-elf: +1 to the two highest stats other than CHA
    STATS.filter(k => k !== 'cha').slice().sort((a, z) => (ch.base[z] || 0) - (ch.base[a] || 0))
      .slice(0, r.flex).forEach(k => { b[k] = (b[k] || 0) + 1; });
  }
  return b;
}
function finalScores(ch) {
  const b = racialBonus(ch), out = {};
  STATS.forEach(k => { out[k] = (ch.base[k] || 8) + (b[k] || 0); });
  return out;
}
function derived(ch) {
  const sc = finalScores(ch);
  const cls = CH_CLASSES[ch.cls] || CH_CLASSES.fighter;
  const race = CH_RACES[ch.race] || CH_RACES.human;
  const lvl = Math.max(1, Math.min(20, ch.level || 1));
  const con = modOf(sc.con), dex = modOf(sc.dex), wis = modOf(sc.wis);
  let hp = Math.max(1, cls.hd + con);
  for (let i = 2; i <= lvl; i++) hp += Math.max(1, Math.floor(cls.hd / 2) + 1 + con);
  const entered = ch.method === 'entered';
  if (entered && ch.hpMax > 0) hp = ch.hpMax;
  return {
    scores: sc, hp,
    ac: entered && ch.acOverride > 0 ? ch.acOverride : 10 + dex,
    init: dex,
    speed: entered && ch.speedOverride > 0 ? ch.speedOverride : race.speed, prof: 2 + Math.floor((lvl - 1) / 4),
    passive: 10 + wis, hd: cls.hd, saves: cls.saves, level: lvl
  };
}
function subtitleOf(ch) {
  const race = ch.raceLabel || (CH_RACES[ch.race] || {}).label || '';
  const cls = ch.clsLabel || (CH_CLASSES[ch.cls] || {}).label || '';
  return ('Level ' + (ch.level || 1) + ' ' + race + ' ' + cls).replace(/\s+/g, ' ').trim();
}
// Match typed race/class text to the built-in lists (for hit dice, speed and portrait looks)
function keyFromText(table, text, fallback) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return fallback;
  const k = Object.keys(table).find(k => k === t || String(table[k].label || '').toLowerCase() === t);
  return k || fallback;
}

/* ── Stat methods ──────────────────────────────────────────── */
function arrangeForClass(ch) {
  const prio = (CH_CLASSES[ch.cls] || CH_CLASSES.fighter).prio;
  const pairs = STATS.map(k => ({ v: ch.base[k], d: ch.dice ? ch.dice[k] : null }))
    .sort((a, b) => b.v - a.v);
  prio.forEach((k, i) => {
    ch.base[k] = pairs[i].v;
    if (ch.dice) ch.dice[k] = pairs[i].d;
  });
}
function applyMethod(ch, method) {
  ch.method = method;
  ch.base = {};
  if (method === 'roll') {
    ch.dice = {};
    STATS.forEach(k => { ch.dice[k] = roll4d6(); ch.base[k] = diceTotal(ch.dice[k]); });
  } else if (method === 'array') {
    ch.dice = null;
    STATS.forEach((k, i) => { ch.base[k] = STANDARD_ARRAY[i]; });
    arrangeForClass(ch);
  } else {
    ch.dice = null;
    STATS.forEach(k => { ch.base[k] = 8; });
  }
}
function pointsSpent(ch) {
  return STATS.reduce((sum, k) => sum + (POINT_COST[ch.base[k]] || 0), 0);
}

/* ── Generator ─────────────────────────────────────────────── */
function generateCharacter(opts) {
  opts = opts || {};
  const race = CH_RACES[opts.race] ? opts.race : chPick(Object.keys(CH_RACES));
  const cls = CH_CLASSES[opts.cls] ? opts.cls : chPick(Object.keys(CH_CLASSES));
  const ch = {
    id: null, name: nameFor(race), aliases: [], race, cls,
    background: CH_BACKGROUNDS.indexOf(opts.background) >= 0 ? opts.background : chPick(CH_BACKGROUNDS),
    alignment: chPick(CH_ALIGNMENTS), level: 1,
    trait: chPick(PC_TRAITS),
    ideal: chPick(npcTable('IDEALS', ['Freedom'])),
    bond: chPick(npcTable('BONDS', ['A friend back home'])),
    flaw: chPick(npcTable('FLAWS', ['Too trusting'])),
    backstory: '', portrait: null, photo: null, hpCur: null
  };
  applyMethod(ch, opts.method || 'roll');
  if (ch.method === 'roll') arrangeForClass(ch);     // a fresh hero comes out ready to play
  ch.portrait = randomLook(race);
  return ch;
}

/* ── Pre-made heroes (Pro) ─────────────────────────────────── */
const PREMADE = [
  { key: 'thora', name: 'Thora Ironfist', aliases: ['Thora'], race: 'dwarf', cls: 'fighter', background: 'Soldier', alignment: 'Lawful Good',
    base: { str: 15, dex: 12, con: 14, int: 8, wis: 13, cha: 10 },
    trait: 'I face problems head-on. A simple, direct solution is the best path.', ideal: 'Responsibility — I do what I must and obey just authority.',
    bond: 'I fight for those who cannot fight for themselves.', flaw: 'I made a terrible mistake in battle that cost many lives, and I would do anything to keep it secret.',
    backstory: 'Thora held the bridge at Greystone for three days when the rest of her company fled. Now she sells her axe to anyone fighting the same kind of darkness.',
    portrait: { sex: 'female', skin: '#d9a07b', face: 'square', hair: 'long', hairColor: '#b5371f', eyes: 'normal', eyeColor: '#3f7a3a', mouth: 'neutral', facial: 'none', clothes: 'armor', clothesColor: '#7a1f2b', extras: ['scar'], bg: '#3a2418' } },
  { key: 'pip', name: 'Pip Thistlewick', aliases: ['Pip'], race: 'halfling', cls: 'rogue', background: 'Criminal', alignment: 'Chaotic Neutral',
    base: { str: 8, dex: 15, con: 13, int: 12, wis: 10, cha: 14 },
    trait: 'I always have a plan for what to do when things go wrong.', ideal: 'Freedom — chains are meant to be broken, as are those who forge them.',
    bond: 'I owe everything to the old fence who took me in off the street.', flaw: 'When I see something valuable, I can\'t think about anything but how to steal it.',
    backstory: 'Pip grew up picking pockets at the Plum Market. A job gone wrong left a guild boss very angry, so Pip is "seeing the world" for a while.',
    portrait: { sex: 'male', skin: '#eac0a0', face: 'round', hair: 'curly', hairColor: '#5a3825', eyes: 'wide', eyeColor: '#8a6d2e', mouth: 'smile', facial: 'none', clothes: 'cloak', clothesColor: '#24503a', extras: ['freckles'], bg: '#18352c' } },
  { key: 'mira', name: 'Sister Mira Ashford', aliases: ['Mira', 'Sister Mira'], race: 'human', cls: 'cleric', background: 'Acolyte', alignment: 'Neutral Good',
    base: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
    trait: 'I see omens in every event and action.', ideal: 'Charity — I always try to help those in need, no matter the cost.',
    bond: 'The temple where I grew up was burned. I will find who did it.', flaw: 'I put too much trust in those who wield power within my temple.',
    backstory: 'Mira tended the sick at the Temple of the Dawn until raiders burned it to the ground. She carries the last surviving holy symbol and a list of names.',
    portrait: { sex: 'female', skin: '#a0673e', face: 'oval', hair: 'ponytail', hairColor: '#1c1a1a', eyes: 'normal', eyeColor: '#5b3a1e', mouth: 'smile', facial: 'none', clothes: 'robe', clothesColor: '#d8d2c4', extras: [], bg: '#5a4a2a' } },
  { key: 'zilenna', name: 'Zilenna Emberveil', aliases: ['Zil', 'Zilenna'], race: 'tiefling', cls: 'warlock', background: 'Charlatan', alignment: 'Chaotic Neutral',
    base: { str: 8, dex: 13, con: 14, int: 12, wis: 10, cha: 15 },
    trait: 'I fall in and out of love easily, and am always pursuing someone.', ideal: 'Independence — I am a free spirit; no one tells me what to do.',
    bond: 'My patron gave me power, and one day it will want something back.', flaw: 'I can\'t resist swindling people who are more powerful than me.',
    backstory: 'Zilenna sold fake fortunes until a real voice answered from her crystal ball. The pact made her powerful — and someone is always watching through her eyes.',
    portrait: { sex: 'female', skin: '#b04a3f', face: 'long', hair: 'long', hairColor: '#6b3fa0', eyes: 'narrow', eyeColor: '#d4a017', mouth: 'smile', facial: 'none', clothes: 'cloak', clothesColor: '#4a2a5e', extras: ['horns'], bg: '#2a1e3a' } },
  { key: 'fenwick', name: 'Fenwick Glimmerstone', aliases: ['Fen', 'Fenwick'], race: 'gnome', cls: 'wizard', background: 'Sage', alignment: 'Neutral Good',
    base: { str: 8, dex: 13, con: 14, int: 15, wis: 12, cha: 10 },
    trait: 'I use long words to sound smarter than I am.', ideal: 'Knowledge — the path to power and self-improvement is through knowledge.',
    bond: 'I have an ancient spellbook that I cannot yet read.', flaw: 'I overlook obvious solutions in favor of complicated ones.',
    backstory: 'Fenwick spent forty years in the Silvern library. When a book started whispering back, he decided some research has to be done in the field.',
    portrait: { sex: 'male', skin: '#f6d7c3', face: 'round', hair: 'spiky', hairColor: '#e8e4dc', eyes: 'wide', eyeColor: '#3b6fb6', mouth: 'smile', facial: 'mustache', clothes: 'robe', clothesColor: '#1f2f5a', extras: ['glasses'], bg: '#1b2440' } },
  { key: 'aldric', name: 'Aldric Silvern', aliases: ['Aldric'], race: 'half-elf', cls: 'bard', background: 'Entertainer', alignment: 'Chaotic Good',
    base: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
    trait: 'I know a story relevant to almost every situation.', ideal: 'Beauty — when I perform, I make the world better than it was.',
    bond: 'I want to be famous, whatever it takes.', flaw: 'I\'m a sucker for a pretty face.',
    backstory: 'Aldric played every tavern between here and the coast. His newest song is about a dragon nobody has seen in a hundred years — and people keep asking how he knows the ending.',
    portrait: { sex: 'male', skin: '#eac0a0', face: 'oval', hair: 'long', hairColor: '#d8b25a', eyes: 'normal', eyeColor: '#3f7a3a', mouth: 'smile', facial: 'stubble', clothes: 'tunic', clothesColor: '#7a1f2b', extras: ['elf'], bg: '#5a1f24' } },
  { key: 'kava', name: 'Kava Brightscale', aliases: ['Kava'], race: 'dragonborn', cls: 'paladin', background: 'Noble', alignment: 'Lawful Good',
    base: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
    trait: 'My eloquent flattery makes everyone I talk to feel wonderful and important.', ideal: 'Noble Obligation — it is my duty to protect and care for the people beneath me.',
    bond: 'I will face any challenge to win the approval of my family.', flaw: 'I secretly believe everyone is beneath me.',
    backstory: 'Kava is the youngest of a proud clan of dragon-blooded knights. She swore her oath early to prove she was more than a spare heir.',
    portrait: { sex: 'female', skin: '#b5652e', face: 'long', hair: 'bald', hairColor: '#1c1a1a', eyes: 'narrow', eyeColor: '#d4a017', mouth: 'neutral', facial: 'none', clothes: 'armor', clothesColor: '#b08a2e', extras: ['horns'], bg: '#3a3f4a' } },
  { key: 'grosh', name: 'Grosh Thornhide', aliases: ['Grosh'], race: 'half-orc', cls: 'barbarian', background: 'Outlander', alignment: 'Chaotic Good',
    base: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
    trait: 'I was, in fact, raised by wolves.', ideal: 'Nature — the natural world is more important than all the constructs of civilization.',
    bond: 'My tribe was scattered. I search for the ones who survived.', flaw: 'Violence is my answer to almost any challenge.',
    backstory: 'Grosh came down from the frozen hills after a winter that killed half his tribe. Cities confuse him, but he never forgets a face — friend or enemy.',
    portrait: { sex: 'male', skin: '#9bb8a0', face: 'square', hair: 'short', hairColor: '#1c1a1a', eyes: 'narrow', eyeColor: '#b3261e', mouth: 'frown', facial: 'none', clothes: 'tunic', clothesColor: '#5a3b22', extras: ['tusks', 'scar'], bg: '#18352c' } }
];

/* ── Storage ───────────────────────────────────────────────── */
const Characters = (() => {
  const KEY = 'dmforge_characters';
  let list = [];
  let nextId = 1;

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (d && Array.isArray(d.list)) { list = d.list; nextId = d.nextId || 1; }
    } catch (e) { list = []; }
    list.forEach(ch => { if (!Array.isArray(ch.aliases)) ch.aliases = []; if (!ch.base) applyMethod(ch, 'array'); });
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify({ list, nextId })); return true; }
    catch (e) { showToast('Could not save — phone storage is full. Try removing a photo.'); return false; }
  }
  function add(ch) {
    const c = chClone(ch);
    c.id = nextId++;
    c.createdAt = c.updatedAt = new Date().toISOString();
    list.unshift(c);
    persist();
    if (typeof Quests !== 'undefined') Quests.addToParty(c.id);   // new heroes join the quest being played
    return c;
  }
  function touch(ch) { ch.updatedAt = new Date().toISOString(); return persist(); }
  function remove(id) {
    list = list.filter(c => c.id !== id);
    persist();
    if (typeof Quests !== 'undefined') Quests.forgetCharacter(id);
  }
  function get(id) { return list.find(c => c.id === id) || null; }
  function getAll() { return list; }

  return { load, add, touch, remove, get, getAll, persist };
})();

/* ══════════════════════════════════════════════════════════════
   UI
   ══════════════════════════════════════════════════════════════ */
const ICON_DIE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="16" r="1.3" fill="currentColor"/></svg>';
const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
const ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 19l-7-7 7-7"/></svg>';

const chUI = {
  view: 'list',         // 'list' | 'sheet' | 'premade' | 'enter'
  genOpen: false,       // "Roll a new character" box expanded
  draft: null,          // unsaved generated character
  currentId: null,      // saved character open in the sheet
  gen: { race: '', cls: '', background: '', method: 'roll' },
  swapSel: null,        // stat picked up for swapping
  builderOpen: false,
  saveTimer: null
};

function chRoot() { return document.getElementById('chars-root'); }
function chCurrent() { return chUI.draft || (chUI.currentId != null ? Characters.get(chUI.currentId) : null); }

function portraitHTML(ch) {
  if (ch && ch.photo && /^data:image\/(jpeg|png|webp);base64,/.test(ch.photo)) {
    return '<img src="' + ch.photo + '" alt="">';
  }
  return portraitSVG(ch && ch.portrait);
}

function optionList(pairs, sel) {
  return pairs.map(([v, l]) => '<option value="' + escHtml(v) + '"' + (v === sel ? ' selected' : '') + '>' + escHtml(l) + '</option>').join('');
}
const raceOpts = () => Object.keys(CH_RACES).map(k => [k, CH_RACES[k].label]);
const classOpts = () => Object.keys(CH_CLASSES).map(k => [k, CH_CLASSES[k].label]);

function chSaveSoon() {
  if (chUI.draft) return;   // drafts aren't saved until "Save to party"
  const ch = chCurrent();
  if (!ch) return;
  clearTimeout(chUI.saveTimer);
  chUI.saveTimer = setTimeout(() => Characters.touch(ch), 350);
}
function chSaveNow() {
  clearTimeout(chUI.saveTimer);
  const ch = chCurrent();
  if (ch && !chUI.draft) Characters.touch(ch);
}

/* ── Views ─────────────────────────────────────────────────── */
function renderCharacters() {
  const root = chRoot();
  if (!root) return;
  if (chUI.view === 'sheet' && chCurrent()) renderSheet();
  else if (chUI.view === 'premade') renderPremade();
  else if (chUI.view === 'enter') renderEnter();
  else { chUI.view = 'list'; renderCharList(); }
}

function charRowHTML(ch, inQuest) {
  const d = derived(ch);
  return `<div class="ch-row-wrap">
    <button class="ch-row" data-id="${ch.id}">
      <span class="ch-thumb">${portraitHTML(ch)}</span>
      <span class="ch-row-info">
        <span class="ch-row-name">${escHtml(ch.name || 'Unnamed')}</span>
        <span class="ch-row-sub">${escHtml(subtitleOf(ch))}</span>
      </span>
      <span class="ch-row-stats"><b>${d.hp}</b> HP<br><b>${d.ac}</b> AC</span>
    </button>
    <button class="ch-party-btn${inQuest ? ' out' : ''}" data-id="${ch.id}" data-act="${inQuest ? 'remove' : 'add'}"
      aria-label="${inQuest ? 'Remove ' + escHtml(ch.name || 'character') + ' from this quest' : 'Add ' + escHtml(ch.name || 'character') + ' to this quest'}">${inQuest ? 'Remove' : '+ Add'}</button>
  </div>`;
}

function renderCharList() {
  const g = chUI.gen;
  const all = Characters.getAll();
  const party = all.filter(c => Quests.inParty(c.id));
  const others = all.filter(c => !Quests.inParty(c.id));
  const q = Quests.current();
  chRoot().innerHTML = `
    <div class="section-head">
      <h2>Heroes</h2>
      <p>Already have a character? Enter it in a minute. Or roll a new one with real dice.</p>
    </div>

    <button class="btn btn-primary btn-full ch-big-btn" id="ch-enter">Enter my character</button>

    <details class="panel ch-gen" id="ch-gen-box"${chUI.genOpen ? ' open' : ''}>
      <summary class="ch-gen-sum">${ICON_DIE} Roll a new character</summary>
      <div class="ch-grid2">
        <div class="field-group"><label for="ch-g-race">Race</label>
          <select class="field-input cr-select" id="ch-g-race"><option value="">Random</option>${optionList(raceOpts(), g.race)}</select></div>
        <div class="field-group"><label for="ch-g-class">Class</label>
          <select class="field-input cr-select" id="ch-g-class"><option value="">Random</option>${optionList(classOpts(), g.cls)}</select></div>
        <div class="field-group"><label for="ch-g-bg">Background</label>
          <select class="field-input cr-select" id="ch-g-bg"><option value="">Random</option>${optionList(CH_BACKGROUNDS.map(b => [b, b]), g.background)}</select></div>
        <div class="field-group"><label for="ch-g-method">Ability scores</label>
          <select class="field-input cr-select" id="ch-g-method">${optionList([['roll', 'Roll 4d6'], ['array', 'Standard array'], ['pointbuy', 'Point buy']], g.method)}</select></div>
      </div>
      <button class="btn btn-primary btn-full ch-big-btn" id="ch-roll-new">${ICON_DIE} Roll Character</button>
    </details>

    <button class="btn btn-secondary btn-full ch-premade-btn" id="ch-open-premade">
      Pre-made heroes ${isProUnlocked() ? '' : '<span class="ch-pro-tag">PRO</span>'}
    </button>

    <div class="add-form-title ch-list-title">In this quest <span class="ch-quest-tag">${escHtml(q ? q.name : '')}</span></div>
    <div id="ch-list">
      ${party.length ? party.map(ch => charRowHTML(ch, true)).join('')
        : '<p class="saved-empty">No heroes in this quest yet. Enter one above, or add one of your other characters below.</p>'}
    </div>

    ${others.length ? `<div class="add-form-title ch-list-title">Your other characters</div>
    <div id="ch-list-others">${others.map(ch => charRowHTML(ch, false)).join('')}</div>` : ''}
  `;

  const bind = (id, key) => document.getElementById(id).addEventListener('change', e => { chUI.gen[key] = e.target.value; });
  bind('ch-g-race', 'race'); bind('ch-g-class', 'cls'); bind('ch-g-bg', 'background'); bind('ch-g-method', 'method');
  document.getElementById('ch-gen-box').addEventListener('toggle', e => { chUI.genOpen = e.target.open; });
  document.getElementById('ch-enter').addEventListener('click', () => {
    chUI.view = 'enter'; renderCharacters(); chScrollTop();
  });
  document.getElementById('ch-roll-new').addEventListener('click', () => {
    chUI.draft = generateCharacter(chUI.gen);
    chUI.currentId = null;
    chUI.view = 'sheet';
    chUI.builderOpen = false;
    renderCharacters();
    chScrollTop();
    animateStats(STATS);
  });
  document.getElementById('ch-open-premade').addEventListener('click', () => {
    chUI.view = 'premade'; renderCharacters(); chScrollTop();
  });
  chRoot().querySelectorAll('.ch-row').forEach(row => {
    row.addEventListener('click', () => openCharacterSheet(Number(row.dataset.id)));
  });
  chRoot().querySelectorAll('.ch-party-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const ch = Characters.get(id);
      if (btn.dataset.act === 'add') { Quests.addToParty(id); showToast((ch && ch.name || 'Character') + ' joined this quest.'); }
      else { Quests.removeFromParty(id); showToast((ch && ch.name || 'Character') + ' left this quest. They are still saved.'); }
      if (typeof linksChanged === 'function') linksChanged();
      renderCharList();
    });
  });
}

/* ── Enter my character (for heroes made on paper or elsewhere) ── */
function renderEnter() {
  const raceList = Object.keys(CH_RACES).map(k => `<option value="${escHtml(CH_RACES[k].label)}">`).join('');
  const clsList = Object.keys(CH_CLASSES).map(k => `<option value="${escHtml(CH_CLASSES[k].label)}">`).join('');
  chRoot().innerHTML = `
    <div class="ch-topbar">
      <button class="ch-back" id="ch-back">${ICON_BACK} Heroes</button>
      <span class="ch-topbar-title">Enter my character</span>
    </div>
    <p class="ch-note">Copy it from your sheet. Only the name is needed — fill in the rest now or later.</p>

    <div class="field-group ch-field"><label for="en-name">Name</label>
      <input class="field-input" id="en-name" type="text" maxlength="60" autocomplete="off" placeholder="Character name"></div>
    <div class="ch-grid2">
      <div class="field-group"><label for="en-race">Race</label>
        <input class="field-input" id="en-race" type="text" maxlength="40" list="en-race-list" autocomplete="off" placeholder="e.g. Elf"><datalist id="en-race-list">${raceList}</datalist></div>
      <div class="field-group"><label for="en-class">Class</label>
        <input class="field-input" id="en-class" type="text" maxlength="40" list="en-class-list" autocomplete="off" placeholder="e.g. Ranger"><datalist id="en-class-list">${clsList}</datalist></div>
    </div>

    <div class="ch-grid3">
      <div class="field-group"><label for="en-level">Level</label><input class="field-input en-num" id="en-level" type="number" inputmode="numeric" min="1" max="20" value="1"></div>
      <div class="field-group"><label for="en-hp">Max HP</label><input class="field-input en-num" id="en-hp" type="number" inputmode="numeric" min="1" max="999" placeholder="auto"></div>
      <div class="field-group"><label for="en-ac">AC</label><input class="field-input en-num" id="en-ac" type="number" inputmode="numeric" min="1" max="40" placeholder="auto"></div>
      <div class="field-group"><label for="en-speed">Speed</label><input class="field-input en-num" id="en-speed" type="number" inputmode="numeric" min="0" max="200" step="5" placeholder="30"></div>
    </div>

    <div class="ch-sec-title">Ability scores</div>
    <div class="ch-grid3">
      ${STATS.map(k => `<div class="field-group"><label for="en-${k}">${STAT_LABEL[k]}</label>
        <input class="field-input en-num en-stat" id="en-${k}" type="number" inputmode="numeric" min="1" max="30" value="10"></div>`).join('')}
    </div>

    <div class="field-group ch-field"><label for="en-notes">Notes <span class="ch-hint">— backstory, gear, anything</span></label>
      <textarea class="field-input ch-ta" id="en-notes" rows="3" maxlength="3000"></textarea></div>

    <div class="ch-sticky"><button class="btn btn-primary btn-full ch-big-btn" id="en-save">Save to this quest</button></div>
  `;
  const $ = id => document.getElementById(id);
  setTimeout(() => $('en-name').focus(), 50);
  $('ch-back').addEventListener('click', chBackToList);
  const num = (id, lo, hi) => { const v = parseInt($(id).value, 10); return isNaN(v) ? null : Math.max(lo, Math.min(hi, v)); };
  $('en-save').addEventListener('click', () => {
    const name = $('en-name').value.trim();
    if (!name) { showToast('Give your character a name.'); $('en-name').focus(); return; }
    const raceText = $('en-race').value.trim(), clsText = $('en-class').value.trim();
    const race = keyFromText(CH_RACES, raceText, 'human');
    const cls = keyFromText(CH_CLASSES, clsText, 'fighter');
    const base = {};
    STATS.forEach(k => { base[k] = num('en-' + k, 1, 30) || 10; });
    const ch = {
      name, aliases: [], race, cls,
      raceLabel: raceText ? (CH_RACES[race] && CH_RACES[race].label.toLowerCase() === raceText.toLowerCase() ? '' : raceText) : '',
      clsLabel: clsText ? (CH_CLASSES[cls] && CH_CLASSES[cls].label.toLowerCase() === clsText.toLowerCase() ? '' : clsText) : '',
      background: '', alignment: '', level: num('en-level', 1, 20) || 1,
      method: 'entered', base, dice: null,
      hpMax: num('en-hp', 1, 999), acOverride: num('en-ac', 1, 40), speedOverride: num('en-speed', 0, 200),
      trait: '', ideal: '', bond: '', flaw: '', backstory: $('en-notes').value,
      portrait: randomLook(race), photo: null, hpCur: null
    };
    const saved = Characters.add(ch);
    if (typeof linksChanged === 'function') linksChanged();
    showToast(saved.name + ' joined ' + (Quests.current() ? Quests.current().name : 'your quest') + '.');
    openCharacterSheet(saved.id);
  });
}

function renderPremade() {
  const pro = isProUnlocked();
  chRoot().innerHTML = `
    <div class="ch-topbar">
      <button class="ch-back" id="ch-back">${ICON_BACK} Heroes</button>
      <span class="ch-topbar-title">Pre-made heroes</span>
    </div>
    ${pro ? '' : `<div class="pro-lock-banner">${ICON_LOCK}<span>Pre-made heroes are Pro</span><button class="btn-inline-unlock js-unlock-pro">Unlock — $2.99</button></div>`}
    <p class="ch-note">Level 1 and ready to play. Using one copies it into your party, so you can change anything.</p>
    ${PREMADE.map(p => {
      const ch = Object.assign({ level: 1 }, p);
      const d = derived(ch);
      return `<div class="ch-pm-card${pro ? '' : ' ch-locked'}">
        <div class="ch-pm-top">
          <span class="ch-pm-portrait">${portraitSVG(p.portrait)}</span>
          <div class="ch-pm-info">
            <div class="ch-pm-name">${escHtml(p.name)}</div>
            <div class="ch-pm-sub">${escHtml(subtitleOf(ch))}</div>
            <div class="ch-pm-sub">${escHtml(p.background)} · ${escHtml(p.alignment)}</div>
            <div class="ch-pm-nums"><span><b>${d.hp}</b> HP</span><span><b>${d.ac}</b> AC</span><span><b>${fmtMod(d.init)}</b> Init</span></div>
          </div>
        </div>
        <div class="ch-pm-stats">${STATS.map(k => `<span><small>${STAT_LABEL[k]}</small>${d.scores[k]}</span>`).join('')}</div>
        <p class="ch-pm-story">${escHtml(p.backstory)}</p>
        ${pro ? `<button class="btn btn-primary btn-full ch-use" data-key="${p.key}">Use this character</button>`
              : `<button class="btn btn-secondary btn-full js-unlock-pro">${ICON_LOCK} Unlock to use</button>`}
      </div>`;
    }).join('')}
  `;
  document.getElementById('ch-back').addEventListener('click', chBackToList);
  chRoot().querySelectorAll('.ch-use').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PREMADE.find(x => x.key === btn.dataset.key);
      if (!p) return;
      const copy = chClone(p);
      delete copy.key;
      Object.assign(copy, { level: 1, method: 'array', dice: null, photo: null, hpCur: null, premade: p.key });
      const saved = Characters.add(copy);
      showToast(saved.name + ' joined this quest.');
      openCharacterSheet(saved.id);
    });
  });
}

function chBackToList() {
  chSaveNow();
  chUI.view = 'list';
  chUI.draft = null;
  chUI.currentId = null;
  chUI.swapSel = null;
  renderCharacters();
  chScrollTop();
}
function chScrollTop() { window.scrollTo(0, 0); }

/* ── Character sheet ───────────────────────────────────────── */
function renderSheet() {
  const ch = chCurrent();
  const isDraft = !!chUI.draft;
  const pro = isProUnlocked();
  const entered = ch.method === 'entered';
  const blankOpt = v => (v ? '' : '<option value="" selected>—</option>');
  chRoot().innerHTML = `
    <div class="ch-topbar">
      <button class="ch-back" id="ch-back">${ICON_BACK} Heroes</button>
      <span class="ch-topbar-title">${isDraft ? 'New character' : 'Character sheet'}</span>
    </div>

    <div class="ch-hero">
      <div class="ch-portrait" id="ch-portrait">${portraitHTML(ch)}</div>
      <div class="ch-portrait-actions" id="ch-portrait-actions"></div>
    </div>
    <div id="ch-builder"></div>

    <div class="field-group ch-field">
      <label for="ch-name">Name</label>
      <div class="ch-inline">
        <input class="field-input" id="ch-name" type="text" maxlength="60" value="${escHtml(ch.name || '')}" autocomplete="off">
        <button class="ch-icon-btn" id="ch-name-roll" aria-label="Random name">${ICON_DIE}</button>
      </div>
    </div>
    <div class="field-group ch-field">
      <label for="ch-aliases">Also called <span class="ch-hint">— nicknames, commas between</span></label>
      <input class="field-input" id="ch-aliases" type="text" maxlength="120" value="${escHtml((ch.aliases || []).join(', '))}" placeholder="e.g. Zil, the Red Witch" autocomplete="off">
    </div>

    <div class="ch-grid2">
      ${entered ? `
      <div class="field-group"><label for="ch-race-t">Race</label>
        <input class="field-input" id="ch-race-t" type="text" maxlength="40" list="ch-race-list" autocomplete="off" value="${escHtml(ch.raceLabel || (CH_RACES[ch.race] || {}).label || '')}">
        <datalist id="ch-race-list">${Object.keys(CH_RACES).map(k => `<option value="${escHtml(CH_RACES[k].label)}">`).join('')}</datalist></div>
      <div class="field-group"><label for="ch-class-t">Class</label>
        <input class="field-input" id="ch-class-t" type="text" maxlength="40" list="ch-class-list" autocomplete="off" value="${escHtml(ch.clsLabel || (CH_CLASSES[ch.cls] || {}).label || '')}">
        <datalist id="ch-class-list">${Object.keys(CH_CLASSES).map(k => `<option value="${escHtml(CH_CLASSES[k].label)}">`).join('')}</datalist></div>` : `
      <div class="field-group"><label for="ch-race">Race</label>
        <select class="field-input cr-select" id="ch-race">${optionList(raceOpts(), ch.race)}</select></div>
      <div class="field-group"><label for="ch-class">Class</label>
        <select class="field-input cr-select" id="ch-class">${optionList(classOpts(), ch.cls)}</select></div>`}
      <div class="field-group"><label for="ch-bg">Background</label>
        <select class="field-input cr-select" id="ch-bg">${blankOpt(ch.background)}${optionList(CH_BACKGROUNDS.map(b => [b, b]), ch.background)}</select></div>
      <div class="field-group"><label for="ch-align">Alignment</label>
        <select class="field-input cr-select" id="ch-align">${blankOpt(ch.alignment)}${optionList(CH_ALIGNMENTS.map(a => [a, a]), ch.alignment)}</select></div>
    </div>

    <div class="ch-level">
      <span class="ch-level-label">Level</span>
      <button class="ch-step" id="ch-lvl-down" aria-label="Level down">−</button>
      <span class="ch-level-num" id="ch-lvl">${ch.level || 1}</span>
      <button class="ch-step" id="ch-lvl-up" aria-label="Level up">+</button>
    </div>

    <div class="ch-derived" id="ch-derived"></div>
    ${entered ? `<div class="ch-grid3 ch-over">
      <div class="field-group"><label for="ch-hpmax">Max HP</label><input class="field-input en-num" id="ch-hpmax" type="number" inputmode="numeric" min="1" max="999" placeholder="auto" value="${ch.hpMax || ''}"></div>
      <div class="field-group"><label for="ch-acv">AC</label><input class="field-input en-num" id="ch-acv" type="number" inputmode="numeric" min="1" max="40" placeholder="auto" value="${ch.acOverride || ''}"></div>
      <div class="field-group"><label for="ch-spd">Speed</label><input class="field-input en-num" id="ch-spd" type="number" inputmode="numeric" min="0" max="200" step="5" placeholder="auto" value="${ch.speedOverride || ''}"></div>
    </div>` : ''}

    <div class="ch-sec-title">Ability scores</div>
    ${entered ? '' : `<div class="ch-seg" role="radiogroup" aria-label="How to get ability scores">
      ${[['roll', '4d6 roll'], ['array', 'Std array'], ['pointbuy', 'Point buy']].map(([v, l]) =>
        `<button class="ch-seg-btn${ch.method === v ? ' on' : ''}" data-method="${v}" role="radio" aria-checked="${ch.method === v}">${l}</button>`).join('')}
    </div>`}
    <div id="ch-stats"></div>

    <div class="ch-sec-title">Personality
      <button class="ch-mini-btn" id="ch-pers-roll">${ICON_DIE} Random</button>
    </div>
    ${['trait', 'ideal', 'bond', 'flaw'].map(k => `
      <div class="field-group ch-field">
        <label for="ch-${k}">${{ trait: 'Personality trait', ideal: 'Ideal', bond: 'Bond', flaw: 'Flaw' }[k]}</label>
        <textarea class="field-input ch-ta" id="ch-${k}" rows="2" maxlength="300">${escHtml(ch[k] || '')}</textarea>
      </div>`).join('')}
    <div class="field-group ch-field">
      <label for="ch-backstory">Backstory</label>
      <textarea class="field-input ch-ta" id="ch-backstory" rows="4" maxlength="3000" placeholder="Where they come from, what they want…">${escHtml(ch.backstory || '')}</textarea>
    </div>

    <div id="ch-appears"></div>

    <div class="ch-actions">
      ${entered ? '' : `<button class="btn btn-secondary btn-full" id="ch-reroll-all">${ICON_DIE} Re-roll whole character</button>`}
      ${isDraft ? '' : '<button class="btn btn-danger btn-full" id="ch-delete">Delete character</button>'}
    </div>
    ${isDraft ? `<div class="ch-sticky"><button class="btn btn-primary btn-full ch-big-btn" id="ch-save">Save to this quest</button></div>` : ''}
  `;

  renderPortraitActions();
  renderBuilder();
  renderDerived();
  renderStats();
  renderAppears();

  const $ = id => document.getElementById(id);
  $('ch-back').addEventListener('click', () => {
    if (chUI.draft && !confirm('Leave without saving this character?')) return;
    chBackToList();
  });
  $('ch-name').addEventListener('input', e => { ch.name = e.target.value; chSaveSoon(); });
  $('ch-name-roll').addEventListener('click', () => { ch.name = nameFor(ch.race); $('ch-name').value = ch.name; chSaveSoon(); });
  $('ch-aliases').addEventListener('input', e => {
    ch.aliases = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    chSaveSoon();
  });
  if (entered) {
    $('ch-race-t').addEventListener('input', e => {
      const t = e.target.value.trim();
      const k = keyFromText(CH_RACES, t, ch.race);
      if (k !== ch.race) { ch.race = k; ch.portrait = applyRaceLook(cleanPortrait(ch.portrait), k); if (!ch.photo) $('ch-portrait').innerHTML = portraitHTML(ch); }
      ch.raceLabel = (CH_RACES[k] && CH_RACES[k].label.toLowerCase() === t.toLowerCase()) ? '' : t;
      renderDerived(); chSaveSoon();
    });
    $('ch-class-t').addEventListener('input', e => {
      const t = e.target.value.trim();
      ch.cls = keyFromText(CH_CLASSES, t, ch.cls);
      ch.clsLabel = (CH_CLASSES[ch.cls] && CH_CLASSES[ch.cls].label.toLowerCase() === t.toLowerCase()) ? '' : t;
      renderDerived(); chSaveSoon();
    });
    const over = (id, key, lo, hi) => $(id).addEventListener('input', e => {
      const v = parseInt(e.target.value, 10);
      ch[key] = isNaN(v) ? null : Math.max(lo, Math.min(hi, v));
      renderDerived(); chSaveSoon();
    });
    over('ch-hpmax', 'hpMax', 1, 999); over('ch-acv', 'acOverride', 1, 40); over('ch-spd', 'speedOverride', 0, 200);
  } else $('ch-race').addEventListener('change', e => {
    ch.race = e.target.value;
    ch.portrait = applyRaceLook(cleanPortrait(ch.portrait), ch.race);
    if (!ch.photo) $('ch-portrait').innerHTML = portraitHTML(ch);
    renderBuilder(); renderDerived(); renderStats(); chSaveSoon();
  });
  if (!entered) $('ch-class').addEventListener('change', e => { ch.cls = e.target.value; renderDerived(); renderStats(); chSaveSoon(); });
  $('ch-bg').addEventListener('change', e => { ch.background = e.target.value; chSaveSoon(); });
  $('ch-align').addEventListener('change', e => { ch.alignment = e.target.value; chSaveSoon(); });
  const setLevel = n => { ch.level = Math.max(1, Math.min(20, n)); $('ch-lvl').textContent = ch.level; renderDerived(); chSaveSoon(); };
  $('ch-lvl-down').addEventListener('click', () => setLevel((ch.level || 1) - 1));
  $('ch-lvl-up').addEventListener('click', () => setLevel((ch.level || 1) + 1));

  chRoot().querySelectorAll('.ch-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.method;
      if (m === ch.method) return;
      if (!chUI.draft && !confirm('Switch method? This replaces the current ability scores.')) return;
      applyMethod(ch, m);
      chUI.swapSel = null;
      chRoot().querySelectorAll('.ch-seg-btn').forEach(b => { b.classList.toggle('on', b === btn); b.setAttribute('aria-checked', b === btn); });
      renderStats(); renderDerived(); chSaveSoon();
      if (m === 'roll') animateStats(STATS);
    });
  });

  ['trait', 'ideal', 'bond', 'flaw', 'backstory'].forEach(k => {
    $('ch-' + k).addEventListener('input', e => { ch[k] = e.target.value; chSaveSoon(); });
  });
  $('ch-pers-roll').addEventListener('click', () => {
    ch.trait = chPick(PC_TRAITS);
    ch.ideal = chPick(npcTable('IDEALS', ['Freedom']));
    ch.bond = chPick(npcTable('BONDS', ['A friend back home']));
    ch.flaw = chPick(npcTable('FLAWS', ['Too trusting']));
    ['trait', 'ideal', 'bond', 'flaw'].forEach(k => { $('ch-' + k).value = ch[k]; });
    chSaveSoon();
  });

  if ($('ch-reroll-all')) $('ch-reroll-all').addEventListener('click', () => {
    if (!chUI.draft && !confirm('Re-roll everything about ' + (ch.name || 'this character') + '? Name, stats, race and class all change.')) return;
    const keep = { id: ch.id, createdAt: ch.createdAt, photo: ch.photo };
    const fresh = generateCharacter({ race: chUI.gen.race, cls: chUI.gen.cls, background: chUI.gen.background, method: ch.method });
    Object.keys(ch).forEach(k => delete ch[k]);
    Object.assign(ch, fresh, keep);
    chSaveNow();
    renderSheet();
    animateStats(STATS);
  });
  if ($('ch-delete')) $('ch-delete').addEventListener('click', () => {
    if (!confirm('Delete ' + (ch.name || 'this character') + '? Their name will stop linking in your notes.')) return;
    Characters.remove(ch.id);
    showToast('Character deleted.');
    chBackToList();
  });
  if ($('ch-save')) $('ch-save').addEventListener('click', () => {
    const saved = Characters.add(chUI.draft);
    chUI.draft = null;
    chUI.currentId = saved.id;
    if (typeof linksChanged === 'function') linksChanged();
    showToast((saved.name || 'Character') + ' joined this quest.');
    renderSheet();
  });
}

function renderDerived() {
  const ch = chCurrent();
  const el = document.getElementById('ch-derived');
  if (!ch || !el) return;
  const d = derived(ch);
  const box = (v, l) => `<div class="ch-dbox"><span class="ch-dval">${v}</span><span class="ch-dlab">${l}</span></div>`;
  el.innerHTML = box(d.hp, 'HP') + box(d.ac, 'AC') + box(fmtMod(d.prof), 'Prof') + box(fmtMod(d.init), 'Init') + box(d.speed, 'Speed') +
    `<div class="ch-dline">Hit die d${d.hd} · Saves ${d.saves.map(k => STAT_LABEL[k]).join(', ')} · Passive Perception ${d.passive}</div>`;
}

function renderStats() {
  const ch = chCurrent();
  const el = document.getElementById('ch-stats');
  if (!ch || !el) return;
  if (ch.method === 'entered') {
    el.innerHTML = '<p class="ch-note">Type the scores from your sheet.</p><div class="ch-stat-grid">' + STATS.map(k => `
      <div class="ch-stat" data-k="${k}">
        <div class="ch-stat-head"><span class="ch-stat-lab">${STAT_LABEL[k]}</span></div>
        <input class="ch-stat-input" type="number" inputmode="numeric" min="1" max="30" value="${ch.base[k]}" data-k="${k}" aria-label="${STAT_NAME[k]} score">
        <div class="ch-stat-mod">${fmtMod(modOf(ch.base[k]))}</div>
      </div>`).join('') + '</div>';
    el.querySelectorAll('.ch-stat-input').forEach(inp => inp.addEventListener('input', () => {
      const v = parseInt(inp.value, 10);
      if (isNaN(v)) return;
      ch.base[inp.dataset.k] = Math.max(1, Math.min(30, v));
      inp.parentElement.querySelector('.ch-stat-mod').textContent = fmtMod(modOf(ch.base[inp.dataset.k]));
      renderDerived(); chSaveSoon();
    }));
    return;
  }
  const bonus = racialBonus(ch);
  const sc = finalScores(ch);
  const pb = ch.method === 'pointbuy';
  const left = POINT_BUDGET - pointsSpent(ch);

  let html = '';
  if (pb) html += `<div class="ch-points${left < 0 ? ' over' : ''}">Points left: <b>${left}</b> of ${POINT_BUDGET}</div>`;
  else html += `<p class="ch-note">Tap two scores to swap them.</p>`;

  html += '<div class="ch-stat-grid">';
  STATS.forEach(k => {
    const b = bonus[k] || 0;
    const sel = chUI.swapSel === k;
    let dice = '';
    if (ch.method === 'roll' && ch.dice && ch.dice[k]) {
      const di = droppedIndex(ch.dice[k]);
      dice = '<div class="ch-dice">' + ch.dice[k].map((v, i) => `<span class="ch-die${i === di ? ' dropped' : ''}">${v}</span>`).join('') + '</div>';
    }
    let controls = '';
    if (pb) {
      const v = ch.base[k];
      const nextCost = v < 15 ? POINT_COST[v + 1] - POINT_COST[v] : 99;
      controls = `<div class="ch-pb">
        <button class="ch-pb-btn" data-k="${k}" data-d="-1" ${v <= 8 ? 'disabled' : ''} aria-label="Lower ${STAT_NAME[k]}">−</button>
        <button class="ch-pb-btn" data-k="${k}" data-d="1" ${v >= 15 || nextCost > left ? 'disabled' : ''} aria-label="Raise ${STAT_NAME[k]}">+</button>
      </div>`;
    }
    html += `<div class="ch-stat${sel ? ' sel' : ''}" data-k="${k}" ${pb ? '' : 'role="button" tabindex="0"'} aria-label="${STAT_NAME[k]} ${sc[k]}">
      <div class="ch-stat-head">
        <span class="ch-stat-lab">${STAT_LABEL[k]}</span>
        ${ch.method === 'roll' ? `<button class="ch-reroll" data-k="${k}" aria-label="Re-roll ${STAT_NAME[k]}">↻</button>` : ''}
      </div>
      <div class="ch-stat-score">${sc[k]}</div>
      <div class="ch-stat-mod">${fmtMod(modOf(sc[k]))}</div>
      <div class="ch-stat-base">${ch.base[k]}${b ? ` <span class="ch-race-b">+${b} race</span>` : ''}</div>
      ${dice}${controls}
    </div>`;
  });
  html += '</div>';
  html += `<div class="ch-stat-actions">
    ${ch.method === 'roll' ? `<button class="btn btn-primary" id="ch-roll-all">${ICON_DIE} Roll all</button>` : ''}
    ${pb ? '' : '<button class="btn btn-secondary" id="ch-arrange">Best for class</button>'}
  </div>`;
  el.innerHTML = html;

  el.querySelectorAll('.ch-reroll').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const k = btn.dataset.k;
    ch.dice[k] = roll4d6();
    ch.base[k] = diceTotal(ch.dice[k]);
    chUI.swapSel = null;
    renderStats(); renderDerived(); chSaveSoon();
    animateStats([k]);
  }));
  el.querySelectorAll('.ch-pb-btn').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const k = btn.dataset.k;
    ch.base[k] = Math.max(8, Math.min(15, ch.base[k] + Number(btn.dataset.d)));
    renderStats(); renderDerived(); chSaveSoon();
  }));
  if (!pb) el.querySelectorAll('.ch-stat').forEach(tile => {
    const pickTile = () => {
      const k = tile.dataset.k;
      if (!chUI.swapSel) { chUI.swapSel = k; renderStats(); return; }
      if (chUI.swapSel !== k) {
        const a = chUI.swapSel;
        [ch.base[a], ch.base[k]] = [ch.base[k], ch.base[a]];
        if (ch.dice) [ch.dice[a], ch.dice[k]] = [ch.dice[k], ch.dice[a]];
        chSaveSoon();
      }
      chUI.swapSel = null;
      renderStats(); renderDerived();
    };
    tile.addEventListener('click', pickTile);
    tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickTile(); } });
  });
  const rollAll = document.getElementById('ch-roll-all');
  if (rollAll) rollAll.addEventListener('click', () => {
    STATS.forEach(k => { ch.dice[k] = roll4d6(); ch.base[k] = diceTotal(ch.dice[k]); });
    chUI.swapSel = null;
    renderStats(); renderDerived(); chSaveSoon();
    animateStats(STATS);
  });
  const arrange = document.getElementById('ch-arrange');
  if (arrange) arrange.addEventListener('click', () => {
    arrangeForClass(ch);
    chUI.swapSel = null;
    renderStats(); renderDerived(); chSaveSoon();
    showToast('Best scores moved to ' + CH_CLASSES[ch.cls].label + ' stats.');
  });
}

// Short tumble of the dice faces before they land — feels like rolling at the table
function animateStats(keys) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const tiles = keys.map(k => chRoot().querySelector('.ch-stat[data-k="' + k + '"]')).filter(Boolean);
  const dice = [];
  tiles.forEach(t => {
    t.classList.add('rolling');
    t.querySelectorAll('.ch-die').forEach(d => dice.push({ el: d, final: d.textContent }));
  });
  if (!dice.length) { tiles.forEach(t => t.classList.remove('rolling')); return; }
  let n = 0;
  const timer = setInterval(() => {
    n++;
    dice.forEach(d => { d.el.textContent = d6(); });
    if (n >= 7) {
      clearInterval(timer);
      dice.forEach(d => { d.el.textContent = d.final; });
      tiles.forEach(t => t.classList.remove('rolling'));
    }
  }, 55);
}

/* ── Portrait (Pro) ────────────────────────────────────────── */
function renderPortraitActions() {
  const ch = chCurrent();
  const el = document.getElementById('ch-portrait-actions');
  if (!ch || !el) return;
  if (!isProUnlocked()) {
    el.innerHTML = `<div class="ch-pro-note">${ICON_LOCK}<span>Custom portraits &amp; photos are Pro</span></div>
      <button class="btn-inline-unlock js-unlock-pro">Unlock — $2.99</button>`;
    return;
  }
  el.innerHTML = `
    <button class="btn btn-secondary ch-pa-btn" id="ch-look-rand">${ICON_DIE} Randomize look</button>
    <button class="btn btn-secondary ch-pa-btn" id="ch-look-custom">${chUI.builderOpen ? 'Close builder' : 'Customize'}</button>
    <button class="btn btn-secondary ch-pa-btn" id="ch-photo-btn">${ch.photo ? 'New photo' : 'Use a photo'}</button>
    ${ch.photo ? '<button class="btn btn-ghost ch-pa-btn" id="ch-photo-rm">Remove photo</button>' : ''}
    <input type="file" id="ch-photo-file" accept="image/*" hidden>
  `;
  const $ = id => document.getElementById(id);
  $('ch-look-rand').addEventListener('click', () => {
    ch.portrait = randomLook(ch.race, cleanPortrait(ch.portrait).sex);
    ch.photo = null;
    portraitChanged();
  });
  $('ch-look-custom').addEventListener('click', () => {
    chUI.builderOpen = !chUI.builderOpen;
    renderPortraitActions(); renderBuilder();
    if (chUI.builderOpen) document.getElementById('ch-builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('ch-photo-btn').addEventListener('click', () => $('ch-photo-file').click());
  $('ch-photo-file').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) shrinkPhoto(f, data => {
      if (!data) { showToast('That picture could not be opened. Try a JPG or PNG.'); return; }
      ch.photo = data;
      portraitChanged();
      showToast('Photo added.');
    });
  });
  if ($('ch-photo-rm')) $('ch-photo-rm').addEventListener('click', () => { ch.photo = null; portraitChanged(); });
}

function portraitChanged() {
  const ch = chCurrent();
  document.getElementById('ch-portrait').innerHTML = portraitHTML(ch);
  renderPortraitActions();
  renderBuilder();
  chSaveSoon();
}

// Shrink a photo to fit 300px so it stays small in storage (JPEG ~20–40 KB)
function shrinkPhoto(file, cb) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const max = 300, k = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(img.width * k));
    cv.height = Math.max(1, Math.round(img.height * k));
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    let data = null;
    try { data = cv.toDataURL('image/jpeg', 0.8); } catch (e) {}
    cv.width = cv.height = 0;   // free canvas memory right away on low-RAM phones
    cb(data);
  };
  img.onerror = () => { URL.revokeObjectURL(url); cb(null); };
  img.src = url;
}

function renderBuilder() {
  const ch = chCurrent();
  const el = document.getElementById('ch-builder');
  if (!ch || !el) return;
  if (!chUI.builderOpen || !isProUnlocked()) { el.innerHTML = ''; el.className = ''; return; }
  const p = ch.portrait = cleanPortrait(ch.portrait);
  el.className = 'ch-builder';
  el.innerHTML = (ch.photo ? '<p class="ch-note">Using a photo. Pick any option to switch back to a built portrait.</p>' : '') +
    P_GROUPS.map(g => {
      let opts;
      if (g.colors) {
        opts = g.colors.map(col => `<button class="ch-sw${p[g.k] === col ? ' on' : ''}" style="background:${col}" data-k="${g.k}" data-v="${col}" aria-label="${g.label} ${col}"></button>`).join('');
      } else {
        opts = g.opts.map(([v, l]) => {
          const on = g.multi ? p.extras.indexOf(v) >= 0 : p[g.k] === v;
          return `<button class="ch-opt${on ? ' on' : ''}" data-k="${g.k}" data-v="${v}" aria-pressed="${on}">${l}</button>`;
        }).join('');
      }
      return `<div class="ch-b-group"><div class="ch-b-label">${g.label}</div><div class="ch-b-opts">${opts}</div></div>`;
    }).join('') +
    '<button class="btn btn-secondary btn-full" id="ch-builder-done">Done</button>';

  el.querySelectorAll('[data-k]').forEach(btn => btn.addEventListener('click', () => {
    const k = btn.dataset.k, v = btn.dataset.v;
    if (k === 'extras') {
      const i = p.extras.indexOf(v);
      if (i >= 0) p.extras.splice(i, 1); else p.extras.push(v);
    } else p[k] = v;
    ch.photo = null;
    const y = window.scrollY;
    portraitChanged();
    window.scrollTo(0, y);
  }));
  document.getElementById('ch-builder-done').addEventListener('click', () => {
    chUI.builderOpen = false;
    renderPortraitActions(); renderBuilder();
    document.getElementById('ch-portrait').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/* ── "Appears in sessions" ─────────────────────────────────── */
function renderAppears() {
  const ch = chCurrent();
  const el = document.getElementById('ch-appears');
  if (!ch || !el) return;
  if (chUI.draft) { el.innerHTML = ''; return; }
  const hits = (typeof LinkedWords !== 'undefined') ? LinkedWords.sessionsMentioning('character', ch.id) : [];
  el.innerHTML = `<div class="ch-sec-title">Appears in sessions</div>` + (hits.length
    ? `<div class="ch-appear-chips">${hits.map(h => `<button class="lw-chip lw-chip-character" data-sid="${h.session.id}">${escHtml(h.session.title || 'Session')}<span class="lw-chip-count">${h.count}</span></button>`).join('')}</div>`
    : `<p class="ch-note">Type ${escHtml(ch.name || 'their name')} in your session notes and it will link here.</p>`);
  el.querySelectorAll('[data-sid]').forEach(btn => btn.addEventListener('click', () => {
    if (typeof openSessionAt === 'function') openSessionAt(Number(btn.dataset.sid), 'character', ch.id);
  }));
}

/* ── Public entry points ───────────────────────────────────── */
function openCharacterSheet(id) {
  const ch = Characters.get(id);
  if (!ch) { showToast('That character no longer exists.'); return; }
  chSaveNow();
  chUI.draft = null;
  chUI.currentId = id;
  chUI.view = 'sheet';
  chUI.swapSel = null;
  chUI.builderOpen = false;
  if (typeof activateTab === 'function') activateTab('characters');
  renderCharacters();
  chScrollTop();
}

// Used by "★ Link → Player Character" in session notes
function createCharacterNamed(name) {
  const ch = generateCharacter({});
  ch.name = name;
  return Characters.add(ch);
}

function onCharactersProChange() {
  if (chRoot() && chRoot().childElementCount) renderCharacters();
}
function onCharactersTabShown() {
  // sessions may have changed while we were away
  if (chUI.view === 'sheet') renderAppears();
  else if (chUI.view === 'list') renderCharList();
}

function setupCharactersUI() {
  Characters.load();
  renderCharacters();
  // Save right away if the app is backgrounded mid-edit
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') chSaveNow(); });
}
