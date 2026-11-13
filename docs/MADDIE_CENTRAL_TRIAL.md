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
