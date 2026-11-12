# Maddie Journey · Static Prototype v1.1

An editable **51-employee demonstration** for the Madhouse People & Culture team. Built using **HTML, CSS and vanilla JavaScript**, with no build tools, subscriptions, Airtable, Firebase, Supabase or paid hosting required.

**Repository:** https://github.com/nemtxt/Maddie-Journey-NemDev-

## Run and publish

Open index.html in a modern browser to test locally. For a shared GitHub Pages preview, go to the repository's **Settings → Pages → Build and deployment → Deploy from a branch**, choose **main** and **/(root)**, then save. Once GitHub has published the site, its expected URL is:

https://nemtxt.github.io/Maddie-Journey-NemDev-/

> A GitHub Pages URL is **not considered live** until Pages is enabled and a successful deployment is confirmed.

## What is included

- **Overview:** company-wide metrics, division progress, pending reviews, attendance indicators and one-click access to assigned evaluator departments.
- **Divisions:** a seven-division index, with one dedicated member evaluation screen per department, evaluator information, assigned team list, demo KPI scores and direct evaluation shortcuts. URLs use #division/rmd, #division/design, #division/corp, #division/media, #division/it, #division/gencon and #division/bd.
- **Employees:** 51 local demonstration records distributed across seven divisions. HR can modify profile details; other roles view them.
- **Journey:** Stage 1 onboarding and documentation, Stage 2 orientation and immersion, and Stages 3–7.
- **Welcome Maddie Kit:** equipment, AI software, email, messaging and community access, with notes and individual completion checklists.
- **Attendance:** individual late/absent/leave entries, verification, approved/excused/unapproved distinction, rankings and trends.
- **2026 KPI:** fixed category weights of **15% division objectives + 45% individual objectives + 15% values + 25% job behavior**, weighted result and rating.
- **Approvals:** Division Head → Corporate Operations → CSO → COO review chain, notes, endorsements and simulated salary proposals/approvals.
- **Activity & data:** local audit log, CSV/JSON exports, JSON backup import and reset.
- **Screen summaries:** each workspace and each division screen displays four computed sample-data metrics; employee profiles include a compact personal summary.

## Evaluator and role demo

Use the **role selector in the upper-right corner** to preview different workflows. No sign-in is required **for the demo**.

| Division or responsibility | Assigned demo evaluator |
| --- | --- |
| People & Culture (HR) | GIEZELLE; KURT |
| Revenue Management Division | TRIZIA BALDOVI — Chief Experience Officer |
| Design Division | AR. AJ TRABADO — Design Operations Manager |
| Corporate Operations | RENATO RENDON; ZSARINA MAE LACUMBA |
| Media | MICHELLE OROCIO — Media Manager |
| IT | INIGO ARELLANO — COO |
| GenCon | INIGO ARELLANO — COO |
| Business Development | MA. CRISTINE ORTIZ — Business Development Head |

The **CEO** and **CSO** also have generic role-preview entries; their actual names were not supplied.

### Editing matrix (prototype role preview)

| Role preview | Accessible data and demo actions |
| --- | --- |
| **CEO / CSO / COO observer** | View company-wide metrics, all seven divisions, employee report cards and evaluation/approval status; **no edits or approvals** in this version |
| **People & Culture / HR: GIEZELLE or KURT** | Maintain employee profiles, onboarding and Welcome Kit, attendance verification, KPI Values Alignment (15%) and Job Behavior (25%) |
| **Assigned Division Head** | Open their department evaluation desk; update assigned employees' Division Objectives (15%), Individual Objectives (45%), sample targets and salary proposals; submit division evaluation |
| **Corporate Operations: RENATO or ZSARINA** | Assigned Corporate Operations scoring and executive workflow endorsement demonstration |
| **INIGO ARELLANO — IT & GenCon evaluator** | Separate division-input context for IT and GenCon. **INIGO ARELLANO — COO observer** is a distinct read-only context for the same named evaluator |

**Important separation:** The requested COO observer access conflicts with the earlier specification that the COO should edit final approvals. The *latest instructions* are applied here: COO, CEO and CSO are observer-only. Previous final approval examples are fictional pre-populated status records. Actual final approval operations remain a future authenticated-backend requirement.

Changing any evaluated KPI, objective, compensation proposal or an employee's division invalidates previously recorded approval statuses for that employee. This demonstrates a review trail that requires the changed evaluation to be endorsed again.

### Initial demonstration data

Fresh or reset data has 51 fictional employee records across seven divisions. A few evaluations include staged fictional approvals for executive dashboard previews. If you opened an earlier build in the same browser, existing local edits and statuses are retained; use **Activity & data → Reset 51 sample employees** only if you want the new sample fixtures, because reset clears previous local changes.

## Important: demo restrictions

- **All 51 employee profiles, attendance entries, salary amounts, targets and KPI scores are fictional.** They must not be used for real employee assessments or compensation decisions.
- Employee KPI figures are **not official 2026 records**. Missing official KPI links are intentionally marked for validation.
- Changes are stored only in this browser's localStorage. **They do not sync across devices, users or GitHub.** Export JSON backups to move demo changes to another browser.
- The role selector models who can edit what in the interface, but does **not** provide backend authorization. Anyone who accesses the page can switch demo roles.
- **Do not store actual employee personal information, salary data, passwords, API keys, private Airtable URLs or confidential documents** in this public repository or prototype.
- GitHub Pages hosts static files; actual multi-user collaboration, secure access permissions, attendance verification, sensitive HR records and server-side audit logs will require a properly secured backend and authentication.

## Files

- index.html — static HTML entry point
- styles.css — visual design and responsive layouts
- data.js — synthetic fixture records and workflow definitions
- app.js — interactive views, calculations, local storage and exports
- README.md — this setup and usage guide

**Prototype purpose:** validate screen organization, division ownership, checklist completeness, roles, calculations and approval flow **before** integrating official data sources.