---
title: "Activity Log"
description: "An append-only log tracking every wiki ingest, query, and lint pass, recording which pages were created or updated and when."
last_updated: 2026-06-23
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

## [2026-06-15] ingest | Cluster E — Interoception & Predictive Processing (concept cards)
Pages created: —
Pages updated: concepts/interoception (metabolic ramping, somatic markers, Hyper/Hypo-arousal edge subsections, Sources), entities/insular-cortex (Mid-Insula Integration Zone, Somatic Marker Hypothesis section, Moral Compass Aarish note, Sources), concepts/theory-of-constructed-emotion (James-Lange 1884, Two Levers of Regulation, Emotion as Allostatic Guess, Sources), concepts/predictive-body (staircase-dark example, Two Ways to Resolve Prediction Error, Orchid/High-Gain Predictive System, recalibration Aarish note, Sources), concepts/interoceptive-dimensions (Hypo-arousal Flip section, clinical distinction, Sources)
Source cards: What Interoception Is, The Insular Cortex, Emotions from the Body Up, The Predictive Body, Interoception Widens the Window

## [2026-06-15] ingest | Cluster F — Breathwork Practices (concept cards)
Pages created: practices/cold-exposure (MDR mechanism, Richer 2022 evidence, face-in-cold-water protocol), practices/humming-chanting-gargling (NTS dashboard, laryngeal branches, Bhramari, OM, gargling)
Pages updated: practices/box-breathing (Kumbhaka tradition, Breathwork Tool Comparison table, Sources), practices/extended-exhale-breathing (Bhramari as cheat code, Nadi Shodhana, Sources), practices/physiological-sigh (Balban 2023 Stanford RCT, relaxation-induced anxiety, Sources), practices/meditation-as-vagal-training (Ritual as Neuroceptive Shortcut, neuroception added to related, Sources)
Source cards: Box Breathing and Structured Protocols, Extended Exhale Breathing, The Physiological Sigh, Polyvagal Meets Practice, Cold Exposure and the Diving Reflex, Humming Chanting and Gargling

## [2026-06-15] ingest | Cluster G — Body/Somatic Practices (concept cards)
Pages created: —
Pages updated: practices/somatic-movement-discharge (full rebuild: Zeigarnik Effect, Psoas section, Peter Levine/Somatic Experiencing, Neurogenic Tremors/TRE, Pandiculation, Training vs. Tending, False Calm, Does Exercise Count?, 2-minute shake + pandiculation protocols, Aarish note mirror neurons, source_count 1→4), practices/body-scan (Habituation Trap, blank-area navigation, Sara Lazar evidence, Sources section, source_count 2, last_updated), concepts/co-regulation (Obligate Gregariousness, Motherese/middle ear tuning, Zoom fatigue, Group Ventral Vagal field, bidirectional loop + infant co-reg Aarish note, mirror neuron Aarish note, Sources section, source_count 3→4), practices/meditation-as-vagal-training (State vs. Trait, Open Monitoring + PFC-amygdala inhibition + DMN decoupling, Metta as internalized co-regulation, Tool Selection Regulation vs. Expansion, source_count 2→3)
Source cards: Somatic Movement and Discharge, Body Scan and Yoga as Training, Co-Regulation and Connection, Meditation and Body Scan as Down-Regulation

## [2026-06-15] ingest | Cluster H — Temperament & Antifragility (concept cards + text elements)
Pages created: concepts/antifragility (Black Swan, Mediocristan/Extremistan, Robustness vs. Antifragility, Orchid-Dandelion synthesis table, Narrative Fallacy / Dandelion Blindspot, Cassandra problem Aarish note)
Pages updated: concepts/orchids-dandelions (population percentages, Diathesis-Stress vs. Differential Susceptibility paradigm shift, "Orchids are plastic" framing, Depth of Processing, Boyce citation, conditional fragility/antifragility, evolutionary sentinels, Cassandra Aarish note, Micro-recoveries, Sources section, source_count 2→5)
Source cards: Orchids and Dandelions, Black Swan (NNT), Robustness vs Antifragility, Hedging Against the Dandelion Blindspots, Boyce text element

## [2026-06-15] ingest | Wave 2 — PDF Research Papers (stubs)
Pages created: sources/richer-2022-cold-face-test, sources/kim-kim-2025-interoception-moral, sources/lionetti-2018-orchids-dandelions, sources/laborde-2017-hrv-vagal-tone, sources/pluess-2020-sensitivity-environment, sources/manning-2017-attachment-social-anxiety (stub), sources/jellema-2024-social-intuition (stub), sources/swiatowy-2021-activity-dna-methylation (stub), sources/herrera-shaheen-2025-parkinsons-STUB (relevance unconfirmed), sources/barrett-2026-FLAGGED (out-of-scope, needs verification)
Note: PDF reading requires `brew install poppler`. All 10 PDFs documented; 5 have substantive stubs from lesson card citations; 5 are stubs pending PDF read. Barrett 2026 title does not match ANS domain — flagged for verification.

## [2026-06-15] ingest | Wave 3 — Text Elements, Mindmaps, Whiteboards
Pages created: —
Pages updated: —
Notes: Mindmaps are structural outlines linking to existing card library cards — all content already ingested via card clusters. Text elements are either (a) already processed in Cluster H (Boyce, Cassandra) or (b) empty Heptabase canvas label strings (Classical Model, Polyvagal Post Classical, External Domain). Whiteboards are organizational containers (Regulate Your Nervous System = card/PDF/highlight index; others = system defaults). The "Thought 1" mindmap contains a novel threat-response circuit diagram (Neuroception → Amygdala → Stomach Knot → Afferent Vagal → NTS Confirms → Sympathetic) — this somatic confirmation loop is implicitly covered in predictive-body.md Active Inference section but not explicitly diagrammed; candidate for a future synthesis page.

## [2026-06-15] ingest | Wave 2 — PDF Research Papers (full re-ingest via pypdf)
Note: pypdf installed (pip3 install pypdf); all 9 readable PDFs extracted and read in full.
Barrett 2026 confirmed out of scope (graph theory / discrete math; Jordan Barrett, Dalhousie — not Lisa Feldman Barrett).
Herrera 2025 file not found on disk.
Pages created/updated:
- sources/richer-2022-cold-face-test — full rewrite: MIST protocol (Montreal Imaging Stress Task), cooling mask specs (−1°C + −14°C overlay), exact bradycardia figures (26.6%/23.9%/20.1%), p<0.05 cortisol result, state-independence confirmed
- sources/lionetti-2018-orchids-dandelions — full rewrite: actual proportions (Orchid 31%, Tulip 40%, Dandelion 29%); latent class analysis; Big Five profile (high neuroticism + low extraversion); positive emotional reactivity finding
- sources/kim-kim-2025-interoception-moral — full rewrite: two experiments; K-MAIA + heartbeat counting task; vmPFC + precuneus as mediators (not insular cortex directly); allostasis/prediction-error framing
- sources/laborde-2017-hrv-vagal-tone — full rewrite: Five HRV theories (neurovisceral integration, polyvagal, biological behavioral, resonance frequency, psychophysiological coherence); Three Rs (Resting/Reactivity/Recovery); tonic vs. phasic distinction; confound list
- sources/pluess-2020-sensitivity-environment — full rewrite: HSP-12 validation; N=1,140 across 4 studies; dual personality profile (high neuroticism + high openness); Integrated Environmental Sensitivity framework
- sources/manning-2017-attachment-social-anxiety — full rewrite: 30 studies, 28 positive; anxious attachment strongest predictor; cognitive (IWMs) + evolutionary (social rank) mediators; clinical implications
- sources/jellema-2024-social-intuition — full rewrite: Social-Affective Implicit Learning (SAIL); Mirror Neuron Mechanism (MNM) + Action Observation Network; ASC impairment selective to social (not non-social) implicit learning; Damasio somatic marker connection
- sources/swiatowy-2021-activity-dna-methylation — full rewrite: DNMT enzymes; CpG island methylation = gene silencing; exercise → methylation changes in muscle/adipose/blood; epigenetic layer of structural change model
- sources/barrett-2026-FLAGGED — confirmed out of scope, action required to remove file
Corrections to existing wiki pages:
- concepts/orchids-dandelions.md — corrected population percentages (Orchid 31%, Tulip 40%, Dandelion 29%) to match Lionetti 2018 actual data
- entities/insular-cortex.md — added Kim & Kim 2025 section with neural pathway clarification (vmPFC/precuneus as explicit mediators; insula as upstream interoceptive substrate)
- concepts/hrv.md — added Tonic vs. Phasic HRV section; Three Rs framework; respiration confound note (Laborde et al. 2017); source added

## [2026-06-15] maintenance | index.md and log.md updated for 2026-06-15 ingest
index.md: added concepts/antifragility; updated orchids-dandelions description; added cold-exposure, humming-chanting-gargling, somatic-movement-discharge to Practices index; updated body-scan and meditation-as-vagal-training descriptions; added all 10 PDF sources to Sources section; updated last_updated to 2026-06-15.

## [2026-06-23] ingest | Lesson 10 — Completing the Down-Regulation Toolkit
Pages created: sources/lesson-10, concepts/technique-matching
Pages updated: practices/cold-exposure (Tier placement, hardware vs. software framing), practices/humming-chanting-gargling (internal prosody, self-co-regulation), practices/somatic-movement-discharge (Tier placement), practices/meditation-as-vagal-training (Stillness Trap, 8-12 week timeline, Tier placement), practices/body-scan (software patch framing)

## [2026-06-23] ingest | Lesson 11 — The Regulation Stack and Practice Ecology
Pages created: sources/lesson-11, concepts/regulation-stack, concepts/training-recovery-curve, concepts/nervous-system-field-guide
Pages updated: concepts/shadow-work (Golden Rule of Integration, Dual Awareness, Catharsis vs. Integration), concepts/progressive-overload (V-Curve, sequencing logic), concepts/hrv (HRV as Fuel Gauge), concepts/ventral-sympathetic-blend (Holding the Heat, intra-workout regulation)

## [2026-06-23] ingest | Cluster I — Practice Application Cards (concept cards)
Pages created: concepts/practice-ecology, concepts/technique-state-matching, concepts/training-performance-recovery
Pages updated: concepts/progressive-overload (three tiers of overload, physical training, funding rule), concepts/shadow-work (Ventral Anchor strategy, Tier 3 categorization), concepts/allostatic-load (overtraining as shared metabolic budget), concepts/hrv (HRV as fuel gauge for training), concepts/ventral-sympathetic-blend (Ventral Anchor techniques, blend in training, blend in practice ecology), concepts/window-of-tolerance (applied frameworks section), concepts/no-skips-rule (practice selection subsection), practices/physiological-sigh (intra-workout protocol, regulation stack context), practices/yoga-as-training (practice ecology multi-category), practices/somatic-movement-discharge (Category 4 Arousal Cycler), practices/body-scan (Category 1 Sensor framing), practices/meditation-as-vagal-training (Hardware First rule, multi-category), practices/resonance-frequency-breathing (Savasana Rule, Category 2), practices/box-breathing (intra-workout protocol)
Source cards: Mapping Your Practices, Matching Technique to State, Your Regulation Stack, Training Performance and Recovery

## [2026-06-23] ingest | Cluster J — Integration/Synthesis Cards (concept cards)
Pages created: concepts/top-down-modulation
Pages updated: concepts/shadow-work (ventral anchoring protocol, dual awareness split-focus, catching the slide, co-regulation as ventral hook, catharsis myth), concepts/ventral-sympathetic-blend (stretch-zone framing, top-down modulation), practices/meditation-as-vagal-training (three-phase neurological rep loop), concepts/neuroception (environmental safety anchors, neuroscience scaffold), concepts/co-regulation (ventral hook in shadow work, moral alignment), concepts/progressive-overload (weekly expansion schedule)
Source cards: Neuroscience Meets Practice, Shadow Work and the Window, Your Nervous System Field Guide. Skipped: "A wonderful new card 6" (empty placeholder).

## [2026-06-23] ingest | 2 new PDF research papers (both FLAGGED out of scope)
Pages created: sources/xu-2023-ecological-transitions-FLAGGED, sources/mattson-2021-goodharts-law-gme-FLAGGED
Notes: Xu et al. 2023 — mathematical ecology / nonequilibrium statistical mechanics. Mattson et al. 2021 — Goodhart's Law in medical education. Neither relevant to ANS/polyvagal domain. Both flagged for removal from raw/Card Library/.

## [2026-06-23] maintenance | Consolidated multi-agent ingest and merged overlapping updates
Merged overlapping updates from 4 parallel agents into unified pages. Files with content from multiple agents: shadow-work (3 agents), ventral-sympathetic-blend (3), progressive-overload (3), meditation-as-vagal-training (3), hrv (2), body-scan (2), somatic-movement-discharge (2), regulation-stack (2 — merged concept versions; absorbed synthesis duplicate). Updated index.md with 10 new concept entries, 2 new lesson sources, 2 FLAGGED papers.
