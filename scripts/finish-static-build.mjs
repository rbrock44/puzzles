// Runs after `ng build`: writes sitemap.xml from the prerendered pages and adds the
// 404.html fallback GitHub Pages serves for any path that has no file.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE_URL = 'https://puzzles.ryan-brock.com';
const dist = 'dist/puzzles';
const browser = join(dist, 'browser');

const { routes } = JSON.parse(readFileSync(join(dist, 'prerendered-routes.json'), 'utf8'));
const lastmod = new Date().toISOString().slice(0, 10);

const urls = Object.keys(routes)
  .filter(route => {
    const html = readFileSync(join(browser, route, 'index.html'), 'utf8');
    return !/<meta name="robots" content="noindex"/.test(html);
  })
  .map(route => (route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}/`))
  .map(url => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);

writeFileSync(
  join(browser, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
);

copyFileSync(join(browser, 'index.csr.html'), join(browser, '404.html'));

console.log(`sitemap.xml: ${urls.length} urls, 404.html: copied from index.csr.html`);
