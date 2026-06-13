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

// `currentUrlPath` drives nav active-highlighting; `depthUrlPath` is the
// actual output location and drives relative link prefixes. These differ
// for the home page, which is the wiki/index page rendered at dist/ root.
function renderFullPage({ title, currentUrlPath, depthUrlPath = currentUrlPath, index, bodyHtml }) {
  return site.layout({
    title,
    currentUrlPath,
    index,
    bodyHtml,
    hrefForPage: hrefForPageFactory(depthUrlPath),
    staticHref: staticHrefFactory(depthUrlPath),
    homeHref: relPrefix(depthForUrlPath(depthUrlPath)),
  });
}

function build() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  copyDir(PUBLIC_DIR, path.join(OUT_DIR, 'static'));

  const index = site.buildIndex(WIKI_DIR);

  // One page per wiki entry, at dist/wiki/<urlPath>/index.html
  for (const page of index.pages) {
    const { data, articleHtml } = site.renderPageBody(WIKI_DIR, page, index, hrefForPageFactory(page.urlPath));
    const html = renderFullPage({
      title: data.title || page.title,
      currentUrlPath: page.urlPath,
      index,
      bodyHtml: articleHtml,
    });
    writeFile(path.join(OUT_DIR, 'wiki', page.urlPath, 'index.html'), html);
  }

  // Home page: wiki/index.md if present, else an auto-generated overview.
  const indexPage = index.pages.find((p) => p.urlPath === 'index');
  let homeHtml;
  if (indexPage) {
    const { data, articleHtml } = site.renderPageBody(WIKI_DIR, indexPage, index, hrefForPageFactory(''));
    homeHtml = renderFullPage({ title: data.title || indexPage.title, currentUrlPath: indexPage.urlPath, depthUrlPath: '', index, bodyHtml: articleHtml });
  } else {
    const bodyHtml = site.renderAutoHomeBody(index, hrefForPageFactory(''));
    homeHtml = renderFullPage({ title: 'Home', currentUrlPath: '', depthUrlPath: '', index, bodyHtml });
  }
  writeFile(path.join(OUT_DIR, 'index.html'), homeHtml);

  // Generic 404 page for GitHub Pages.
  const notFoundBody = site.renderNotFoundBody('', relPrefix(0));
  const notFoundHtml = renderFullPage({ title: 'Not found', currentUrlPath: '', depthUrlPath: '', index, bodyHtml: notFoundBody });
  writeFile(path.join(OUT_DIR, '404.html'), notFoundHtml);

  console.log(`Built ${index.pages.length} wiki page(s) to ${OUT_DIR}`);
}

build();
