# Maddie Journey — Prototype Acceptance Checklist

Release: **v2.3**. Scope: **HTML/CSS/vanilla JavaScript + fictional fixture only**.

This document distinguishes code-level verification from human visual acceptance. The 26 automated smoke checks confirm the named routing and data contracts but cannot prove pixel-level accuracy on physical Windows, macOS, Android or iOS devices.

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
| Dashboard | Overview, Divisions | Metric cards, eight division cards, stage breakdown, upcoming milestones, follow-up Board/List, department comparison |
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
- Correct static asset references and module/script order.
- Read-only data adapter, 51 distinct sample IDs, eight divisions, source status and quality.
- Functional landing and all 11 main routes, deep links and contextual top navigation.
- All eight division boards, lists and org chart panels.
- Journey Kanban and 51-row table.
- Employee modal previews and absence of edit/approval actions.
- Directory search/sort/filter/clear behavior, visible-only CSV and formula-like text protection.
- Weekly/monthly attendance reporting.
- Keyboard search shortcuts and mobile drawer close.
- Invalid fixture recovery and zero writes to fictional source records.
- Rendered HTML action names against implemented action handlers.

## Manual visual acceptance (not yet verified on physical devices)

Open the GitHub Pages website on desktop and mobile, then inspect:

1. **Desktop (~1440px and 1280px):** sidebar width, active item visibility, top tabs, metric alignment, table density, no clipped dialogs or oversize cards.
2. **Tablet (~768px):** responsive sidebar and top navigation, horizontal scrolling in the Journey board, no overlap between floating UI and content.
3. **Mobile (~390px and 320px):** menu opens/closes, header and theme remain usable, modal tabs scroll, charts and tables stay readable without layout breaking.
4. **Dark mode:** legible typography and chart/card labels, visible focus indicators, no white-on-white or low-contrast text.
5. **Keyboard:** tab through primary links, activate a modal, close it with Escape, use / or Ctrl/Command+K to locate the employee search.
6. **Data flow:** change division scope, inspect a specific employee across all eight modal sections, clear search, export only matching rows.
7. **Data integrity:** confirm the source page always reports mock integration state as disconnected; no fabricated real sync timestamps.
8. **Brand assets:** official PNG Madhouse logo and original JPEG team photograph; do not replace with WebP or invented logos.

Automated tests cannot replace these checks; log any remaining visual issue before labeling the presentation as visually accepted.

## Known deferred work (connected account phase)

- Real connector discovery and authorized schema inspection.
- Cross-source employee ID matching and source validation.
- Secure, permission-filtered transport of real records.
- Real sync freshness, partial-source failures and structured integration logging.
- Authentication and access control **only if the product later displays confidential employee records**, not for this sample prototype.
- Source-specific privacy and data retention policies.

For the intended integration boundary, see [Claude Connector Handoff](CLAUDE_CONNECTORS_HANDOFF.md).
