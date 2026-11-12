# Maddie Journey — Read-only Prototype v3.1

**Madhouse Design Studio · People & Culture**

[Open prototype](https://nemtxt.github.io/Maddie-Journey-NemDev-/) · [GitHub repository](https://github.com/nemtxt/Maddie-Journey-NemDev-) · [Claude connector handoff](docs/CLAUDE_CONNECTORS_HANDOFF.md) · [Prototype acceptance checklist](docs/PROTOTYPE_ACCEPTANCE.md)

## Project goal

Maddie Journey is a **reader, organizer, summary and monitoring dashboard**, not a system for recording or submitting employee information. It is used to preview division, Journey, attendance, KPI, milestone and review data originally maintained in external systems.

**This GitHub phase uses only fictional sample data:** 51 employees across eight divisions. There is no account creation, login, role chooser, employee editing, approval submission or live source synchronization.

The intended external data sources for the **later Claude-connected development phase** are Airtable, Google Sheets, Google Drive, Google Docs and email. Claude account connectors are not automatically accessible as a browser API from public GitHub Pages.

## Interface

The responsive frontend uses HTML, CSS and vanilla JavaScript, with a text-only identity and the original Madhalloween JPEG event photograph. The user-provided white dashboard reference informs the composition, with white/black neutral surfaces, one consistent Inter font, and pink used only as an accent.

### Navigation

| Left sidebar | Contextual top navigation |
| --- | --- |
| Dashboard | Overview · Divisions |
| People | Directory · Milestones |
| Journey | Journey Board · Welcome Kit · Attendance |
| Performance | KPI Scorecards · Reviews |
| Data & Sources | Data Sources · About the Prototype |

All 11 screens are available to anyone using the fictional sample prototype. On desktop, the primary sidebar collapses to icon navigation and remembers the display preference locally; on mobile it remains a full-width accessible drawer. A division also offers its own Summary, Board, List and Org Chart tabs. Employee cards open centered view-only previews.

### v2.2 overview improvements

- **Pastel overview metrics:** sample employees, average Journey progress, incomplete Welcome Kits and KPI verification needs.
- **Division cards:** eight horizontally browsable pastel cards with member count, assigned evaluator names and calculated Journey progress. Each opens its division workspace.
- **Journey-by-stage chart:** counts from each employee's first incomplete stage, with a final Completed category; this does not fabricate a historical trend.
- **Upcoming milestones:** real calculations on fictional birthdays and service anniversaries, with employee preview links.
- **Follow-ups:** existing List/Board tracker, populated from the same local fixture.
- **Consistent mobile layouts:** single sidebar, useful top tabs, compact theme controls, responsive tables and centered preview dialogs.

### v2.3 completion and reliability improvements

- **Employee directory:** Search employee name, ID, email, job title or division; sort by name, department, Journey, Welcome Kit or KPI; clear the search and view matching counts.
- **Accurate exports:** Employee CSV contains the currently visible, filtered/sorted records (not silently all 51). Text beginning with spreadsheet formula syntax is escaped defensively.
- **Weekly/monthly attendance:** The existing reporting logic is now reachable through a compact expandable breakdown; recorded entries remain read-only.
- **Navigation:** Fixed the division employee shortcut to select the visible List tab. Quick search supports Ctrl/Command+K and slash outside text fields; Escape closes mobile navigation.
- **Fixture integrity:** Data Sources reports distinct sample IDs, division count, Journey/Kit structure and broken cross-references. These are structural fixture checks, not authentication or official record verification.
- **Graceful errors:** An invalid demonstration fixture displays a recoverable error screen rather than rendering a broken dashboard.
- **Automated verification:** 26 dependency-free smoke tests now cover data readiness, navigation, all division modes, active filters, safe CSV exports, keyboard shortcuts and read-only actions.

[See the prototype acceptance matrix](docs/PROTOTYPE_ACCEPTANCE.md) for manual desktop/mobile validation tasks and documented limitations.

### v2.4 visual consistency and motion

- **Minimal landing (v2.4):** Removed both rows of audience/shortcut cards and landing progress badges. The full-viewport, typography-only landing is the later v2.6 design.
- **Black and white workspace:** White surfaces in Light mode, near-black surfaces in Dark mode, neutral status backgrounds, one pink accent for active navigation, focus rings and essential actions. Decorative pastel panel fills and purple gradients are no longer part of the displayed system.
- **One typeface:** Inter for the entire site; the font is loaded as a free web font, with a sans-serif fallback only when the font request fails. Navigation and appearance icons are consistent inline SVG rather than platform-dependent symbols.
- **Sidebar control:** Collapse or expand the main desktop sidebar from the top header. The collapsed state retains all five destination icons, accessible labels and tooltips and is stored as a UI preference only. Mobile uses its separate Menu drawer.
- **Soft Anime.js v4 motion:** The site uses the pinned version of Anime.js loaded from jsDelivr as an optional visual enhancement. Short page/preview fade transitions run only on navigation or dialog entry. Motion respects **prefers-reduced-motion**, never loops and has no effect on reading data if the CDN is unavailable.
- **Verification:** The source-level tests now include the landing simplification, persistent sidebar, single-font and neutral theme configuration, and optional/reduced-motion behavior. Manual cross-browser and physical-device visual QA remains a separate acceptance step.

The final design tokens and overrides are in **mono.css**. New features should use these shared tokens rather than introducing additional accent colors or page-specific fonts. The historical base stylesheets remain for compatibility.

### v2.5 navigation and accessibility refinement

- **Fewer duplicate routes (v2.5):** Removed unnecessary sidebar and subnavigation instructions. The v2.6 landing now has one dashboard CTA and a text-only brand return.
- **One employee drill-down:** Employee previews use their existing eight accessible tabs rather than a second bank of six buttons that went to the same information.
- **Search stays responsive:** The visible directory count, matching table and clear-search control react as the user types, without changing or persisting employee data.
- **Keyboard continuity:** Closing an employee or division dialog restores keyboard focus to its originating action when available. Invalid employee identifiers cannot open a broken dialog.
- **Gentle Anime.js motion:** Small screen and modal entrances plus a mobile drawer entrance, all optional, non-looping and disabled for reduced-motion users. Sidebar size and hover transitions remain CSS-only.

### v2.6 monitoring redesign

- The Madhouse image logo no longer appears on the landing, desktop sidebar or mobile header. A consistent Inter text identity replaces it.
- The landing is one **full-viewport, full-bleed photo screen** with no page scroll, one dashboard entry, a subtle theme control and adaptive type for small/short screens.
- The overview is a **monitoring console**: connected signal metrics, first-position attention queue, stacked Journey and milestone insights, followed by a non-carousel eight-division matrix.
- The 51-person fictional sample remains read-only, with no login or input/edit forms. External source connectors remain disconnected.
- Black/white theme, restrained pink accent, and optional reduced-motion-aware Anime.js remain.

### v2.7 — Person-first monitoring controls

- All four summary indicators are keyboard-operable shortcuts to their existing directory, Journey, Welcome Kit and KPI screens.
- The default **Needs attention** List displays one highest-priority item per person, eliminating repeated names while keeping underlying signals accessible under category filters.
- Badge totals count unique people; the queue separately displays the number of people and underlying sample signals. Board shows one person per category and may show a person in different categories where appropriate.
- Expanded List and Board views now show all matching people without the former 30-row or nine-card ceiling.
- In-place filter switches restore keyboard focus after rendering; the mobile menu locks page scrolling while open. No new page, login or source-edit forms were added.

### Phase 1 + Phase 2 — v2.9 monitoring system

- **Phase 1 — shared interface system:** Unified spacing, panel radii, typography hierarchy, control minimum heights, responsive behavior and focus styles through named `--mj-*` tokens in canonical `mono.css`. Reduced repeated sidebar copy and turned the existing sample-source badge into a direct view of disconnected source status.
- **Phase 2 — operational overview:** Source-derived attendance context surfaces the number of people with verified concerns and unverified attendance entries without claiming real-time alerts. The person-first attention list now distinguishes Check / Validate / Review / In progress and shows additional issue counts without repeating employee rows.
- **Phase 2 — division comparison:** Replaced eight tall overview cards with a single 8-row table-like matrix showing people, Journey average, Welcome Kit average, reviews pending and people with verified attendance concerns. Every row opens the already-existing division workspace; no new top-level navigation.
- **Boundaries:** All values come from the same immutable 51-person fixture. No login, inputs for HR data, approval changes, live sync claims, third-party secrets or remote persistence. The full-viewport landing and optional Anime.js motion are retained.
- **Verification:** Automated smoke suite expanded with design-system, source-derived attendance, division matrix and priority-inspection assertions. Manual visual acceptance is still a separate milestone.

### Phase 3 — v3.0 employee and division workflows

- **Context-aware employee reader:** Employee previews browse the originating roster. A division is limited to its own members; a filtered directory keeps its matching and sorted results. Previous/Next retains the selected detail tab and indicates the current position.
- **Single direct return:** View division opens the existing department List with the currently inspected employee highlighted. The return action does not require finding the same employee again.
- **Shareable division subviews:** `#division/{id}` remains Summary; `#division/{id}/board`, `/list`, and `/chart` open corresponding views on reload. Division tabs update the address fragment, with no new page or route family.
- **Consistent follow-up details:** Division Summary uses the same prioritized, distinct-employee signals as the organization overview; Inspect links directly to the correct employee detail tab. Duplicated division-tab shortcuts were removed.
- **Accessibility:** Responsive Previous/Next controls, disabled list boundaries, keyboard focus continuity and an origin description. All employee information remains view-only; the app still uses 51 fictional employees, eight divisions and optional Anime.js.
- **Validation:** Five new workflow regression tests plus the existing full suite. Physical-device visual QA remains pending.

### Phase 4 — v3.1 reporting clarity

- **Seven-stage Journey:** An eight-category first-incomplete-stage table displays person counts and denominators; every task numerator reconciles with the complete selected checklist count. Dashboard stage bars show share of all employees, not scale relative to the largest stage.
- **Attendance:** Verified/total events, late arrivals, absences, concern entries, affected people, and pending verifications are distinct. The weekly/monthly report shows only periods with recorded verified events and counts excused late and approved leave separately. No attendance records never imply perfect attendance.
- **KPI:** A single formula powers every weighted score. The composition table exposes 15/45/15/25 weights, raw scores, weighted contribution points and a reconciled total. All source/validation flags remain fictional, not official provider verification.
- **Reviews:** A four-step status table displays only recorded statuses, existing dates and comments. The routing order is not represented as a verified chronology; missing dates remain Not recorded.
- **Divisions:** Eight rows now include KPI mean, employee percentages, and explicit denominators for pending reviews and affected people. Calculations use the same fixture and employee cohort across screens.
- **Read-only contract:** 51 fictional employees, eight divisions, all original routes and optional motion preserved. No fabricated historical trends, official statuses, sync timestamps, data mutations or connector credentials.
- **Verification:** 51 dependency-free smoke tests, with attendance-classification, KPI arithmetic, Journey aggregation, review status and division cohort consistency assertions. Manual device visual QA remains separate.

### Seven-stage Journey

The Journey monitoring screen contains **seven stages plus Completed**, with one card per employee grouped by the first incomplete stage. The Board scrolls horizontally; Table view shows all matching members and aggregate progress. All status rows are non-editable.

## Read-only source adapter

The script loading order is:

1. data.js — fictional fixture
2. data-adapter.js — read-only snapshot and data-source contract
3. app.js — rendering, navigation, metrics and employee previews

data-adapter.js exposes getSnapshot(), getSources(), getProvenance(), getQualityReport() and validateSnapshot(snapshot). It currently returns a defensive copy of the fictional fixture and marks all five planned providers **Not connected**. There are **no network calls or provider tokens**.

The later connected-account phase can implement source normalization against the same frontend view model, but the private data delivery mechanism must be authenticated and controlled. Read the [Claude connector handoff](docs/CLAUDE_CONNECTORS_HANDOFF.md) for provider responsibilities, data contract and security boundaries.

**GitHub Pages is public. Never commit real employee information, payroll or disciplinary records, private documents/emails, passwords, API tokens or connector secrets.** Open access is suitable only for fictional demo data; any real-data deployment needs access-controlled delivery and appropriate permissions.

## Run and verify

- Open index.html in a modern browser or use VS Code Live Server.
- Run: node tests/smoke.js
- On main, the custom GitHub Actions validation workflow runs the regression tests. Anime.js and the Inter web font are optional third-party CDN resources; UI navigation and sample data do not depend on their availability. GitHub Pages uses its separate publishing workflow.
- Confirm both test and Pages workflow statuses under GitHub Actions. The automated suite currently includes 51 cases; physical Windows/macOS/Android/iOS visual acceptance remains separate.

## Source files

| Path | Responsibility |
| --- | --- |
| index.html | Entry point and ordered CSS/JS assets |
| data.js | 51 fictional employee records and complete 8-division fixtures |
| data-adapter.js | Read-only source boundary, provider status and snapshot validation |
| app.js | Single-page UI, division overview, summary calculations and previews |
| styles.css / theme.css | Base and theme styles |
| operations.css / palette.css | Org chart, tracking and historical brand styles |
| landing.css | Landing page and source photo |
| workspace.css / reader.css | Global workspace, primary/secondary navigation and read-only views |
| refined.css | Dashboard metrics, searchable directory, source quality panel and responsive summaries |
| mono.css | **v3.1 canonical styles:** shared UI tokens, monochrome system, contextual employee viewer, reporting tables and responsive division comparisons |
| motion.js | Reduced-motion-aware, nonessential Anime.js entrance transitions |
| tests/smoke.js | Regression tests for navigation, adapters, fixtures and read-only operation |
| docs/CLAUDE_CONNECTORS_HANDOFF.md | Future connector development instructions |
| docs/PROTOTYPE_ACCEPTANCE.md | Complete screen/navigation matrix and physical-device acceptance checklist |
| assets/madhalloween.jpg | Original user-supplied JPEG |

## Remaining phase

**Not yet implemented:** real Airtable/Google/email source retrieval, connector authorization, private read-only synchronization, permission-filtered real records, true provider timestamps and physical-device visual QA. The public site is a functional **sample-data UI prototype**, not a live HR data system.
