const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const jsonld = require('./jsonld');

const CATEGORY_LABELS = {
  concepts: 'Concepts',
  entities: 'Entities',
  practices: 'Practices',
  sources: 'Sources',
  syntheses: 'Syntheses',
};
const CATEGORY_ORDER = ['concepts', 'entities', 'practices', 'sources', 'syntheses'];

const SITE_URL = 'https://aarishgilani.github.io/window-of-tolerance-research/';
const SITE_DESCRIPTION = 'A cross-referenced wiki on the Window of Tolerance, polyvagal theory, interoception, and nervous-system regulation — concepts, mechanisms, and practices with inline source citations.';

// IndexNow key: not a secret — publicly hosted at `${SITE_URL}${INDEXNOW_KEY}.txt`
// (see writeIndexNowKey in build.js) so Bing/Yandex/Seznam/Naver/Yep can verify
// submissions against this host.
const INDEXNOW_KEY = '088372556d933852fc61dea3b4aaf8fe';

// Maps a page's urlPath ('' for home, 'concepts/foo' for content pages) to an
// absolute URL under SITE_URL, matching build.js's dist/ output layout.
function absoluteUrl(urlPath) {
  if (!urlPath) return SITE_URL;
  return `${SITE_URL}wiki/${urlPath}/`;
}

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

// Derive a meta-description-length summary from a page's markdown body: the
// first paragraph that isn't a heading/blockquote/list/code block, with
// markdown formatting stripped and truncated at a word boundary.
function deriveDescription(content, maxLen = 155) {
  const blocks = String(content).split(/\n\s*\n/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^#{1,6}\s/.test(trimmed)) continue;
    if (/^>/.test(trimmed)) continue;
    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) continue;
    if (/^```/.test(trimmed)) continue;

    const text = trimmed
      .replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (m, target, _sep, display) => (display || target).trim())
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;

    if (text.length <= maxLen) return text;
    const truncated = text.slice(0, maxLen);
    const lastSpace = truncated.lastIndexOf(' ');
    return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}…`;
  }
  return null;
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

function layout({
  title,
  description,
  canonicalUrlPath,
  pageType = 'article',
  ogImage,
  noindex = false,
  currentUrlPath,
  index,
  bodyHtml,
  hrefForPage,
  staticHref,
  homeHref,
  jsonLd,
}) {
  const desc = description || SITE_DESCRIPTION;
  const image = ogImage || `${absoluteUrl('')}static/og-default.png`;
  const canonical = canonicalUrlPath != null ? absoluteUrl(canonicalUrlPath) : null;
  const jsonLdHtml = jsonLd && jsonLd.length ? jsonld.renderJsonLdScripts(jsonLd) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Window of Tolerance Wiki</title>
<meta name="description" content="${escapeHtml(desc)}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:type" content="${pageType === 'website' ? 'website' : 'article'}">
${canonical ? `<meta property="og:url" content="${canonical}">` : ''}
<meta property="og:image" content="${image}">
<meta property="og:site_name" content="Window of Tolerance Wiki">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" type="image/svg+xml" href="${staticHref('favicon.svg')}">
<link rel="stylesheet" href="${staticHref('style.css')}">
${jsonLdHtml}
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
    ${footerHtml(index, hrefForPage)}
  </main>
</div>
<script src="${staticHref('app.js')}"></script>
</body>
</html>`;
}

// Trail of crumbs for a page: Home -> [Category] -> Page Title. The category
// crumb (if any) has no urlPath since there's no per-category index page.
// Returns null for the homepage (no breadcrumbs).
function breadcrumbsForPage(page, index) {
  if (page.urlPath === 'index') return null;
  const crumbs = [{ name: 'Home', urlPath: 'index' }];
  if (page.category) {
    crumbs.push({ name: CATEGORY_LABELS[page.category] || page.category, urlPath: null });
  }
  crumbs.push({ name: page.title, urlPath: page.urlPath });
  return crumbs;
}

// Renders the breadcrumb trail as a nav. Home links to homeHref (the
// homepage lives at dist/index.html, not dist/wiki/index/, so it can't use
// hrefForPage); the category crumb (if any) and the current page are plain
// text, with aria-current="page" on the current page.
function breadcrumbsHtml(crumbs, homeHref) {
  if (!crumbs || !crumbs.length) return '';
  const parts = crumbs.map((crumb, i) => {
    if (i === crumbs.length - 1) {
      return `<span aria-current="page">${escapeHtml(crumb.name)}</span>`;
    }
    if (crumb.urlPath === 'index') {
      return `<a href="${homeHref}">${escapeHtml(crumb.name)}</a>`;
    }
    return `<span>${escapeHtml(crumb.name)}</span>`;
  });
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${parts.join('<span class="sep">/</span>')}</nav>`;
}

// Site-wide "content last updated" date: the max last_updated across all pages.
function latestUpdate(index) {
  let latest = null;
  for (const p of index.pages) {
    if (p.lastUpdated && (!latest || p.lastUpdated > latest)) latest = p.lastUpdated;
  }
  return formatDate(latest);
}

function footerHtml(index, hrefForPage) {
  const links = [];
  const about = index.pages.find((p) => p.urlPath === 'about');
  if (about) links.push(`<a href="${hrefForPage(about)}">About</a>`);
  const wikiIndex = index.pages.find((p) => p.urlPath === 'index');
  if (wikiIndex) links.push(`<a href="${hrefForPage(wikiIndex)}">Full index</a>`);

  const updated = latestUpdate(index);
  const linksHtml = links.length ? `<div class="footer-links">${links.join(' · ')}</div>` : '';
  const updatedHtml = updated ? `<div class="footer-updated">Content last updated: ${escapeHtml(updated)}</div>` : '';

  if (!linksHtml && !updatedHtml) return '';
  return `<footer class="site-footer">${linksHtml}${updatedHtml}</footer>`;
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

// Assembles the JSON-LD objects for a page: a BreadcrumbList for every page
// (except the homepage, which has none), plus one type-specific object based
// on the page's category/urlPath (DefinedTerm, DefinedTermSet, HowTo,
// Article/TechArticle, or WebSite for the homepage).
function buildJsonLd(page, data, content, description, index, crumbs) {
  const objects = [];

  const breadcrumbs = jsonld.breadcrumbListJsonLd(crumbs, absoluteUrl);
  if (breadcrumbs) objects.push(breadcrumbs);

  if (page.urlPath === 'index') {
    objects.push(jsonld.websiteJsonLd(SITE_URL, 'Window of Tolerance Wiki', description));
  } else if (page.urlPath === 'overview') {
    objects.push(jsonld.definedTermSetJsonLd(page, data, description, index, absoluteUrl));
  } else if (page.category === 'concepts' || page.category === 'entities') {
    objects.push(jsonld.definedTermJsonLd(page, data, description, absoluteUrl));
  } else if (page.category === 'practices') {
    const howTo = jsonld.howToJsonLd(page, data, description, content, absoluteUrl);
    if (howTo) objects.push(howTo);
  } else if (page.category === 'syntheses') {
    objects.push(jsonld.articleJsonLd(page, data, description, absoluteUrl, 'Article', formatDate(data.last_updated)));
  } else if (page.category === 'sources') {
    objects.push(jsonld.articleJsonLd(page, data, description, absoluteUrl, 'TechArticle', formatDate(data.last_updated)));
  }

  return objects;
}

function renderPageBody(wikiDir, page, index, hrefForPage, homeHref) {
  const full = path.join(wikiDir, page.rel);
  const raw = fs.readFileSync(full, 'utf8');
  const { data, content } = matter(raw);
  const bodyHtml = renderMarkdown(content, index, hrefForPage);
  const description = data.description || deriveDescription(content) || `${data.title || page.title} — Window of Tolerance Wiki`;
  const crumbs = breadcrumbsForPage(page, index);
  const jsonLd = buildJsonLd(page, data, content, description, index, crumbs);
  const articleHtml = `
    <article>
      <header class="page-header">
        ${breadcrumbsHtml(crumbs, homeHref)}
        <h1>${escapeHtml(data.title || page.title)}</h1>
        ${metaHtml(data)}
        ${relatedHtml(data, index, hrefForPage)}
      </header>
      <div class="markdown-body">${bodyHtml}</div>
    </article>`;
  return { data, description, articleHtml, jsonLd };
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
  SITE_URL,
  SITE_DESCRIPTION,
  INDEXNOW_KEY,
  absoluteUrl,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  walkMarkdown,
  slugify,
  escapeHtml,
  formatDate,
  deriveDescription,
  buildIndex,
  resolveWikiLinks,
  applyCallouts,
  renderMarkdown,
  navHtml,
  layout,
  breadcrumbsForPage,
  breadcrumbsHtml,
  latestUpdate,
  footerHtml,
  metaHtml,
  relatedHtml,
  renderPageBody,
  renderAutoHomeBody,
  renderNotFoundBody,
};
