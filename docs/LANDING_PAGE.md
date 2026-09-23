# Worth My Scroll landing page

Deployed to Vercel at Ali’s request. No AWS resources, domain purchases, store submissions, or GitHub visibility changes were made.

## Preview

```sh
npm run site:build
npm run site:preview
```

Open http://127.0.0.1:4180. Edit `site/index.html`, `site/styles.css`, and `site/app.js`, rebuild, then refresh. This build is independent of the extension build; `dist/` is unchanged. Static deployable files are in ignored `site-dist/`.

## Content and assets

- FavStash family: Sora, blue actions, pink accents, pale backgrounds, navy feature section.
- Original Worth My Scroll logo reused from `public/logo.svg`.
- Demo reuses the approved full-width 9-second GIF in `docs/demo/`; sidebar remains visible.
- Real product screenshot in the hero. Demo GIF autoplays when loaded, with a pause/replay control. Reduced-motion users see the WebP poster until they choose Play. No third-party fonts, analytics, or external runtime dependencies.
- Hero screenshot and demo are actual usage. Full-width navy demo and usage sections alternate with the light content sections.
- Copy covers real-time Jev scoring, ultra-low usage cost, LinkedIn feed filtering, Chrome extensions, open-source productivity, AI slop, and content repurposing. The roughly $0.04/1,000-post estimate links to dated provider pricing and its 1,000-input-token assumption. No ranking guarantee or AI-authorship claim.
- Native FavStash handoff described accurately: prefill, choose collection, confirm. Publishing requires approval and supported connected accounts.

## Search and social metadata

HTML includes title, description, semantic headings, SoftwareApplication JSON-LD, social preview image, and responsive styles. A production build generates absolute canonical and social URLs, robots.txt, and sitemap.xml from a confirmed origin:

```sh
SITE_URL=https://your-confirmed-domain.example npm run site:build
```

Without SITE_URL, builds deliberately emit noindex/nofollow and robots Disallow. There is no assumed ownership of worthmyscroll.com. Do not deploy the review build as the public launch artifact. The placeholder above is illustrative, not a deployment target.

## Production on Vercel

Live URL: https://worth-my-scroll.vercel.app

- Workspace: `ali-2770s-projects`
- Project: `worth-my-scroll` (`prj_qr1fQ3M8TPsrCX1qz3ueDkzLPXXV`)
- First production deployment: `dpl_9emXvMgUjg9vtjEbhHE5J6zjsRhG`, READY on September 23, 2026.
- Static output: `site-dist`; build command: `node scripts/build-site.mjs`; no dependency installation or server runtime required.
- Production canonical origin is derived from Vercel's `VERCEL_PROJECT_PRODUCTION_URL`. SITE_URL remains an explicit override. Non-production builds default to noindex.
- `.vercelignore` limits deployment inputs to the page, demo, fonts, logo, build script, privacy text, and license. Credentials and extension source are not uploaded.
- The production `/privacy` route and `/LICENSE.txt` are publicly accessible independently of GitHub.
- GitHub auto-deploy connection is not established: Vercel requested a GitHub login connection. CLI deployments work with the approved CLI login.
- The repository remains private. Publishing the repository or creating an accessible release is a separate step before visitors can use its source-install links.

Deploy updates from the linked repository:

```sh
npx vercel@59.25.4 deploy --prod --scope ali-2770s-projects
```

No custom domain or AWS resources are used. Search crawlers are allowed, but indexing and ranking are determined by search engines, not by successful deployment.

## Verification

Production checks passed: unauthenticated HTTP 200, no X-Robots-Tag noindex, index/follow metadata, correct canonical and social URLs, sitemap and robots, privacy and license, fonts and images. The deployed GIF matches the approved local file by SHA-256. Chrome visual checks passed at desktop and 390px mobile width; demo autoplay, pause, and resume were verified. Temporary viewport overrides were reset. This is not a full accessibility or performance audit.
