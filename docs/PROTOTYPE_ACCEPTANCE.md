# Maddie Journey — Prototype Acceptance Checklist

Release: **v3.3.1**. Scope: **HTML/CSS/vanilla JavaScript + fictional fixture only**.

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
| People | Directory, Milestones, Calendar | Search, sorting, division filters, visible-only CSV, centered employee modal, milestone categories |
| Journey | Journey board, Welcome Kit, 201 Files, Attendance | Seven stages plus Completed with denominators and task counts; scoped Kanban/Table, Kit summary, verified versus pending attendance audit and weekly/monthly reporting |
| Performance | KPI scorecards, Reviews | Reconciled weighted KPI composition, fictional-only source flags, four-step status/date/comment review table and no inferred approval dates |
| Data & Sources | Data sources, About the prototype | Five disconnected-provider cards, structural fixture checks, no-login/read-only explanation and handoff policy |

Division detail must expose **Summary / Board / List / Org chart** in one workspace without creating extra top-level sections.

Employee previews must support **Overview, Milestones, KPI, Journey, Welcome Kit, Attendance, Review and Profile** using centered modal presentation. The Previous/Next controls browse only the current division team or filtered directory, retaining the selected detail. View division opens the existing department List with the selected employee highlighted. All information is read-only.

## Automated validation

Run from the repository root:

    node tests/smoke.js

The smoke suite covers:
- Correct static asset references and module/script order, including canonical monochrome CSS and the optional Anime.js script.
- Read-only data adapter, 51 distinct sample IDs, eight divisions, source status and quality.
- Functional landing and all 11 main routes, deep links and contextual top navigation.
- All eight division boards, lists and org chart panels, including shareable subview deep links and contextual employee browsing.
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

## Phase 4 — Reporting accuracy verification

- **Journey:** Stage counts must sum to the selected employee population. Checklist completed/available totals use every recorded item. First-incomplete-stage grouping must not imply later tasks are uncompleted.
- **Attendance:** Verified late/absent/leave records and pending verification must reconcile to the fixture. Excused late is counted in late arrivals but not concerns; approved leave is not absence. Missing records are not evidence of perfect attendance.
- **KPI:** Category weights are 15%, 45%, 15%, 25%. Each raw score contributes raw × weight / 100; the sum must equal the displayed weighted score to two decimal places. Fictional sample flags are not official verification.
- **Review:** Each reviewer displays their exact recorded status, comment and date if present; missing dates say Not recorded. A configured process order must not be misrepresented as a chronological event log.
- **Division:** Eight division means are derived from each division's own employees. Review and concern metrics display affected people out of division members and must match the displayed detail lists.

## Phase 5 — Responsive and accessibility acceptance

- **Mobile 320px, 375px, 390px and 430px:** Confirm the workspace has no unintended *page-level* sideways overflow; intentional wide tables and navigation tab strips remain independently horizontally scrollable. Drawer menu, employee preview and controls must not be clipped.
- **Tablet 768px and 1024px:** Inspect sidebar transitions, combined KPI cards, division summaries, chart layouts and long employee names.
- **Large desktop 1440px and 1920px:** Confirm readable measure widths, no wasteful card expansion and consistent sidebar collapse state.
- **Drawer:** On phones, Open menu focuses the drawer's Close menu button, the workspace becomes inert, Tab stays inside the drawer, Escape closes it and keyboard focus returns to the mobile toggle.
- **Tables:** When horizontal overflow exists, the data container gets `tabindex="0"`, `role="region"` and a descriptive accessible label. Closed details and window resizing re-run the check. Small tables should not generate redundant tab stops.
- **Dialog and tabs:** Employee previews fit within the available viewport and scroll internally. Modal focus stays trapped, Previous/Next preserve the active detail, and arrow keys change employee/division tabs. Test with keyboard and touch.
- **Accessibility:** Confirm visible focus, ≥44px mobile targets where practical, zoom/text resizing, both themes, reduced-motion preference and high-contrast OS mode. Check with an actual screen reader.
- **Landing:** The photographic landing must remain one full viewport with no independent scrollbar and a working Skip to main content target.
- **Integrity:** Source remains 51 fictional employees, eight divisions, read-only controls and no connected provider. Manual viewport/browser checks are not replaced by unit tests; track actual observations separately.

## Phase 6 — Motion and performance acceptance

- No list rows or employee records stagger into visibility. Route motion targets at most two structural surfaces, with zero delay and ≤165 ms duration.
- Dialog and mobile drawer each animate only once on entry, ≤155 ms and ≤150 ms respectively. Filter feedback affects only a short status indicator, ≤110 ms.
- Motion is disabled for reduced motion, hidden tabs and Save-Data and cannot block the app if the animation CDN is unavailable or errors.
- Directory search updates only its table/result count; selecting the current filter or view must not rebuild the workspace. Horizontal table accessibility is recalculated after localized search updates.
- The loading state is static and accessible; missing/corrupted fictional records show an alert and reload action, with no claims of live synchronization.
- A real browser/performance trace remains mandatory before declaring physical-device or runtime performance acceptance. See [Phase 6 manual QA](PHASE6_MOTION_QA.md).

## Additional pre-Phase-7 monitors — v3.3.1

- **201 Files totals:** Each of 51 employees has one explicit status per each of nine fictional document types. Employee-level complete, missing, and not-checked categories are mutually exclusive and total 51. Document-level complete, missing, unchecked and N/A totals also equal 51. The "complete/applicable" denominator excludes N/A.
- **Named missing requirements:** "Who is missing what" lists actual fictional names and the exact documents marked Missing in the fixture; selecting Not checked must not mix those gaps with missing documents. Employee previews include a read-only 201 Files tab and do not modify sample records.
- **Calendar:** The default three months begin in the Asia/Manila current month. Previous/Next move by three months, Today restores the current month, and date/category selections affect presentation only. Verify year boundaries and 320px mobile grids.
- **Calendar source fidelity:** Only computed milestones from fictional start/birthday dates and explicitly recorded example promotions appear. No real meetings, PIP/LIP records, live invitations or synchronized Google Calendar/Drive statuses should be displayed or implied.
- **Navigation:** 13 read-only screens across five existing main menu groups. Direct `#files201` and `#calendar` routes should work on reload. No role chooser or editor appears.
- **Browser QA:** Visually inspect 320px, 375px, 768px, 1024px, 1440px and 1920px widths, light/dark themes, tab keyboard focus, internal data-table scrolling and calendar accessibility. The smoke suite is source-level and does not prove visual non-clipping.
