// Tiny stand-in for the browser's localStorage, so tests run in Node.
function fakeStorage(init) {
  const m = new Map(Object.entries(init || {}));
  return {
    get length() { return m.size; },
    key(i) { return [...m.keys()][i] ?? null; },
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); },
    removeItem(k) { m.delete(k); },
    dump() { return Object.fromEntries(m); }
  };
}
module.exports = { fakeStorage };
