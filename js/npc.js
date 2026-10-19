/**
 * NPC Generator — random NPCs using fantasy name tables
 * Race: human / elf / dwarf / halfling / tiefling
 */

const NPC = (() => {

  // ── Name tables ───────────────────────────────────────────
  const NAMES = {
    human: {
      first: ['Aldric','Bram','Cassia','Deva','Edwyn','Faye','Gareth','Hilda','Isara','Jorin','Kessa','Lorn','Mira','Neven','Orla','Petr','Quinn','Reva','Soren','Tilda','Uvan','Vera','Wren','Xander','Yara','Zeth'],
      last: ['Ashford','Blackwood','Coldwater','Dunmore','Eastmere','Farrow','Greystone','Hollis','Ironwood','Jarvis','Keld','Longfellow','Marsh','Northgate','Oldfield','Plum','Redvale','Silvern','Thorne','Underhill','Vance','Westfall','Yew']
    },
    elf: {
      first: ['Aelindra','Caladwen','Erevan','Filarion','Galanodel','Ilthilior','Laucian','Mialee','Naivara','Quillathe','Riardon','Sariel','Thamior','Varis','Xanaphia','Zylvara','Adran','Birel','Carric','Daratrine'],
      last: ['Amakiir','Brightwood','Calahorn','Dawnwhisper','Evenwind','Galanodel','Holimion','Liadon','Meliamne','Moonwhisper','Naïlo','Nightbreeze','Siannodel','Silverfrond','Xiloscient']
    },
    dwarf: {
      first: ['Adrik','Baern','Dagnal','Eberk','Falkrunn','Gurdis','Harbek','Kildrak','Liftrasa','Mardred','Orla','Rurik','Sannl','Torbera','Ulfgar','Veit','Artin','Brigo','Dain','Gimra'],
      last: ['Balderk','Battlehammer','Boulderfoot','Cragback','Dankil','Fireforge','Frostbeard','Gorunn','Holderhek','Ironfist','Loderr','Lutgehr','Rumnaheim','Strakeln','Torunn','Ungart']
    },
    halfling: {
      first: ['Alton','Beau','Cora','Eldon','Finnan','Garret','Hena','Jillian','Kithri','Lyle','Marigold','Osborn','Pell','Rosie','Seraphina','Tobold','Verna','Wendell','Yenna','Zula'],
      last: ['Brushgather','Coldfoot','Goodbarrel','Greenbottle','High-hill','Hilltopple','Leagallow','Sandybanks','Thistlewick','Tosscobble','Underbough','Warmwater','Whitelock']
    },
    tiefling: {
      first: ['Akta','Bryseis','Damaia','Ea','Kallista','Lerissa','Makaria','Nemeia','Orianna','Phelaia','Rieta','Seraphina','Tanis','Ulmiel','Vaevictis','Zilenna','Akmenos','Amnon','Barakas','Damakos','Ekemon','Iados','Kairon','Leucis','Mordai','Naamah','Skamos'],
      last: ['Bloodthorn','Chaosbane','Darkmantle','Emberveil','Flamescar','Grimhallow','Hellsgate','Ironblight','Jadecurse','Killsorrow','Lordbane','Mirewraith','Nightfall','Oblivion','Plagueborn','Ruinsoul','Shadowmark','Thornhide','Voidborn','Wraithbound']
    }
  };

  const RACES = ['human','elf','dwarf','halfling','tiefling'];

  const OCCUPATIONS = [
    'Farmer','Blacksmith','Innkeeper','Merchant','Guard','Herbalist','Sailor','Carpenter',
    'Tailor','Cook','Librarian','Priest','Scholar','Hunter','Ranger','Thief','Bard',
    'Soldier','Apothecary','Miner','Fisher','Weaver','Stablehand','Scribe','Courier',
    'Alchemist','Cartographer','Spymaster','Fence','Cultist','Exile','Noble','Beggar'
  ];

  const TRAITS = [
    'Speaks in rhymes when nervous','Never makes eye contact','Laughs at their own jokes',
    'Quotes obscure historical figures','Collects teeth','Always eating something',
    'Hums tunelessly while thinking','Compulsively straightens objects','Extremely literal-minded',
    'Repeats the last word of every sentence they hear','Mistrusts magic',
    'Claims to be someone they are not','Has a nervous tic','Speaks very slowly and deliberately',
    'Refers to themselves in the third person','Whistles to fill silence',
    'Obsessively polite','Makes dark jokes in grim situations','Fidgets constantly',
    'Never admits to being wrong','Tells long stories with no point'
  ];

  const IDEALS = [
    'Community — we survive together or not at all',
    'Power — knowledge is the only true currency',
    'Faith — the gods will provide for those who serve',
    'Freedom — no one owns anyone else',
    'Justice — wrongs must be made right, whatever the cost',
    'Tradition — the old ways exist for a reason',
    'Ambition — I will rise, no matter what it takes',
    'Redemption — even the worst may yet be saved',
    'Survival — nothing matters if you are dead',
    'Loyalty — blood and bond, before all else'
  ];

  const BONDS = [
    'A debt owed to someone dangerous','A sibling who disappeared years ago',
    'A childhood home they were forced to leave','An heirloom they would die to protect',
    'A mentor who changed everything','A vow made to someone now dead',
    'A secret buried in their past','A lover in another city','A child they have never met',
    'An enemy who must be outlived','A book they have never been able to finish reading',
    'The memory of a place they can never return to'
  ];

  const FLAWS = [
    'Cannot resist a bet, no matter the odds','Trusts strangers far too quickly',
    'Holds grudges across generations','Drinks to forget','Believes they are always the smartest person present',
    'Cannot keep a secret','Lies reflexively, even about small things',
    'Runs from danger at the first sign','Covets things that belong to others',
    'Cannot let an insult pass unanswered','Spends money the moment they have it',
    'Falls for flattery every time'
  ];

  const BUILD = ['lean','stocky','wiry','broad-shouldered','slight','muscular','hunched','towering'];
  const HAIR = ['close-cropped','long and braided','wild and unkempt','neatly tied back','shaved','thinning','streaked with grey','silver-white'];
  const EYE_COLOR = ['grey','amber','pale blue','dark brown','green','hazel','black','violet'];
  const FEATURE = [
    'a scar across the chin','a gap-toothed smile','ink-stained fingers','calloused hands',
    'a crooked nose broken more than once','weathered skin','a permanent squint',
    'an elaborate tattoo on the neck','mismatched earrings','a missing fingertip'
  ];

  const SECRETS = [
    'Once burned down a building to collect the insurance — two people were inside.',
    'Is a spy for the city the party just came from.',
    'Murdered their last employer and took their identity.',
    'Owes a tithe to a cult they have never managed to leave.',
    'Was present the night the town elder disappeared, and said nothing.',
    'Has been slowly poisoning a rival for months.',
    'Knows where a significant cache of stolen gold is buried.',
    'Is the illegitimate child of someone locally powerful.',
    'Sold information to the enemy during the last war.',
    'Has been impersonating a dead person for years.',
    'Owes a life-debt to a devil and has not paid it yet.',
    'Witnessed a crime by a city official and is blackmailing them.',
    'Secretly funding a resistance movement the party may be caught in the middle of.'
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function roll(sides) { return Math.floor(Math.random() * sides) + 1; }

  // ── Generate ──────────────────────────────────────────────
  function generateNPC() {
    const race = pick(RACES);
    const nameTable = NAMES[race];
    const firstName = pick(nameTable.first);
    const lastName = pick(nameTable.last);
    const name = `${firstName} ${lastName}`;
    const occupation = pick(OCCUPATIONS);
    const trait = pick(TRAITS);
    const ideal = pick(IDEALS);
    const bond = pick(BONDS);
    const flaw = pick(FLAWS);
    const age = 18 + roll(60);
    const desc = `A ${age}-year-old ${race} of ${pick(BUILD)} build with ${pick(HAIR)} hair and ${pick(EYE_COLOR)} eyes. Notable: ${pick(FEATURE)}.`;
    const secret = pick(SECRETS);

    return { name, race, occupation, trait, ideal, bond, flaw, description: desc, secret };
  }

  // ── Persistence (NPCs live in the shared Vault, see vault.js) ──
  function load() { /* Vault.load() runs once in app.js */ }

  function saveNPC(npc) {
    return Vault.add('npc', npc.name, {
      details: npc.description || '',
      fields: { race: npc.race ? npc.race[0].toUpperCase() + npc.race.slice(1) : '', occupation: npc.occupation || '',
        trait: npc.trait || '', ideal: npc.ideal || '', bond: npc.bond || '', flaw: npc.flaw || '', secret: npc.secret || '' }
    });
  }

  function deleteNPC(id) { Vault.remove(id); }

  // Flattened view for the NPC tab list
  function getSaved() {
    return Vault.byType('npc').map(e => ({ id: e.id, name: e.name, race: e.fields.race || '', occupation: e.fields.occupation || '' }));
  }

  // Tables are shared with the player-character generator (characters.js)
  const tables = { NAMES, IDEALS, BONDS, FLAWS };

  return { generateNPC, load, saveNPC, deleteNPC, getSaved, tables };
})();

// ── UI ────────────────────────────────────────────────────
let currentNPC = null;

function renderNPCResult(npc) {
  if (!npc) return;
  currentNPC = npc;
  const el = document.getElementById('npc-result');
  el.innerHTML = `
    <div class="npc-card">
      <div class="npc-name">${escHtml(npc.name)}</div>
      <div class="npc-meta">${cap(npc.race)} · ${escHtml(npc.occupation)}</div>
      <div class="npc-desc">${escHtml(npc.description)}</div>
      <div class="npc-fields">
        <div class="npc-field"><span class="npc-label">Trait</span><span>${escHtml(npc.trait)}</span></div>
        <div class="npc-field"><span class="npc-label">Ideal</span><span>${escHtml(npc.ideal)}</span></div>
        <div class="npc-field"><span class="npc-label">Bond</span><span>${escHtml(npc.bond)}</span></div>
        <div class="npc-field"><span class="npc-label">Flaw</span><span>${escHtml(npc.flaw)}</span></div>
        <div class="npc-field secret"><span class="npc-label">Secret</span><span>${escHtml(npc.secret)}</span></div>
      </div>
      <div class="npc-actions">
        <button class="btn btn-primary" id="save-npc-btn">Save NPC</button>
        <button class="btn btn-secondary" id="regen-npc-btn">Regenerate</button>
      </div>
    </div>
  `;
  document.getElementById('save-npc-btn').addEventListener('click', () => {
    NPC.saveNPC(currentNPC);
    renderSavedNPCs();
    showToast(`${currentNPC.name} saved.`);
  });
  document.getElementById('regen-npc-btn').addEventListener('click', () => {
    renderNPCResult(NPC.generateNPC());
  });
}

function renderSavedNPCs() {
  const list = document.getElementById('saved-npcs');
  const saved = NPC.getSaved();
  if (saved.length === 0) {
    list.innerHTML = '<p class="saved-empty">No saved NPCs yet.</p>';
    return;
  }
  list.innerHTML = saved.map(n => `
    <div class="saved-npc-row">
      <div class="saved-npc-info" role="button" tabindex="0" data-open="${n.id}" aria-label="Edit ${escHtml(n.name)}">
        <span class="saved-npc-name">${escHtml(n.name)}</span>
        <span class="saved-npc-sub">${escHtml([cap(n.race), n.occupation].filter(Boolean).join(' · ') || 'NPC')}</span>
      </div>
      <button class="icon-btn remove" data-id="${n.id}" aria-label="Delete ${escHtml(n.name)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');
  list.querySelectorAll('[data-open]').forEach(el => {
    el.addEventListener('click', () => { if (typeof openEntryCard === 'function') openEntryCard(Number(el.dataset.open)); });
  });
  list.querySelectorAll('.icon-btn.remove').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete ' + (Vault.get(Number(btn.dataset.id)) || {}).name + '?')) return;
      NPC.deleteNPC(Number(btn.dataset.id));
      renderSavedNPCs();
    });
  });
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function setupNPCUI() {
  NPC.load();
  document.getElementById('gen-npc-btn').addEventListener('click', () => {
    renderNPCResult(NPC.generateNPC());
  });
  renderSavedNPCs();
  // Generate one on load so the panel isn't empty
  renderNPCResult(NPC.generateNPC());
}
