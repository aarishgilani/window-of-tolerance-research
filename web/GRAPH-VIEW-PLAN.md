# Cytoscape.js Graph View — Implementation Plan

## Goal

Add an interactive concept-map page at `/wiki/graph/` that visualizes all wiki pages as nodes and their connections (frontmatter `related` + inline `[[wiki links]]`) as edges. Clicking a node navigates to that page. The graph should use the site's existing color palette and feel native to the current design.

---

## Current Architecture (do not change)

- **Static site generator**: `web/build.js` reads `wiki/**/*.md`, renders HTML to `web/dist/`.
- **No framework**: Zero client-side framework. One vanilla JS file (`web/public/app.js`, 29 lines — sidebar filter).
- **No bundler**: Raw `<script>` tags. No webpack/vite/esbuild.
- **Styling**: Single `web/public/style.css` with CSS custom properties (`--accent`, `--link`, `--fg`, etc.).
- **Page model**: `web/lib/site.js` exports `buildIndex(wikiDir)` which returns `{ pages, bySlug }`. Each page has: `urlPath`, `slug`, `title`, `type`, `tags`, `related` (array of slugs from frontmatter), `category`.
- **Wiki link resolution**: `resolveWikiLinks()` in `site.js` handles `[[Target]]` and `[[target|Display]]` syntax via regex. These are resolved to `<a>` tags at render time but the raw link targets are not currently extracted as structured data.

### Key numbers

- **73 wiki pages** (nodes)
- **~350+ connections** estimated (from `related` arrays + inline `[[wiki links]]`)
- 5 categories: concepts, entities, practices, sources, syntheses (+ uncategorized top-level pages like overview, about, index, log)

---

## Implementation Steps

### Step 1: Extract graph data at build time

**File**: `web/build.js`  
**What**: After `buildIndex()`, generate a `graph.json` and write it to `web/dist/static/graph.json`.

**Graph data structure**:
```json
{
  "nodes": [
    { "id": "window-of-tolerance", "label": "Window of Tolerance", "category": "concepts", "url": "../window-of-tolerance/" }
  ],
  "edges": [
    { "source": "window-of-tolerance", "target": "dan-siegel" }
  ]
}
```

**Node extraction**: Map every page from `index.pages` into a node. Use `page.slug` as `id`, `page.title` as `label`, `page.category` as `category` (null for top-level pages like overview/about). The `url` field should be the relative href from `/wiki/graph/` to the page — use the existing `hrefForPageFactory('graph')` to compute this.

**Edge extraction — two sources, deduplicated**:

1. **Frontmatter `related`**: Already parsed into `page.related` as an array of page-name strings. Slugify each and look up in `index.bySlug`. For each resolved page, emit an edge `{ source: currentPage.slug, target: resolvedPage.slug }`.

2. **Inline `[[wiki links]]`**: Not currently extracted as structured data. Scan each page's raw markdown content with the same regex used by `resolveWikiLinks()` — `/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g` — extract the target, slugify it, resolve via `index.bySlug`, and emit edges.

**Deduplication**: Edges should be undirected for display purposes. Deduplicate by sorting source/target alphabetically and using a Set of `${min}--${max}` keys. This prevents double-rendering when page A lists page B in `related` and page B also links to page A.

**Exclusions**: Skip the `index` and `log` pages as nodes — they're meta-pages, not concepts. Keep `overview` and `about`.

**Add to `build()` function** in `build.js`, after the page rendering loop, before `writeSitemap()`:
```js
writeGraphJson(OUT_DIR, index, WIKI_DIR);
```

### Step 2: Create the graph page HTML

**File**: `web/build.js`  
**What**: Add a new `renderGraphPage()` function and call it in `build()` to emit `dist/wiki/graph/index.html`.

The graph page should use the existing `renderFullPage()` wrapper so it gets the same sidebar nav, header, and footer as every other page. The `bodyHtml` is minimal:

```html
<article>
  <header class="page-header">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="../">Home</a><span class="sep">/</span>
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
</article>
```

**Parameters for `renderFullPage()`**:
- `title`: `'Concept Map'`
- `description`: `'Interactive graph of all wiki pages and their connections in the Window of Tolerance knowledge base.'`
- `pageType`: `'website'`
- `currentUrlPath`: `'graph'`
- `noindex`: `false`

**Cytoscape loading**: Add two `<script>` tags at the bottom of the body (after the layout's closing `</div>`, before the existing `app.js` script), or inject them via the layout function:
- Cytoscape.js from CDN: `https://unpkg.com/cytoscape@3/dist/cytoscape.min.js`
- Graph init script: `../../static/graph-init.js` (relative from `/wiki/graph/index.html`)

**Important**: The `layout()` function in `site.js` currently hard-codes the `<script>` tag for `app.js`. Either:
- (Preferred) Add an optional `extraScripts` parameter to `layout()` that appends additional `<script>` tags before `</body>`.
- Or: Inline the Cytoscape script tags into the `bodyHtml` itself (less clean but zero changes to `site.js`).

### Step 3: Write the graph initialization script

**File**: `web/public/graph-init.js` (new file — gets copied to `dist/static/graph-init.js` by the existing `copyDir` in build)

**Responsibilities**:
1. Fetch `graph.json` (relative path: `../../static/graph.json` from the graph page).
2. Initialize Cytoscape on `#cy`.
3. Map categories to colors matching the site's palette.
4. Handle node click → `window.location.href = node.data('url')`.

**Cytoscape configuration**:

```js
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('cy');
  if (!container) return;

  const res = await fetch('../../static/graph.json');
  const graph = await res.json();

  const categoryColors = {
    concepts: '#2f6f4f',    // --accent
    entities: '#1f6feb',    // --link
    practices: '#b45309',
    sources: '#6b7280',     // --muted
    syntheses: '#7c3aed',
    null: '#1d2127',        // --fg (for top-level pages)
  };

  const elements = [
    ...graph.nodes.map(n => ({
      data: { id: n.id, label: n.label, url: n.url, color: categoryColors[n.category] || '#1d2127' }
    })),
    ...graph.edges.map(e => ({
      data: { source: e.source, target: e.target }
    }))
  ];

  const cy = cytoscape({
    container,
    elements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': 'data(color)',
          'color': '#1d2127',
          'font-size': '10px',
          'text-valign': 'bottom',
          'text-margin-y': 5,
          'width': 20,
          'height': 20,
          'cursor': 'pointer',
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 1,
          'line-color': '#e5e7eb',
          'curve-style': 'bezier',
        }
      },
      {
        selector: 'node:active',
        style: { 'overlay-opacity': 0 }
      }
    ],
    layout: {
      name: 'cose',
      idealEdgeLength: 120,
      nodeOverlap: 20,
      nodeRepulsion: 8000,
      gravity: 0.3,
      animate: true,
      animationDuration: 1000,
    },
    minZoom: 0.3,
    maxZoom: 3,
  });

  cy.on('tap', 'node', (evt) => {
    const url = evt.target.data('url');
    if (url) window.location.href = url;
  });
});
```

**Layout choice**: `cose` (Compound Spring Embedder) — built into Cytoscape core, no extra dependency, works well for 73 nodes with moderate edge density. If the result is too tangled, `fcose` (via `cytoscape-fcose` plugin from CDN) is a drop-in upgrade but adds another script tag.

### Step 4: Add CSS for graph page elements

**File**: `web/public/style.css`  
**What**: Append styles for the legend and graph container.

```css
/* Graph view */
#cy {
  margin-top: 1rem;
}

.graph-legend {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--muted);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.25rem;
  vertical-align: middle;
}
```

### Step 5: Add nav link to the graph page

**File**: `web/lib/site.js`  
**What**: The graph page is not a wiki markdown page, so it won't appear in the sidebar nav automatically. Add a hard-coded link in `navHtml()`, after the filter input and before the category sections:

```js
// In navHtml(), after the topLevel block:
html += `<ul class="nav-toplevel"><li><a href="${hrefForPage({ urlPath: 'graph' })}"${currentUrlPath === 'graph' ? ' class="active"' : ''}>Concept Map</a></li></ul>`;
```

Alternatively, add a synthetic page entry to `buildIndex()` so it flows naturally. The simpler approach is the hard-coded nav link since the graph page isn't a wiki `.md` file.

**Also**: Add the graph page to the sitemap by pushing a synthetic entry into `pagesForSitemap` in `build.js`:
```js
pagesForSitemap.push({ urlPath: 'graph', title: 'Concept Map', description: 'Interactive graph...', lastUpdated: latestUpdate(index) });
```

### Step 6: Update `hrefForPageFactory` for the graph page

The graph page lives at `dist/wiki/graph/index.html`. The existing `hrefForPageFactory` and `depthForUrlPath` will handle `urlPath: 'graph'` correctly since it's a single-segment path — no changes needed. Verify by confirming `depthForUrlPath('graph')` returns `2` (wiki/ + graph/).

---

## Files Changed (summary)

| File | Change |
|---|---|
| `web/build.js` | Add `writeGraphJson()`, `renderGraphPage()`, call both in `build()`, add synthetic sitemap entry |
| `web/lib/site.js` | Add graph nav link in `navHtml()`, optionally add `extraScripts` param to `layout()` |
| `web/public/style.css` | Append graph legend styles (~15 lines) |
| `web/public/graph-init.js` | **New file** — Cytoscape initialization (~60 lines) |

**No new npm dependencies.** Cytoscape is loaded from CDN at runtime, matching the existing pattern of zero build tooling.

---

## Testing Checklist

- [ ] `node build.js` completes without errors
- [ ] `dist/static/graph.json` exists and contains valid JSON with nodes and edges
- [ ] `dist/wiki/graph/index.html` renders with sidebar nav, breadcrumbs, and the `#cy` container
- [ ] Graph renders in browser — nodes are visible, colored by category, labeled
- [ ] Clicking a node navigates to the correct wiki page
- [ ] Zooming and panning work
- [ ] Graph page link appears in sidebar nav and highlights when active
- [ ] Graph page appears in sitemap.xml
- [ ] No console errors on graph page or any other page
- [ ] Existing pages are unaffected (spot-check 3-4 pages)

---

## Edge Cases and Decisions

1. **Missing link targets**: Inline `[[links]]` that don't resolve to a page (8 unresolved per last lint) should be silently skipped in the graph — don't create phantom nodes.

2. **Self-referencing links**: If a page's markdown contains `[[its-own-name]]`, skip the self-loop edge.

3. **Source pages**: Sources have many outbound links but few inbound. They'll cluster at the periphery naturally with `cose` layout. Consider making source nodes slightly smaller (width/height 14 instead of 20) to reduce visual noise — but this is a polish decision, not blocking.

4. **CDN fallback**: If `unpkg.com` is down, the graph page degrades to an empty container. Acceptable for a static wiki. If offline use matters later, vendor the Cytoscape JS file into `web/public/`.

5. **Mobile**: The `#cy` container at `70vh` will be usable but cramped on phones. The `cose` layout and pinch-zoom handle it. No mobile-specific work needed for v1.

6. **Performance**: 73 nodes + ~350 edges is trivial for Cytoscape — it handles 10k+ elements. No lazy loading or virtualization needed.
