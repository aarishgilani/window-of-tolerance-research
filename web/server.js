const express = require('express');
const fs = require('fs');
const path = require('path');
const site = require('./lib/site');

const WIKI_DIR = path.resolve(__dirname, '..', 'wiki');
const PORT = process.env.PORT || 4000;

const app = express();
app.use('/static', express.static(path.join(__dirname, 'public')));

const hrefForPage = (page) => `/wiki/${page.urlPath}`;
const staticHref = (asset) => `/static/${asset}`;
const homeHref = '/';

app.get('/', (req, res) => {
  // Re-scan the wiki on every request so edits made by the LLM show up immediately.
  const index = site.buildIndex(WIKI_DIR);
  const indexPage = index.pages.find((p) => p.urlPath === 'index');
  if (indexPage) {
    const { data, articleHtml, jsonLd } = site.renderPageBody(WIKI_DIR, indexPage, index, hrefForPage, homeHref);
    const description = data.description || site.SITE_DESCRIPTION;
    return res.send(site.layout({
      title: data.title || indexPage.title,
      description,
      canonicalUrlPath: '',
      pageType: 'website',
      currentUrlPath: indexPage.urlPath,
      index,
      bodyHtml: articleHtml,
      jsonLd,
      hrefForPage,
      staticHref,
      homeHref,
    }));
  }
  const bodyHtml = site.renderAutoHomeBody(index, hrefForPage);
  res.send(site.layout({
    title: 'Home',
    description: site.SITE_DESCRIPTION,
    canonicalUrlPath: '',
    pageType: 'website',
    currentUrlPath: '',
    index,
    bodyHtml,
    hrefForPage,
    staticHref,
    homeHref,
  }));
});

app.get('/wiki/*', (req, res) => {
  const index = site.buildIndex(WIKI_DIR);
  const reqPath = req.params[0].replace(/\.md$/i, '');
  const rel = reqPath + '.md';
  const full = path.resolve(WIKI_DIR, rel);

  const notFound = () => {
    const bodyHtml = site.renderNotFoundBody(reqPath, homeHref);
    res.status(404).send(site.layout({
      title: 'Not found',
      description: 'Page not found — Window of Tolerance Wiki',
      pageType: 'website',
      noindex: true,
      canonicalUrlPath: null,
      currentUrlPath: '',
      index,
      bodyHtml,
      hrefForPage,
      staticHref,
      homeHref,
    }));
  };

  if (!full.startsWith(WIKI_DIR + path.sep) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return notFound();
  }

  const page = index.pages.find((p) => p.urlPath === reqPath);
  if (!page) {
    return notFound();
  }

  const { data, description, articleHtml, jsonLd } = site.renderPageBody(WIKI_DIR, page, index, hrefForPage, homeHref);
  res.send(site.layout({
    title: data.title || page.title,
    description,
    canonicalUrlPath: page.urlPath,
    pageType: 'article',
    currentUrlPath: page.urlPath,
    index,
    bodyHtml: articleHtml,
    jsonLd,
    hrefForPage,
    staticHref,
    homeHref,
  }));
});

app.listen(PORT, () => {
  console.log(`Window of Tolerance wiki server running at http://localhost:${PORT}`);
  console.log(`Serving: ${WIKI_DIR}`);
});
