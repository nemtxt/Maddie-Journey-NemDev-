# Maddie Journey · Static Prototype v1.3

An editable **51-employee demonstration** for the Madhouse People & Culture team. Built using **HTML, CSS and vanilla JavaScript**, with no build tools, subscriptions, Airtable, Firebase, Supabase or paid hosting required.

**Repository:** https://github.com/nemtxt/Maddie-Journey-NemDev-

## Run and publish

Open index.html in a modern browser to test locally. For a shared GitHub Pages preview, go to the repository's **Settings → Pages → Build and deployment → Deploy from a branch**, choose **main** and **/(root)**, then save. Once GitHub has published the site, its expected URL is:

https://nemtxt.github.io/Maddie-Journey-NemDev-/

> A GitHub Pages URL is **not considered live** until Pages is enabled and a successful deployment is confirmed.

## What is included

- **Overview:** company-wide metrics, division progress, pending reviews, attendance indicators and one-click access to assigned evaluator departments.
- **Divisions:** eight separate evaluator workspaces, each using concise employee cards with **Preview charts** and **Open evaluation** buttons. A Change division button opens a department selection popup. Direct routes use #division/rmd, #division/design, #division/designops, #division/corp, #division/media, #division/it, #division/gencon and #division/bd.
- **Employees:** 51 local demonstration records distributed across eight divisions. HR can modify profile details; other roles view them.
- **Journey:** Stage 1 onboarding and documentation, Stage 2 orientation and immersion, and Stages 3–7.
- **Welcome Maddie Kit:** equipment, AI software, email, messaging and community access, with notes and individual completion checklists.
- **Attendance:** individual late/absent/leave entries, verification, approved/excused/unapproved distinction, rankings and trends.
- **2026 KPI:** fixed category weights of **15% division objectives + 45% individual objectives + 15% values + 25% job behavior**, weighted result and rating.
- **Approvals:** Division Head → Corporate Operations → CSO → COO review chain, notes, endorsements and simulated salary proposals/approvals.
- **Activity & data:** local audit log, CSV/JSON exports, JSON backup import and reset.
- **Screen summaries:** each workspace and each division screen displays four computed sample-data metrics; employee profiles include a compact personal summary.
- **Employee preview popup:** centered responsive modal with a weighted KPI donut, 4 KPI category bars, 7-stage onboarding chart, recent verified attendance chart, Welcome Kit progress and review status. Buttons lead to KPI, journey, kit, attendance, review and HR-editable profile screens without navigating away.
- **Employee chooser popup:** replaces the previous long 51-name dropdown with eight easy department filter buttons and an individual employee Select action. The full directory remains available.
- **Separate HR and Division Head landing pages:** quick entry into relevant tasks and assigned members. Executive observers retain an organization-wide summary view.

## Evaluator and role demo

Use the **Switch Workspace button** in the upper-right corner (or the sidebar) to open a role chooser modal. The modal groups users into **People & Culture**, **Division evaluators** and **Executive observers**. No sign-in is required **for the demo**.

| Division or responsibility | Assigned demo evaluator |
| --- | --- |
| People & Culture (HR) | GIEZELLE; KURT |
| Revenue Management Division | TRIZIA BALDOVI — Chief Experience Officer |
| Design Division | AR. AJ TRABADO — Design Operations Manager |
| Design Operations | AR. AJ TRABADO — Design Operations Manager |
| Corporate Operations | RENATO RENDON; ZSARINA MAE LACUMBA |
| Media | MICHELLE OROCIO — Media Manager |
| IT | INIGO ARELLANO — COO |
| GenCon | INIGO ARELLANO — COO |
| Business Development | MA. CRISTINE ORTIZ — Business Development Head |

The **CEO** and **CSO** also have generic role-preview entries; their actual names were not supplied.

### Editing matrix (prototype role preview)

| Role preview | Accessible data and demo actions |
| --- | --- |
| **CEO / CSO / COO observer** | View company-wide metrics, all eight divisions, employee report cards and evaluation/approval status; **no edits or approvals** in this version |
| **People & Culture / HR: GIEZELLE or KURT** | Maintain employee profiles, onboarding and Welcome Kit, attendance verification, KPI Values Alignment (15%) and Job Behavior (25%) |
| **Assigned Division Head** | Open their department evaluation desk; update assigned employees' Division Objectives (15%), Individual Objectives (45%), sample targets and salary proposals; submit division evaluation |
| **Corporate Operations: RENATO or ZSARINA** | Assigned Corporate Operations scoring and executive workflow endorsement demonstration |
| **INIGO ARELLANO — IT & GenCon evaluator** | Separate division-input context for IT and GenCon. **INIGO ARELLANO — COO observer** is a distinct read-only context for the same named evaluator |

**Important separation:** The requested COO observer access conflicts with the earlier specification that the COO should edit final approvals. The *latest instructions* are applied here: COO, CEO and CSO are observer-only. Previous final approval examples are fictional pre-populated status records. Actual final approval operations remain a future authenticated-backend requirement.

Changing any evaluated KPI, objective, compensation proposal or an employee's division invalidates previously recorded approval statuses for that employee. This demonstrates a review trail that requires the changed evaluation to be endorsed again.

### Initial demonstration data

Fresh or reset data has 51 fictional employee records across eight divisions, including staged demo evaluations. Old browser data is migrated when possible without resetting its previous edits. Reset only if you want to replace the data with the newest fresh sample fixtures; that clears local changes.


## Quick start: user workflow

1. Click **Switch Workspace**. Choose GIEZELLE or KURT for HR tasks; a named department evaluator for scoring; or CEO / CSO / COO for observation.
2. **Division evaluators:** From **My evaluation workspace**, select a department and click **Preview charts** beside a team member. Open **KPI** to enter an assigned score or comment.
3. **HR:** Use the **HR workspace** quick buttons to access attendance, onboarding, the Welcome Maddie Kit or KPI scoring. Click **Change member** to open the department-filtered employee chooser.
4. **Executive observers:** Explore the division and employee dashboards without editing. Demonstration salaries and approval statuses are explicitly fictional.

Use **Escape**, the **×** close button, or click the shaded backdrop to dismiss a modal. On small screens, the navigation uses the mobile menu.

Existing local browser changes remain after code updates. To load newly added sample review scenarios, export any important JSON backup first, then use **Activity & data → Reset 51 sample employees**; reset clears previous local changes.


## v1.3: Eight divisions and consistent center-screen dialogs

This update retains **51 fictional employees** while separating **Design Division** and **Design Operations** into different tracker groups. Both use the provided evaluator **AR. AJ TRABADO** because no distinct Design Operations evaluator was supplied. The other seven assignments remain unchanged.

**Use the department scope button** at the top of the page to choose **All 8 divisions** or any specific department. This single selection is used consistently by the Employees directory, 7-stage Journey tracker, Welcome Maddie Kit tracker, verified Attendance trends and rankings, KPI evaluations, executive approval queue, activity log and the relevant CSV exports.

- **All-divisions tracker:** eight department-level summary rows and buttons to open the selected department.
- **Single-division tracker:** individual employee progress rows and direct actions to open the appropriate employee section.
- **Center-screen modals:** employee chart preview, HR attendance entry/edit, role chooser, department picker and employee picker now share a centered responsive dialog pattern. The previous right-side attendance editor is gone.
- **On refresh:** the selected division scope is restored in the same browser session. Department routes also restore their scope when loaded directly.
- **Existing sample data:** legacy v3 browser data (51 employees) is accepted. Untouched fictional employees previously in Design are partially moved to Design Operations; profiles with previous edits retain their division assignment. No KPI, comments, compensation or attendance records are discarded. Version-3 JSON backups can also be imported.
- **Resetting is optional:** reset creates the fresh v4 51-person, eight-division demo. Back up locally modified information with **Activity & data → Export all data (JSON)** before resetting.

This is a local browser prototype. **Switch Workspace is not secure authentication**, and edits are not synced to GitHub or other people's browsers.

## Important: demo restrictions

- **All 51 employee profiles, attendance entries, salary amounts, targets and KPI scores are fictional.** They must not be used for real employee assessments or compensation decisions.
- Employee KPI figures are **not official 2026 records**. Missing official KPI links are intentionally marked for validation.
- Changes are stored only in this browser's localStorage. **They do not sync across devices, users or GitHub.** Export JSON backups to move demo changes to another browser.
- The workspace chooser models who can edit what in the interface, but does **not** provide backend authorization. Anyone who accesses the page can switch demo roles.
- **Do not store actual employee personal information, salary data, passwords, API keys, private Airtable URLs or confidential documents** in this public repository or prototype.
- GitHub Pages hosts static files; actual multi-user collaboration, secure access permissions, attendance verification, sensitive HR records and server-side audit logs will require a properly secured backend and authentication.

## Files

- index.html — static HTML entry point
- styles.css — visual design and responsive layouts
- data.js — synthetic fixture records and workflow definitions
- app.js — interactive views, calculations, local storage and exports
- README.md — this setup and usage guide

**Prototype purpose:** validate screen organization, division ownership, checklist completeness, roles, calculations and approval flow **before** integrating official data sources.