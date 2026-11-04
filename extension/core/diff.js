// Sentence-level diff that ignores cosmetic edits (case, punctuation, dates, "last updated" lines).
const DATE = /\b(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)\.? \d{1,2},? \d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/gi;

export function splitSentences(text) {
  return text
    .split('\n')
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/))
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

export function normalize(s) {
  return s.toLowerCase().replace(DATE, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const META_LINE = /^(last (updated|modified|revised)|effective( date)?|updated)\b/;

export function diffSentences(oldText, newText) {
  const oldS = splitSentences(oldText), newS = splitSentences(newText);
  const oldN = new Set(oldS.map(normalize)), newN = new Set(newS.map(normalize));
  const keep = (s) => { const n = normalize(s); return n.length > 20 && !META_LINE.test(n); };
  return {
    added: newS.filter((s) => !oldN.has(normalize(s)) && keep(s)),
    removed: oldS.filter((s) => !newN.has(normalize(s)) && keep(s)),
  };
}
