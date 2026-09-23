# Privacy — development preview

Worth My Scroll is a local Chrome extension. There is no extension-operated backend, analytics, or telemetry.

## Credentials and preferences

Your TypeSafe/Jev or Vercel AI Gateway key is stored in Chrome extension session storage by default. Optional “remember” stores it in local extension storage. Both are restricted to trusted extension contexts; content scripts cannot retrieve the key. Local storage is not an encrypted vault. The key is transmitted to the selected provider (TypeSafe directly or Vercel AI Gateway) as the authorization header for requests and never deliberately sent to FavStash or LinkedIn. Removing it pauses scoring.

Preferences, usage counters, and cached numeric judgments stay in this Chrome profile, not Chrome Sync. Caches store hashed post/preference identifiers and results, not raw post text. At most 500 results are retained with a seven-day reuse period. Expired entries are pruned as new evaluations occur; Clear cached ratings removes them immediately.

## Model requests

When you enable scoring, visible LinkedIn post text and your preferences are sent via HTTPS to TypeSafe directly, or to Vercel AI Gateway for processing by TypeSafe’s Jev. This is not entirely offline processing. Author names, profile URLs, and engagement counts are not deliberately extracted as separate fields, but the post itself can contain names or other personal information. Gateway/TypeSafe may process or log requests under their own policies and your account configuration.

Test connection sends a fixed synthetic example. No OpenAI model, profile inference, or additional language-model key is required. The extension's sample feed also uses synthetic content.

## FavStash

Only an explicit Save in FavStash click creates a handoff. The source URL and short numeric/creative note are kept in extension session storage for up to an hour and supplied to a companion content script on the FavStash stash page. The handoff identifier is placed in a URL fragment. It does not contain your API key. You review the existing FavStash form, select a collection, and click Save item. FavStash's own policies and account limits then apply.

Copy agent brief writes the selected source excerpt, source link if available, scores, and a drafting request to your clipboard. Nothing is automatically sent to an agent or published. Clear the clipboard if that content is sensitive.

## Permissions

- `storage`: settings, scoped credentials, cache, usage, and temporary handoffs.
- `https://ai-gateway.vercel.sh/*`: Gateway evaluation and model-pricing lookup.
- `https://api.typesafe.ai/*`: direct Jev evaluation.
- Bundled Sora font files are exposed only to LinkedIn so injected ratings can use the same typography without remote font requests.
- Content script on `www.linkedin.com/feed/*`: read visible post text and insert ratings.
- Content script on `www.favstash.app/dashboard/stash*`: prepare the existing save form only when an explicit handoff identifier is present.

No cookie access, broad browsing history, or arbitrary network-proxy capability. Uninstalling removes extension storage. Remove the key from settings and revoke it with its provider if you no longer need it.
