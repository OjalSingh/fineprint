import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyItem, buildCheckups } from '../extension/core/checkup.js';

const item = { id: 'x', quotes: ["We don't sell any of your information."] };

test('curly apostrophes and spacing do not break verification', () => {
  assert.equal(verifyItem(item, 'Intro.\nWe don’t  sell any of your information. More.').verified, true);
});

test('a missing quote marks the card unverified and says which', () => {
  const r = verifyItem(item, 'Now we do sell some information.');
  assert.equal(r.verified, false);
  assert.deepEqual(r.missingQuotes, item.quotes);
});

test('no snapshot means unverified', () => {
  const out = buildCheckups({ services: { s: { items: [item] } } }, () => null);
  assert.equal(out.s.items[0].verified, false);
});

test('every quote in registry/checkups.json exists in the committed snapshots', async () => {
  const reg = JSON.parse(await readFile('registry/checkups.json', 'utf8'));
  let snaps = {};
  for (const id of Object.keys(reg.services)) { try { snaps[id] = await readFile(`snapshots/${id}.txt`, 'utf8'); } catch { snaps[id] = null; } }
  const out = buildCheckups(reg, (id) => snaps[id]);
  for (const [id, svc] of Object.entries(out)) for (const it of svc.items) assert.equal(it.verified, true, `${id}/${it.id} missing: ${it.missingQuotes}`);
});
