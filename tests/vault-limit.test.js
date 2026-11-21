// Loads the real vault.js in a sandbox and checks the free-notebook cap.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { fakeStorage } = require('./helpers.js');

function loadVault(pro) {
  const toasts = [];
  const ctx = { localStorage: fakeStorage(), isProUnlocked: () => pro, showToast: m => toasts.push(m),
                Quests: { key: p => 'dmforge_q1_' + p, keyFor: (i, p) => 'dmforge_q1_' + p, isLegacy: () => false }, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/vault.js'), 'utf8') + ';this.Vault=Vault;', ctx);
  ctx.Vault.load();
  return { Vault: ctx.Vault, toasts };
}

test('free notebook stops at the cap with a clear message', () => {
  const { Vault, toasts } = loadVault(false);
  for (let i = 0; i < Vault.FREE_LIMIT; i++) assert.ok(Vault.add('npc', 'Person ' + i));
  assert.strictEqual(Vault.add('npc', 'One too many'), null);
  assert.strictEqual(Vault.getAll().length, Vault.FREE_LIMIT);
  assert.match(toasts.pop(), /Unlock Pro/);
});

test('Pro has no cap', () => {
  const { Vault } = loadVault(true);
  for (let i = 0; i < Vault.FREE_LIMIT + 5; i++) assert.ok(Vault.add('place', 'Town ' + i));
  assert.strictEqual(Vault.getAll().length, Vault.FREE_LIMIT + 5);
});
