# Maddie Journey — Prototype Acceptance Checklist

Release: **v2.9**. Scope: **HTML/CSS/vanilla JavaScript + fictional fixture only**.

This document distinguishes code-level verification from human visual acceptance. The automated smoke checks confirm the named routing and data contracts but cannot prove pixel-level accuracy on physical Windows, macOS, Android or iOS devices.

## Product boundaries

- The prototype is a **reader, organizer, summary and monitoring UI**.
- It has no account creation, role chooser, login, employee edit forms, data submissions, approval actions or connector tokens.
- It is suitable for **fictional** public demonstration, not confidential HR production records.
- All figures are derived from the same 51-person sample fixture across eight divisions.
- All five planned future providers (Airtable, Google Sheets, Drive, Docs and email) are explicitly **Not connected**.
- The future Claude-connected account will supply authorized private data through a separate, secure read-only normalization/integration layer.

## Main navigation walkthrough

| Parent menu | Top tabs | Checks |
| --- | --- | --- |
| Dashboard | Overview, Divisions | Four linked metric indicators, verified-attendance snapshot, person-first queue with explicit priority cues, eight-row division comparison, Journey stages and milestones |
| People | Directory, Milestones | Search, sorting, division filters, visible-only CSV, centered employee modal, milestone categories |
| Journey | Journey board, Welcome Kit, Attendance | Eight Kanban columns (seven stages + Completed), Table view, division scope, Kit summary, attendance chart and weekly/monthly breakdown |
| Performance | KPI scorecards, Reviews | Read-only weighted KPI previews, source/validation flags, review timeline, final status summaries |
| Data & Sources | Data sources, About the prototype | Five disconnected-provider cards, structural fixture checks, no-login/read-only explanation and handoff policy |

Division detail must expose **Summary / Board / List / Org chart** in one workspace without creating extra top-level sections.

Employee previews must support **Overview, Milestones, KPI, Journey, Welcome Kit, Attendance, Review and Profile** using centered modal presentation. All visible fields are status summaries, not editable form inputs.

## Automated validation

Run from the repository root:

    node tests/smoke.js

The smoke suite covers:
- Correct static asset references and module/script order, including canonical monochrome CSS and the optional Anime.js script.
- Read-only data adapter, 51 distinct sample IDs, eight divisions, source status and quality.
- Functional landing and all 11 main routes, deep links and contextual top navigation.
- All eight division boards, lists and org chart panels.
- Journey Kanban and 51-row table.
- Employee modal previews and absence of edit/approval actions.
- Directory search/sort/filter/clear behavior, visible-only CSV and formula-like text protection.
- Weekly/monthly attendance reporting.
- Keyboard search shortcuts and mobile drawer close.
- Desktop icon-only sidebar toggle, local display preference and accessible navigation labels.
- No unwanted landing-card strips or percentage widgets; one Inter font and one pink accent.
- Motion enhancement for page/dialog/mobile drawer, graceful missing-CDN fallback and reduced-motion preference.
- Single landing dashboard CTA, no redundant modal navigation buttons and restored dialog focus.
- Four direct, keyboard-accessible KPI shortcuts; queue distinguishes unique people from underlying signals, shows priority descriptions and supports full expansion.
- In-place controls maintain keyboard focus; mobile drawer locks background scrolling.
- Phase 1: shared `--mj-*` design tokens, consistent header/panel/control hierarchy and a navigation shortcut to data-source provenance.
- Phase 2: verified-attendance count and unverified-entry tally from the fixture; eight responsive division comparison rows with valid drill-downs.
- Invalid fixture recovery and zero writes to fictional source records.
- Rendered HTML action names against implemented action handlers.

## Manual visual acceptance (not yet verified on physical devices)

Open the GitHub Pages website on desktop and mobile, then inspect:

1. **Desktop (~1440px and 1280px):** sidebar expands/collapses with icon button, active navigation remains usable, top tabs and metric cards align, no clipped dialogs or oversize cards. Refresh the page to confirm sidebar preference persists.
2. **Tablet (~768px):** responsive sidebar and top navigation, horizontal scrolling in the Journey board, no overlap between floating UI and content.
3. **Mobile (~390px and 320px):** collapsed desktop preference must not hide mobile menu labels; menu opens/closes, header and theme remain usable, modal tabs scroll, charts and tables stay readable without layout breaking.
4. **Black/white Light and Dark modes:** all backgrounds remain neutral with pink as the sole accent. Verify legible text, table headings, chart bars and progress indicators; no pastel card fills, purple background gradients or low-contrast text.
5. **Keyboard:** tab through primary links, activate a modal, close it with Escape, use / or Ctrl/Command+K to locate the employee search.
6. **Data flow:** change division scope, inspect a specific employee across all eight modal sections, clear search, export only matching rows.
7. **Data integrity:** confirm the source page always reports mock integration state as disconnected; no fabricated real sync timestamps.
8. **Brand and landing:** no image logo in landing, desktop or mobile navigation. Keep the original JPEG photograph edge-to-edge, with a readable dark gradient and text-only product identity. Confirm one entry CTA and no scrolling or clipped actions in desktop, tablet, phone portrait and short landscape viewports.
9. **Typography:** verify Inter appears consistently on Windows, macOS, Android and iOS, including in tables, controls, modals and employee previews; a system sans fallback is allowed only if the font CDN is unreachable.
10. **Motion:** test the short Anime.js fade/slide once per screen change, without bouncing or looping. Disable system animation/reduced-motion and verify everything remains instantly visible. With the animation CDN blocked, the full interface must still work.

Automated tests cannot replace these checks; log any remaining visual issue before labeling the presentation as visually accepted.

## Known deferred work (connected account phase)

- Real connector discovery and authorized schema inspection.
- Cross-source employee ID matching and source validation.
- Secure, permission-filtered transport of real records.
- Real sync freshness, partial-source failures and structured integration logging.
- Authentication and access control **only if the product later displays confidential employee records**, not for this sample prototype.
- Source-specific privacy and data retention policies.

For the intended integration boundary, see [Claude Connector Handoff](CLAUDE_CONNECTORS_HANDOFF.md).
