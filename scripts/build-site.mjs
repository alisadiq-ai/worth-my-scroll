import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'site-dist');
const productionHost = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL;
const requested = process.env.SITE_URL || (productionHost ? `https://${productionHost}` : undefined);
if (process.env.VERCEL_ENV === 'production' && !requested) throw new Error('Production deployment requires a canonical origin.');
let origin;
if (requested) {
  const url = new URL(requested);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS origin, such as https://example.com');
  origin = url.origin;
}
await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'assets'), { recursive: true });
await cp(path.join(root, 'site'), out, { recursive: true });
await cp(path.join(root, 'public', 'icon128.png'), path.join(out, 'favicon.png'));
for (const name of ['logo.svg', 'fonts/sora-regular.ttf', 'fonts/sora-semibold.ttf', 'fonts/OFL.txt']) {
  await cp(path.join(root, 'public', name), path.join(out, 'assets', path.basename(name)));
}
await cp(path.join(root, 'docs/demo/linkedin-feed-demo.gif'), path.join(out, 'assets/linkedin-feed-demo.gif'));
const escape = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
let html = await readFile(path.join(out, 'index.html'), 'utf8');
html = html.replace('__ROBOTS__', origin ? 'index,follow,max-image-preview:large' : 'noindex,nofollow')
  .replace('__CANONICAL__', origin ? `<link rel="canonical" href="${escape(origin)}/">` : '')
  .replace('__SOCIAL__', origin ? `<meta property="og:url" content="${escape(origin)}/"><meta property="og:image" content="${escape(origin)}/assets/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Worth My Scroll. Your personal AI filter for LinkedIn, powered by Jev."><meta name="twitter:image" content="${escape(origin)}/assets/social-card.png">` : '');
await writeFile(path.join(out, 'index.html'), html);
await writeFile(path.join(out, 'robots.txt'), origin ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
if (origin) await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(origin)}/</loc></url></urlset>\n`);
console.log(`Built site-dist (${origin ? `indexable: ${origin}` : 'private review: noindex'}).`);

// Publish the same privacy text as the repository without requiring GitHub access.
const privacySource = await readFile(path.join(root, 'docs/PRIVACY.md'), 'utf8');
const privacyBody = privacySource.trim().split(/\n\n+/).map(block => {
  if (block.startsWith('## ')) return `<h2>${escape(block.slice(3))}</h2>`;
  if (block.startsWith('# ')) return `<h1>${escape(block.slice(2))}</h1>`;
  if (block.startsWith('- ')) return `<ul>${block.split('\n').map(line => `<li>${escape(line.replace(/^- /, ''))}</li>`).join('')}</ul>`;
  return `<p>${escape(block)}</p>`;
}).join('\n');
await writeFile(path.join(out, 'privacy.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Privacy — Worth My Scroll</title><meta name="robots" content="noindex,follow"><link rel="stylesheet" href="/styles.css"><link rel="icon" href="/favicon.png" type="image/png" sizes="128x128"></head><body><main class="wrap section" style="max-width:800px"><a class="text-link" href="/">← Worth My Scroll</a><article style="margin-top:45px">${privacyBody}</article><h2>Landing page hosting</h2><p>This website is hosted on Vercel. Vercel processes network requests to serve the site under its own policies. This page adds no analytics scripts or advertising trackers.</p></main></body></html>`);
await cp(path.join(root, 'LICENSE'), path.join(out, 'LICENSE.txt'));
