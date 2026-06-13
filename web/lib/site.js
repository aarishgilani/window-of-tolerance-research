const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const CATEGORY_LABELS = {
  concepts: 'Concepts',
  entities: 'Entities',
  practices: 'Practices',
  sources: 'Sources',
  syntheses: 'Syntheses',
};
const CATEGORY_ORDER = ['concepts', 'entities', 'practices', 'sources', 'syntheses'];

function walkMarkdown(dir, base = '') {
  let results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results = results.concat(walkMarkdown(full, rel));
    } else if (entry.name.toLowerCase().endsWith('.md')) {
      results.push(rel);
    }
  }
  return results;
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
}

// Scan the wiki directory and build a lookup of all pages, keyed by both
// filename slug and frontmatter title slug so [[wiki links]] can resolve
// either form.
function buildIndex(wikiDir) {
  const files = walkMarkdown(wikiDir).sort();
  const pages = [];
  for (const rel of files) {
    const full = path.join(wikiDir, rel);
    let raw;
    try {
      raw = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    let data = {};
    try {
      data = matter(raw).data || {};
    } catch {
      data = {};
    }
    const urlPath = rel.replace(/\.md$/i, '');
    const parts = rel.split('/');
    const category = parts.length > 1 ? parts[0] : null;
    const slug = slugify(path.basename(urlPath));
    pages.push({
      rel,
      urlPath,
      slug,
      title: data.title || slug,
      type: data.type || category || 'page',
      tags: Array.isArray(data.tags) ? data.tags : [],
      related: Array.isArray(data.related) ? data.related : [],
      lastUpdated: data.last_updated || null,
      category,
    });
  }

  const bySlug = new Map();
  for (const p of pages) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
    const titleSlug = slugify(p.title);
    if (!bySlug.has(titleSlug)) bySlug.set(titleSlug, p);
  }
  return { pages, bySlug };
}

// Resolve [[Page Name]] / [[slug]] / [[target|Display text]] into links or
// "missing page" markers, then leave the rest to marked.
function resolveWikiLinks(content, index, hrefForPage) {
  return content.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (match, target, _sep, display) => {
    const label = (display || target).trim();
    const key = slugify(target.trim());
    const page = index.bySlug.get(key);
    if (page) {
      return `[${label}](${hrefForPage(page)})`;
    }
    return `<span class="missing-link" title="No page yet for &quot;${escapeHtml(target.trim())}&quot;">${escapeHtml(label)}</span>`;
  });
}

function applyCallouts(html) {
  return html.replace(
    /<blockquote>\s*<p>\[CONTRADICTION\]/g,
    '<blockquote class="callout contradiction"><p><strong>⚠️ Contradiction:</strong>'
  );
}

function renderMarkdown(content, index, hrefForPage) {
  const withLinks = resolveWikiLinks(content, index, hrefForPage);
  return applyCallouts(marked.parse(withLinks));
}

function navHtml(index, currentUrlPath, hrefForPage) {
  const topLevel = index.pages.filter((p) => !p.category);
  const link = (p) => {
    const active = p.urlPath === currentUrlPath ? ' class="active"' : '';
    return `<li><a href="${hrefForPage(p)}"${active}>${escapeHtml(p.title)}</a></li>`;
  };

  let html = '';
  if (topLevel.length) {
    html += `<ul class="nav-toplevel">${topLevel.map(link).join('')}</ul>`;
  }

  for (const cat of CATEGORY_ORDER) {
    const items = index.pages
      .filter((p) => p.category === cat)
      .sort((a, b) => a.title.localeCompare(b.title));
    html += `<div class="nav-section">`;
    html += `<h3>${CATEGORY_LABELS[cat] || cat}</h3>`;
    if (items.length) {
      html += `<ul>${items.map(link).join('')}</ul>`;
    } else {
      html += `<p class="empty">(empty)</p>`;
    }
    html += `</div>`;
  }

  // Any categories present on disk but not in CATEGORY_ORDER
  const known = new Set(CATEGORY_ORDER);
  const otherCats = [...new Set(index.pages.map((p) => p.category).filter((c) => c && !known.has(c)))];
  for (const cat of otherCats) {
    const items = index.pages
      .filter((p) => p.category === cat)
      .sort((a, b) => a.title.localeCompare(b.title));
    html += `<div class="nav-section"><h3>${escapeHtml(cat)}</h3><ul>${items.map(link).join('')}</ul></div>`;
  }

  return html;
}

function layout({ title, currentUrlPath, index, bodyHtml, hrefForPage, staticHref, homeHref }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Window of Tolerance Wiki</title>
<link rel="stylesheet" href="${staticHref('style.css')}">
</head>
<body>
<div class="layout">
  <nav class="sidebar">
    <div class="sidebar-header"><a href="${homeHref}">Window of Tolerance Wiki</a></div>
    <input type="search" id="nav-filter" placeholder="Filter pages…">
    ${navHtml(index, currentUrlPath, hrefForPage)}
  </nav>
  <main class="content">
    ${bodyHtml}
  </main>
</div>
<script src="${staticHref('app.js')}"></script>
</body>
</html>`;
}

function metaHtml(data) {
  const rows = [];
  if (data.type) rows.push(`<span class="badge badge-type">${escapeHtml(data.type)}</span>`);
  const updated = formatDate(data.last_updated);
  if (updated) rows.push(`<span class="meta-item">Updated ${escapeHtml(updated)}</span>`);
  if (typeof data.source_count === 'number') {
    rows.push(`<span class="meta-item">${data.source_count} source${data.source_count === 1 ? '' : 's'}</span>`);
  }

  let html = rows.length ? `<div class="page-meta">${rows.join('')}</div>` : '';

  if (Array.isArray(data.tags) && data.tags.length) {
    html += `<div class="tags">${data.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`;
  }

  return html;
}

function relatedHtml(data, index, hrefForPage) {
  if (!Array.isArray(data.related) || !data.related.length) return '';
  const links = data.related.map((name) => {
    const key = slugify(name);
    const page = index.bySlug.get(key);
    if (page) {
      return `<a href="${hrefForPage(page)}">${escapeHtml(page.title)}</a>`;
    }
    return `<span class="missing-link" title="No page yet for &quot;${escapeHtml(name)}&quot;">${escapeHtml(name)}</span>`;
  });
  return `<div class="related"><strong>Related:</strong> ${links.join(', ')}</div>`;
}

function renderPageBody(wikiDir, page, index, hrefForPage) {
  const full = path.join(wikiDir, page.rel);
  const raw = fs.readFileSync(full, 'utf8');
  const { data, content } = matter(raw);
  const bodyHtml = renderMarkdown(content, index, hrefForPage);
  const articleHtml = `
    <article>
      <header class="page-header">
        <h1>${escapeHtml(data.title || page.title)}</h1>
        ${metaHtml(data)}
        ${relatedHtml(data, index, hrefForPage)}
      </header>
      <div class="markdown-body">${bodyHtml}</div>
    </article>`;
  return { data, articleHtml };
}

function renderAutoHomeBody(index, hrefForPage) {
  let html = `<article>
    <header class="page-header">
      <h1>Window of Tolerance Wiki</h1>
      <p class="subtitle">No <code>wiki/index.md</code> yet — here's an auto-generated overview of what exists.</p>
    </header>`;

  for (const cat of CATEGORY_ORDER) {
    const items = index.pages
      .filter((p) => p.category === cat)
      .sort((a, b) => a.title.localeCompare(b.title));
    html += `<section class="markdown-body"><h2>${CATEGORY_LABELS[cat] || cat}</h2>`;
    if (items.length) {
      html += '<ul>' + items.map((p) => `<li><a href="${hrefForPage(p)}">${escapeHtml(p.title)}</a></li>`).join('') + '</ul>';
    } else {
      html += '<p><em>No pages yet.</em></p>';
    }
    html += '</section>';
  }

  html += '</article>';
  return html;
}

function renderNotFoundBody(reqPath, homeHref) {
  return `<article>
    <header class="page-header"><h1>Page not found</h1></header>
    <div class="markdown-body">
      <p>No wiki page exists at <code>wiki/${escapeHtml(reqPath)}.md</code> yet.</p>
      <p>Per <code>CLAUDE.md</code>, a stub can be created for this page during the next ingest or query.</p>
      <p><a href="${homeHref}">&larr; Back to home</a></p>
    </div>
  </article>`;
}

module.exports = {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  walkMarkdown,
  slugify,
  escapeHtml,
  formatDate,
  buildIndex,
  resolveWikiLinks,
  applyCallouts,
  renderMarkdown,
  navHtml,
  layout,
  metaHtml,
  relatedHtml,
  renderPageBody,
  renderAutoHomeBody,
  renderNotFoundBody,
};
