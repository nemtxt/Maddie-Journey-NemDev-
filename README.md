# Maddie Journey · Prototype v1.4

A lightweight, button-first People & Culture prototype built using **HTML, CSS and vanilla JavaScript only**. No build tools, paid subscriptions, login, Airtable or cloud service are needed for demonstration.

**Repository:** https://github.com/nemtxt/Maddie-Journey-NemDev-

## Open and deploy

Open \`index.html\` in a modern browser for a local test.

To deploy, open **GitHub repository → Settings → Pages → Deploy from a branch → main / (root) → Save**. After GitHub reports a successful publication, the expected URL is:

https://nemtxt.github.io/Maddie-Journey-NemDev-/

The URL is not assumed live until Pages publication is verified.

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

- \`index.html\` — static entry point
- \`styles.css\` — responsive screens and centered dialogs
- \`data.js\` — fictional 51-person dataset and initial milestone records
- \`app.js\` — workflows, charts, edit dialogs, local storage and exports
