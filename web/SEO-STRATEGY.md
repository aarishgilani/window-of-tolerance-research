# SEO Strategy — Window of Tolerance Wiki

A roadmap for making the static wiki at `web/` a well-ranked, frequently-cited
reference for Window of Tolerance / polyvagal theory / interoception /
nervous-system-regulation topics. Audience is dual: general public searching
for accessible explanations ("what is the vagal brake", "how to do the
physiological sigh") and clinicians/students wanting mechanistic depth with
citations.

This is a planning document for the **web subproject** — it intentionally
lives outside `wiki/` because it doesn't fit the concept/entity/practice/
source/synthesis schema in `CLAUDE.md`.

---

## 0. Blocking decision: pick the final URL *before* it gets cited

**This is the single highest-leverage item and should be resolved first.**

The site will currently deploy to a GitHub Pages *project page*
(`https://<username>.github.io/<repo-name>/`). Every piece of SEO
infrastructure below — canonical URLs, `sitemap.xml`, `robots.txt`,
Open Graph tags, JSON-LD — needs an absolute base URL baked in.

The risk: if a custom domain is added *later*, after the project-page URLs
have been indexed and cited (the explicit goal of this effort), every
backlink and citation built up will point at dead or duplicate URLs. GitHub
Pages does not provide automatic redirects from a project page to a
subsequently-added custom domain.

**Decide now:**
- Stick with `https://<username>.github.io/<repo-name>/` permanently, or
- Set up a custom domain (via `CNAME`) *before* any outreach/indexing work
  begins.

Once decided, the base URL becomes a single constant (e.g.
`SITE_URL` in `web/lib/site.js`) that feeds everything else in this plan.

---

## 1. Current State Audit

**What's already strong (don't lose this):**
- Clean, descriptive URL structure: `/wiki/concepts/window-of-tolerance/`
  — lowercase, hyphenated, human-readable.
- Dense internal cross-linking via `[[wiki links]]` — this is the single
  biggest SEO asset the project has. ~34 interlinked pages already form a
  topic cluster around a strong "pillar" term (Window of Tolerance).
- `CLAUDE.md`'s "one claim, one source" rule produces inline citations
  `(Lesson 2)`, which is a genuine E-E-A-T (Experience/Expertise/
  Authoritativeness/Trust) signal once real sources (Porges, Siegel,
  Barrett papers) are cited alongside lesson notes.
- `last_updated` frontmatter already exists and renders on-page — good
  freshness signal.
- Proper `<h1>` per page, semantic `<article>`/`<nav>`, `lang="en"`,
  responsive viewport meta tag, working 404 page.
- HTTPS automatic via GitHub Pages.

**What's missing (the gap this plan closes):**
- No meta `description` on any page (search engines will fall back to
  auto-snippeting, which is unpredictable for a sidebar-heavy layout).
- No `<link rel="canonical">`.
- No Open Graph / Twitter Card tags — links shared on social/Slack/Discord
  render with no preview.
- No `sitemap.xml` or `robots.txt`.
- No structured data (JSON-LD) — missing easy wins for "DefinedTerm" /
  "HowTo" / "Article" rich results.
- No favicon.
- `wiki/syntheses/` is empty — this is the category best aligned with how
  people actually search ("how is meditation different from dissociation",
  "orchids vs dandelions sensitivity") and is currently 0% built out.
- No images/diagrams anywhere — high-value for shareability and Google
  Images traffic on a visual-friendly topic (polyvagal ladder, window
  diagram).
- No footer / About page — no author/methodology context for trust signals.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target horizon |
|---|---|---|
| Pages indexed | `site:` count in Google Search Console | All ~34+ pages within 4–6 weeks of launch |
| Ranking for branded/core term | "window of tolerance" position | Top 20 within 3 months, top 10 within 6–12 |
| Long-tail traffic | Impressions/clicks on practice pages (e.g. "physiological sigh", "box breathing") | Steady month-over-month growth via GSC |
| Rich results | DefinedTerm/HowTo/FAQ rich result appearances | Present within 2–3 months of structured data rollout |
| Referencing | Inbound links from forums/directories/other sites | Track via GSC "Links" report |
| Engagement | Avg. pages/session (proxy for internal-link effectiveness) | >2 pages/session |

---

## 3. Strategy Pillars

### Pillar A — Technical SEO Foundation (P0)

These are mechanical, low-risk, and unlock everything else. All live in
`web/build.js` / `web/lib/site.js` (the templating layer), so they apply
to every generated page automatically.

1. **Base URL constant** — depends on Item 0. Add `SITE_URL` to
   `lib/site.js`, used to build absolute URLs for everything below.
2. **Meta description per page** — add a `description` field to the
   wiki frontmatter schema (alongside `title`, `type`, `tags`, etc.).
   - Fallback in `renderPageBody`: if `description` is absent, derive it
     from the first non-heading paragraph of the markdown body, stripped
     of formatting and truncated to ~155 chars.
   - This requires a small, one-time backfill pass writing a 1-sentence
     `description:` into each existing page's frontmatter (~34 pages) —
     a good task to fold into the next "lint" pass per `CLAUDE.md`.
3. **Canonical tag** — `<link rel="canonical" href="{SITE_URL}{path}">`
   on every page, generated from the same `hrefForPage`/path logic
   `build.js` already has.
4. **Open Graph + Twitter Card tags** — `og:title`, `og:description`,
   `og:type` (`article` for content pages, `website` for home),
   `og:url`, `og:image`, `twitter:card=summary_large_image`. Needs one
   default social-share image (see Pillar E, diagrams) — a single
   1200×630 branded card is enough to start; reuse it across all pages.
5. **`robots.txt`** — generated into `dist/`, allow-all, points at
   `sitemap.xml`.
6. **`sitemap.xml`** — generated from `index.pages` in `build.js`, using
   `last_updated` as `<lastmod>`. Exclude nothing initially; revisit if
   `lesson-N` source pages turn out to be thin/duplicate.
7. **Favicon** — add `favicon.svg`/`favicon.ico` to `web/public/`,
   reference in `<head>`.
8. **`CNAME`** — only if a custom domain is chosen in Item 0.

### Pillar B — Structured Data (JSON-LD) (P1)

High payoff for a glossary/reference-style site because Schema.org has
purpose-built types for exactly this content shape:

- **`DefinedTerm`** on every `concepts/` and `entities/` page — Google
  can surface these for "define X" / "what is X" queries. Pair with
  `inDefinedTermSet` pointing at a `DefinedTermSet` for the whole wiki
  (could live on `overview.md`).
- **`HowTo`** on every `practices/` page — steps already exist in the
  "Protocol" section per the `CLAUDE.md` page structure; map directly to
  `HowTo.step`. Strong candidate for rich results on practice queries
  ("how to do the physiological sigh").
- **`Article`** (or `TechArticle`) on `syntheses/` and `sources/` pages,
  with `datePublished`/`dateModified` from `last_updated`.
- **`BreadcrumbList`** on every page reflecting
  Home → Category → Page, matching the URL structure.
- **`WebSite`** on the homepage with `name` and `url` (skip
  `SearchAction`/sitelinks search box — the nav filter is client-side
  only and not a real search endpoint).
- **`Organization`/`Person`** — tied to the About/methodology page in
  Pillar D, referenced as `author`/`publisher` on content pages.

All of this can be generated centrally in `lib/site.js` from frontmatter
that already exists (`type`, `title`, `last_updated`, `related`) plus the
new `description` field — no per-page authoring burden beyond what
Pillar A already requires.

### Pillar C — Information Architecture & Internal Linking (P1)

The cross-linking graph is already the project's strongest asset. To
sharpen it for SEO:

1. **Pillar page strategy** — `overview.md` (rendered at `/wiki/overview/`)
   should function as the hub page for the core term "Window of
   Tolerance," linking out to every concept/practice in a structured way.
   Confirm it's reachable from the homepage with prominent, descriptive
   anchor text (not just "overview").
2. **Anchor text audit** — `[[wiki links]]` currently render using the
   target page's title or a custom display string. Prefer descriptive,
   keyword-relevant anchor text over generic phrases like "see here."
   This is mostly already the case based on the sample page reviewed
   (`window-of-tolerance.md` uses anchors like `[[vagal-brake]]`,
   `[[co-regulation]]`) — keep this discipline as new pages are added.
3. **Orphan page check** — `CLAUDE.md`'s existing "Lint" operation already
   covers this. Run it once SEO work begins; every page should have at
   least one inbound link from another wiki page.
4. **Breadcrumb UI** — add a small breadcrumb trail
   (Home / Concepts / Window of Tolerance) at the top of each
   `page-header`. Doubles as the visual counterpart to the
   `BreadcrumbList` JSON-LD in Pillar B and helps users (and crawlers)
   understand hierarchy.
5. **Footer with site-wide links** — About/Methodology, full sitemap
   (human-readable `/wiki/index/` already exists — link it from the
   footer of every page), and last-updated date. Improves crawl depth
   and gives every page a path back to the hub.

### Pillar D — Content Strategy & E-E-A-T (P1, ongoing)

1. **About / Methodology page** — new top-level page (e.g.
   `wiki/about.md`, rendered outside the `concepts/entities/...`
   categories like `index.md`/`overview.md`/`log.md` already are).
   Should cover: what this wiki is, how it's compiled (Heptabase course
   notes + cited academic sources), the citation policy ("one claim, one
   source"), and how to suggest corrections. This is the page that
   answers "who made this and can I trust it" — important for
   health-adjacent (YMYL-adjacent) content and for `Organization`/`Person`
   structured data in Pillar B.
2. **Fill out `wiki/syntheses/`** — currently empty, but it's the category
   most aligned with actual search queries (questions, comparisons,
   "X vs Y"). Per `CLAUDE.md`'s existing "Query" operation, every
   non-trivial question the human asks should already be filed here —
   this is a content engine that's defined but unused. Prioritize
   syntheses that map to real search intent, e.g.:
   - "orchids vs. dandelions" sensitivity spectrum
   - "is this meditation or dissociation?" (distinguishing regulation
     from hypoarousal)
   - "polyvagal theory criticisms / is it scientifically accepted?"
     (a genuinely high-volume, high-controversy query worth addressing
     even-handedly — builds trust by not overclaiming)
   - "vagus nerve exercises that actually work" (evidence-graded roundup
     linking to the `practices/` pages)
3. **Title tag formula** — current pattern is
   `{Page Title} · Window of Tolerance Wiki` (e.g. *"Resonance Frequency
   Breathing (0.1 Hz) · Window of Tolerance Wiki"* — already near the
   ~60-char display limit). Keep keyword-first ordering (already correct),
   but for long titles consider an optional `seo_title` frontmatter
   override to keep the keyword-bearing portion under ~55 chars before
   the brand suffix gets truncated in SERPs.
4. **Strengthen citations over time** — `(Lesson N)` citations are good
   for traceability but carry little external authority. As capacity
   allows, add direct citations to primary sources (Porges 2011, Siegel,
   Barrett, Lionetti 2018, etc.) alongside or in place of lesson
   citations on the most-trafficked pages (Window of Tolerance, Polyvagal
   Theory, Vagus Nerve, Physiological Sigh).

### Pillar E — Visual Content (P2)

- No images currently exist anywhere in the site. For this topic space,
  simple original diagrams are disproportionately shareable and link-
  worthy:
  - A "Window of Tolerance" band diagram (the three zones) on
    `concepts/window-of-tolerance.md` and `concepts/three-zones.md`.
  - A "polyvagal ladder" diagram on `concepts/evolutionary-stack.md`.
  - A vagal brake / HRV diagram on `concepts/vagal-brake.md` or
    `concepts/hrv.md`.
- These serve double duty: Google Images discovery traffic, and a single
  reusable default OG image (Pillar A item 4) can be derived from the
  same visual style.
- All images need descriptive `alt` text (the markdown pipeline already
  passes through to `marked`, so `![alt text](path)` works as-is).

### Pillar F — AI/LLM Discoverability (P2, low-effort/high-relevance)

Given the dual audience and the increasing share of research traffic
arriving via AI assistants (ChatGPT, Perplexity, Claude itself) rather
than classic search:

- **`llms.txt`** at the site root — an emerging convention (a plain-text
  index of key pages with short descriptions) that some AI crawlers use
  to prioritize what to read. Cheap to generate from `index.pages`
  alongside `sitemap.xml`.
- The existing clean markdown-to-HTML structure with consistent
  frontmatter is already well-suited to being parsed by LLMs — no major
  changes needed beyond making sure `description` fields (Pillar A) are
  information-dense, since these often get used verbatim in AI summaries.

### Pillar G — Off-Page / Authority Building (P2, manual/ongoing)

- **Search Console + Analytics** — see §6 for a concrete implementation
  plan (verification method, GA4 wiring, privacy considerations).
- **Bing Webmaster Tools** — Bing supports importing a verified Google
  Search Console property directly, so this is a near-zero-cost follow-on
  once §6.1 is done.
- **Directory/resource-list outreach** — once content is live and the
  About page exists, submit to relevant aggregators: polyvagal
  theory/trauma-informed resource lists, HRV biofeedback communities,
  breathwork resource roundups.
- **Community sharing** — syntheses pages (Pillar D) are well-suited to
  sharing in relevant communities (r/CPTSD, r/Polyvagal, trauma-informed
  practitioner groups) where a well-cited explainer is genuinely useful
  — natural backlink generation rather than link-building for its own
  sake.
- **Reciprocal citation** — pages that cite primary sources (Porges,
  Siegel, Barrett) by name and link to publisher/DOI pages where
  possible; while these won't link back, precise citation increases
  trust signals and occasionally surfaces in citation-tracking tools.

---

## 4. Prioritized Roadmap

| Priority | Item | Effort | Depends on |
|---|---|---|---|
| **P0** | Decide final URL (custom domain vs. project page) | Decision only | — |
| **P0** | `SITE_URL` constant + canonical tags | Small | URL decision |
| **P0** | `description` frontmatter field + fallback + backfill ~34 pages | Medium | — |
| **P0** | `sitemap.xml` + `robots.txt` generation in `build.js` | Small | `SITE_URL` |
| **P0** | OG/Twitter meta tags + 1 default social image | Small–Medium | `SITE_URL`, image |
| **P0** | Favicon | Tiny | — |
| **P1** | JSON-LD: `DefinedTerm`, `HowTo`, `Article`, `BreadcrumbList`, `WebSite` | Medium | `SITE_URL`, `description` |
| **P1** | About/Methodology page + footer with sitewide links | Small–Medium | — |
| **P1** | Breadcrumb UI | Small | — |
| **P1** | Run `CLAUDE.md` lint pass (orphans, stubs, contradictions) | Medium | — |
| **P1** | Fill `wiki/syntheses/` with 3–5 search-intent-mapped pages | Ongoing | — |
| **P2** | Original diagrams for top concept pages | Medium | — |
| **P2** | `llms.txt` | Tiny | sitemap |
| **P2** | Search Console / Bing Webmaster setup + sitemap submission | Small | deployment |
| **P2** | Outreach to resource lists/communities | Ongoing | content live |

---

## 5. Implementation Touchpoints (for a follow-up session)

All P0/P1 technical items are centralized — no per-page template
duplication required:

- `web/lib/site.js` — `layout()` is the single place to add `<head>`
  meta tags (description, canonical, OG/Twitter, favicon, JSON-LD
  `<script type="application/ld+json">`). `renderPageBody()` is where
  per-page `description`/`datePublished` data gets extracted from
  frontmatter.
- `web/build.js` — add two new write steps: `sitemap.xml` and
  `robots.txt` (and optionally `llms.txt`), built from `index.pages`
  after the existing per-page loop. Also where `SITE_URL` would be
  defined/imported.
- `wiki/*.md` frontmatter — add `description:` field to the schema
  documented in `CLAUDE.md`'s "Wiki Page Conventions" section, and to
  every existing page (one-time backfill).
- `wiki/about.md` (new) — top-level page alongside `index.md`,
  `overview.md`, `log.md`.
- `web/public/` — new favicon + default OG image assets.
- `CLAUDE.md` — once `description` becomes a required frontmatter field,
  add it to the YAML block documented under "Wiki Page Conventions" so
  future ingests include it automatically.
