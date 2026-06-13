---
title: "Activity Log"
description: "An append-only log tracking every wiki ingest, query, and lint pass, recording which pages were created or updated and when."
last_updated: 2026-06-13
---

# Wiki Log

## [2026-06-13] ingest | Lesson 1 — Introduction, The Three Zones, and Window Shape
Pages created: sources/lesson-1, concepts/window-of-tolerance, concepts/three-zones, entities/dan-siegel
Pages updated: —

## [2026-06-13] ingest | Lesson 2 — The Autonomic Nervous System
Pages created: sources/lesson-2, concepts/allostatic-load, entities/vagus-nerve
Pages updated: concepts/window-of-tolerance

## [2026-06-13] ingest | Lesson 3 — Temperament and Polyvagal Theory Origins
Pages created: sources/lesson-3, concepts/polyvagal-theory, concepts/evolutionary-stack, concepts/orchids-dandelions, concepts/vagal-brake, concepts/no-skips-rule, entities/stephen-porges
Pages updated: —

## [2026-06-13] ingest | Lesson 4 — The Three Circuits and Neuroception
Pages created: sources/lesson-4, concepts/neuroception, entities/ventral-vagal-complex, entities/dorsal-vagal-complex, entities/social-engagement-system
Pages updated: concepts/vagal-brake, concepts/no-skips-rule

## [2026-06-13] ingest | Lesson 5 — Riding the Ladder, Co-Regulation, and Practice
Pages created: sources/lesson-5, concepts/co-regulation, practices/meditation-as-vagal-training
Pages updated: entities/social-engagement-system, concepts/no-skips-rule

## [2026-06-13] ingest | Lesson 6 — Interoception: From Organ to Cortex
Pages created: sources/lesson-6, concepts/interoception, concepts/interoceptive-dimensions, concepts/predictive-body, entities/insular-cortex, entities/nucleus-ambiguus
Pages updated: —

## [2026-06-13] ingest | Lesson 7 — Emotions, Interoceptive Training, and the Window
Pages created: sources/lesson-7, concepts/theory-of-constructed-emotion, practices/body-scan, practices/yoga-as-training, entities/lisa-feldman-barrett
Pages updated: concepts/interoception, entities/insular-cortex

## [2026-06-13] ingest | Lesson 8 — The Vagal Brake, HRV, and Building Vagal Tone
Pages created: sources/lesson-8, concepts/hrv, concepts/respiratory-sinus-arrhythmia, practices/hrv-biofeedback, practices/resonance-frequency-breathing
Pages updated: concepts/vagal-brake, entities/nucleus-ambiguus

## [2026-06-13] ingest | Lesson 9 — Breathwork Techniques and Mechanisms
Pages created: sources/lesson-9, practices/physiological-sigh, practices/extended-exhale-breathing, practices/box-breathing
Pages updated: practices/resonance-frequency-breathing, concepts/respiratory-sinus-arrhythmia

## [2026-06-13] build | Full wiki scaffold created
Created: wiki/overview.md, wiki/index.md, wiki/log.md
Total pages: 9 sources, 16 concepts, 9 entities, 8 practices, 1 overview = 43 pages

## [2026-06-13] maintenance | SEO foundation (P0): meta tags, sitemap, descriptions
Pages updated: all 45 wiki pages — backfilled `description:` frontmatter (one-sentence summaries for meta description / AI-crawler use); added frontmatter (title, description, last_updated) to wiki/index.md and wiki/log.md.
Site/build changes: web/lib/site.js and web/build.js now emit per-page `<meta name="description">`, `<link rel="canonical">`, Open Graph/Twitter Card tags, and a favicon; web/build.js generates dist/sitemap.xml and dist/robots.txt; fixed a duplicate-output bug where wiki/index.md was rendered both as the homepage and at /wiki/index/. Added web/public/favicon.svg and web/public/og-default.svg (OG image source; PNG export pending).
CLAUDE.md updated: documented `description:` as a standard frontmatter field for all wiki pages.

## [2026-06-13] lint
Issues found: 8 unresolved `[[wiki links]]` (no orphan pages).
Fixed: created stub pages for all 8 — concepts/sympathetic-nervous-system, concepts/parasympathetic-branch, concepts/fight-flight-freeze, concepts/progressive-overload, concepts/ventral-sympathetic-blend, concepts/shadow-work, entities/nucleus-of-solitary-tract, and syntheses/polyvagal-theory-criticisms-and-evidence (filling the empty `wiki/syntheses/` category and resolving the link from `about.md`). All added to wiki/index.md. Re-running `lint-wiki.js` after these additions shows zero unresolved links and zero orphans.
Open: wiki/syntheses/ now has 1 of the 3-5 search-intent pages recommended in web/SEO-STRATEGY.md Pillar D — "orchids vs. dandelions" and "meditation vs. dissociation" syntheses are still candidates for a future pass.
