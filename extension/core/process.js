import { diffSentences } from './diff.js';
import { classify } from './classify.js';

// Pure function: previous text + new text -> a change entry, or null if nothing meaningful changed.
export function buildChange({ service, url, oldText, newText, hash, now }) {
  const { added, removed } = diffSentences(oldText, newText);
  if (!added.length && !removed.length) return null;
  const c = classify(added, removed);
  return {
    id: `${service}-${hash.slice(0, 12)}`,
    service,
    url,
    detectedAt: now,
    impact: c.impact,
    categories: c.categories,
    summary: c.summary,
    evidence: c.evidence,
    added: added.slice(0, 20).map((s) => s.slice(0, 400)),
    removed: removed.slice(0, 20).map((s) => s.slice(0, 400)),
    autoDetected: true,
  };
}
