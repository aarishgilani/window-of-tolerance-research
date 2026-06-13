const fs = require('fs');
const path = require('path');
const site = require('./lib/site');

const WIKI_DIR = path.resolve(__dirname, '..', 'wiki');
const PUBLIC_DIR = path.join(__dirname, 'public');
const OUT_DIR = path.join(__dirname, 'dist');

// Every page is written to dist/wiki/<urlPath>/index.html, plus assets under
// dist/static/. depthForUrlPath() counts the directories between dist/ and a
// page's index.html so links can stay relative (works for project pages
// served under a subpath as well as a custom domain at the root).
function depthForUrlPath(urlPath) {
  return urlPath === '' ? 0 : 1 + urlPath.split('/').length;
}

function relPrefix(depth) {
  return depth === 0 ? './' : '../'.repeat(depth);
}

function hrefForPageFactory(currentUrlPath) {
  const prefix = relPrefix(depthForUrlPath(currentUrlPath));
  return (page) => `${prefix}wiki/${page.urlPath}/`;
}

function staticHrefFactory(currentUrlPath) {
  const prefix = relPrefix(depthForUrlPath(currentUrlPath));
  return (asset) => `${prefix}static/${asset}`;
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
// <lastmod>. The `index` page maps to the site root (it's rendered as the
// home page, not at /wiki/index/).
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

function writeRobotsTxt(outDir) {
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${site.absoluteUrl('')}sitemap.xml\n`;
  writeFile(path.join(outDir, 'robots.txt'), content);
}

// `currentUrlPath` drives nav active-highlighting; `depthUrlPath` is the
// actual output location and drives relative link prefixes. These differ
// for the home page, which is the wiki/index page rendered at dist/ root.
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
    homeHref: relPrefix(depthForUrlPath(depthUrlPath)),
  });
}

function build() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  copyDir(PUBLIC_DIR, path.join(OUT_DIR, 'static'));

  const index = site.buildIndex(WIKI_DIR);

  // One page per wiki entry, at dist/wiki/<urlPath>/index.html.
  // The `index` page (wiki/index.md) is excluded here — it's rendered as the
  // home page (dist/index.html) below instead of also at dist/wiki/index/.
  const pagesForSitemap = [];
  for (const page of index.pages) {
    const { data, description, articleHtml, jsonLd } = site.renderPageBody(WIKI_DIR, page, index, hrefForPageFactory(page.urlPath), relPrefix(depthForUrlPath(page.urlPath)));
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
  const indexPage = index.pages.find((p) => p.urlPath === 'index');
  let homeHtml;
  if (indexPage) {
    const { data, articleHtml, jsonLd } = site.renderPageBody(WIKI_DIR, indexPage, index, hrefForPageFactory(''), relPrefix(0));
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
  writeFile(path.join(OUT_DIR, 'index.html'), homeHtml);

  // Generic 404 page for GitHub Pages. Not a real indexable URL, so no
  // canonical tag and marked noindex.
  const notFoundBody = site.renderNotFoundBody('', relPrefix(0));
  const notFoundHtml = renderFullPage({
    title: 'Not found',
    description: 'Page not found — Window of Tolerance Wiki',
    pageType: 'website',
    noindex: true,
    currentUrlPath: '',
    depthUrlPath: '',
    canonicalUrlPath: null,
    index,
    bodyHtml: notFoundBody,
  });
  writeFile(path.join(OUT_DIR, '404.html'), notFoundHtml);

  writeSitemap(OUT_DIR, pagesForSitemap);
  writeRobotsTxt(OUT_DIR);

  console.log(`Built ${index.pages.length} wiki page(s) to ${OUT_DIR}`);
}

build();
