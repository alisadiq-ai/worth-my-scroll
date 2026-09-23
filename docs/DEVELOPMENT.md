# Development

Node 22+ and npm. Run `npm ci`, then:

```sh
npm run typecheck
npm test
npm run build
npm run preview  # synthetic UI preview at http://127.0.0.1:4173
npm run package # unpacked extension archive
```

The ordinary browser preview uses illustrative content, accepts no credentials, and makes no model calls. The installed extension's demo can run synthetic posts through Jev. `scripts/live-smoke.mjs` accepts an environment-provided key; outputs are ignored by Git. Never commit keys or provision a shared developer key to end users.

## Providers and scoring

`vck_` selects Vercel Gateway `/v1/evaluate` with `typesafe-ai/jev`; `ts_` selects TypeSafe `/v1/systemone` with `jev-latest`. Unknown key formats require explicit provider selection. A key is never tried against both services. The direct adapter translates boolean questions to `noul` and normalizes snake_case token usage.

Six questions share one evaluation: fit, substance, value, slop, recreate, and bait. Five-point scores are normalized to 0–100. Overall utility is `clamp(0.50 × fit + 0.30 × substance + 0.20 × value − 0.12 × bait − 0.12 × slop)`. Thresholds live in `src/core.ts`; these are product heuristics, not calibrated accuracy claims.

## Native FavStash integration

`src/favstash.ts` builds `https://www.favstash.app/dashboard/stash?url=<encoded-source>&note=<encoded-note>` with URLSearchParams. The public LinkedIn source is validated (including native `lnkd.in/p/…` links), capped at 2,048 characters; the optional note is capped at 1,000. No collection is supplied because users choose it in FavStash. FavStash also accepts an optional `collection` ID for other callers.

The background worker opens the URL on an explicit Save click. FavStash owns pending-intent storage, auth continuity, prefill, collection selection, and persistence. There is no FavStash content script, clipboard/form helper, or extension session handoff protocol. A successful tab opening is labelled Opened, not Saved.

LinkedIn sometimes omits permalinks from the DOM. The bounded MAIN-world bridge invokes that post's Copy link action and captures only the fresh generated link, with a fresh View post toast as fallback. It never reads existing clipboard content. A manual URL field remains only for failed source-link lookup on LinkedIn.

## Source map

- `src/provider.ts`, `src/core.ts`: providers, API contract, rubric, ratings, pricing.
- `src/background.ts`: credentials, consent, budgets, cache, tab opening.
- `src/linkedin.ts`, `src/content.ts`: visible post extraction and observation.
- `src/badge.ts`, `src/stash-actions.ts`: rating UI and actions.
- `src/post-link*.ts`: source-link resolution.
- `src/ui.ts`, `public/ui.css`: popup and synthetic preview.
- `tests/`: API, worker, extraction, link, and UI regressions.

`scripts/browser-check.mjs` is only for an isolated Chrome-for-Testing instance. Its FavStash destination is a placeholder that verifies the URL contract; it does not establish that production authentication/prefill works. Check production separately after the native web release is deployed.
