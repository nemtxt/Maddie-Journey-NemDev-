# Phase 11 · Source Inventory (Stage A)

**Discovery date:** 2026-11-12 (Asia/Manila) · **Method:** Claude account connectors, read-only tools only · **Scope:** People & Culture monitoring datasets only.

> **Public-safe document.** This repository is public. The inventory records provider names, dataset names, schema structure and *aggregate* counts only. It contains no employee names, IDs, per-person statuses, base/file identifiers or URLs. Record-level reconciliation is shown only inside the authenticated private Data & Sources screen.

## 1. Two kinds of "connected"

| Kind | What it is | Used for |
| --- | --- | --- |
| **Claude account connector** | Tools available to Claude in a chat session, authorized by the account owner | Stage A discovery (this document). **Not** a runtime for the website. |
| **Private service integration** | `server/` calling provider REST APIs with its own read-only credentials | The connected monitoring view. **Requires credentials not yet issued** (§5). |

A provider being reachable through a Claude connector does **not** mean the website can reach it. No provider is synchronized into the website yet.

## 2. Provider status (observed evidence)

| Provider | Claude connector | Evidence | Private service integration |
| --- | --- | --- | --- |
| GitHub | Connected | Repository, branches and PR #1 read | n/a |
| Airtable | Connected | 65 bases listed; schemas and records read in the P&C Operations base | **Implemented, not yet configured** (needs read-only token) |
| Google Sheets | Connected | Masterlist metadata and two columns read | **Implemented, not yet configured** (needs read-only OAuth) |
| Google Drive | Connected | P&C files found by search; metadata read; no shared drives | **Not implemented** (§4) |
| Google Docs | Connected via Drive (read file content) | Checklist template read | **Not implemented** (§4) |
| Gmail | Connected | Keyword search returned thread IDs only (~200 estimated matches, 90 days); no content read | **Not implemented** (§4) |
| Google Calendar | Connected | 2 calendars (primary, PH holidays); 223 events Nov 2026–Jan 2027 counted | **Implemented, not yet configured** |

Connector note: the Airtable connector holds *create/write* permission on every base. Only read tools were used. The private service uses a separate token that should be scoped to read-only (§5).

## 3. Datasets relevant to monitoring

### 3.1 Airtable · "P&C Operations" base — **authoritative HR roster**

34 tables. Relevant tables:

| Table | Records | Role | Join key | Notes |
| --- | --- | --- | --- | --- |
| People | **60** | Employee roster (source of truth) | `Employee ID` (text) + Airtable record ID | 184 fields incl. restricted compensation, government IDs, bank and contact data (never requested by the service) |
| Departments | 9 | Organization structure | record ID | DESIGN/OPERATION, CORP OPS, RMD, MEDIA, COO TEAM, BUSINESS DEV, GENCON, CEO TEAM, EXEC |
| Tardiness/Leave Tracker | 470 | Attendance events | link → People record ID | 13 event types; **no approval or verification column** |
| Employee Development Monitoring | 23 | Probation/interim monitoring | link → People record ID | 5th-month and regularization status selects |
| Interim and Probationary Evals Form | **0** | Evaluations | link → People | Empty: no review data to integrate |
| KPI / KRA / Action Plan | — | Organization KPIs | — | Org-level objectives, **not per-employee scorecards** |
| Incident Reports, Notice to Explain, Warnings, Counseling, PIP | — | Disciplinary/wellbeing | — | Restricted. **Out of scope by design** |

**Roster profile (aggregate, People table):**

| Measure | Value |
| --- | --- |
| Total records | 60 |
| Regular / Probationary / Part-Time | 42 / 11 / 1 |
| Resigned / AWOL | 5 / 1 |
| **Active cohort** (Regular + Probationary + Part-Time) | **54** |
| Records with an Employee ID | 50 (all distinct after normalization) |
| Records **without** an Employee ID | 10 (9 active) |
| IDs stored without zero padding (e.g. `269` vs `0269`) | 13 |
| Records with no department linked | 1 |
| `Hire Date` (date field) populated | **0 of 60**. The free-text `Hiring Date` (e.g. "March 21, 2024") is the only start-date source |
| No start date in either field | 4 (3 active) |
| Resigned without a Separation Date | 1 |
| Regularization Date later than Separation Date | 2 |
| `Requirements Status` formula = "Completed Requirements" | **0 of 60** |
| Records with any of the 10 mapped 201 attachments | **0 of 60** |

**Baseline reconciliation:** the active cohort is **54**, against the 51-person baseline in the brief (**+3**). The difference is unexplained by the source and is reported, not corrected. The source has **9 departments**, not 8. It merges Design and Design Operations, has no IT department, and adds CEO TEAM, COO TEAM and EXEC.

### 3.2 Google Sheets · "Employee Masterlist 2026"

- One tab, 46 columns. Header columns mirror the Airtable People table (EE Number, Status, compensation, government IDs…).
- **Last modified 2026-05-05**, the same day the Airtable records were created. It is an older export.
- About 44 Madhouse/TCG IDs, all present in Airtable. A second block of IDs belongs to other business units. An embedded headcount summary reports 52.
- Status disagreements with Airtable are expected drift. **Airtable is authoritative.** The Sheet is used for reconciliation only (EE Number and Status columns).

### 3.3 Google Drive / Docs

| Item | Type | Relevance |
| --- | --- | --- |
| EMPLOYEE CHECKLIST | Google Doc | **Policy template** defining the 201 checklist that the Airtable attachment columns implement |
| EMPLOYEE EVALUATION FORMAT – SAMPLE | Sheet | Template, not records |
| MH Lark Attendance (biweekly exports) | .xlsx files | Attendance exports; **latest covers Dec 6–20, 2025**. Stale; superseded by the Airtable tracker |
| Strategy, policy and playbook documents | Docs/.docx | Not per-employee records |

No per-employee 201 folder structure was found. Without one, Drive files cannot be linked to Employee IDs reliably.

### 3.4 Gmail

Keyword search found about 200 candidate threads in 90 days. No content was read. No tracker identifies which threads are authorized follow-up records, so mailbox ingestion would be indiscriminate and is **not implemented**.

### 3.5 Google Calendar

Primary calendar (Asia/Manila) and the PH holidays calendar. Across 223 events in the 3-month window, about 16 are P&C meetings. There are **no** structured onboarding, regularization or anniversary events, and events carry no Employee IDs. Attendee email is the only candidate join key, and only after it is verified against the roster's company email.

### 3.6 Other Airtable bases reviewed and excluded

| Base | Reason excluded |
| --- | --- |
| HR Employee Database | 15 records, no Employee ID field. Cannot be joined without name matching (prohibited) |
| TCG – KPI Monitoring | Division-level KRAs/KPIs for RMD only. Not per-employee scorecards |
| Madhouse Directory | Company documents, compliance and suppliers. Not employee records |

## 4. Module → source mapping (confirmed)

| Module | Confirmed source | Status in v3.8 connected view |
| --- | --- | --- |
| Employee Directory | Airtable People | **Connected** |
| Divisions | Airtable Departments | **Connected** (9 source departments) |
| 201 Files | Airtable People attachment columns | **Partial**. Tracker attachments only; currently 0 attachments |
| Attendance | Airtable Tardiness/Leave Tracker | **Retrieved, screen withheld**. No approval/verification field |
| Journey | Development Monitoring (stages 3–5 only) + orientation checkboxes | **Not sourced** (partial mapping not yet approved) |
| Welcome Kit | — | **No source found** |
| KPI Scorecards | — | **No per-employee source found** |
| Employee Reviews | Interim/Probationary Evals Form | **Empty source (0 records)** |
| Milestones | People dates (hire, regularization, birthday) | **Not delivered** in this release |
| Three-month Calendar | Google Calendar | **Retrieved, screen withheld** until events are integrated |
| Follow-up Monitoring | — | **No authorized source identified** |
| Data & Sources | Service provider status + reconciliation | **Connected** |

## 5. Authorizations still required

1. **Airtable read-only token** (personal access token: `data.records:read` and `schema.bases:read`, P&C Operations base only).
2. **Google read-only OAuth client + refresh token** (Sheets readonly, Drive metadata readonly, Calendar readonly).
3. **Google Sign-In OAuth client ID** for viewer authentication, plus the list of allowed viewer accounts.
4. **A private host** for `server/` (the HR team's own machine or an existing internal server; no paid service is required).
5. **HR decisions:** a Welcome Kit source; per-employee KPI scorecards; whether tracker attendance entries count as verified; a Drive 201 folder convention; the explanation of the 54 vs 51 headcount.
