import { DONATE_URL, CHECKUPS_URL } from './config.js';
import { scanPolicy } from './core/scan.js';

const $ = (id) => document.getElementById(id);
const SNOOZE_MS = 3 * 24 * 3600 * 1000;
let registry = [];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const name = (id) => registry.find((s) => s.id === id)?.name ?? id;

async function state() {
  const sync = await chrome.storage.sync.get({ watched: [], custom: [], done: [], snoozed: {} });
  const local = await chrome.storage.local.get({ items: [] });
  return { ...sync, ...local };
}

async function renderInbox() {
  const { items, done, snoozed } = await state();
  const now = Date.now();
  const open = items.filter((i) => !done.includes(i.id) && (snoozed[i.id] ?? 0) < now);
  if (!open.length) { $('inbox').innerHTML = '<p class="muted">Nothing needs your attention. Add services in the Services tab and changes will show up here.</p>'; return; }
  $('inbox').innerHTML = open.map((i) => `
    <div class="card" data-id="${esc(i.id)}">
      <h4>${esc(name(i.service))}<span class="tag ${esc(i.impact)}">${esc(i.impact)} impact</span></h4>
      <div>${esc(i.summary)}</div>
      ${(i.evidence ?? []).map((e) => `<blockquote>${esc(e)}</blockquote>`).join('')}
      <div class="row">
        ${(i.actions ?? []).map((a) => `<a target="_blank" rel="noreferrer" href="${esc(a.url)}">${esc(a.label)}${a.verified ? '' : ' (unverified)'}</a>`).join(' · ')}
        <a target="_blank" rel="noreferrer" href="${esc(i.url)}">Read the policy</a>
      </div>
      <div class="row"><button data-act="done">Done</button><button data-act="snooze">Snooze 3 days</button></div>
    </div>`).join('');
}

async function renderServices() {
  const { watched, custom } = await state();
  $('registry').innerHTML = registry.map((s) => `<label><input type="checkbox" data-svc="${esc(s.id)}" ${watched.includes(s.id) ? 'checked' : ''}> ${esc(s.name)}</label>`).join('');
  $('custom').innerHTML = custom.length ? custom.map((c) => `<label>${esc(c.name)} <button data-rm="${esc(c.url)}">remove</button></label>`).join('') : '<p class="muted">None yet.</p>';
}

// Finds the privacy policy link on the current page (needs only the click on this button).
async function watchThisSite() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = new URL(tab.url).hostname.replace(/^www\./, '');
  const known = registry.find((s) => s.domains.some((d) => host === d || host.endsWith('.' + d)));
  const { watched, custom } = await state();
  if (known) {
    if (!watched.includes(known.id)) await chrome.storage.sync.set({ watched: [...watched, known.id] });
    $('watch-msg').textContent = `Now watching ${known.name}.`; return renderServices();
  }
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
    const a = [...document.querySelectorAll('a[href]')].find((x) => /privacy/i.test(x.textContent + ' ' + x.getAttribute('href')));
    return a ? a.href : null; } });
  if (!result) { $('watch-msg').textContent = "Couldn't find a privacy policy link on this page."; return; }
  const origin = new URL(result).origin + '/*';
  if (!(await chrome.permissions.request({ origins: [origin] }))) { $('watch-msg').textContent = 'Permission declined, nothing was added.'; return; }
  if (!custom.some((c) => c.url === result)) await chrome.storage.sync.set({ custom: [...custom, { name: host, url: result }] }); chrome.runtime.sendMessage('check-now');
  $('watch-msg').textContent = `Now watching ${host} (checked from your browser about once a day).`; renderServices();
}

document.addEventListener('click', async (e) => {
  const t = e.target;
  if (t.dataset.tab) { document.querySelectorAll('section').forEach((s) => (s.hidden = s.id !== t.dataset.tab)); document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b === t)); }
  const card = t.closest?.('.card');
  if (card && t.dataset.act) {
    const id = card.dataset.id; const s = await state();
    if (t.dataset.act === 'done') await chrome.storage.sync.set({ done: [...s.done, id] });
    else await chrome.storage.sync.set({ snoozed: { ...s.snoozed, [id]: Date.now() + SNOOZE_MS } });
    renderInbox();
  }
  if (t.dataset.rm) { const s = await state(); await chrome.storage.sync.set({ custom: s.custom.filter((c) => c.url !== t.dataset.rm) }); renderServices(); }
});
document.addEventListener('change', async (e) => {
  if (!e.target.dataset.svc) return;
  const s = await state(); const id = e.target.dataset.svc;
  await chrome.storage.sync.set({ watched: e.target.checked ? [...new Set([...s.watched, id])] : s.watched.filter((w) => w !== id) });
});
$('watch-this').onclick = watchThisSite;
$('check-now').onclick = async () => { $('check-now').textContent = 'Checking…'; await chrome.runtime.sendMessage('check-now'); $('check-now').textContent = 'Done'; renderInbox(); };
$('donate').href = DONATE_URL;

registry = (await (await fetch(chrome.runtime.getURL('services.json'))).json()).services;
await Promise.all([renderInbox(), renderServices()]);

// Lets you see what a change card looks like without waiting for a real policy change.
$('sample').onclick = async () => {
  const { items } = await chrome.storage.local.get({ items: [] });
  const now = new Date().toISOString();
  await chrome.storage.local.set({ items: [{
    id: `sample-${Date.now()}`, service: 'google', url: 'https://policies.google.com/privacy', detectedAt: now, impact: 'high',
    categories: ['ai_training'], autoDetected: true,
    summary: 'SAMPLE: New wording touches: AI training. 1 sentence(s) added, 0 removed.',
    evidence: ['We may use your public content to train our generative AI models.'],
    actions: [{ label: 'Review ad personalization', url: 'https://myadcenter.google.com', verified: false }],
  }, ...items] });
  renderInbox();
};

const LABEL = { happening: 'Happening', not_happening: 'Not happening', unclear: 'Unclear' };

async function loadCheckups() {
  try {
    const data = await (await fetch(CHECKUPS_URL, { cache: 'no-cache' })).json();
    await chrome.storage.local.set({ checkups: data });
    return data;
  } catch { return (await chrome.storage.local.get({ checkups: null })).checkups; }
}

async function renderCheckup() {
  const { watched, custom } = await state();
  const data = await loadCheckups();
  const { snapshots } = await chrome.storage.local.get({ snapshots: {} });
  let html = '';
  for (const id of watched) {
    const items = data?.services?.[id]?.items;
    if (!items) continue;
    html += `<h3>${esc(name(id))}</h3>` + items.map((it) => `
      <div class="card"><h4>${esc(it.topic)}<span class="st ${esc(it.status)}">${LABEL[it.status] ?? ''}</span></h4>
        <div>${esc(it.summary)}</div>
        ${it.verified ? it.quotes.map((q) => `<blockquote>${esc(q)}</blockquote>`).join('') : '<div class="muted">Being re-checked against the latest policy, so the quote is hidden for now.</div>'}
        ${it.action ? `<details><summary>${esc(it.action.label)}</summary><ol class="steps">${it.action.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><div class="row"><a target="_blank" rel="noreferrer" href="${esc(it.action.url)}">Open page${it.action.verified ? '' : ' (link unverified)'}</a></div></details>` : ''}
      </div>`).join('');
  }
  for (const site of custom) {
    const snap = snapshots[site.url];
    html += `<h3>${esc(site.name)}</h3><div class="auto">Auto-detected by keywords. Read the quote, it may be wrong.</div>`;
    if (!snap) { html += '<p class="muted">Not read yet. Press Check now on the About tab.</p>'; continue; }
    const found = scanPolicy(snap.text);
    html += found.length ? found.map((f) => `<div class="card"><h4>${esc(f.label)}<span class="st unclear">${f.negated ? 'Policy says it does NOT' : 'Mentioned'}</span></h4><blockquote>${esc(f.sentence)}</blockquote></div>`).join('') : '<p class="muted">No sensitive topics detected.</p>';
  }
  $('checkup').innerHTML = html || '<p class="muted">Tick services in the Services tab to see what they do with your data today.</p>';
}
renderCheckup();
document.addEventListener('change', () => setTimeout(renderCheckup, 150));
