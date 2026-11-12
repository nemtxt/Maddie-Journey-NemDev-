# Maddie Journey — Read-only Prototype v2.2

**Madhouse Design Studio · People & Culture**

[Open prototype](https://nemtxt.github.io/Maddie-Journey-NemDev-/) · [GitHub repository](https://github.com/nemtxt/Maddie-Journey-NemDev-) · [Claude connector handoff](docs/CLAUDE_CONNECTORS_HANDOFF.md)

## Project goal

Maddie Journey is a **reader, organizer, summary and monitoring dashboard**, not a system for recording or submitting employee information. It is used to preview division, Journey, attendance, KPI, milestone and review data originally maintained in external systems.

**This GitHub phase uses only fictional sample data:** 51 employees across eight divisions. There is no account creation, login, role chooser, employee editing, approval submission or live source synchronization.

The intended external data sources for the **later Claude-connected development phase** are Airtable, Google Sheets, Google Drive, Google Docs and email. Claude account connectors are not automatically accessible as a browser API from public GitHub Pages.

## Interface

The responsive frontend uses HTML, CSS and vanilla JavaScript, with the original Madhouse Design Studio PNG logo and the original Madhalloween JPEG event photograph. The user-provided white dashboard reference informs the composition, with a restrained pink, pastel-yellow, pastel-blue and lavender palette.

### Navigation

| Left sidebar | Contextual top navigation |
| --- | --- |
| Dashboard | Overview · Divisions |
| People | Directory · Milestones |
| Journey | Journey Board · Welcome Kit · Attendance |
| Performance | KPI Scorecards · Reviews |
| Data & Sources | Data Sources · About the Prototype |

All 11 screens are available to anyone using the fictional sample prototype. A division also offers its own Summary, Board, List and Org Chart tabs. Employee cards open centered view-only previews.

### v2.2 overview improvements

- **Pastel overview metrics:** sample employees, average Journey progress, incomplete Welcome Kits and KPI verification needs.
- **Division cards:** eight horizontally browsable pastel cards with member count, assigned evaluator names and calculated Journey progress. Each opens its division workspace.
- **Journey-by-stage chart:** counts from each employee's first incomplete stage, with a final Completed category; this does not fabricate a historical trend.
- **Upcoming milestones:** real calculations on fictional birthdays and service anniversaries, with employee preview links.
- **Follow-ups:** existing List/Board tracker, populated from the same local fixture.
- **Consistent mobile layouts:** single sidebar, useful top tabs, compact theme controls, responsive tables and centered preview dialogs.

### Seven-stage Journey

The Journey monitoring screen contains **seven stages plus Completed**, with one card per employee grouped by the first incomplete stage. The Board scrolls horizontally; Table view shows all matching members and aggregate progress. All status rows are non-editable.

## Read-only source adapter

The script loading order is:

1. data.js — fictional fixture
2. data-adapter.js — read-only snapshot and data-source contract
3. app.js — rendering, navigation, metrics and employee previews

data-adapter.js exposes getSnapshot(), getSources(), getProvenance() and validateSnapshot(snapshot). It currently returns a defensive copy of the fictional fixture and marks all five planned providers **Not connected**. There are **no network calls or provider tokens**.

The later connected-account phase can implement source normalization against the same frontend view model, but the private data delivery mechanism must be authenticated and controlled. Read the [Claude connector handoff](docs/CLAUDE_CONNECTORS_HANDOFF.md) for provider responsibilities, data contract and security boundaries.

**GitHub Pages is public. Never commit real employee information, payroll or disciplinary records, private documents/emails, passwords, API tokens or connector secrets.** Open access is suitable only for fictional demo data; any real-data deployment needs access-controlled delivery and appropriate permissions.

## Run and verify

- Open index.html in a modern browser or use VS Code Live Server.
- Run: node tests/smoke.js
- On main, the custom GitHub Actions validation workflow runs the regression tests. GitHub Pages uses its separate publishing workflow.
- Confirm both test and Pages workflow statuses under GitHub Actions. Physical Windows/macOS/Android/iOS layout review is separate from these Node smoke tests.

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
| refined.css | v2.2 polished reference-inspired dashboard, cards and responsive summaries |
| tests/smoke.js | Regression tests for navigation, adapters, fixtures and read-only operation |
| docs/CLAUDE_CONNECTORS_HANDOFF.md | Future connector development instructions |
| assets/madhouse-logo.png | Original user-supplied PNG |
| assets/madhalloween.jpg | Original user-supplied JPEG |

## Remaining phase

**Not yet implemented:** real Airtable/Google/email source retrieval, connector authorization, private read-only synchronization, permission-filtered real records, true provider timestamps and physical-device visual QA. The public site is a functional **sample-data UI prototype**, not a live HR data system.
