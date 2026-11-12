# Maddie Journey · Prototype v1.8

A lightweight, button-first People & Culture prototype built using **HTML, CSS and vanilla JavaScript only**. No build tools, paid subscriptions, login, Airtable or cloud service are needed for demonstration.

**Repository:** https://github.com/nemtxt/Maddie-Journey-NemDev-

## Open and deploy

Open `index.html` in a modern browser for a local test. The first screen is the official-logo landing page.

To deploy with the included test-and-deploy workflow: open **GitHub repository → Settings → Pages → Build and deployment → Source: GitHub Actions**. Save this one-time setting. Every subsequent push to `main` runs `node tests/smoke.js`, then deploys the static site if the tests pass. View results in the repository's **Actions** tab. A public repository can use this workflow without adding a paid backend. After GitHub reports a successful Pages publication, the expected URL is:

https://nemtxt.github.io/Maddie-Journey-NemDev-/

The URL is not assumed live until Pages publication is verified. GitHub Pages must be enabled for this repository; committing the workflow alone does not prove that deployment succeeded.

## v1.8 — Original artwork and unified pastel operations interface

This release follows the approved landing-page reference and uses **the exact uploaded files**, not re-generated or WebP-derived images.

- **Official logo:** `assets/madhouse-logo.png`, unchanged original PNG, 720 × 117 pixels, SHA-256 `c3659c9b6e2e671074c82c313e70938556f65ef6f69850524a801684ecd2decc`.
- **Event photograph:** `assets/madhalloween.jpg`, unchanged original JPEG, 1800 × 1072 pixels, SHA-256 `e69297164df142ade9ceecb9287dfe30814b6e9fb89619502fc0c3dc7a06fe29`. The second upload was JPEG, so preserving its original bytes avoids changing its format or introducing additional compression.
- **No WebP assets:** The previous optimized WebP was removed, and all photo references now use the original JPEG.
- **Approved landing layout:** translucent header positioned over the event photograph, bold left-aligned introduction, three audience cards (HR, Division Heads, executive overview), feature shortcuts and pastel-wave footer. The supplied third screenshot is the layout reference, not used as a flattened webpage.
- **Consistent product palette:** `palette.css` applies warm blush backgrounds, pink primary buttons, pastel yellow and blue summary cards, readable plum text, and subtle lavender accents to navigation, dashboard cards, org charts, tables and centered modals.
- **Light / Dark:** Light is the default for a new visitor. Switching appearance is persistent, and both palettes work on internal screens. Earlier saved preferences are respected.
- **Operational model:** All 51 sample employees, eight divisions and existing tracker functionality are retained. HR and assigned Division Heads can preview/edit the demo fields permitted by the existing simulated role logic. CEO/COO/CSO demonstrations remain observer-oriented.
- **Data policy:** No actual Airtable/Google connector or authenticated multi-user backend is claimed or deployed. Static GitHub Pages cannot enforce real HR permissions.

Regression checks: run `node tests/smoke.js`. A live desktop/mobile browser visual review is a separate acceptance step.

## v1.5 — Earlier typography and appearance foundations

The interface now follows the design language of the **Nemesis Corporation** website supplied with this project: **Inter typography, restrained dark canvas, fine dividers, low-emphasis card surfaces, subtle department accents, compact pill buttons and a translucent sticky header**. It does not copy the corporate website's brand assets or introduce marketing-page animations into operational workflows.

- **Appearance:** Use the **Light / Dark** segmented control in the **top-right header**. The current choice is stored in the browser under \`maddie-journey-theme\`, separately from HR sample records. The initial dark prototype was superseded by the v1.8 light-first pastel palette; both themes continue to cover the application.
- **Progressive transition:** Theme colors blend gently instead of flashing. Modal entrances and card hover states are subtle; the CSS respects \`prefers-reduced-motion\` and disables nonessential movement when required.
- **Eight divisions:** Each division has a small, consistent accent used on its cards and department header only. This keeps divisions identifiable without making the dashboard overly colorful.
- **HR workflow:** Overview → People directory or Milestones → select division/employee → open a centered modal to edit permitted fields.
- **Division Head workflow:** Overview → assigned department → employee card → KPI/Journey/Kit/other relevant modal. Department owners can edit only their designated demo inputs.
- **Executive observer:** Read-only overview and report previews; demonstration roles are not secure login accounts.
- **Keyboard access:** Visible focus indicators and a Skip to main content link. Theme switching does not re-render forms or discard open modal state.

Appearance changes need no build process and no backend. All new styling lives in \`theme.css\`, layered after the original \`styles.css\` to keep future refinements separate.

## v1.7 — Official Madhouse landing page

The root URL (no hash, or `#welcome`) now opens a lightweight, responsive landing screen before the dashboard.

- **Authentic branding only:** the provided Madhouse Design Studio logo is used in the landing header, dashboard sidebar and mobile header. The invented pink “M” symbol from the earlier illustration is intentionally not part of the project.
- **Real supplied photo:** the Madhalloween team photograph is the landing hero background, preserved as the original upload `assets/madhalloween.jpg`. The original source was supplied for this prototype; the optimized image does not contain baked-in text or fabricated branding.
- **Pastel interface:** pink, white, soft yellow and blue, with the existing persistent Light / Dark control. Light is the initial appearance for new browsers; previously saved choices remain unchanged.
- **Direct navigation:** Open dashboard, View divisions, and links to Org charts, Employees and Data sources. The HR, Division Heads and Executive overview cards set a fictional demo workspace and open the overview; these are not login or authorization controls.
- **Preserved routes:** `#overview`, `#divisions`, `#division/rmd`, and all other direct dashboard links still work. A new `#welcome` destination returns to the landing screen.
- **Preserved information:** no employee data, scores, milestones, evaluators or sources were replaced. The 51 sample employees in eight divisions are still stored in the local browser.
- **Accessibility:** keyboard-reachable links and buttons, focus outlines, calm responsive layouts and reduced-motion support. No new JS framework, sign-in dependency or billing is required.

Landing styling lives in `landing.css`. The design is built using normal HTML/CSS/JS; it is **not** a screenshot used as a website background. Images are kept as separate files so they can be replaced or compressed without changing navigation.

## v1.6 changes

- A focused home dashboard: four KPIs, a category-filtered action queue, quick links and an eight-division table.
- Each division now has Summary, Org chart and Employees tabs, with clickable six-level fictional hierarchies.
- An honest Data Sources screen shows Airtable, Google Sheets, Google Drive, Google Docs and email as not connected.
- All 51 sample employees and older saved scores are preserved; the new hierarchy fields use data version 6.
- Additional visual and accessibility refinements are in operations.css.
- Run `node tests/smoke.js` for regression testing; see `docs/UX_DASHBOARD_DECISIONS.md` for research rationale.

## Simple user flow

1. **Overview** — a company-wide starting point with practical summary cards. The top header has no demo-role selector, sample badge, or global division dropdown.
2. **Divisions** — all eight departments are always accessible. Choose a department to see only its member cards, assigned evaluators and scoring summaries.
3. **Employees** — a 51-person fictional directory. Open an employee in a centered modal; their details remain available without leaving the current screen.
4. **Milestones** — choose **one** of six categories at a time: Birthdays, Tenure, Hiring, Promotions, Perfect attendance and Disciplinary actions. The one-page list can be filtered by department inside this screen.
5. **Journey / Welcome Kit / Attendance / KPI scorecards / Reviews** — the main screen shows **eight departmental summaries**. Select **View team**, then **Open** beside the desired member to work in a centered modal. Full forms are deliberately not shown under the overview.
6. **Data & settings** — local backup, CSV export, import, activity log and demo reset.

Navigation is grouped into **People**, **Operations** and **Performance**. A discreet **Switch demo view** button at the bottom of the sidebar allows testing HR, Division Head and executive observer experiences. It is not a secure login system.

## Eight demonstration divisions and evaluators

| Division | Evaluator |
| --- | --- |
| Revenue Management | TRIZIA BALDOVI — Chief Experience Officer |
| Design | AR. AJ TRABADO — Design Operations Manager |
| Design Operations | AR. AJ TRABADO — Design Operations Manager |
| Corporate Operations | RENATO RENDON / ZSARINA MAE LACUMBA |
| Media | MICHELLE OROCIO |
| IT | INIGO ARELLANO |
| GenCon | INIGO ARELLANO |
| Business Development | MA. CRISTINE ORTIZ |

**HR:** GIEZELLE and KURT. **Executive observers:** CEO, CSO, COO. Since no separate Design Operations evaluator was supplied, both Design groups share Ar. AJ Trabado for the prototype. Inigo has separate COO Observer and IT/GenCon evaluator preview contexts.

The sample dataset stays at **exactly 51 fictional employees**.

## New employee milestone records

| Category | How it works | Demo editor |
| --- | --- | --- |
| Birthday | Upcoming birthday calculated from the fictional employee's date of birth | HR updates date in Profile |
| Tenure | Completed years and next anniversary derived from hiring date | HR updates hiring date in Profile |
| Hiring | Joining date and new hire status derived from start date | HR updates hiring date in Profile |
| Promotions | Dated prior/new positions, proposed or approved status and notes | HR can edit/approve; assigned Division Heads can propose/recommend |
| Perfect attendance | A specific month's award is recorded explicitly; **not automatically inferred from incomplete attendance data** | HR verifies and edits awards |
| Disciplinary actions | Case category, action level, status and internal note; sample data only | HR-only detail and edit controls |

To add a promotion, award or case, choose the employee and open **Milestones** in their centered employee popup. Use **Add**, **Edit** or **Remove**. Dates and status choices are validated.

Disciplinary details are hidden from non-HR demo roles. **These role restrictions are interface simulations, not security controls.** Do not use actual HR cases or employee personal data.

## Other features retained

- Seven-stage onboarding, Welcome Maddie Kit and issuance notes.
- Verified attendance entry editor, approval/excuse states, monthly charts and individual history.
- 2026 weighted KPI evaluation: **Division 15%, Individual 45%, Values 15%, Job Behavior 25%**.
- Division Head → Corporate Operations → CSO → COO review status tracking. CEO/CSO/COO previews are read-only; final sample approvals are fictional.
- Local action history; employee and attendance CSV exports; JSON backup, import and reset.

## Persistence and privacy

All sample data is stored in your own browser's **localStorage**. The prototype does **not** sync edits to GitHub or between users/devices. GitHub Pages only hosts the static files. The demo role chooser is **not authentication**.

The current fixtures are **v6**. Compatible v3/v4/v5 browser data and JSON imports are upgraded without wiping existing employee scores or manually edited profiles; missing milestone fields are added. **Reset** replaces local data with new fictional fixtures, so export a JSON backup before resetting.

Do not store real employee details, disciplinary actions, salaries, passwords, access tokens or private Airtable links in this public GitHub Pages prototype. Secure multi-user access requires a real authenticated backend before production use.

## Files

- `index.html` — landing and dashboard entry point
- `styles.css` — core responsive screens and centered dialogs
- `theme.css` — underlying typography and Light/Dark design tokens
- `operations.css` — responsive org charts, work queues and division tracking
- `palette.css` — unified pastel palette for all interior screens
- `landing.css` — approved responsive landing page and original JPG background
- `tests/smoke.js` — dependency-free regression checks
- `data.js` — fictional 51-person dataset and initial milestone records
- `app.js` — workflows, charts, edit dialogs, local storage and exports

### GitHub Pages automation

The repository includes `.github/workflows/pages.yml`. It tests before attempting deployment; a failed test blocks publication. Choose **GitHub Actions** as the Pages source under Settings. Do not publish confidential HR data or credentials in this static project.

### Branding assets

- `assets/madhouse-logo.png` — unchanged original PNG logo supplied by the user.
- `assets/madhalloween.jpg` — unchanged original JPEG photograph supplied by the user.
- `landing.css` — responsive pastel landing appearance and official branding in the dashboard shell.

