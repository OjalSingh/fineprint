// Automatic scan for sites without a hand-written check-up. Keywords cannot truly understand a policy,
// so results are labelled auto-detected and negated sentences ("we do not sell...") are shown separately.
import { splitSentences } from './diff.js';
import { RULES } from './classify.js';

const NEGATION = /\b(do not|does not|don't|doesn't|never|will not|won't|not sell|no longer|cannot|can't)\b/i;

export function scanPolicy(text) {
  const sentences = splitSentences(text);
  const out = [];
  for (const rule of RULES) {
    if (rule.id === 'deletion') continue;
    const hits = sentences.filter((s) => rule.re.test(s));
    const positive = hits.find((s) => !NEGATION.test(s));
    const negative = hits.find((s) => NEGATION.test(s));
    if (positive) out.push({ id: rule.id, label: rule.label, sentence: positive.slice(0, 320), negated: false });
    else if (negative) out.push({ id: rule.id, label: rule.label, sentence: negative.slice(0, 320), negated: true });
  }
  return out;
}
