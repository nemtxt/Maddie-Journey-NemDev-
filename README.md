# Maddie Journey · Static Prototype

An editable **51-employee demonstration** for the Madhouse People & Culture team. Built using **HTML, CSS and vanilla JavaScript**, with no build tools, subscriptions, Airtable, Firebase, Supabase or paid hosting required.

**Repository:** https://github.com/nemtxt/Maddie-Journey-NemDev-

## Run and publish

Open index.html in a modern browser to test locally. For a shared GitHub Pages preview, go to the repository's **Settings → Pages → Build and deployment → Deploy from a branch**, choose **main** and **/(root)**, then save. Once GitHub has published the site, its expected URL is:

https://nemtxt.github.io/Maddie-Journey-NemDev-/

> A GitHub Pages URL is **not considered live** until Pages is enabled and a successful deployment is confirmed.

## What is included

- **Overview:** company-wide metrics, division progress, pending reviews and attendance indicators.
- **Employees:** 51 editable local demo records distributed across seven divisions.
- **Journey:** Stage 1 onboarding and documentation, Stage 2 orientation and immersion, and Stages 3–7.
- **Welcome Maddie Kit:** equipment, AI software, email, messaging and community access, with notes and individual completion checklists.
- **Attendance:** individual late/absent/leave entries, verification, approved/excused/unapproved distinction, rankings and trends.
- **2026 KPI:** fixed category weights of **15% division objectives + 45% individual objectives + 15% values + 25% job behavior**, weighted result and rating.
- **Approvals:** Division Head → Corporate Operations → CSO → COO review chain, notes, endorsements and simulated salary proposals/approvals.
- **Activity & data:** local audit log, CSV/JSON exports, JSON backup import and reset.

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