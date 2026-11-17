# Fine Print

**Privacy policies change constantly and nobody can keep up. Fine Print does it for you.**

A free, open-source browser extension that tells you what the sites you use are doing with your data today (AI training, ads, sharing, retention...), quotes the policy sentence it comes from, and gives you steps and links when there is something you can switch off. Meta and Google get curated check-up cards. Any other site you add gets an automatic keyword scan, clearly labelled as auto-detected.

The detector is rule-based and the registry links are community-checkable, so treat every card as a pointer to the original text, not as legal advice.

## Screenshots

<img width="475" alt="Check-up tab showing a Meta card marked Happening, with the quoted policy sentence and opt-out steps" src="https://github.com/user-attachments/assets/fa2a48e7-71c0-486d-8ad8-8ae1f0348305" />

<img width="476" alt="Services tab with popular services to tick and a Watch the site I'm on button" src="https://github.com/user-attachments/assets/6806284a-b317-4dd1-b906-0f8a4c1f3f12" />

<img width="613" alt="About tab explaining the rule-based detector and the privacy model" src="https://github.com/user-attachments/assets/d2adf108-7e1e-442e-aca5-83ceee192a85" />

## Run it (about 2 minutes)

1. Clone or download this repo (`Code` -> `Download ZIP`, then unzip).
2. Open `chrome://extensions` in Chrome, Edge or Brave.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the `extension/` folder.
5. Click the Fine Print icon (pin it from the puzzle-piece menu).
6. **Services** tab: tick a few services, or open any site and press **Watch the site I'm on**.
   > Reddit and Amazon can be ticked but are not tracked yet (see Known limits), so they won't show cards.
7. The **Check-up** tab (first tab) shows, for each service you tick, what is *Happening*, *Not happening* or *Unclear*, with the quote and steps.
8. **About** tab: press **Add a sample change** to see exactly what a change card looks like. The red badge on the icon counts open cards.
9. Press **Check now** to pull the latest public feed. Real cards appear only when a watched policy actually changes, and a new change takes up to two daily runs to show up, so a quiet feed is normal.
To run the checks yourself: `npm test` (unit tests) and `node scripts/watch.mjs` (fetches policies and updates `feed/feed.json`, needs Node 20+).

## How it works

**Check-up (what is happening now).** Curated cards for the big services (Meta and Google first), written from the policy text, each quoting it word for word. The daily Action re-checks every quote against the newest policy text. If a quote disappears, the card hides itself until someone re-verifies it, so a stale card can't pass as current. The quote check confirms the wording still exists, not that a card's summary is correct, so read the quote.

**Change tracking (what just changed).**

```
GitHub Action (daily) -> fetch policy -> strip to text -> diff vs last snapshot
        -> classify topics -> feed/feed.json (public, same file for everyone)
Extension -> downloads the whole feed -> shows only the services YOU watch
```

- **Diff:** sentence-level, ignoring dates, capitalization and punctuation, so cosmetic edits don't raise alarms.
- **Classifier:** transparent keyword rules in [`extension/core/classify.js`](extension/core/classify.js) for AI training, data sharing/sale, biometrics, arbitration, ads/tracking, retention, location and deletion. Impact is high, medium or low by topic.
- **Cards:** quoted new wording, impact, links to settings and the policy, Done and Snooze (3 days).
- **Confirmation:** a change must appear in two consecutive daily runs before it becomes a card, so pages that flicker between versions don't create noise.
- **Your own sites:** policies you add are fetched from your browser about once a day. Chrome asks for access to that one site only.

## Privacy

- No account, no analytics, no tracking, no server of ours.
- The feed is a single public file. Your browser downloads all of it and filters locally, so nobody learns which services you watch.
- Sites you add yourself are never reported anywhere.
- Done and Snooze state is stored in your browser (`chrome.storage`).

## Permissions, and who can see what

| Permission | Why |
|---|---|
| `storage` | Saves your watched services and Done/Snooze state in your browser |
| `alarms` | Schedules the feed check (every 6 hours) and the daily check of sites you added |
| `activeTab` | Lets "Watch the site I'm on" see the tab you're on, only when you click it |
| `scripting` | Reads the page you're on to find its privacy policy link, only after you click "Watch the site I'm on" |
| Host access: `raw.githubusercontent.com` | Downloads the public feed |
| Optional host access: `https://*/*` | Never granted up front. Chrome asks for one site at a time when you add it, so Fine Print can fetch that site's policy |

There are no always-on content scripts, and Fine Print doesn't read your browsing history.

Fine Print has no server and no analytics. Two parties can still see ordinary network requests:

- **GitHub** serves the public feed, so it sees that your browser downloaded it. It cannot tell which services you watch, because the extension downloads the whole file and filters locally.
- **A site you add yourself** sees your browser fetch its policy page, like any visit.

Your watched list and your added sites are never sent anywhere.

## Run your own feed

The feed is built by a GitHub Action, so you can run your own:

1. Fork this repo and enable Actions.
2. Edit `registry/services.json` to choose which policies to watch.
3. Let the scheduled workflow run (or trigger it manually).
4. In `extension/config.js`, set `FEED_URL` to your fork's raw feed URL
   (`https://raw.githubusercontent.com/<you>/fineprint/main/feed/feed.json`),
   then reload the extension. The check-up feed URL follows automatically.

## Project layout

- `.github/workflows/`: the daily Action
- `scripts/`: `watch.mjs`, which fetches, diffs and writes the feed
- `snapshots/`: last-seen policy text
- `feed/`: the public `feed.json`
- `registry/`: known services, policy URLs and settings links
- `extension/`: the Manifest V3 extension
- `test/`: unit tests

## Known limits

> Reddit and Amazon can be ticked but are not tracked yet (see Known limits), so they won't show cards.
- Check-up cards exist for Meta and Google only so far.
- Registry policy and settings links were written from memory and are marked `verified: false`. Please check and fix them.
- A keyword detector misses subtle rewording and can over-flag. Always read the quoted text.
- Chrome-family browsers only for now.

## Roadmap

Fix the three uncaptured services, verify links, settings audit, pre-filled GDPR/CCPA request emails, weekly digest, Firefox, optional AI summaries.

## Contributing

Edit `registry/services.json` (then copy it to `extension/services.json`) to add or fix a service. Add a test in `test/` for any change to the detector.

## Support

Free for everyone, forever. If it saved you time, you can [buy me a coffee](https://ojalsingh.netlify.app). Donations never unlock anything.

MIT licensed.
