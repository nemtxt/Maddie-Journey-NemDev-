# Maddie Journey · Prototype v1.5

A lightweight, button-first People & Culture prototype built using **HTML, CSS and vanilla JavaScript only**. No build tools, paid subscriptions, login, Airtable or cloud service are needed for demonstration.

**Repository:** https://github.com/nemtxt/Maddie-Journey-NemDev-

## Open and deploy

Open `index.html` in a modern browser for a local test.

To deploy, open **GitHub repository → Settings → Pages → Deploy from a branch → main / (root) → Save**. After GitHub reports a successful publication, the expected URL is:

https://nemtxt.github.io/Maddie-Journey-NemDev-/

The URL is not assumed live until Pages publication is verified.

## v1.5 — Nemesis-inspired interface and progressive appearance

The interface now follows the design language of the **Nemesis Corporation** website supplied with this project: **Inter typography, restrained dark canvas, fine dividers, low-emphasis card surfaces, subtle department accents, compact pill buttons and a translucent sticky header**. It does not copy the corporate website's brand assets or introduce marketing-page animations into operational workflows.

- **Appearance:** Use the **Light / Dark** segmented control in the **top-right header**. The current choice is stored in the browser under \`maddie-journey-theme\`, separately from HR sample records. The initial default is dark to reflect the reference site; both themes cover all pages, charts, forms, division cards and popups.
- **Progressive transition:** Theme colors blend gently instead of flashing. Modal entrances and card hover states are subtle; the CSS respects \`prefers-reduced-motion\` and disables nonessential movement when required.
- **Eight divisions:** Each division has a small, consistent accent used on its cards and department header only. This keeps divisions identifiable without making the dashboard overly colorful.
- **HR workflow:** Overview → People directory or Milestones → select division/employee → open a centered modal to edit permitted fields.
- **Division Head workflow:** Overview → assigned department → employee card → KPI/Journey/Kit/other relevant modal. Department owners can edit only their designated demo inputs.
- **Executive observer:** Read-only overview and report previews; demonstration roles are not secure login accounts.
- **Keyboard access:** Visible focus indicators and a Skip to main content link. Theme switching does not re-render forms or discard open modal state.

Appearance changes need no build process and no backend. All new styling lives in \`theme.css\`, layered after the original \`styles.css\` to keep future refinements separate.

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

The current fixtures are **v5**. Compatible v3/v4 browser data and JSON imports are upgraded without wiping existing employee scores or manually edited profiles; missing milestone fields are added. **Reset** replaces local data with new fictional fixtures, so export a JSON backup before resetting.

Do not store real employee details, disciplinary actions, salaries, passwords, access tokens or private Airtable links in this public GitHub Pages prototype. Secure multi-user access requires a real authenticated backend before production use.

## Files

- `index.html` — static entry point
- `styles.css` — core responsive screens and centered dialogs
- `theme.css` — Inter-based Nemesis design system and progressive Light / Dark themes
- `data.js` — fictional 51-person dataset and initial milestone records
- `app.js` — workflows, charts, edit dialogs, local storage and exports
