import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlToText } from '../extension/core/text.js';
import { diffSentences } from '../extension/core/diff.js';
import { classify } from '../extension/core/classify.js';
import { buildChange } from '../extension/core/process.js';

const base = 'We collect your name and email address to run the service. We keep logs for security reasons only.';

test('htmlToText strips scripts, tags and entities', () => {
  const t = htmlToText('<html><script>x=1</script><body><p>Hello &amp; welcome</p><nav>menu</nav><p>Second line</p></body></html>');
  assert.equal(t, 'Hello & welcome\nSecond line');
});

test('cosmetic edits (dates, case, punctuation) are ignored', () => {
  const a = 'Last updated: March 3, 2025\n' + base;
  const b = 'Last updated: November 1, 2026\n' + base.toUpperCase();
  const d = diffSentences(a, b);
  assert.equal(d.added.length, 0);
  assert.equal(d.removed.length, 0);
});

test('added AI-training sentence is flagged high impact', () => {
  const b = base + ' We may use your public posts to train our generative AI models.';
  const d = diffSentences(base, b);
  assert.equal(d.added.length, 1);
  const c = classify(d.added, d.removed);
  assert.equal(c.impact, 'high');
  assert.ok(c.categories.includes('ai_training'));
});

test('sharing with partners is high, cookies are medium, boilerplate is low', () => {
  assert.equal(classify(['We may share your information with advertising partners and affiliates.']).impact, 'high');
  assert.equal(classify(['We use cookies to remember your preferences on this site.']).impact, 'medium');
  assert.equal(classify(['Our office address has moved to a new building downtown.']).impact, 'low');
});

test('buildChange returns null for no meaningful change', () => {
  assert.equal(buildChange({ service: 's', url: 'u', oldText: base, newText: base, hash: 'a'.repeat(64), now: 'n' }), null);
});

test('buildChange returns an entry with evidence', () => {
  const c = buildChange({ service: 'meta', url: 'u', oldText: base, newText: base + ' We may sell your data to third parties for profit.', hash: 'b'.repeat(64), now: 'n' });
  assert.equal(c.id, 'meta-bbbbbbbbbbbb');
  assert.equal(c.impact, 'high');
  assert.equal(c.evidence.length, 1);
});

import { scanPolicy } from '../extension/core/scan.js';

test('scan separates "we do not sell" from "we share with partners"', () => {
  const text = 'We do not sell your personal information to anyone for money.\nWe may share your information with advertising partners and affiliates.';
  const r = scanPolicy(text);
  const sharing = r.find((x) => x.id === 'data_sharing');
  assert.equal(sharing.negated, false);
  assert.match(sharing.sentence, /advertising partners/);
  assert.equal(scanPolicy('We do not sell your personal information to anyone for money.').find((x) => x.id === 'data_sharing').negated, true);
});
