# Maddie Journey — Interface Improvement Roadmap

**Goal:** Keep the monitoring workspace professional, calm, fast and immediately legible, rather than adding generic administrative pages or data-entry capabilities.  
**Baseline:** v3.6 · 51 fictional employees · eight divisions · 13 read-only screens · five main navigation groups.  
**Source boundary:** All data comes from local sample fixtures; any future Claude/Drive/Airtable connectors require a secure private integration layer.

## Phase 7 — Cross-workflow monitoring clarity (v3.4)

**Status: Implemented and automated checks passed.**

Enhancement: consolidate attendance, 201 Files gaps and upcoming fictional Calendar dates into one compact operational-focus strip on Overview. Add a separate 201 Files filter to the attention queue, deep-linking to the existing employee document reader. Retain the established neutral palette, Inter font and one restrained pink accent.

Completion: counts reconcile to source records; routes and document previews work; 84 regression tests pass; no data is modified. Physical visual QA remains open.

### v3.4.1 visual refinement — completed

Subtle pastel categorization added for the monitoring summary tiles, operational-focus strip, document groups, review/attention categories and Calendar event keys. Hover responses now favor fine-pointer devices only, with keyboard focus and reduced-motion support. The original one-font, neutral-first, read-only contract remains unchanged. Automated regression checks: **88 passed**. Physical visual inspection remains outstanding.

### v3.4.2 icon refinement — completed

All UI symbols in navigation, buttons, checklists, Calendar and document monitoring were replaced with one locally defined 39-icon SVG set. Consistent 24px coordinate grid, outline stroke, responsive sizing, accessible control labels, local-script failure fallback and no decorative emojis. Automated suite: **94 checks passed**. Browser/device visual confirmation remains open.

## Phase 8 — Information density and reporting rhythm (v3.5)

**Status: Implemented; 104 automated checks passed. Rendered visual/device acceptance pending.**

Introduced a locally persisted, read-only Compact rows preference, shared typography and number alignment, meaningful screen-reader table captions, employee task/kit denominators, selected-versus-visible document counts and explicit no-evidence states. Desktop row padding is optional and can be restored to Comfortable. Mobile touch targets and horizontal table accessibility are retained. No fixture data, status or source provenance changed.

Completion verified at the source/interaction-test level: directory, Journey, attendance, KPI, review and 201 document tables display the same underlying calculations with a coherent information order. Manual viewport and screen-reader checks remain open; see [Phase 8 QA](PHASE8_REPORTING_QA.md).

## Phase 9 — Contextual employee-reader continuity (v3.6)

**Status: Implemented; 113 automated regression tests passed. Rendered browser/assistive-technology acceptance pending.**

The employee preview now shows a compact source-specific origin and Back action. Previous/Next is bounded to the current visible filtered roster from Directory, 201 Files, Calendar events and attention categories; division browsing remains within its team. Current-person record cues and section-specific demo provenance are recalculated on every preview. All closing methods restore source route/filter state and attempt exact keyboard focus and scroll recovery; employee tabs use semantic tablist relationships and arrow-key navigation.

Completion verified at the source/interaction-test level only. Manual test device rendering, screen-reader names and actual scroll restoration across browsers using [Phase 9 QA](PHASE9_READER_QA.md).

## Phase 10 — Real-device accessibility and responsive acceptance (proposed v3.7)

Enhancement: validate 320px/375px/430px phones, 768px and 1024px tablets, 1440px and 1920px desktops, 200% zoom, screen reader labels, keyboard-only use, high contrast and reduced motion. Fix actual clipping and measured responsiveness problems rather than speculative decorative styling.

Completion: complete documented *rendered* manual viewport checks on real browsers and devices, with severity-ranked issues, screenshots and verified remediation. Passing source-level tests alone is insufficient.

## Phase 11 — Source-state UX and secure integration readiness (proposed v3.8)

Enhancement: consistent read-only visual representations for Not connected, Demo, Empty, Partially available, Verified-by-source (only when verifiable), Error, and permission-limited states, with explicit ownership and last-sync provenance where genuinely supplied. Prepare display adapters for future secure integrations without placing tokens or connected HR data in the public frontend.

Completion: simulated connector-failure and partial-data states remain usable; no invented sync timestamps or official approvals appear; source-adapter contracts and accessible error recovery pass regression checks. Live integration occurs only through a separately authorized, private architecture.

## Non-negotiable interface contract

- One Inter typeface, neutral black/white surfaces and one restrained pink accent.
- No authentication gate, editor, upload, form submission, or write workflow in the public monitoring prototype.
- Full-screen non-scrolling photographic landing; data-rich monitoring screens scroll naturally.
- Collapse/expand navigation, mobile drawer, employee previews, tables and date filters remain accessible.
- Animate only small, optional details using Anime.js; reduced-motion and offline-CDN support remain mandatory.
- Never import counts from screenshot examples as if they were verified data.
- Validate calculations from the 51-person fixture before publishing every incremental phase.
