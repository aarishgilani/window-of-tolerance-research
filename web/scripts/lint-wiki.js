const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const site = require('../lib/site');

const WIKI_DIR = path.resolve(__dirname, '..', '..', 'wiki');

const index = site.buildIndex(WIKI_DIR);
const inbound = new Map(index.pages.map((p) => [p.urlPath, 0]));
const unresolved = new Map(); // target -> Set of pages referencing it

for (const page of index.pages) {
  const full = path.join(WIKI_DIR, page.rel);
  const raw = fs.readFileSync(full, 'utf8');
  const { content, data } = matter(raw);

  const targets = [];
  const linkRe = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;
  let m;
  while ((m = linkRe.exec(content))) {
    targets.push(m[1].trim());
  }
  if (Array.isArray(data.related)) {
    for (const r of data.related) targets.push(String(r).trim());
  }

  for (const target of targets) {
    const key = site.slugify(target);
    const targetPage = index.bySlug.get(key);
    if (targetPage) {
      if (targetPage.urlPath !== page.urlPath) {
        inbound.set(targetPage.urlPath, (inbound.get(targetPage.urlPath) || 0) + 1);
      }
    } else {
      if (!unresolved.has(target)) unresolved.set(target, new Set());
      unresolved.get(target).add(page.urlPath);
    }
  }
}

console.log('=== Unresolved [[wiki links]] (no matching page) ===');
if (unresolved.size === 0) {
  console.log('(none)');
} else {
  for (const [target, pages] of unresolved) {
    console.log(`  "${target}" referenced from: ${[...pages].join(', ')}`);
  }
}

console.log('\n=== Orphan pages (zero inbound [[links]] from other pages) ===');
const topLevel = new Set(['index', 'overview', 'about', 'log']);
let orphanCount = 0;
for (const p of index.pages) {
  if (topLevel.has(p.urlPath)) continue;
  if ((inbound.get(p.urlPath) || 0) === 0) {
    console.log(`  ${p.urlPath} (${p.title})`);
    orphanCount++;
  }
}
if (orphanCount === 0) console.log('(none)');
