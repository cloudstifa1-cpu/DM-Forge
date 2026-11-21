const test = require('node:test');
const assert = require('node:assert');
const Backup = require('../js/backup.js');
const { fakeStorage } = require('./helpers.js');

test('backup copies every DM Forge item and nothing else', () => {
  const s = fakeStorage({ dmforge_quests: '{"a":1}', dmforge_q1_notes: 'hi', other_app: 'x', dmforge_tab: 'notes', dmforge_launched: '1' });
  const snap = Backup.collect(s, '2026-11-21T00:00:00Z');
  assert.deepStrictEqual(Object.keys(snap.data), ['dmforge_q1_notes', 'dmforge_quests']);
  assert.strictEqual(snap.app, 'DM Forge');
  assert.strictEqual(snap.savedAt, '2026-11-21T00:00:00Z');
});

test('restore brings the backup back exactly and wipes newer leftovers', () => {
  const src = fakeStorage({ dmforge_quests: 'Q', dmforge_characters: 'C' });
  const snap = JSON.parse(JSON.stringify(Backup.collect(src)));
  const dest = fakeStorage({ dmforge_q9_notes: 'stale', other_app: 'keep me' });
  const n = Backup.restore(dest, snap);
  assert.strictEqual(n, 2);
  assert.deepStrictEqual(dest.dump(), { other_app: 'keep me', dmforge_quests: 'Q', dmforge_characters: 'C' });
});

test('bad files are refused and nothing is touched', () => {
  const dest = fakeStorage({ dmforge_quests: 'mine' });
  for (const bad of [null, 'text', {}, { app: 'Other', data: {} }, { app: 'DM Forge', data: {} },
                     { app: 'DM Forge', data: { evil_key: 'x' } }, { app: 'DM Forge', data: { dmforge_x: 5 } }]) {
    assert.ok(Backup.validate(bad), 'should refuse ' + JSON.stringify(bad));
    assert.throws(() => Backup.restore(dest, bad));
  }
  assert.strictEqual(dest.getItem('dmforge_quests'), 'mine');
});

test('weekly reminder shows only when there is data and no backup in 7 days', () => {
  const now = Date.parse('2026-11-21T00:00:00Z');
  assert.strictEqual(Backup.needsReminder(fakeStorage(), now), false);
  assert.strictEqual(Backup.needsReminder(fakeStorage({ dmforge_quests: 'Q' }), now), true);
  // brand-new user: no nag until they've used it a week
  assert.strictEqual(Backup.needsReminder(fakeStorage({ dmforge_quests: 'Q', dmforge_first_use: '2026-11-20T00:00:00Z' }), now), false);
  assert.strictEqual(Backup.needsReminder(fakeStorage({ dmforge_quests: 'Q', dmforge_first_use: '2026-11-01T00:00:00Z' }), now), true);
  assert.strictEqual(Backup.needsReminder(fakeStorage({ dmforge_quests: 'Q', dmforge_last_backup: '2026-11-18T00:00:00Z' }), now), false);
  assert.strictEqual(Backup.needsReminder(fakeStorage({ dmforge_quests: 'Q', dmforge_last_backup: '2026-11-10T00:00:00Z' }), now), true);
});

test('the last-backup date itself is not copied to other devices', () => {
  const s = fakeStorage({ dmforge_quests: 'Q', dmforge_last_backup: '2026-11-01' });
  assert.ok(!('dmforge_last_backup' in Backup.collect(s).data));
});

test('backup file name carries the date', () => {
  assert.strictEqual(Backup.fileName('2026-11-21T10:00:00Z'), 'dm-forge-backup-2026-11-21.json');
});
