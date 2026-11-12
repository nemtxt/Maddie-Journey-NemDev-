# Maddie Journey — Claude Connector Handoff

**Current phase:** GitHub Pages HTML/CSS/JavaScript prototype with 51 fictional employees and eight divisions. No live integrations are configured.

**Future phase:** Transfer source development to the Claude workspace that has authorized access to Airtable, Google Sheets, Google Drive, Google Docs and email connectors. The current public interface will remain **read-only**, with no account creation, sign-up, edit forms or approvals.

## Architectural boundary

The prototype consists of:
- data.js: entirely fictional local fixture
- data-adapter.js: source-neutral read-only adapter (sample mode) with structural fixture reporting
- app.js: frontend UI, navigation, charts, summaries and previews
- stylesheets: responsive light/dark visual system
- tests/smoke.js: dependency-free regression checks

The present application reads the fixture through:

    window.MJ_SOURCE_ADAPTER.getSnapshot()
    window.MJ_SOURCE_ADAPTER.getSources()
    window.MJ_SOURCE_ADAPTER.getProvenance()

The adapter also exposes validateSnapshot(snapshot) for basic shape and ID checks. Those checks do not validate all HR semantics.

The adapter also exposes getQualityReport() for fictional fixture checks: distinct IDs, division links, supervisor references, Journey array sizes and Welcome Kit array sizes. These checks **do not** confirm that any Airtable, Sheets or HR system contains verified records.

Claude connectors are **account-scoped tools, not automatically browser-callable APIs**. Any later integration must run in an authorized environment, retrieve and normalize records, and provide the frontend a permission-filtered snapshot through a secure mechanism. No connector tokens, private records or backend secrets belong in this public GitHub repository.

## Intended source responsibilities

| Source | Intended data |
| --- | --- |
| Airtable | Employee roster, division assignments, onboarding stages and structured tracker records |
| Google Sheets | KPI scorecards, targets, actuals and official source calculations |
| Google Drive | Evidence, source document references and attachments |
| Google Docs | Evaluation documents, onboarding forms and written review status |
| Email | Authorized follow-up and correspondence status, not broad inbox ingestion |

These are planned mappings, not claims about what the connected account currently contains. Confirm the actual schemas in the Claude account before writing any connector adapter.

## Current snapshot contract

The top-level data shape contains version, divisions, viewers (legacy evaluator/assignment metadata, **not login identities**), stages, kit and employees.

A current employee record uses these groups:

| Category | Existing fields |
| --- | --- |
| Identity / organization | id, name, division, jobTitle, email, startDate, birthday, orgLevel, reportsTo |
| Journey | journey, journeyNotes |
| Welcome Kit | kit, kitNotes |
| Attendance | attendance (date, type, reason, approval, verified, remarks) |
| KPI | scores (division, individual, values, behavior), kpiItems, kpiSource, kpiValidated |
| Milestones | promotions, attendanceAwards, disciplinaryActions |
| Reviews | review (division, corp, cso, coo), comments |
| Restricted compensation | currentBasic, currentAllowances, proposedPct, approvedPct, effectiveDate |
| Fictional legacy metadata | modifiedAt, audit |

Employee IDs must be cross-referenced across sources using a verified stable identifier. Do not join on names alone. Missing data, unmatched source records and conflicts must be surfaced, not guessed.

## Data lifecycle when connected

1. Read only authorized provider records in the future connected environment.
2. Verify the source schema and employee-ID mapping.
3. Normalize source records into the frontend contract and validate the result.
4. Attach trustworthy source identifiers, last-synced timestamps and validation status.
5. Deliver access-controlled snapshots to a protected frontend/backend; keep all write endpoints disabled.
6. Show disconnected, loading, synced, partial, stale and error states only when backed by actual integration results.
7. Run source-by-source verification and the existing regression tests.

## Security and deployment

GitHub Pages is public. **Never publish real employee files, disciplinary actions, compensation, private emails, API tokens, OAuth secrets or authorized connector output as assets in this prototype.**

The open-access/no-account experience is suitable for fictional sample data only. A production system with confidential HR records will need authentication and server-enforced access controls, even though the dashboard itself is a reader.

For current v2.3 navigation, safe filtered exports, and physical-device QA steps, see [Prototype Acceptance](PROTOTYPE_ACCEPTANCE.md).

## UI acceptance requirements

- Primary sidebar: Dashboard, People, Journey, Performance, Data & Sources.
- Top navigation shows contextual subpages and works on desktop and mobile.
- The Journey Kanban/Table, all eight divisions and employee modal previews use the same snapshot.
- The dashboard computes actual sample summaries and never fabricates trend histories.
- Original Madhouse PNG and event JPEG are preserved. Pink, pastel yellow, blue and restrained lavender accents remain consistent.
- No forms, accounts, login, sign-up or employee-record editing.
- Keep 51 fictional employees and perform a full browser/physical-device QA before delivery.
- Run node tests/smoke.js after every integration change.

**Handoff sequence:** finish UI with fictional data -> access connected sources in Claude -> verify schemas -> implement private read-only normalization -> review security and accuracy -> deploy through an appropriate protected channel.
