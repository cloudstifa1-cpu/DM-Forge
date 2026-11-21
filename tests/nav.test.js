const test = require('node:test');
const assert = require('node:assert');
const { NAV, navResolve, navButtonFor } = require('../js/nav.js');

test('the app opens on the notebook by default', () => {
  assert.strictEqual(NAV.START, 'notes');
  assert.strictEqual(navResolve(undefined), 'notes');
  assert.strictEqual(navResolve('nonsense'), 'notes');
});

test('bottom bar has 5 buttons with the notebook first', () => {
  assert.strictEqual(NAV.BAR.length, 5);
  assert.strictEqual(NAV.BAR[0], 'notes');
});

test('every old tool is still reachable (nothing removed)', () => {
  for (const t of ['initiative', 'encounter', 'characters', 'npc', 'loot', 'notes', 'spells'])
    assert.strictEqual(navResolve(t), t);
});

test('tools under More light up the More button', () => {
  for (const t of ['npc', 'loot', 'spells', 'backup']) assert.strictEqual(navButtonFor(t), 'more');
  assert.strictEqual(navButtonFor('initiative'), 'initiative');
});
