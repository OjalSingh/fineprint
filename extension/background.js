import { FEED_URL, CHECK_EVERY_MINUTES, LOCAL_WATCH_EVERY_MINUTES } from './config.js';
import { htmlToText, sha256 } from './core/text.js';
import { buildChange } from './core/process.js';

const SNOOZE_MS = 3 * 24 * 3600 * 1000;

async function getState() {
  const sync = await chrome.storage.sync.get({ watched: [], custom: [], done: [], snoozed: {} });
  const local = await chrome.storage.local.get({ items: [], snapshots: {} });
  return { ...sync, ...local };
}

export async function refreshBadge() {
  const { items, done, snoozed } = await getState();
  const now = Date.now();
  const open = items.filter((i) => !done.includes(i.id) && (snoozed[i.id] ?? 0) < now);
  await chrome.action.setBadgeText({ text: open.length ? String(open.length) : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#b3261e' });
}

async function checkFeed() {
  const { watched, items } = await getState();
  if (!watched.length || FEED_URL.includes('OWNER/REPO')) return;
  try {
    const feed = await (await fetch(FEED_URL, { cache: 'no-cache' })).json(); // same file for everyone, we never tell the server what you watch
    const seen = new Set(items.map((i) => i.id));
    const fresh = feed.changes.filter((c) => watched.includes(c.service) && !seen.has(c.id));
    if (fresh.length) await chrome.storage.local.set({ items: [...fresh, ...items].slice(0, 300) });
  } catch (e) { console.warn('feed check failed', e); }
}

// Custom sites are fetched from your own browser and never reported anywhere.
async function checkCustom() {
  const { custom, snapshots, items } = await getState();
  const next = { ...snapshots };
  const fresh = [];
  for (const site of custom) {
    try {
      const res = await fetch(site.url, { redirect: 'follow' });
      if (!res.ok) continue;
      const text = htmlToText(await res.text());
      if (text.length < 2000) continue;
      const hash = await sha256(text);
      const prev = snapshots[site.url];
      if (prev && prev.hash !== hash) {
        const c = buildChange({ service: site.name, url: site.url, oldText: prev.text, newText: text, hash, now: new Date().toISOString() });
        if (c) fresh.push({ ...c, actions: [] });
      }
      next[site.url] = { hash, text };
    } catch (e) { console.warn('custom check failed', site.url, e); }
  }
  await chrome.storage.local.set({ snapshots: next, items: [...fresh, ...items].slice(0, 300) });
}

async function setupAlarms() {
  await chrome.alarms.create('feed', { periodInMinutes: CHECK_EVERY_MINUTES });
  await chrome.alarms.create('custom', { periodInMinutes: LOCAL_WATCH_EVERY_MINUTES });
}

chrome.runtime.onInstalled.addListener(async () => { await setupAlarms(); await checkFeed(); await refreshBadge(); });
chrome.runtime.onStartup.addListener(async () => { await setupAlarms(); await refreshBadge(); });
chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name === 'feed') await checkFeed();
  if (a.name === 'custom') await checkCustom();
  await refreshBadge();
});
chrome.storage.onChanged.addListener(() => refreshBadge());
chrome.runtime.onMessage.addListener((msg, _s, reply) => {
  if (msg === 'check-now') Promise.all([checkFeed(), checkCustom()]).then(refreshBadge).then(() => reply(true));
  return true;
});
export { SNOOZE_MS };
