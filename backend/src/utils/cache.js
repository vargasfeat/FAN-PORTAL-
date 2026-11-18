/**
 * Cache en memoria con tiempo de vida (TTL).
 * Protege el limite del plan gratuito de TheSportsDB (30 peticiones por minuto):
 * si un dato ya se consulto hace poco, se responde desde memoria.
 */
const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function clear() {
  store.clear();
}

module.exports = { get, set, clear };
