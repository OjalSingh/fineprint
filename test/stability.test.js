import test from 'node:test';
import assert from 'node:assert/strict';
import { settle } from '../extension/core/stability.js';

test('a page flip-flopping against the baseline is never accepted', () => {
  let entry = null;
  for (const h of ['B', 'A', 'B', 'A']) {
    const r = settle(entry, 'A', h);
    assert.equal(r.accept, false);
    entry = r.entry;
  }
});

test('the same new version seen twice in a row is accepted', () => {
  const r1 = settle(null, 'A', 'B');
  assert.equal(r1.accept, false);
  assert.deepEqual(r1.entry, { hash: 'B', count: 1 });
  const r2 = settle(r1.entry, 'A', 'B');
  assert.equal(r2.accept, true);
  assert.equal(r2.entry, null);
});

test('a different new version restarts the count', () => {
  const r = settle({ hash: 'B', count: 1 }, 'A', 'C');
  assert.equal(r.accept, false);
  assert.deepEqual(r.entry, { hash: 'C', count: 1 });
});
