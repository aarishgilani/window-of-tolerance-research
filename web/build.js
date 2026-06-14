const fs = require('fs');
const path = require('path');
const site = require('./lib/site');

const WIKI_DIR = path.resolve(__dirname, '..', 'wiki');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PUBLIC_ROOT_DIR = path.join(__dirname, 'public-root');
const OUT_DIR = path.join(__dirname, 'dist');

// Every page is written to dist/wiki/<urlPath>/index.html, plus assets under
// dist/static/. The homepage (wiki/index.md, urlPath 'index') is the one
// exception: it's rendered at dist/wiki/index.html itself — i.e. urlPath ''
// relative to the wiki/ directory — so the site's homepage URL is /wiki/.
//
// depthForUrlPath() counts the directories between dist/ and a page's
// index.html so links can stay relative (works for project pages served
// under a subpath as well as a custom domain at the root). `null` marks a
// page rendered at dist/ root (404.html), which sits outside the wiki/ tree.
function depthForUrlPath(urlPath) {
  if (urlPath === null) return 0;
  return urlPath === '' ? 1 : 1 + urlPath.split('/').length;
}

function relPrefix(depth) {
  return depth === 0 ? './' : '../'.repeat(depth);
}

// Maps a page's urlPath to its href relative to a page at `currentUrlPath`.
// The home page (urlPath 'index') lives at dist/wiki/index.html, i.e. the
// wiki/ directory itself, so it maps to '' rather than 'index/'.
function hrefForPageFactory(currentUrlPath) {
  const prefix = relPrefix(depthForUrlPath(currentUrlPath));
  return (page) => {
    const urlPath = page.urlPath === 'index' ? '' : page.urlPath;
    return `${prefix}wiki/${urlPath}${urlPath ? '/' : ''}`;
  };
}

function staticHrefFactory(currentUrlPath) {
  const prefix = relPrefix(depthForUrlPath(currentUrlPath));
  return (asset) => `${prefix}static/${asset}`;
}

// Path from a page at `currentUrlPath` back to the home page's directory
// (dist/wiki/). `null` (404.html, at dist root) needs the explicit 'wiki/'
// segment since it sits outside the wiki/ tree.
function homeHrefForUrlPath(urlPath) {
  if (urlPath === null) return './wiki/';
  return relPrefix(depthForUrlPath(urlPath) - 1);
}

function writeFile(outPath, html) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Writes dist/sitemap.xml from the page list, using `last_updated` as
// <lastmod>. The `index` page maps to /wiki/ (it's rendered as the home
// page, not at /wiki/index/).
function writeSitemap(outDir, pages) {
  const urls = pages.map((page) => {
    const loc = site.absoluteUrl(page.urlPath === 'index' ? '' : page.urlPath);
    const lastmod = site.formatDate(page.lastUpdated);
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  writeFile(path.join(outDir, 'sitemap.xml'), xml);
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// sitemap.xml lives at dist root (not under /wiki/), per robots.txt convention.
function writeRobotsTxt(outDir) {
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${site.SITE_URL}sitemap.xml\n`;
  writeFile(path.join(outDir, 'robots.txt'), content);
}

// IndexNow key file: must be served at `${SITE_URL}${INDEXNOW_KEY}.txt` so
// search engines can verify ownership when submit-indexnow.js notifies them.
function writeIndexNowKey(outDir) {
  writeFile(path.join(outDir, `${site.INDEXNOW_KEY}.txt`), `${site.INDEXNOW_KEY}\n`);
}

// Writes dist/llms.txt: a plain-text index of every page with its one-line
// description, following the emerging llms.txt convention so AI crawlers can
// prioritize what to read without parsing full HTML.
function writeLlmsTxt(outDir, pages) {
  const lines = [`# Window of Tolerance Wiki`, '', `> ${site.SITE_DESCRIPTION}`, ''];

  const entry = (page) => {
    const loc = site.absoluteUrl(page.urlPath === 'index' ? '' : page.urlPath);
    return `- [${page.title}](${loc}): ${page.description}`;
  };

  for (const page of pages.filter((p) => !p.category)) {
    lines.push(entry(page));
  }
  lines.push('');

  for (const cat of site.CATEGORY_ORDER) {
    const items = pages.filter((p) => p.category === cat).sort((a, b) => a.title.localeCompare(b.title));
    if (!items.length) continue;
    lines.push(`## ${site.CATEGORY_LABELS[cat] || cat}`);
    for (const page of items) lines.push(entry(page));
    lines.push('');
  }

  writeFile(path.join(outDir, 'llms.txt'), lines.join('\n').trimEnd() + '\n');
}

// Minimal redirect page for dist/index.html: sends `[base]/` to the real
// homepage at `[base]/wiki/`. No layout/nav — it's never the canonical URL
// and isn't meant to be indexed.
function renderRootRedirect() {
  const target = './wiki/';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${site.absoluteUrl('')}">
<meta name="robots" content="noindex">
<title>Window of Tolerance Wiki</title>
</head>
<body>
<p>Redirecting to <a href="${target}">the Window of Tolerance Wiki</a>…</p>
</body>
</html>`;
}

// `currentUrlPath` drives nav active-highlighting; `depthUrlPath` is the
// actual output location and drives relative link prefixes. These differ
// for the home page, which is the wiki/index page rendered at dist/wiki/.
// `canonicalUrlPath` defaults to `depthUrlPath` (the real output location)
// but can be overridden (e.g. `null` to omit the canonical tag on 404).
function renderFullPage({
  title,
  description,
  pageType,
  noindex,
  currentUrlPath,
  depthUrlPath = currentUrlPath,
  canonicalUrlPath = depthUrlPath,
  index,
  bodyHtml,
  jsonLd,
}) {
  return site.layout({
    title,
    description,
    canonicalUrlPath,
    pageType,
    noindex,
    currentUrlPath,
    index,
    bodyHtml,
    jsonLd,
    hrefForPage: hrefForPageFactory(depthUrlPath),
    staticHref: staticHrefFactory(depthUrlPath),
    homeHref: homeHrefForUrlPath(depthUrlPath),
  });
}

function build() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  copyDir(PUBLIC_DIR, path.join(OUT_DIR, 'static'));
  // Files that must be served from the dist root (e.g. search-engine
  // verification files), unlike web/public/ which lands under dist/static/.
  copyDir(PUBLIC_ROOT_DIR, OUT_DIR);

  const index = site.buildIndex(WIKI_DIR);

  // One page per wiki entry, at dist/wiki/<urlPath>/index.html.
  // The `index` page (wiki/index.md) is excluded here — it's rendered as the
  // home page (dist/wiki/index.html) below instead of also at dist/wiki/index/.
  const pagesForSitemap = [];
  for (const page of index.pages) {
    const { data, description, articleHtml, jsonLd } = site.renderPageBody(WIKI_DIR, page, index, hrefForPageFactory(page.urlPath), homeHrefForUrlPath(page.urlPath));
    if (page.urlPath !== 'index') {
      const html = renderFullPage({
        title: data.title || page.title,
        description,
        pageType: 'article',
        currentUrlPath: page.urlPath,
        index,
        bodyHtml: articleHtml,
        jsonLd,
      });
      writeFile(path.join(OUT_DIR, 'wiki', page.urlPath, 'index.html'), html);
    }
    pagesForSitemap.push({ ...page, description });
  }

  // Home page: wiki/index.md if present, else an auto-generated overview.
  // Rendered at dist/wiki/index.html, so the site's homepage URL is /wiki/.
  const indexPage = index.pages.find((p) => p.urlPath === 'index');
  let homeHtml;
  if (indexPage) {
    const { data, articleHtml, jsonLd } = site.renderPageBody(WIKI_DIR, indexPage, index, hrefForPageFactory(''), homeHrefForUrlPath(''));
    const description = data.description || site.SITE_DESCRIPTION;
    homeHtml = renderFullPage({
      title: data.title || indexPage.title,
      description,
      pageType: 'website',
      currentUrlPath: indexPage.urlPath,
      depthUrlPath: '',
      index,
      bodyHtml: articleHtml,
      jsonLd,
    });
  } else {
    const bodyHtml = site.renderAutoHomeBody(index, hrefForPageFactory(''));
    homeHtml = renderFullPage({
      title: 'Home',
      description: site.SITE_DESCRIPTION,
      pageType: 'website',
      currentUrlPath: '',
      depthUrlPath: '',
      index,
      bodyHtml,
    });
  }
  writeFile(path.join(OUT_DIR, 'wiki', 'index.html'), homeHtml);

  // Root redirect: dist/index.html sends `[base]/` to the real homepage at
  // /wiki/. Kept minimal (no nav/layout) since it's never the canonical URL.
  writeFile(path.join(OUT_DIR, 'index.html'), renderRootRedirect());

  // Generic 404 page for GitHub Pages. Lives at dist root (not under /wiki/),
  // so no canonical tag and marked noindex.
  const notFoundBody = site.renderNotFoundBody('', homeHrefForUrlPath(null));
  const notFoundHtml = renderFullPage({
    title: 'Not found',
    description: 'Page not found — Window of Tolerance Wiki',
    pageType: 'website',
    noindex: true,
    currentUrlPath: null,
    depthUrlPath: null,
    canonicalUrlPath: null,
    index,
    bodyHtml: notFoundBody,
  });
  writeFile(path.join(OUT_DIR, '404.html'), notFoundHtml);

  writeSitemap(OUT_DIR, pagesForSitemap);
  writeRobotsTxt(OUT_DIR);
  writeLlmsTxt(OUT_DIR, pagesForSitemap);
  writeIndexNowKey(OUT_DIR);

  console.log(`Built ${index.pages.length} wiki page(s) to ${OUT_DIR}`);
}

build();
