# Validation — 2026-09-23

## Verified

- TypeScript check and 23 Node tests passed. Tests cover provider routing, schema translation, invalid output rejection, credential isolation, cache deduplication, budgets, pause, URL validation, and extraction.
- Live **Vercel Gateway** synthetic requests returned all six requested judgments. Four-case smoke sample: useful builder post green; hollow bait red; useful gardening post amber for builder preferences and green for gardener preferences. This is a behavior smoke check, not an accuracy benchmark.
- In an isolated Chrome for Testing installation, the popup detected both known key prefixes and exposed a selector for unknown formats. A real Gateway key completed connect/test/enable in one action. Session-only storage, clearing the key field, pause and resume were verified.
- Twelve browser checks passed: three live ratings, recreate chip, radar popover, repeat cache hit, narrow viewport, installed content-script scoring, sponsored-post exclusion, FavStash handoff creation, URL/note prefill, collection remaining a user choice, and pause removing ratings.
- FavStash prefill was tested against a synthetic form matching the current application markup. No real item was saved or scheduled.
- Live annotations were confirmed on Ali’s personal LinkedIn feed after reloading the extension and refreshing the feed. Four visible DOM ratings and the new 1px outline were verified; Ali confirmed the display issue was fixed.

## Measurements

The four-case six-question API smoke run used 3,735 input tokens: estimated **$0.0392175 per 1,000 similar uncached posts**, using the $0.042/M input and free-output price snapshot. Its responses took 359–558 ms. The later three-post browser run averaged 401 ms (2,914 input tokens total). Tiny samples; network, provider load, text length and preferences affect results. Billing was not reconciled against an invoice.

## Remaining limits

- Direct TypeSafe support uses the [documented native API](https://docs.typesafe.ai/api). Its adapter and routing are contract-tested, **not live-authentication tested** because no direct TypeSafe key was available.
- Detected prefixes are `vck_` (Gateway) and `ts_` (TypeSafe). Unknown formats require explicit provider selection; no credential is sent to an inferred fallback host.
- The score wheel shows six signal dimensions; it is not a calibrated confidence chart. When the provider supplies score confidence, the UI labels its average separately as model confidence. Confidence does not equal measured accuracy.
- “Slop” is a quality heuristic, not AI-authorship detection. “Recreate” is creative potential, not a virality prediction. Substance scores can also vary with context.
- LinkedIn can change markup. Some layouts hide public URLs, requiring the user to copy the post link before the FavStash handoff.
- The real authenticated FavStash form still needs a user acceptance check. A fixture passing does not prove a remote save. Nothing is automatically saved or posted.
- No landing page, public distribution, Chrome Web Store release, or LinkedIn post has been published.

## Repeat checks

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Optional live smoke: provide `AI_GATEWAY_API_KEY` in the process environment and run `npm run smoke`. Never put a real key in a command argument, source file, screenshot, or commit.

The browser harnesses are for a separately launched Chrome for Testing with the unpacked extension and a dedicated profile/CDP endpoint. Never attach them to a normal personal browser. `scripts/popup-check.mjs` uses an environment key; `scripts/browser-check.mjs` assumes that isolated extension has been provisioned. Reports and screenshots go to ignored `output/`.

## Feed recovery fix (0.2.1)

A newer popup can coexist with an older Chrome-cached content script until the extension itself is reloaded. The popup now reports feed connection/annotation counts or a scoring error. A successful connection test resets the feed scoring revision so previously failed posts can retry. A regression test covers failure recovery and restoring a badge removed by a feed rerender. There is no automatic loop retrying rejected paid requests. Health metadata stays in extension session storage; it contains counts, script version, timestamps, and sanitized errors, never post text or credentials.

## Toolbar stash action (0.2.2)

Save to Stash and an accessible info popover are available beside Why on every rated post, including red ratings. The same existing FavStash form handoff is used; the UI says Opened, not Saved. Unit regression verified the source URL and recreation note, missing-URL fallback, and low-score availability. The new toolbar and info popover were visually inspected in Chrome on synthetic posts. No real FavStash item was saved during this check.

## Native post-link resolution (0.2.4)

A bounded MAIN-world helper invokes the selected post’s native control menu and Copy link action, then returns only a validated LinkedIn permalink. The clipboard read permission is not requested. Automated tests cover capture of a freshly generated URL, original clipboard function restoration, existing handoff routing, and excluding links quoted within post text. Live acceptance of this new native menu path is pending an extension reload.

## Short post links (0.2.5)

Live LinkedIn copying revealed a native `https://lnkd.in/p/<id>` URL, which the previous validator rejected. The validator now accepts that bounded path, strips tracking, and unwraps LinkedIn safety links only when their destination is a supported post URL. A fresh View post toast is a second capture path. Tests cover full URLs, short URLs, toast-only delivery, spoofed destinations, and the short-link worker handoff. FavStash’s current backend allowlist was checked read-only and recognizes lnkd.in as LinkedIn. Live automatic handoff acceptance awaits the updated extension reload.

## Native FavStash save route (0.2.6)

Save to Stash now opens FavStash's native `?url=…&note=…` route. Removed the FavStash content script, injected helper, temporary session handoff store, and old `#wms` protocol. The URL contract was checked against the FavStash implementation, including source/note length limits. All 24 unit tests, TypeScript checking, and the build passed. Regression coverage includes native short links, parameter encoding, invalid input rejection, and blocking the removed handoff message. README illustrations were visually checked in Chrome.

The earlier form-helper browser checks above describe historical versions, not the current native flow. The isolated browser harness now checks only the outgoing URL contract. Production prefill and the user's installed-extension flow remain pending the FavStash Amplify release and a Chrome extension reload. A scheduled follow-up tracks the owning FavStash task.


## Popup polish and scoring recovery (0.2.7)

Ali confirmed the native FavStash save flow works in the installed extension. A five-second GIF from his 22-second real-use recording shows preference selection, a rated post, and the Why panel. FFmpeg joins three moments, crops to the feed, and exports a looping 12 fps GIF; its duration and representative frames were checked. The README embeds this loop directly. The original MOV is untouched. The recording shows v0.2.6, before the popup changes below.

The toolbar icons and popup share the same w/arrow mark. The collapsed usage row explicitly says Est.; the helper now names ChatGPT and Claude. Feed status derives from recent heartbeat activity, pending evaluations, visible errors, and retry state instead of only the enabled preference. Connection verification no longer claims the feed is connected.

Temporary network, rate-limit, and server failures receive one delayed automatic retry per visible post. Key, billing, invalid-response, and budget errors do not auto-retry. A Retry scoring action resets failed post attempts without paying for a synthetic connection test. Saving changed preferences, resuming, or increasing the budget also restarts failed posts. Local tests verify the delay and retry cap, error classification, and popup status; 27 tests, type checking, and build passed. The popup was visually checked in a local browser preview. Live acceptance of this revision needs an extension reload and LinkedIn refresh.
