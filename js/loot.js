/**
 * Loot Generator — 5e DMG treasure hoard tables
 * Coin amounts, gems, art objects, magic items by CR bracket
 */

const Loot = (() => {

  // Dice helpers
  function roll(sides, num = 1) {
    let t = 0;
    for (let i = 0; i < num; i++) t += Math.floor(Math.random() * sides) + 1;
    return t;
  }
  function d100() { return roll(100); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── Gem tables ────────────────────────────────────────────
  const GEMS_10GP = ['Azurite','Banded agate','Blue quartz','Eye agate','Hematite','Lapis lazuli','Malachite','Moss agate','Obsidian','Rhodonite','Tiger eye','Turquoise'];
  const GEMS_50GP = ['Bloodstone','Carnelian','Chalcedony','Chrysoprase','Citrine','Jasper','Moonstone','Onyx','Quartz','Sardonyx','Star rose quartz','Zircon'];
  const GEMS_100GP = ['Amber','Amethyst','Chrysoberyl','Coral','Garnet','Jade','Jet','Pearl','Spinel','Tourmaline'];
  const GEMS_500GP = ['Alexandrite','Aquamarine','Black pearl','Blue spinel','Peridot','Topaz'];
  const GEMS_1000GP = ['Black opal','Blue sapphire','Emerald','Fire opal','Opal','Star ruby','Star sapphire','Yellow sapphire'];
  const GEMS_5000GP = ['Black sapphire','Diamond','Jacinth','Ruby'];

  // ── Art object tables ─────────────────────────────────────
  const ART_25GP = ['Silver ewer','Carved bone statuette','Small gold bracelet','Cloth-of-gold vestments','Black velvet mask stitched with silver thread','Copper chalice with silver filigree','Pair of engraved bone dice','Small mirror set in a painted wooden frame','Embroidered silk handkerchief','Gold locket with a painted portrait inside'];
  const ART_250GP = ['Gold ring set with bloodstones','Carved ivory statuette','Large gold bracelet','Silver necklace with a gemstone pendant','Bronze crown','Silk robe with gold embroidery','Large well-made tapestry','Brass mug with jade inlay','Box of turquoise animal figurines','Gold bird cage with electrum filigree'];
  const ART_750GP = ['Silver chalice set with moonstones','Silver-plated steel longsword with jet set in hilt','Carved harp of exotic wood with ivory inlay and zircon gems','Small gold idol','Gold dragon comb set with red garnets as eyes','Bottle stopper cork embossed with gold leaf and set with amethysts','Ceremonial electrum dagger with a black pearl in the pommel','Silver and gold brooch','Obsidian statuette with gold fittings and inlay','Painted gold war mask'];
  const ART_2500GP = ['Fine gold chain set with a fire opal','Old masterwork oil painting on a teak panel','Embroidered silk and velvet mantle set with numerous moonstones','Platinum bracelet set with a sapphire','Embroidered glove set with jewel chips','Jeweled anklet','Gold music box','Gold circlet set with four aquamarines','Eye patch with a mock eye set in blue sapphire and moonstone','A necklace string of small pink pearls'];
  const ART_7500GP = ['Jeweled gold crown','Jeweled platinum ring','Small gold statuette set with rubies','Gold cup set with emeralds','Gold jewelry box with platinum filigree','Painted gold child\'s sarcophagus','Jade game board with solid gold playing pieces','Bejeweled ivory drinking horn with gold filigree'];

  // ── Magic item tables (simplified) ───────────────────────
  const MAGIC_A = ['Potion of healing','Spell scroll (cantrip)','Potion of climbing','Spell scroll (1st level)','Potion of healing (2)','Bag of 1d6 tricks'];
  const MAGIC_B = ['Potion of greater healing','Spell scroll (2nd level)','Potion of fire breath','Potion of resistance','Ammunition +1','Potion of animal friendship','Potion of hill giant strength','Potion of growth','Potion of water breathing','Spell scroll (3rd level)','Bag of holding','Dust of disappearance'];
  const MAGIC_C = ['Potion of superior healing','Spell scroll (4th level)','Ammunition +2','Potion of clairvoyance','Potion of diminution','Potion of gaseous form','Potion of frost giant strength','Potion of stone giant strength','Potion of heroism','Potion of invulnerability','Potion of mind reading','Spell scroll (5th level)','Elixir of health','Oil of etherealness','Potion of fire giant strength','Quaal\'s feather token','Scroll of protection','Bag of beans','Bead of force'];
  const MAGIC_D = ['Potion of supreme healing','Spell scroll (6th level)','Spell scroll (7th level)','Ammunition +3','Oil of sharpness','Potion of flying','Potion of cloud giant strength','Potion of longevity','Potion of vitality','Spell scroll (8th level)','Horseshoes of speed','Necklace of fireballs','Potion of storm giant strength','Figurine of wondrous power'];
  const MAGIC_E = ['Spell scroll (8th level)','Potion of supreme healing (1d4)','Spell scroll (9th level)'];
  const MAGIC_F = ['Weapon +1','Shield +1','Sentinel shield','Amulet of proof against detection','Boots of elvenkind','Boots of striding and springing','Bracers of archery','Brooch of shielding','Broom of flying','Circlet of blasting','Cloak of elvenkind','Cloak of protection','Gauntlets of ogre power','Hat of disguise','Javelin of lightning','Pearl of power','Rod of the pact keeper +1','Slippers of spider climbing','Staff of the adder','Staff of the python','Sword of vengeance','Trident of fish command','Wand of magic missiles','Wand of the war mage +1','Wand of web','Weapon of warning'];
  const MAGIC_G = ['Weapon +2','Figurine of wondrous power (roll)','Amulet of health','Armor of vulnerability','Arrow-catching shield','Belt of dwarvenkind','Belt of giant strength (hill)','Berserker axe','Boots of levitation','Boots of speed','Bowl of commanding water elementals','Bracers of defense','Brazier of commanding fire elementals','Cape of the mountebank','Censer of controlling air elementals','Armor +1','Dagger of venom','Dancing sword','Demon armor','Dragon scale mail','Dwarven plate','Dwarven thrower','Efreeti bottle','Figurine of wondrous power (obsidian steed)','Frost brand','Helm of brilliance'];
  const MAGIC_H = ['Weapon +3','Amulet of the planes','Carpet of flying','Crystal ball','Ring of regeneration','Ring of shooting stars','Ring of telekinesis','Robe of scintillating colors','Robe of stars','Rod of absorption','Rod of alertness','Rod of security','Rod of the pact keeper +3','Scimitar of speed','Shield +3','Staff of fire','Staff of frost','Staff of power','Staff of striking','Staff of thunder and lightning','Sword of sharpness','Wand of polymorph','Wand of the war mage +3'];
  const MAGIC_I = ['Defender','Hammer of thunderbolts','Luck blade','Sword of answering','Holy avenger','Ring of djinni summoning','Ring of elemental command','Ring of spell storing','Ring of three wishes','Ring of invulnerability','Staff of the magi'];

  // ── Hoard generation by CR bracket ───────────────────────
  function generateHoard(crBracket) {
    let coins = {};
    let gems = [];
    let art = [];
    let magic = [];
    const r = d100();

    if (crBracket === '0-4') {
      coins.cp = roll(6, 6) * 100;
      coins.sp = roll(3, 6) * 100;
      coins.gp = roll(2, 6) * 10;
      if (r <= 6)        { /* nothing extra */ }
      else if (r <= 16)  { gems = rollGems(2, GEMS_10GP); }
      else if (r <= 26)  { gems = rollGems(2, GEMS_25GP_ART(ART_25GP)); art = rollArt(2, ART_25GP); }
      else if (r <= 36)  { gems = rollGems(2, GEMS_50GP); }
      else if (r <= 44)  { gems = rollGems(2, GEMS_10GP); magic = [pick(MAGIC_A)]; }
      else if (r <= 52)  { gems = rollGems(2, GEMS_25GP_ART(ART_25GP)); art = rollArt(2, ART_25GP); magic = [pick(MAGIC_A)]; }
      else if (r <= 60)  { gems = rollGems(2, GEMS_50GP); magic = [pick(MAGIC_A)]; }
      else if (r <= 65)  { gems = rollGems(2, GEMS_10GP); magic = rollMany(2, MAGIC_B); }
      else if (r <= 70)  { gems = rollGems(2, GEMS_25GP_ART(ART_25GP)); art = rollArt(2, ART_25GP); magic = rollMany(2, MAGIC_B); }
      else if (r <= 75)  { gems = rollGems(2, GEMS_50GP); magic = rollMany(2, MAGIC_B); }
      else if (r <= 78)  { gems = rollGems(2, GEMS_10GP); magic = rollMany(3, MAGIC_C); }
      else if (r <= 80)  { gems = rollGems(2, GEMS_25GP_ART(ART_25GP)); art = rollArt(2, ART_25GP); magic = rollMany(3, MAGIC_C); }
      else if (r <= 85)  { magic = rollMany(1, MAGIC_F); }
      else if (r <= 92)  { gems = rollGems(2, GEMS_50GP); magic = rollMany(1, MAGIC_F); }
      else if (r <= 97)  { art = rollArt(2, ART_25GP); magic = rollMany(1, MAGIC_G); }
      else               { gems = rollGems(3, GEMS_50GP); magic = rollMany(1, MAGIC_H); }
    }
    else if (crBracket === '5-10') {
      coins.cp = roll(4, 6) * 100;
      coins.sp = roll(6, 6) * 100;
      coins.ep = roll(3, 6) * 100;
      coins.gp = roll(6, 6) * 100;
      if (r <= 4)        { /* nothing extra */ }
      else if (r <= 10)  { art = rollArt(2, ART_25GP); }
      else if (r <= 16)  { gems = rollGems(3, GEMS_50GP); }
      else if (r <= 22)  { gems = rollGems(3, GEMS_100GP); }
      else if (r <= 28)  { art = rollArt(2, ART_250GP); }
      else if (r <= 32)  { art = rollArt(2, ART_25GP); magic = rollMany(roll(6), MAGIC_A); }
      else if (r <= 36)  { gems = rollGems(3, GEMS_50GP); magic = rollMany(roll(6), MAGIC_A); }
      else if (r <= 40)  { gems = rollGems(3, GEMS_100GP); magic = rollMany(roll(6), MAGIC_B); }
      else if (r <= 44)  { art = rollArt(2, ART_250GP); magic = rollMany(roll(6), MAGIC_B); }
      else if (r <= 49)  { art = rollArt(2, ART_25GP); magic = rollMany(roll(4), MAGIC_C); }
      else if (r <= 54)  { gems = rollGems(3, GEMS_50GP); magic = rollMany(roll(4), MAGIC_C); }
      else if (r <= 59)  { gems = rollGems(3, GEMS_100GP); magic = rollMany(roll(4), MAGIC_D); }
      else if (r <= 63)  { art = rollArt(2, ART_250GP); magic = rollMany(roll(4), MAGIC_D); }
      else if (r <= 66)  { art = rollArt(2, ART_25GP); magic = rollMany(roll(4), MAGIC_F); }
      else if (r <= 69)  { gems = rollGems(3, GEMS_50GP); magic = rollMany(roll(4), MAGIC_F); }
      else if (r <= 72)  { gems = rollGems(3, GEMS_100GP); magic = rollMany(roll(4), MAGIC_F); }
      else if (r <= 74)  { art = rollArt(2, ART_250GP); magic = rollMany(roll(4), MAGIC_F); }
      else if (r <= 76)  { art = rollArt(2, ART_25GP); magic = rollMany(roll(4), MAGIC_G); }
      else if (r <= 78)  { gems = rollGems(3, GEMS_50GP); magic = rollMany(roll(4), MAGIC_G); }
      else if (r <= 80)  { gems = rollGems(3, GEMS_100GP); magic = rollMany(1, MAGIC_G); }
      else if (r <= 84)  { art = rollArt(2, ART_250GP); magic = rollMany(1, MAGIC_H); }
      else if (r <= 92)  { gems = rollGems(3, GEMS_500GP); magic = rollMany(1, MAGIC_H); }
      else               { art = rollArt(2, ART_750GP); magic = rollMany(1, MAGIC_I); }
    }
    else if (crBracket === '11-16') {
      coins.gp = roll(4, 6) * 1000;
      coins.pp = roll(5, 6) * 100;
      if (r <= 3)        { /* nothing extra */ }
      else if (r <= 6)   { art = rollArt(2, ART_250GP); }
      else if (r <= 9)   { art = rollArt(2, ART_750GP); }
      else if (r <= 12)  { gems = rollGems(3, GEMS_500GP); }
      else if (r <= 15)  { gems = rollGems(3, GEMS_1000GP); }
      else if (r <= 19)  { art = rollArt(2, ART_250GP); magic = rollMany(roll(4), MAGIC_A); magic.push(...rollMany(roll(6), MAGIC_B)); }
      else if (r <= 23)  { art = rollArt(2, ART_750GP); magic = rollMany(roll(4), MAGIC_C); }
      else if (r <= 31)  { gems = rollGems(3, GEMS_500GP); magic = rollMany(roll(4), MAGIC_C); }
      else if (r <= 35)  { art = rollArt(2, ART_250GP); magic = rollMany(roll(4), MAGIC_D); }
      else if (r <= 38)  { art = rollArt(2, ART_750GP); magic = rollMany(roll(4), MAGIC_D); }
      else if (r <= 45)  { gems = rollGems(3, GEMS_1000GP); magic = rollMany(roll(4), MAGIC_D); }
      else if (r <= 52)  { art = rollArt(2, ART_250GP); magic = rollMany(roll(4), MAGIC_F); }
      else if (r <= 54)  { art = rollArt(2, ART_750GP); magic = rollMany(roll(4), MAGIC_F); }
      else if (r <= 58)  { gems = rollGems(3, GEMS_500GP); magic = rollMany(roll(4), MAGIC_F); }
      else if (r <= 62)  { gems = rollGems(3, GEMS_1000GP); magic = rollMany(roll(4), MAGIC_G); }
      else if (r <= 66)  { art = rollArt(2, ART_250GP); magic = rollMany(1, MAGIC_G); }
      else if (r <= 68)  { art = rollArt(2, ART_750GP); magic = rollMany(1, MAGIC_H); }
      else if (r <= 70)  { gems = rollGems(3, GEMS_500GP); magic = rollMany(1, MAGIC_H); }
      else if (r <= 72)  { gems = rollGems(3, GEMS_1000GP); magic = rollMany(1, MAGIC_H); }
      else if (r <= 74)  { art = rollArt(2, ART_250GP); magic = rollMany(1, MAGIC_I); }
      else if (r <= 76)  { art = rollArt(2, ART_750GP); magic = rollMany(1, MAGIC_I); }
      else if (r <= 78)  { gems = rollGems(3, GEMS_500GP); magic = rollMany(1, MAGIC_I); }
      else               { gems = rollGems(3, GEMS_1000GP); magic = rollMany(1, MAGIC_I); }
    }
    else { // 17+
      coins.gp = roll(12, 6) * 1000;
      coins.pp = roll(8, 6) * 1000;
      if (r <= 2)        { /* nothing extra */ }
      else if (r <= 5)   { gems = rollGems(3, GEMS_1000GP); magic = rollMany(roll(4), MAGIC_C); magic.push(...rollMany(roll(4), MAGIC_D)); }
      else if (r <= 8)   { art = rollArt(2, ART_2500GP); magic = rollMany(roll(4), MAGIC_C); magic.push(...rollMany(roll(4), MAGIC_D)); }
      else if (r <= 11)  { art = rollArt(2, ART_7500GP); magic = rollMany(roll(4), MAGIC_C); magic.push(...rollMany(roll(4), MAGIC_D)); }
      else if (r <= 14)  { gems = rollGems(3, GEMS_5000GP); magic = rollMany(roll(4), MAGIC_C); magic.push(...rollMany(roll(4), MAGIC_D)); }
      else if (r <= 22)  { gems = rollGems(3, GEMS_1000GP); magic = rollMany(roll(4), MAGIC_D); magic.push(...rollMany(roll(4), MAGIC_E)); }
      else if (r <= 30)  { art = rollArt(2, ART_2500GP); magic = rollMany(roll(4), MAGIC_D); magic.push(...rollMany(roll(4), MAGIC_E)); }
      else if (r <= 38)  { art = rollArt(2, ART_7500GP); magic = rollMany(roll(4), MAGIC_D); magic.push(...rollMany(roll(4), MAGIC_E)); }
      else if (r <= 46)  { gems = rollGems(3, GEMS_5000GP); magic = rollMany(roll(4), MAGIC_D); magic.push(...rollMany(roll(4), MAGIC_E)); }
      else if (r <= 52)  { art = rollArt(2, ART_2500GP); magic = rollMany(roll(4), MAGIC_F); magic.push(...rollMany(roll(4), MAGIC_G)); magic.push(...rollMany(roll(4), MAGIC_H)); }
      else if (r <= 54)  { gems = rollGems(3, GEMS_1000GP); magic = rollMany(1, MAGIC_H); magic.push(...rollMany(1, MAGIC_I)); }
      else if (r <= 58)  { art = rollArt(2, ART_2500GP); magic = rollMany(1, MAGIC_I); }
      else if (r <= 62)  { art = rollArt(2, ART_7500GP); magic = rollMany(1, MAGIC_I); }
      else if (r <= 66)  { gems = rollGems(3, GEMS_5000GP); magic = rollMany(1, MAGIC_I); }
      else               { gems = rollGems(3, GEMS_5000GP); magic = rollMany(1, MAGIC_I); magic.push(...rollMany(1, MAGIC_H)); }
    }

    return { coins, gems, art, magic };
  }

  function rollGems(n, table) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(pick(table));
    return out;
  }

  function GEMS_25GP_ART(artTable) { return artTable; } // reuse art table as gem stand-in for 25gp

  function rollArt(n, table) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(pick(table));
    return out;
  }

  function rollMany(n, table) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(pick(table));
    return out;
  }

  return { generateHoard };
})();

// ── UI ─────────────────────────────────────────────────────
function renderLoot(result) {
  const el = document.getElementById('loot-result');
  const { coins, gems, art, magic } = result;

  const coinParts = [];
  if (coins.cp) coinParts.push(`${coins.cp.toLocaleString()} cp`);
  if (coins.sp) coinParts.push(`${coins.sp.toLocaleString()} sp`);
  if (coins.ep) coinParts.push(`${coins.ep.toLocaleString()} ep`);
  if (coins.gp) coinParts.push(`${coins.gp.toLocaleString()} gp`);
  if (coins.pp) coinParts.push(`${coins.pp.toLocaleString()} pp`);

  const sections = [];

  if (coinParts.length) {
    sections.push(`<div class="loot-section">
      <div class="loot-section-head">Coin</div>
      <div class="loot-items">${coinParts.map(c => `<div class="loot-item coin-item">${c}</div>`).join('')}</div>
    </div>`);
  }

  if (gems.length) {
    sections.push(`<div class="loot-section">
      <div class="loot-section-head">Gems</div>
      <div class="loot-items">${gems.map(g => `<div class="loot-item">${escHtml(g)}</div>`).join('')}</div>
    </div>`);
  }

  if (art.length) {
    sections.push(`<div class="loot-section">
      <div class="loot-section-head">Art Objects</div>
      <div class="loot-items">${art.map(a => `<div class="loot-item">${escHtml(a)}</div>`).join('')}</div>
    </div>`);
  }

  if (magic.length) {
    sections.push(`<div class="loot-section">
      <div class="loot-section-head">Magic Items</div>
      <div class="loot-items">${magic.map(m => `<div class="loot-item magic-item">${escHtml(m)}</div>`).join('')}</div>
    </div>`);
  }

  if (!sections.length) {
    sections.push(`<div class="loot-empty">No notable treasures — just some scattered copper.</div>`);
  }

  el.innerHTML = sections.join('');
  // Store for clipboard
  el.dataset.text = buildLootText(coins, gems, art, magic);
}

function buildLootText(coins, gems, art, magic) {
  const lines = ['=== LOOT HOARD ==='];
  if (coins.cp) lines.push(`${coins.cp.toLocaleString()} cp`);
  if (coins.sp) lines.push(`${coins.sp.toLocaleString()} sp`);
  if (coins.ep) lines.push(`${coins.ep.toLocaleString()} ep`);
  if (coins.gp) lines.push(`${coins.gp.toLocaleString()} gp`);
  if (coins.pp) lines.push(`${coins.pp.toLocaleString()} pp`);
  if (gems.length) { lines.push(''); lines.push('Gems:'); gems.forEach(g => lines.push(`  - ${g}`)); }
  if (art.length)  { lines.push(''); lines.push('Art:');  art.forEach(a => lines.push(`  - ${a}`)); }
  if (magic.length){ lines.push(''); lines.push('Magic:'); magic.forEach(m => lines.push(`  - ${m}`)); }
  return lines.join('\n');
}

function setupLootUI() {
  const crSelect = document.getElementById('loot-cr');
  // Generate initial loot
  const initialCR = crSelect ? crSelect.value : '0-4';
  renderLoot(Loot.generateHoard(initialCR));

  document.getElementById('gen-loot-btn').addEventListener('click', () => {
    const cr = document.getElementById('loot-cr').value;
    renderLoot(Loot.generateHoard(cr));
  });

  document.getElementById('copy-loot-btn').addEventListener('click', () => {
    const text = document.getElementById('loot-result').dataset.text || '';
    if (!text) { showToast('Generate loot first.'); return; }
    navigator.clipboard.writeText(text).then(() => {
      showToast('Loot copied to clipboard.');
    }).catch(() => {
      // Fallback: select text
      showToast('Copy failed — long-press the loot to copy manually.');
    });
  });
}
