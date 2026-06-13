# Window of Tolerance — LLM Wiki Schema

This project is a persistent knowledge base about autonomic nervous system regulation, polyvagal theory, interoception, and the Window of Tolerance. The raw sources are Heptabase cards exported as markdown (lesson notes, concept cards, Q&A) and research papers (PDFs). The wiki is the compiled, cross-referenced synthesis of all of it.

You (the LLM) write and maintain the wiki. The human curates sources, asks questions, and directs analysis.

---

## Directory Structure

```
/
├── CLAUDE.md          ← this file; the schema
├── raw/               ← immutable source documents; never modify
│   └── Heptabase-Data-Backup-*/
│       └── Card Library/   ← lesson notes and concept cards (.md)
│                           ← research papers (.pdf)
└── wiki/              ← LLM-maintained; you own this entirely
    ├── index.md       ← content catalog; update on every ingest
    ├── log.md         ← append-only activity log
    ├── overview.md    ← high-level synthesis of the whole domain
    ├── concepts/      ← one page per core concept or mechanism
    ├── entities/      ← people, frameworks, anatomical structures
    ├── practices/     ← breathwork, somatic, meditation techniques
    ├── sources/       ← one summary page per ingested source
    └── syntheses/     ← comparisons, analyses, filed Q&A
```

---

## Wiki Page Conventions

Every wiki page must have a YAML frontmatter block:

```yaml
---
title: "Page Title"
type: concept | entity | practice | source | synthesis | overview
tags: [list, of, relevant, tags]
related: [Other Page, Another Page]
source_count: 0        # for concept/entity pages: how many sources support it
last_updated: YYYY-MM-DD
---
```

**Cross-reference liberally.** When a page mentions a concept, person, or practice that has its own page, link it with `[[Page Name]]`. If the page doesn't exist yet, create it (a stub is fine).

**One claim, one source.** When stating a fact on a concept page, append a source citation inline: `(Lesson 2 note)` or `(Porges 2011)`. This makes contradictions traceable.

---

## Domain Context

The four pillars of this knowledge base:

1. **Window of Tolerance** — Dr. Dan Siegel's framework: a bandwidth of optimal arousal (regulated zone) bounded by hyper-arousal (fight/flight) above and hypo-arousal (shutdown/freeze) below. The goal is to widen this window through deliberate practice.

2. **Autonomic Nervous System (ANS)** — The biological substrate. Sympathetic branch (mobilization/gas pedal) vs. parasympathetic branch (recovery/brake). The vagus nerve is the primary parasympathetic highway (80% afferent — body reports to brain).

3. **Interoception** — The internal sensory feed: reading the body's physiological state in real time. The insular cortex integrates these signals. Widening interoceptive awareness is a prerequisite for deliberate regulation.

4. **Vagal Tone & Practices** — The practical toolkit: breathwork (RSA, extended exhale, box breathing, physiological sigh), somatic movement (yoga, body scan), HRV biofeedback, cold exposure, co-regulation.

**Key theorists/entities:** Dan Siegel, Stephen Porges (Polyvagal Theory), Lisa Feldman Barrett (Predictive Processing / constructed emotion), Nassim Taleb (antifragility, referenced for robustness framing).

---

## Page Types

### `concepts/` — Core mechanisms and ideas
Examples: `window-of-tolerance.md`, `allostatic-load.md`, `neuroception.md`, `respiratory-sinus-arrhythmia.md`

Structure:
1. One-paragraph definition
2. Mechanism (how it works)
3. Relevance to the Window of Tolerance
4. Related concepts
5. Sources

### `entities/` — People, anatomical structures, frameworks
Examples: `vagus-nerve.md`, `dan-siegel.md`, `polyvagal-theory.md`, `insular-cortex.md`

Structure:
1. One-line description
2. Key contributions / functional role
3. How it appears in this domain
4. Related pages

### `practices/` — Techniques and interventions
Examples: `extended-exhale-breathing.md`, `hrv-biofeedback.md`, `body-scan.md`, `cold-exposure.md`

Structure:
1. What it is
2. Mechanism (which physiological system it targets and why)
3. Protocol (how to do it)
4. Evidence / caveats
5. When to use (hyper vs. hypo arousal context)

### `sources/` — One page per ingested source
Examples: `lesson-1-note.md`, `porges-polyvagal-discovery.md`, `lionetti-2018-dandelions-tulips-orchids.md`

Structure:
1. Source metadata (title, type, date ingested)
2. Summary (3–5 bullets)
3. Key claims
4. Pages updated during ingest
5. Open questions raised

### `syntheses/` — Comparisons, analyses, filed answers
Examples: `robustness-vs-antifragility.md`, `orchids-dandelions-sensitivity-spectrum.md`, `distinguishing-meditation-from-hypoarousal.md`

Structure: free-form, but always include a `## Sources` section at the bottom.

---

## Operations

### Ingest

When the human drops a new source and asks you to process it:

1. Read the source in full.
2. Discuss key takeaways briefly (2–3 sentences) before writing anything.
3. Create a `sources/` page for it.
4. Create or update any `concepts/`, `entities/`, or `practices/` pages touched by the source. Note contradictions with existing pages explicitly — don't silently overwrite claims.
5. Update `wiki/index.md` with the new source and any new concept/entity pages created.
6. Append an entry to `wiki/log.md`:
   ```
   ## [YYYY-MM-DD] ingest | Source Title
   Pages created: ...
   Pages updated: ...
   ```

For the Heptabase card library: each `Lesson N note.md` is a lesson summary. Each standalone card (`The Vagus Nerve.md`, `Neuroception.md`, etc.) is a concept card. Ingest lesson notes first to build the scaffold, then individual concept cards to deepen it.

### Query

When the human asks a question:

1. Read `wiki/index.md` to identify relevant pages.
2. Read those pages and synthesize an answer with inline citations.
3. If the answer is non-trivial (a comparison, a mechanism walkthrough, a synthesis of multiple concepts), file it as a new page in `wiki/syntheses/` — good answers shouldn't disappear into chat history.
4. If filing a synthesis, append to `wiki/log.md`:
   ```
   ## [YYYY-MM-DD] query | Brief description
   Filed: wiki/syntheses/filename.md
   ```

### Lint

When asked to health-check the wiki:

1. Scan for contradictions between pages (flag them with `> [CONTRADICTION]` callouts on the affected pages).
2. Identify orphan pages (no inbound links from other wiki pages).
3. Identify concepts mentioned across multiple pages that lack their own dedicated page — create stubs.
4. Check for stale claims that newer sources have superseded.
5. Suggest 3–5 questions worth investigating or sources worth finding.
6. Log the lint pass:
   ```
   ## [YYYY-MM-DD] lint
   Issues found: N
   Fixed: ...
   Open: ...
   ```

---

## index.md Format

The index is organized by category. Each entry: `- [[Page Name]] — one-line description`

```markdown
# Wiki Index

## Overview
- [[overview]] — High-level synthesis of the Window of Tolerance knowledge base

## Concepts
- [[window-of-tolerance]] — Dan Siegel's framework for optimal arousal bandwidth
- ...

## Entities
- [[vagus-nerve]] — Primary parasympathetic highway; 80% afferent
- ...

## Practices
- [[extended-exhale-breathing]] — Activates parasympathetic via RSA
- ...

## Sources
- [[lesson-1-note]] — Course intro, three zones, window shape
- ...

## Syntheses
- ...
```

---

## log.md Format

Append-only. Each entry prefixed with `## [YYYY-MM-DD] <operation> | <title>` so it's greppable:

```bash
grep "^## \[" wiki/log.md | tail -10   # last 10 entries
grep "ingest" wiki/log.md              # all ingests
```

---

## Style Notes

- Write concept pages for a reader who understands the domain but is encountering this specific mechanism for the first time. No jargon without definition on first use within a page.
- Prefer mechanistic explanations: *why* something works physiologically, not just *that* it works.
- When a concept spans multiple levels (e.g., neuroception operates at brainstem, limbic, and cortical levels), organize by level.
- The tone is precise and clinical in concept/entity pages; more integrative in syntheses.
- Avoid redundancy across pages — if a mechanism is explained fully in `concepts/respiratory-sinus-arrhythmia.md`, other pages should link to it rather than re-explain it.
