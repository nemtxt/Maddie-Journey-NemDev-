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
