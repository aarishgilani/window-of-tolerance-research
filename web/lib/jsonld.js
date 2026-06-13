// Pure JSON-LD builders for the wiki's structured data. Each function takes
// already-resolved values (absolute URLs, formatted dates, descriptions) so
// this module has no dependency on site.js and can't form a require cycle.

function stripMarkdown(text) {
  return String(text)
    .replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (m, target, _sep, display) => (display || target).trim())
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Pulls list items (numbered or bulleted) out of a page's "## Protocol"
// section and returns them as plain-text strings, in order. Returns an
// empty array if there's no Protocol section or it has no list items.
function extractProtocolSteps(content) {
  const lines = String(content).split('\n');
  let inSection = false;
  const items = [];
  for (const line of lines) {
    if (/^##\s+Protocol\b/i.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^##\s/.test(line)) break;
    if (!inSection) continue;
    const m = line.match(/^\s*(?:\d+\.|[-*+])\s+(.+)$/);
    if (m) {
      const text = stripMarkdown(m[1]);
      if (text) items.push(text);
    }
  }
  return items;
}

// `crumbs` is the array from site.breadcrumbsForPage(): [{name, urlPath}, ...].
// The Home crumb and the current-page crumb get an `item` URL; a category
// crumb (urlPath: null — there's no per-category index page) doesn't.
function breadcrumbListJsonLd(crumbs, absoluteUrl) {
  if (!crumbs || !crumbs.length) return null;
  const itemListElement = crumbs.map((crumb, i) => {
    const item = { '@type': 'ListItem', position: i + 1, name: crumb.name };
    if (crumb.urlPath === 'index') {
      item.item = absoluteUrl('');
    } else if (crumb.urlPath) {
      item.item = absoluteUrl(crumb.urlPath);
    }
    return item;
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

// For concepts/ and entities/ pages: a term in the wiki's glossary, pointing
// back at the overview page as its DefinedTermSet.
function definedTermJsonLd(page, data, description, absoluteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: data.title || page.title,
    description,
    url: absoluteUrl(page.urlPath),
    inDefinedTermSet: absoluteUrl('overview'),
  };
}

// For overview.md: the glossary itself, listing every concept/entity page.
function definedTermSetJsonLd(page, data, description, index, absoluteUrl) {
  const terms = index.pages
    .filter((p) => p.category === 'concepts' || p.category === 'entities')
    .map((p) => ({ '@type': 'DefinedTerm', name: p.title, url: absoluteUrl(p.urlPath) }));
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: data.title || page.title,
    description,
    url: absoluteUrl(page.urlPath),
    hasDefinedTerm: terms,
  };
}

// For practices/ pages with a parseable "## Protocol" section. Returns null
// if there are fewer than 2 steps (no HowTo for that page).
function howToJsonLd(page, data, description, content, absoluteUrl) {
  const steps = extractProtocolSteps(content);
  if (steps.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.title || page.title,
    description,
    url: absoluteUrl(page.urlPath),
    step: steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
  };
}

// For syntheses/ (Article) and sources/ (TechArticle) pages.
function articleJsonLd(page, data, description, absoluteUrl, articleType, date) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': articleType,
    headline: data.title || page.title,
    description,
    url: absoluteUrl(page.urlPath),
  };
  if (date) {
    obj.datePublished = date;
    obj.dateModified = date;
  }
  return obj;
}

// For the homepage.
function websiteJsonLd(siteUrl, siteName, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description,
  };
}

function renderJsonLdScripts(objects) {
  return objects
    .filter(Boolean)
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n');
}

module.exports = {
  extractProtocolSteps,
  breadcrumbListJsonLd,
  definedTermJsonLd,
  definedTermSetJsonLd,
  howToJsonLd,
  articleJsonLd,
  websiteJsonLd,
  renderJsonLdScripts,
};
