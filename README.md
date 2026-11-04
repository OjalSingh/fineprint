# Fine Print

A free, open-source browser extension that watches the privacy policies of the sites you use and tells you, in plain words, what changed and what you can do about it. Works for any site with a privacy policy, not just the big ones.

## How it works
1. **Pick services.** Tick popular ones, or press "Watch the site I'm on" and Fine Print finds that site's privacy policy link.
2. **A daily GitHub Action** (`scripts/watch.mjs`) fetches the registry policies, diffs them against the last snapshot, and writes meaningful changes to `feed/feed.json`. Cosmetic edits (dates, case, punctuation) are ignored.
3. **The extension downloads the whole public feed** and shows only the services you watch, so nobody learns which ones you chose. Sites you add yourself are fetched from your own browser and never reported.
4. **Each change becomes a card** with the quoted new wording, an impact level, links to the relevant settings, and Done / Snooze. The badge shows what is still open.

The detector is rule-based (`extension/core/classify.js`): it flags topics such as AI training, data sharing, tracking and arbitration. It is not a lawyer, so read the quoted text.

## Costs: zero
Static feed on GitHub, a scheduled Action (free on public repos), no servers, no paid APIs, no accounts. The only possible spend is the one-time $5 Chrome Web Store developer fee.

## Develop
```
npm test                 # unit tests
node scripts/watch.mjs   # fetch policies and update the feed
```
Load `extension/` as an unpacked extension in `chrome://extensions`. `registry/services.json` is the source of truth: copy it to `extension/services.json` after editing.
Before publishing, set `FEED_URL` and `DONATE_URL` in `extension/config.js`.

## Status (v0.1)
Registry links and settings deep links are from memory and marked `verified: false`; please check and fix them. Not built yet: settings audit, rights-request emails, Firefox, weekly digest, Chit-Chat group action card.

MIT licensed. Donations are optional and never unlock anything.
