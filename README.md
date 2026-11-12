# Maddie Journey — Open Monitoring Prototype v2.1

**Madhouse Design Studio · People & Culture**

[Open the GitHub Pages prototype](https://nemtxt.github.io/Maddie-Journey-NemDev-/) · [Repository](https://github.com/nemtxt/Maddie-Journey-NemDev-)

## Purpose

Maddie Journey is a **reader, organizer, summary dashboard, and monitoring tracker** for HR (People & Culture), Division Heads and executive observers (CEO, COO and CSO). **It does not create, edit, validate, endorse, approve, or send employee records to other systems.**

- The frontend is **HTML, CSS and vanilla JavaScript** deployed to **GitHub Pages**.
- The current data fixture contains **exactly 51 fictional employees in eight divisions**, intended for demonstration.
- The **original Madhouse Design Studio PNG logo** and **original Madhalloween JPEG photograph** are retained as separate assets. The third-party screenshot reference guides the layout, not branding.
- **Light / Dark** appearance is supported; the aesthetic is primarily neutral white with restrained pink, pastel yellow and blue accents.

## How to use

1. Open the landing page and select **Enter dashboard**, or open any deep link such as \`#overview\`, \`#employees\`, \`#journey\`, or \`#division/media\`. All fictional records are accessible immediately: **no login, role choice, or first-visit popup**.
2. The **left sidebar** contains five main areas: Dashboard, People, Journey, Performance, and Data & Sources. Select one to access its default screen.
3. The **top contextual tabs** change to the relevant subpages, making secondary navigation predictable and reducing sidebar clutter.
4. Use Search, division filters, Board/Table modes, employee modal previews, and Light/Dark theme to navigate without changing source data.
5. On mobile, the compact **Menu** button opens the primary sidebar. Dismiss it by tapping the backdrop. The top tabs remain horizontally scrollable.

## Navigation

| Main sidebar destination | Top sub-navigation | Main purpose |
|---|---|---|
| Dashboard | Overview · Divisions | Organization metrics, worklist and eight-division comparison |
| People | Directory · Milestones | Employee records, birthdays, tenure, promotions, recognition and other fictional milestones |
| Journey | Journey board · Welcome Kit · Attendance | Seven-stage Kanban, onboarding kit and attendance summary |
| Performance | KPI scorecards · Reviews | Weighted KPI previews and executive review history |
| Data & Sources | Data sources · About the prototype | Provider status, assignments, scope and privacy boundaries |

**Division detail:** Selecting an individual division opens a centered, integrated workspace with its own Summary, Board, List and Org chart view tabs. These are within the selected division, not a sixth primary navigation destination.

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

**No employee data is saved or updated by the v2.1 frontend.** All fictional records are read from \`data.js\` on each load. Older locally edited demonstration data under \`maddie-journey-demo-v3\` is **ignored but not erased**. Only theme and optional temporary board/list preferences are remembered locally. CSV exports are read-only copies of fictional data and do not mutate the fixture.

This demonstration is deliberately **open to all visitors**. Do not publish real employee or compensation records in the public fixture. A later production integration requires authentication, server-enforced permissions and an appropriate data-governance review.

## Run and deploy

1. Open \`index.html\` locally in a modern browser, or use VS Code Live Server.
2. Run \`node tests/smoke.js\` in the repository root. The tests use only built-in Node modules.
3. Open **GitHub → Settings → Pages** and select **GitHub Actions** as the build/deployment source if not already enabled.
4. Commits to \`main\` trigger the repository's test-and-deploy workflow. Verify both its test result and the Pages deployment in **Actions** before treating the live site as updated.

The automated tests check JavaScript parsing, 51-person fixture, open-access navigation, five primary sections, contextual top tabs, Journey board and table, all eight division pages, source transparency, inert old edit actions, and preservation of source data. **Automated DOM/browser screenshot comparison across physical Windows, Mac, Android and iOS devices is not covered by the smoke tests.**

## Source structure

| Path | Function |
|---|---|
| \`index.html\` | Static GitHub Pages entry and stylesheet order |
| \`data.js\` | 51 fictional employee fixtures, division/evaluator assignment, Journey and Kit definitions |
| \`app.js\` | View-only rendering, navigation, filtering, previews and unrestricted read-only access |
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
