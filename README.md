# Fine Print

**Privacy policies change constantly and nobody can keep up. Fine Print does it for you.**

A free, open-source browser extension that watches the privacy policies of the sites you use, flags what changed in plain words (AI training, data sharing, tracking, arbitration...), quotes the new wording, and links you to the settings where you can do something about it. It works for any site with a privacy policy, not only Meta and Google.

> Status: v0.1, early. The detector is rule-based and the registry links are community-checkable, so treat every card as a pointer to the original text, not as legal advice.

## Run it once (about 2 minutes)

1. Clone or download this repo (`Code` -> `Download ZIP`, then unzip).
2. Open `chrome://extensions` in Chrome, Edge or Brave.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the `extension/` folder.
5. Click the Fine Print icon (pin it from the puzzle-piece menu).
6. **Services** tab: tick a few services, or open any site and press **Watch the site I'm on**.
7. **About** tab: press **Add a sample change** to see exactly what a change card looks like. The red badge on the icon counts open cards.
8. Press **Check now** to pull the latest public feed. Real cards appear only when a watched policy actually changes, so a quiet feed is normal.

To run the checks yourself: `npm test` (unit tests) and `node scripts/watch.mjs` (fetches policies and updates `feed/feed.json`, needs Node 20+).

## How it works

```
GitHub Action (daily) -> fetch policy -> strip to text -> diff vs last snapshot
        -> classify topics -> feed/feed.json (public, same file for everyone)
Extension -> downloads the whole feed -> shows only the services YOU watch
```

- **Diff:** sentence-level, ignoring dates, capitalization and punctuation, so cosmetic edits don't raise alarms.
- **Classifier:** transparent keyword rules in [`extension/core/classify.js`](extension/core/classify.js) for AI training, data sharing/sale, biometrics, arbitration, ads/tracking, retention, location and deletion. Impact is high, medium or low by topic.
- **Cards:** quoted new wording, impact, links to settings and the policy, Done and Snooze (3 days).
- **Your own sites:** policies you add are fetched from your browser about once a day. Chrome asks for access to that one site only.

## Privacy

- No account, no analytics, no tracking, no server of ours.
- The feed is a single public file. Your browser downloads all of it and filters locally, so nobody learns which services you watch.
- Sites you add yourself are never reported anywhere.
- Done and Snooze state is stored in your browser (`chrome.storage`).

## Cost: zero

A static file on GitHub, a free scheduled GitHub Action, no paid APIs. The only possible spend is Chrome's one-time $5 developer fee if you publish to the Web Store.

## Known limits

- Meta, Reddit and Amazon policy pages were not captured in the first run (blocked or built with JavaScript), so they are not tracked yet. Fixing this is the top item.
- Registry policy and settings links were written from memory and are marked `verified: false`. Please check and fix them.
- A keyword detector misses subtle rewording and can over-flag. Always read the quoted text.
- Chrome-family browsers only for now.

## Roadmap

Fix the three uncaptured services, verify links, settings audit, pre-filled GDPR/CCPA request emails, weekly digest, Firefox, optional AI summaries, and a group-action card in Chit-Chat.

## Contributing

Edit `registry/services.json` (then copy it to `extension/services.json`) to add or fix a service. Add a test in `test/` for any change to the detector.

## Support

Free for everyone, forever. If it saved you time, you can [buy me a coffee](https://ojalsingh.netlify.app). Donations never unlock anything.

MIT licensed.
