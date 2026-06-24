const express = require('express');
const fs = require('fs');
const path = require('path');
const site = require('./lib/site');

const WIKI_DIR = path.resolve(__dirname, '..', 'wiki');
const PORT = process.env.PORT || 4000;

const app = express();
app.use('/static', express.static(path.join(__dirname, 'public')));

// The home page (urlPath 'index') lives at /wiki/, not /wiki/index — matches
// build.js's dist/wiki/index.html output.
const hrefForPage = (page) => (page.urlPath === 'index' ? '/wiki/' : `/wiki/${page.urlPath}`);
const staticHref = (asset) => `/static/${asset}`;
const homeHref = '/wiki/';

app.get('/', (req, res) => res.redirect('/wiki/'));

app.get(['/wiki', '/wiki/'], (req, res) => {
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

app.get(['/wiki/graph', '/wiki/graph/'], (req, res) => {
  const index = site.buildIndex(WIKI_DIR);
  const bodyHtml = `<article>
  <header class="page-header">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/wiki/">Home</a><span class="sep">/</span>
      <span aria-current="page">Concept Map</span>
    </nav>
    <h1>Concept Map</h1>
    <p class="subtitle">Interactive graph of all wiki pages and their connections. Click a node to navigate.</p>
  </header>
  <div id="cy" style="width: 100%; height: 70vh; border: 1px solid var(--border); border-radius: 6px;"></div>
  <div class="graph-legend">
    <span class="legend-dot" style="background: #2f6f4f;"></span> Concepts
    <span class="legend-dot" style="background: #1f6feb;"></span> Entities
    <span class="legend-dot" style="background: #b45309;"></span> Practices
    <span class="legend-dot" style="background: #6b7280;"></span> Sources
    <span class="legend-dot" style="background: #7c3aed;"></span> Syntheses
  </div>
</article>`;
  const extraScripts = `<script src="https://unpkg.com/cytoscape@3/dist/cytoscape.min.js"></script>
<script src="https://unpkg.com/layout-base/layout-base.js"></script>
<script src="https://unpkg.com/cose-base/cose-base.js"></script>
<script src="https://unpkg.com/cytoscape-fcose@2.2.0/cytoscape-fcose.js"></script>
<script src="/static/graph-init.js"></script>`;
  res.send(site.layout({
    title: 'Concept Map',
    description: 'Interactive graph of all wiki pages and their connections in the Window of Tolerance knowledge base.',
    pageType: 'website',
    currentUrlPath: 'graph',
    index,
    bodyHtml,
    extraScripts,
    hrefForPage,
    staticHref,
    homeHref,
  }));
});

app.get('/static/graph.json', (req, res) => {
  const index = site.buildIndex(WIKI_DIR);
  const nodeExclude = new Set(['index', 'log']);
  const nodes = [];
  const edgeSet = new Set();
  const edges = [];

  for (const page of index.pages) {
    if (nodeExclude.has(page.slug)) continue;
    nodes.push({
      id: page.slug,
      label: page.title,
      category: page.category || null,
      url: `/wiki/${page.urlPath}`,
    });
  }

  function addEdge(srcSlug, tgtSlug) {
    if (srcSlug === tgtSlug) return;
    const [a, b] = srcSlug < tgtSlug ? [srcSlug, tgtSlug] : [tgtSlug, srcSlug];
    const key = `${a}--${b}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ source: a, target: b });
  }

  for (const page of index.pages) {
    if (nodeExclude.has(page.slug)) continue;
    for (const rel of page.related) {
      const targetSlug = site.slugify(rel);
      if (index.bySlug.has(targetSlug) && !nodeExclude.has(targetSlug)) {
        addEdge(page.slug, targetSlug);
      }
    }
    const filePath = path.resolve(WIKI_DIR, page.rel);
    let raw;
    try { raw = fs.readFileSync(filePath, 'utf8'); } catch { continue; }
    const wikiLinkRe = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;
    let match;
    while ((match = wikiLinkRe.exec(raw)) !== null) {
      const target = match[1].trim();
      const targetSlug = site.slugify(target);
      if (index.bySlug.has(targetSlug) && !nodeExclude.has(targetSlug)) {
        addEdge(page.slug, targetSlug);
      }
    }
  }

  res.json({ nodes, edges });
});

app.get('/wiki/*', (req, res) => {
  const index = site.buildIndex(WIKI_DIR);
  const reqPath = req.params[0].replace(/\.md$/i, '').replace(/\/$/, '');

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

  // 'index' (the home page) is served at /wiki/, not /wiki/index.
  if (!reqPath || reqPath === 'index') {
    return notFound();
  }

  const rel = reqPath + '.md';
  const full = path.resolve(WIKI_DIR, rel);

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
