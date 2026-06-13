// IndexNow lets a site push "this URL changed" notifications to participating
// search engines instead of waiting for them to recrawl. One POST here fans
// out to Bing, Yandex, Seznam, and Naver/Yep — but NOT Google, which doesn't
// participate in IndexNow (Bing Webmaster Tools is the separate path that
// covers Google indexing signals, see web/SEO-STRATEGY.md §6.1).
//
// Usage:
//   node submit-indexnow.js                  # submit every <loc> in dist/sitemap.xml
//   node submit-indexnow.js <url1> <url2> …  # submit only the given URLs

const fs = require('fs');
const path = require('path');
const { SITE_URL, INDEXNOW_KEY } = require('../lib/site');

const SITEMAP_PATH = path.resolve(__dirname, '..', 'dist', 'sitemap.xml');
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function urlsFromSitemap(sitemapPath) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const urls = [];
  const locRe = /<loc>(.*?)<\/loc>/g;
  let m;
  while ((m = locRe.exec(xml))) {
    urls.push(m[1].trim());
  }
  return urls;
}

async function main() {
  const args = process.argv.slice(2);
  const urlList = args.length ? args : urlsFromSitemap(SITEMAP_PATH);

  if (!urlList.length) {
    console.error('No URLs to submit.');
    process.exit(1);
  }

  const host = new URL(SITE_URL).host;
  const keyLocation = `${SITE_URL}${INDEXNOW_KEY}.txt`;
  const body = { host, key: INDEXNOW_KEY, keyLocation, urlList };

  console.log(`Submitting ${urlList.length} URL(s) to ${ENDPOINT}`);
  console.log(`  host: ${host}`);
  console.log(`  keyLocation: ${keyLocation}`);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  if (text) console.log(`Response: ${text}`);

  if (res.status >= 300) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
