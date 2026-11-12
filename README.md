# Maddie Journey — Read-only Monitoring Prototype v2.0

**Madhouse Design Studio · People & Culture**

[Open the GitHub Pages prototype](https://nemtxt.github.io/Maddie-Journey-NemDev-/) · [Repository](https://github.com/nemtxt/Maddie-Journey-NemDev-)

## Purpose

Maddie Journey is a **reader, organizer, summary dashboard, and monitoring tracker** for HR (People & Culture), Division Heads and executive observers (CEO, COO and CSO). **It does not create, edit, validate, endorse, approve, or send employee records to other systems.**

- The frontend is **HTML, CSS and vanilla JavaScript** deployed to **GitHub Pages**.
- The current data fixture contains **exactly 51 fictional employees in eight divisions**, intended for demonstration.
- The **original Madhouse Design Studio PNG logo** and **original Madhalloween JPEG photograph** are retained as separate assets. The third-party screenshot reference guides the layout, not branding.
- **Light / Dark** appearance is supported; the aesthetic is primarily neutral white with restrained pink, pastel yellow and blue accents.

## How to use

1. Open the landing page and choose **Enter dashboard** or one of its HR, Division Head or Executive audience cards.
2. **On your first entry, select your actual demo identity:** first the workspace type (HR / Division Head / Executive), then your name. There is no assumed default identity and no login requirement for this prototype.
3. The choice is remembered **on the current device** using localStorage under \`maddie-journey-viewer-v2\`. Click the viewer profile control in the top-right header to change it at any time. This choice adjusts the overview and sample data presentation; **it is not authentication or server-side authorization**.
4. Use the **single grouped sidebar** to navigate. The top bar contains the current location, employee search shortcut, appearance controls, sample-data indicator and viewer switch. On mobile, use the menu button and dismiss the drawer using its backdrop.
5. Click an employee in a table, Kanban card, org chart or tracker to open the **centered read-only employee preview**. Any edit, attendance verification, save or approval button from older versions has been removed.
6. Use **Data sources** to see integration readiness and **About data** for the operating model and role assignments.

## Navigation

| Section | Destinations | Main job |
|---|---|---|
| Overview | Overview, Divisions | Company/assigned-team metrics, follow-up summaries, eight-division comparison |
| People | Employees, Milestones | Searchable sample directory; birthdays, hiring, tenure, promotions, attendance recognitions |
| Monitoring | Journey board, Welcome Kit, Attendance, KPI scorecards, Reviews | Read and compare progress; inspect individual sample records |
| Information | Data sources, About data | Source-of-truth status, integration readiness, scope and privacy boundaries |

### Journey Kanban

Journey has **seven onboarding stages plus one Completed column**.

- Each sample employee appears **exactly once**, grouped under the **first stage that is not fully complete**. Completed employees occupy the final column.
- The employee card shows their name, division, job title, progress in that stage and overall completion.
- The **Board** view scrolls horizontally; the **Table** view lists all matching employees, their current stage, completed stages and total progress.
- Choose a division to narrow either view, or return to all eight divisions.
- The stage checklist in an employee modal is **a non-interactive visual status list**; cards cannot be dragged to change data.
- All data is **fictional**; a stage labeled "Complete" does not confirm that official onboarding documents have been approved in a real source system.

### Other previews

- **Division page:** Summary / Board / List / Org chart. Department boards are derived from Journey, Welcome Kit and sample review states.
- **Employees:** Filter/search, compare, view centered profile and optional CSV export of the displayed fictional snapshot.
- **KPI:** Weighted score, recorded objectives, target/actual values, verification notes and comments **without forms**.
- **Attendance:** Incidents, trends and recorded verification flags **without new/edit record actions**.
- **Reviews:** Existing sample timeline and fictional compensation figures **without endorsement or approval buttons**.
- **Milestones and Welcome Kit:** Read-only events, item statuses and source notes.

## Sources and privacy

Maddie Journey is **not** a second HR database. Airtable, Google Sheets, Google Docs, Google Drive and email are the intended original sources. **None are connected to the current GitHub Pages prototype.** Claude account connectors do not automatically provide a callable API to static browser JavaScript.

For later real-data integration, use a controlled synchronization service or authenticated backend that reads authorized provider records, matches employee IDs, validates data and returns **permission-filtered** snapshots with source/time provenance. Keep API keys, secrets, OAuth tokens and private employee information off the public GitHub Pages site.

**No employee data is saved or updated by the v2.0 frontend.** All fictional records are read from \`data.js\` on each load. Older locally edited demonstration data under \`maddie-journey-demo-v3\` is **ignored but not erased**. Only the selected viewer, theme and temporary board/list preferences are remembered locally. CSV exports are read-only copies of fictional data and do not mutate the fixture.

The viewer chooser can simulate perspectives but **cannot protect confidential HR information**. Do not publish real employee or compensation records without authenticated access and server-enforced permissions.

## Run and deploy

1. Open \`index.html\` locally in a modern browser, or use VS Code Live Server.
2. Run \`node tests/smoke.js\` in the repository root. The tests use only built-in Node modules.
3. Open **GitHub → Settings → Pages** and select **GitHub Actions** as the build/deployment source if not already enabled.
4. Commits to \`main\` trigger the repository's test-and-deploy workflow. Verify both its test result and the Pages deployment in **Actions** before treating the live site as updated.

The automated tests check JavaScript parsing, 51-person fixture, first-visit identity selection, navigation, Journey board and table, all eight division pages, source transparency, inert old edit actions, and browser preference behavior. **Automated DOM/browser screenshot comparison across physical Windows, Mac, Android and iOS devices is not covered by the smoke tests.**

## Source structure

| Path | Function |
|---|---|
| \`index.html\` | Static GitHub Pages entry and stylesheet order |
| \`data.js\` | 51 fictional employee fixtures, division/evaluator assignment, Journey and Kit definitions |
| \`app.js\` | View-only rendering, navigation, filtering, previews and first-visit viewer choice |
| \`styles.css\` / \`theme.css\` | Existing base styles and Light/Dark system |
| \`operations.css\` / \`palette.css\` | Existing tracker and Madhouse color system |
| \`landing.css\` | Original-image landing layout |
| \`workspace.css\` | White admin dashboard structure and reference-inspired list/board styles |
| \`reader.css\` | **v2.0** single navigation, first-visit chooser, Journey Kanban, read-only detail layouts |
| \`tests/smoke.js\` | Dependency-free Node regression tests |
| \`assets/madhouse-logo.png\` | Original user-provided PNG |
| \`assets/madhalloween.jpg\` | Original user-provided JPEG |

### Known limitations

This is a **complete sample-data monitoring prototype**, not a production HR integration. Real accounts, authentication/authorization, connector data, reliable live synchronization, source timestamps, error handling for live sources and usability verification with actual users remain outside the current release.
