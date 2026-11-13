# MADDIE CENTRAL | 2027 — Isolated fictional navigation trial

## Branch and data isolation

- Trial branch: `trial/maddie-central-2027-navigation`.
- Based on the pre-live **fictional** `phase10-v3.7-responsive-accessibility` commit `43c58849d605715a90f714553f80e46b53946c98`, **not** the later `main` changes.
- `main` and `claude/trusting-cori-ixprfj` must never be committed to, merged into, or used as the source of employee data for this trial.
- `index.html` on the trial branch loads only `data.js`, `central/config.js`, `central/model.js`, and `central/app.js`; **no Gmail, Sheets, Drive, Airtable, Claude or other external connectors**.
- Original v3.7 monitor is kept unchanged as `legacy.html` on this trial branch, with its original JS/CSS, navigation and 51-person sample records.
- **Do not merge this branch into live main**. Preview with a local static server or an explicitly isolated non-production environment. No production deployment workflow is configured by this branch.

## Trial behavior

The navigation follows the provided **MADDIE CENTRAL | 2027 IT Workspace Implementation Guide**, including **9 exact top-level categories** and **86 expandable subcategories**. Every category has a dedicated URL route and each subcategory has a linked filtered record view or an honest empty state. Keyboard-native accordions, breadcrumbs, back links, responsive card/table layouts, theme toggle, visible focus, reduced motion and CSV exports for non-sensitive sections are supported.

The 51 fictional employees, 8 fictional divisions, 201 file checklist records, journey statuses, attendance exceptions and movement records derive from one `MJ_SEED` fixture keyed by immutable Employee IDs. Separate synthetic schedules, requisitions, governance case shells and executive action items demonstrate the additional navigation. Aggregate dashboard numbers are calculated from these sample records, not manually entered or sourced from a live system. Sample-period dates refer to the **2026 demo snapshot**, despite the prospective 2027 workspace title.

Controlled fields (employment, document, attendance, recruitment, journey, training, event, governance and executive statuses) live in `central/config.js`. Search, status filter, division filter, sorting, status changes for selected demo roles, saved views and light/dark theme are functional **within the browser**. Local status changes and saved filters are stored under `mc-trial-*` browser storage keys; they do **not** update `data.js`, any GitHub branch or external databases. Clear browser site data to reset this local trial state.

## Privacy and trust boundary

The role selector is **a demonstrator, not authentication or security enforcement**. The GitHub repository is public, and all files in it are inherently publicly readable. **Never add real employee details, salaries, government identifiers, medical notes, employee-relations evidence, passwords, passphrases, tokens or connector responses**.

Highly Restricted screens are masked for non-authorized *simulated* roles. The general dashboard shows de-identified aggregates. Restricted and confidential CSV exports are disabled in the trial. Any future real-data solution requires approved backend/database platform, server-side role authorization, row-level policies, secure document storage, MFA, immutable audit history, data-owner approval, retention settings and tested access control. A front-end role selector cannot supply these guarantees.

## Navigation map

01 PEOPLE DIRECTORY — 10 subcategories
02 PAY & BENEFITS — 9 subcategories
03 WORKFORCE PULSE — 6 subcategories
04 MADDIE JOURNEY — 9 subcategories
05 MADDIE LEARNING HUB — 11 subcategories
06 CULTURE & COMMUNITY — 11 subcategories
07 TALENT ACQUISITION — 9 subcategories
08 PEOPLE GOVERNANCE — 9 subcategories
09 EXECUTIVE SCOREBOARD — 12 subcategories

The category labels and all 86 dropdown labels are in `central/config.js` and checked in the trial suite. The six executive view shortcuts are preconfigured and link to their corresponding fictional reports.

## Developer commands

```sh
node tests/smoke.js
node tests/central-smoke.js
python -m http.server 8080
```

Open `http://localhost:8080/` to review the new 2027 trial, or `http://localhost:8080/legacy.html` to review the preserved v3.7 fictional monitor.

The isolated `.github/workflows/central-trial.yml` checks both test suites on pushes to this trial branch. It **does not deploy to GitHub Pages or push changes to main**.

## Unimplemented production capabilities

The guide's full production scope is **not** claimed as done. This trial does not provide actual linked cloud databases, validated role permissions, record creation/closure forms, editable attachments, secure personnel file vaults, email/push reminders, approvals, signed audit history, external synchronization, WIG #4 target validation or verified source-of-truth governance. These require separate platform and access-control decisions before implementation.

## Manual acceptance tests still needed

- Desktop viewport 1024, 1280, 1440 and 1920 pixels; mobile 320, 375 and 430 pixels; tablet 768 pixels.
- iPhone Safari and Android Chrome: category routing, native accordions, focus after back navigation, drawers and scroll behavior.
- Screen reader (NVDA or VoiceOver): landmark order, accordion state, labels, filter announcements, table navigation and restricted notices.
- 200% zoom, keyboard-only usage, high contrast, dark/light mode and reduced-motion settings.
- Verify every category/subcategory link, status edits under P&C simulated roles, filters, local reset and CSV exports using **only** fictional data.
- Independently verify the live `main` website and Claude branch remain on their existing commits. Do not enable Pages deployment for this trial.

**Acceptance boundary:** This is a navigable, testable **fictional prototype**, not a production People & Culture system.


## Nine category summary dashboards — trial update (November 13, 2026)

Every category page now opens with a dedicated, source-derived executive **summary dashboard** before the existing expandable directory. The following features are shared across the nine screens:

- Category-specific introductory header, last demo snapshot, simulated viewer role, and clearly visible **Fictional sample data only** label.
- Between 4 and 8 category-specific metric cards, rendered with restrained pastel backgrounds and **white chips** (with dark text) in light and dark appearance.
- Source-derived status mix and bar visualization with accessible numeric totals, linked highlights, demo-record activity, and honest risks/source limitations.
- Direct clickable links to **every** subcategory within the category, plus the original accordions and existing records views.
- Responsive breakpoints for desktop/tablet/mobile, keyboard focus, reduced motion and forced-colors support.
- Local test status edits update the relevant summary calculations on next render; no data leaves the browser.

| Workspace | Summary focus |
| --- | --- |
| PEOPLE DIRECTORY | 51 employee IDs, 201 file completeness, review requests, movements and performance records |
| PAY & BENEFITS | Aggregate pay-record coverage, synthetic benefit workflows and compensation movement counts; no individual compensation values |
| WORKFORCE PULSE | Verified demo attendance entries and late/absent exceptions, without falsely claiming live daily presence |
| MADDIE JOURNEY | Completion, assessment queues, progress percentages, report cards and movement examples |
| MADDIE LEARNING HUB | Training programs, fictional schedule statuses and linked attendance |
| CULTURE & COMMUNITY | Sample events, milestones, recognition and event approval statuses |
| TALENT ACQUISITION | Demo requisitions and recruitment stages, without inventing candidates or vacancy aging |
| PEOPLE GOVERNANCE | De-identified fictional case-status aggregates only; no personal allegations or case evidence |
| EXECUTIVE SCOREBOARD | Derived headcount, document requests, attendance exceptions, recruiting, training, journeys, decisions and blocked actions |

**Source caveat:** This fixture contains no validated HMO enrollment, payroll contributions, daily present-today logs, overtime durations, training assessments, applicant roster, vacancy-creation timestamps or approved WIG #4 targets. The affected metrics display **Not tracked**, not synthetic percentages or fabricated operational totals.

### Relevant trial files and verification

- \`central/summary.js\` — pure category-specific summary definitions and derivations.
- \`central/summary.css\` — responsive pastel cards, white chips and summary-specific accessible styles.
- \`central/app.js\` — new category summary renderer; accordion directory and all deep links preserved.
- \`tests/central-smoke.js\` — includes summary coverage, source-rollup reconciliation, local status edit recomputation, sensitive summary masking, deep links and white-chip checks.

Run \`node tests/smoke.js\` and \`node tests/central-smoke.js\`. As of this update, **119 legacy + 21 new trial checks passed** in GitHub Actions. Browser/device visual acceptance and real security review are still outstanding.

**Publishing note:** GitHub generated automatic “pages build and deployment” runs on trial-branch pushes. Repository branch isolation keeps \`main\` and the Claude branch unchanged, but does **not** by itself guarantee that a separately configured Pages published site will remain unaffected. Review GitHub Settings → Pages before treating the published URL as a protected production environment.


## Editorial visual refinement + collapsible navigation (November 13, 2026)

This trial-only refinement adapts the user-supplied layouts into an executive monitoring interface rather than reproducing their photography or branding:

- **Black notes-board direction:** A black editorial dashboard masthead with large, confident type; white, rounded filter chips; and three vivid, linked pastel preview cards (people, executive and journey).
- **People-story direction:** Three colorful, vertical sample-profile cards below the nine workspace categories. These are **fictional employees from the unchanged 51-person demonstration fixture**. Only CSS-generated initials, shapes and gradients are used — **no real headshots, stock portraits or personal photos**.
- **Graphic-poster direction:** Strong cobalt, violet, apricot and yellow accents, geometric decorative elements, short uppercase metadata labels, and generous typographic hierarchy.
- **Existing category summary dashboards remain:** Their data-derived metrics, white chips, status breakdowns, highlights, example activity and all 86 subcategory links are unchanged in meaning.

### Collapsible sidebar behavior

1. **Desktop (above 900px):** The sidebar collapse control in the top bar toggles between the full ~270px navigation and a compact **78px icon rail**. The choice is stored under the existing fictional trial storage prefix, using \`mc-trial-sidebar-collapsed\`. Every icon retains its visible title tooltip and accessible link label.
2. **Mobile/tablet (900px or narrower):** Navigation uses an off-canvas panel and backdrop. The mobile button opens/closes it, **Escape** closes it, and **Tab** remains within the open drawer. While closed, off-screen navigation links are marked inert; the main panel is inert while the drawer is open.
3. **Route continuity:** Existing category routes, all 86 subcategory deep links, saved local demonstration filters, theme switching, fictional record summaries and \`legacy.html\` remain available.
4. **Appearance:** White chips keep dark text in both themes. Motion honors reduced-motion preferences, and the design includes a forced-colors fallback.

### Relevant source and regression checks

- \`central/editorial.css\` — new reference-inspired design styles; loaded only by trial \`index.html\`.
- \`central/app.js\` — editorial dashboard and fictional profile cards, persistent desktop rail, keyboard-friendly mobile drawer.
- \`tests/central-smoke.js\` — six additional checks covering styled home sections, mock identity provenance, collapse persistence, mobile open/close, route availability, white chips and no external photo/data sources.

**Automated test result:** 119 unchanged legacy v3.7 tests + 27 fictional trial tests = **146 passing tests**. Real-device browser and screen-reader checks remain necessary; an automated smoke suite cannot certify pixel-perfect rendering on every device.

**Deployment caution:** GitHub automatically initiates Pages build/deployment jobs after trial-branch pushes, despite no changes to the \`main\` branch. Check the repository's GitHub Pages source/environment before assuming the live website is unaffected. This refinement makes no changes to \`main\`, Claude branches, repository permissions or production integrations.


## Executive motion, navigation stabilization & progressive disclosure (trial update)

This interaction phase adapts the supplied visual reference to an **executive monitoring application** without reproducing external branding, likenesses, real employee photography, or copyrighted graphical assets.

### What changed

- **Navigation overflow repaired.** The original site-wide 320px minimum width caused sideways scrolling at ultra-narrow widths. The trial interaction stylesheet now allows sub-320px viewports, constrains navigation item sizing, truncates long labels, and contains overflow in the sidebar.
- **Desktop sidebar slide.** Full navigation collapses to a 78px labeled-icon rail with a smooth grid-column transition. The collapsed preference persists locally. The toggle changes classes and ARIA attributes **without reconstructing the app DOM**, so focus and scroll state remain stable.
- **Mobile drawer slide.** Off-canvas navigation uses an eased lateral entrance/exit and fading backdrop. It preserves its closed position with reduced-motion enabled; mobile focus is trapped when open and returned on Escape.
- **Contextual drill-down.** The active workspace exposes a native expandable mini-list of the first four subcategory links and a route-safe "All views" affordance; the rail still shows only icons when collapsed.
- **Executive overview selector.** Every one of the nine category dashboards now offers four keyboard-accessible focus modes: **Overview, Priorities, Updates, Explore all views**. The default Overview shows metrics and status priorities without exposing every detail at once; the other modes progressively reveal their own views. All 86 subcategory routes and original accordions remain intact.
- **Slide-ready route transitions.** Supported browsers use the document View Transitions API; other browsers progressively enhance route entrances with the Web Animations API. Both gracefully fall back to instantaneous navigation without losing content.
- **Micro-interactions.** Responsive editorial cards lift subtly on hover, arrows signal drill-down, accordion content eases into view, status bars grow on arrival, and limited on-screen cards enter in a short stagger. Effects are modest and cap stagger times to avoid slowing executive review.
- **Accessibility and performance.** Keyboard arrow/Home/End navigation works across the four focus modes. Tabs expose selected state, keyboard roving focus and labelled content regions. Reduced-motion users get equivalent functionality with motion disabled. Motion does not download any third-party animation library or query live services.

### Files

- \`central/kinetic.css\` — overflow stabilization, navigation slide, executive cards, focus tabs, stagger and reduced-motion design.
- \`central/motion.js\` — optional, bounded WAAPI and IntersectionObserver enhancement; no network or external animation dependency.
- \`central/app.js\` — persistent collapse without DOM replacement, contextual links, progressive-focus categories and motion-aware routing.
- \`index.html\` — trial-only stylesheet and script registration.
- \`tests/central-smoke.js\` — additional behavioral and regression coverage for focus modes, keyboard controls, ultra-narrow layouts, motion fallback, sidebar persistence and context navigation.

### Verification and limitations

CI runs both \`node tests/smoke.js\` (preserved v3.7 monitor) and \`node tests/central-smoke.js\` (isolated fictional 2027 trial). The role preview remains **not authentication** and this is not a secure production HR data system.

Still requires real browser QA at **280, 320, 375, 430, 768, 1024, 1440 and 1920px**, iPhone Safari, Android Chrome, Windows keyboard-only and screen readers. CSS and mocked event tests are not substitutes for actual screenshot-based visual inspection.

**Operational deployment warning:** GitHub's repository-level Pages configuration is currently producing "pages build and deployment" jobs on pushes to this trial branch. These deployments can target the same URL as the live \`main\` site even though no commit, merge or push touches \`main\`. To maintain separate public preview and live environments, production Pages settings must be corrected independently before treating the published URL as an isolated trial preview.


## Uploaded \`maddie-central.html\` wireframe integration (November 13, 2026)

This phase translated the uploaded standalone wireframe's **information architecture and interaction patterns** into the existing *isolated* Maddie Central 2027 trial. It did **not** copy the uploaded source wholesale, because that source uses separate hardcoded data for **54 employees**, ten departments, fictitious payroll totals, candidate counts, sample passcode/login messaging, and claims about live connectors. Those claims conflict with this branch's protected, read-only **51 fictional employees / eight divisions / zero live integrations** contract.

### Integrated visual and interactive patterns

| Uploaded wireframe design pattern | Implemented trial behavior |
| --- | --- |
| Executive hero and attention queue | New source-derived executive operating picture with fictional document, attendance, journey and decision review counts |
| Week / month / quarter segmented controls | Real client-side selection of due dates within the next 7 / 30 / 90 days relative to the November 13, 2026 demo snapshot |
| Severity tabs | All / High review queue filters, with no fake notification acknowledgment or dismissal |
| Color-accent KPI tiles | Linked and responsive cards showing fictional headcount, requisitions, attendance exceptions, document requests and sample upcoming deadlines |
| Department composition | Aggregated headcount-by-division stacked bar and legend calculated directly from the unchanged 51-person masterlist |
| Coming-up timeline | Due dates sourced only from fictional journey, recruiting, learning, culture and executive records |
| Workspace monitoring table | Nine-row status/coverage table, each row linked to the existing category dashboard |
| Global quick-search | Ctrl / Cmd + K command palette finds all nine workspaces and their 86 subcategory views |
| People Directory | Live-derived *fictional* division composition panel; existing Employee Masterlist search, filters and record pages remain |
| Pay & Benefits | Benefits readiness pipeline derived from sample statuses, **without** claiming payroll release dates, pay totals or benefit enrollment |
| Workforce Pulse | Weekday exception visualization from verified fictional late/absent entries; not an official daily presence rate |
| Maddie Journey | Non-editable progression board using existing employee journey stage/status and checklist completion |
| Learning Hub | Attendance-based program rings with transparent denominator; not invented training assessments |
| Culture & Community | November / December 2026 calendar whose marks reflect fictional event due dates |
| Talent Acquisition | Stage-grouped **requisition** board, not unsupported candidates or offer approval |
| People Governance | De-identified aggregate case-state matrix; no names, allegations, evidence or sensitive personnel information |
| Executive Scoreboard | Percentage coverage against actual sample-record denominators; no fabricated WIG #4 targets |

The prior nine category summary dashboards, protected simulated-role previews, 86 subcategory deep links, mobile and desktop collapsible navigation, keyboard controls, local-only fictional updates, white chips and reduced-motion protections remain in place. The older redundant bottom-of-home KPI row was removed to reduce duplicate information; six executive saved-view shortcuts are preserved in an optional expandable section.

### Code and safety

- \`central/wireframe.js\`: purely source-based HTML renderers and derived fictional data; no connector or fetch calls.
- \`central/wireframe.css\`: responsive executive cards, table, timeline, status boards, heat visualization, sample calendar and native command dialog.
- \`central/app.js\`: safe integration points and interactive period/severity/calendar controls, native-dialog command palette and keyboard shortcut.
- \`tests/central-smoke.js\`: new reconciliation tests for source-driven values, all nine visuals, search, deep links, privacy and controls.
- \`index.html\`: trial-only assets; no uploaded base64 photograph, passcode system or real connector scripts were added.

### Constraints and next acceptance review

The trial's role selector **is not** server authentication; do not put real HR data or secrets in the public repository. The dashboard cannot claim real-time freshness, actual payroll approval, employee relations findings, staff attendance today, or candidate pipeline performance.

Device/browser testing is still required at 320 / 375 / 430 / 768 / 1024 / 1440 widths, keyboard-only, iPhone Safari, Android Chrome, screen readers, dark mode, and reduced-motion. Verify the global search opens with Ctrl / Cmd + K, all result links resolve, November/December calendar switching works, and each executive period filter changes only documented due-date counts.

**Publishing warning:** The repository's existing Pages settings are triggering a **production URL deployment from trial-branch pushes**. Git branch isolation does not isolate GitHub Pages deployment. Do not assume \`https://nemtxt.github.io/Maddie-Journey-NemDev-/\` is a safe preview, and confirm repository Pages source before relying on that URL for confidential or live operations. No changes were made to \`main\` or the Claude branch by this work.
