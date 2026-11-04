// Run by GitHub Actions on a schedule (free for public repos). Fetches each policy, diffs it against the
// last snapshot, and appends meaningful changes to feed/feed.json. Zero dependencies, zero paid APIs.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { htmlToText, sha256 } from '../extension/core/text.js';
import { buildChange } from '../extension/core/process.js';

const registry = JSON.parse(await readFile('registry/services.json', 'utf8'));
let feed = { updatedAt: null, changes: [] };
try { feed = JSON.parse(await readFile('feed/feed.json', 'utf8')); } catch {}
await mkdir('snapshots', { recursive: true });
const now = new Date().toISOString();
const failures = [];

for (const s of registry.services) {
  try {
    const res = await fetch(s.policyUrl, { headers: { 'user-agent': 'FinePrintBot/0.1 (open-source privacy policy tracker)' }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = htmlToText(await res.text());
    if (text.length < 2000) throw new Error('page looks empty or JS-rendered');
    const hash = await sha256(text);
    let old = '';
    try { old = await readFile(`snapshots/${s.id}.txt`, 'utf8'); } catch {}
    if (old && (await sha256(old)) !== hash) {
      const change = buildChange({ service: s.id, url: s.policyUrl, oldText: old, newText: text, hash, now });
      if (change) feed.changes.unshift({ ...change, actions: s.actions });
    }
    await writeFile(`snapshots/${s.id}.txt`, text);
  } catch (e) {
    failures.push(`${s.id}: ${e.message}`);
  }
}
feed.changes = feed.changes.slice(0, 300);
feed.updatedAt = now;
await writeFile('feed/feed.json', JSON.stringify(feed, null, 1));
if (failures.length) console.warn('Could not fetch:\n' + failures.join('\n'));
