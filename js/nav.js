/**
 * Navigation map. The bottom bar has 5 buttons; the extra tools live
 * under "More" so the bar isn't crowded on a phone.
 */
const NAV = {
  START: 'notes',
  BAR: ['notes', 'initiative', 'encounter', 'characters', 'more'],
  UNDER_MORE: ['npc', 'loot', 'spells', 'backup'],
  // Old saved tab names that no longer exist map to the closest one
  ALIASES: { monsters: 'encounter', heroes: 'characters', notebook: 'notes', fight: 'initiative' }
};

// Which tab to really open for a requested name
function navResolve(tab) {
  const t = NAV.ALIASES[tab] || tab;
  if (NAV.BAR.indexOf(t) >= 0 || NAV.UNDER_MORE.indexOf(t) >= 0) return t;
  return NAV.START;
}

// Which bottom-bar button lights up for a tab
function navButtonFor(tab) {
  const t = navResolve(tab);
  return NAV.UNDER_MORE.indexOf(t) >= 0 ? 'more' : t;
}

if (typeof module !== 'undefined') module.exports = { NAV, navResolve, navButtonFor };
