// Check-up cards are hand-written, and each one quotes the policy. A card is only shown as verified while
// every quote still appears word for word in the latest snapshot, so a stale card can never pass as current.
export function normalizeForQuote(s) {
  return String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}

export function verifyItem(item, policyText) {
  const hay = normalizeForQuote(policyText);
  const missing = item.quotes.filter((q) => !hay.includes(normalizeForQuote(q)));
  return { ...item, verified: missing.length === 0, missingQuotes: missing };
}

export function buildCheckups(checkups, readText) {
  const services = {};
  for (const [id, entry] of Object.entries(checkups.services)) {
    const text = readText(id);
    services[id] = { items: entry.items.map((it) => (text == null ? { ...it, verified: false, missingQuotes: it.quotes } : verifyItem(it, text))) };
  }
  return services;
}
