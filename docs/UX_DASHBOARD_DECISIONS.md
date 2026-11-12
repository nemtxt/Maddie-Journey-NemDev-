# Maddie Journey v1.6 — Dashboard UX decisions

**Date:** 2026-11-12  
**Purpose:** Provide a precise, comprehensible read-first dashboard for People & Culture (HR), Division Heads and executive observers. This is a static prototype with 51 fictional employee profiles across eight divisions.

## What research supports

| Source | Relevant guidance | Decision in prototype |
| --- | --- | --- |
| [IBM Carbon: Dashboards](https://www.carbondesignsystem.com/building-blocks/data-visualization/dashboards) | Prioritize the most important metrics, reduce chart clutter, allow drill-down for exploratory tasks | Limit the dashboard to four headline metrics, one actionable work queue, a compact eight-division table |
| [Fluent 2: Layout](https://fluent2.microsoft.design/layout) | Group related content with consistent spacing and hierarchy | Reusable summaries, table rows, departmental tabs and consistent 4/8/12/16/24-pixel spacing |
| [Fluent 2: Typography](https://fluent2.microsoft.design/typography) | Give text a predictable visual hierarchy, favor sentence case | Standard sizes (12, 14, 16, 20 and 28 px) in \`operations.css\` |
| [Atlassian: Navigation system](https://atlassian.design/components/navigation-system/migration-guide) | Keep global actions in the top navigation, app-specific destinations in the side navigation | Top bar is limited to location and appearance; People / Operations / Performance / Integrations live in the sidebar |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Minimize barriers for pointer and keyboard users | Bigger interaction targets, visible focus states, keyboard-accessible org chart buttons, reduced-motion support |

The choices above are engineering interpretations of these guidelines, **not** claims that an HR usability study has been conducted with actual stakeholders.

## Key product decisions

1. **One starting dashboard, tailored by context.** HR and executives see organization-wide sample metrics; assigned Division Heads see a summary for their departments. Role inputs aren't presented as distracting badges.
2. **Action-first, not notification overload.** An ordered "Needs attention" list is derived from the local sample records. Filters separate attendance, KPI, onboarding and review issues. Results are fictional and never claim to be real tasks or deadlines.
3. **All eight divisions remain accessible.** Each division has Summary, Org chart and Employees views. The hierarchy chart shows levels 6 through 1 and uses explicit \`reportsTo\` relationships. The hierarchy is **fictional**.
4. **Employee details are consistently centered.** Org chart nodes, team cards and tracker rows open the same employee modal. The modal includes KPI, journey, kit, milestones, attendance and review sections.
5. **A source transparency screen is mandatory.** Airtable, Google Sheets, Drive, Docs and email all say **Not connected** until the system actually receives authenticated data. Demo data is never labeled live or synchronized.
6. **No fake precision.** An employee with no verified lateness or absence is not automatically described as having perfect attendance. Zero recorded incidents is not proof of complete attendance coverage. Source validation, missing inputs and review state remain distinguishable.
7. **No real sensitive HR data on public Pages.** The current role chooser is simulated, localStorage is per-browser, and the UI has no server-side permission boundary.

## Data mapping for future secure integration

| Canonical object | Suggested key | Potential read source | What to validate |
| --- | --- | --- | --- |
| Person | employee_id | Airtable | Unique ID, active status, division, reporting ID |
| Department | division_id | Airtable or Google Sheets | Ownership and canonical name |
| Onboarding | employee_id + stage_id | Airtable | Completion evidence and update time |
| Welcome Kit | employee_id + item_id | Airtable or Sheets | Issuance/confirmation state |
| KPI | employee_id + period + metric_id | Google Sheets | Formula provenance, weight, period |
| Attendance | employee_id + date + record_id | Airtable or Sheets | Verification and approval status |
| Milestone | employee_id + event_id | Airtable | Timestamp and confidentiality |
| Document link | employee_id + doc_type + file_id | Google Drive / Docs | Permissioned URL, accessible identity |
| Correspondence | message_id / thread_id | Email | Authorized visibility, provenance |

**Do not place Google account access tokens, Airtable keys or Claude connector credentials in client-side JavaScript.** The intended future flow is a secure integration layer returning only the data each authenticated viewer is allowed to see. Merely connecting an app to Claude does not expose a browser-accessible endpoint.

## Data quality and release checks

- Exact demo fixtures: 51 employees, eight divisions, v6 hierarchy.
- Preserve v3-v5 saved scores, statuses, audit entries and other local edits through non-destructive migration.
- Ensure \`reportsTo\` belongs to the same division and points to a higher-level sample employee.
- Run \`node tests/smoke.js\` from the repository root (no third-party dependencies).
- Perform visual browser tests of desktop/mobile, light/dark themes, focus order and chart scrolling before final sign-off.
- Verify GitHub Pages Settings → Pages only after a successful deploy. A committed branch is not evidence of successful publication.

## Remaining gaps before operational use

- Validated source records, connectors and a secure backend integration layer.
- Authenticated real user accounts and role-specific authorization enforced server-side.
- Data freshness timestamps, error/loading states and sync reconciliation based on actual service responses.
- Real reporting hierarchy and official review workflows.
- User acceptance testing with GIEZELLE / KURT, a representative Division Head, and executive observers.
