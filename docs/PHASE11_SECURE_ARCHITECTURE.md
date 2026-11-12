# Phase 11 · Secure Multi-Source Integration (v3.8)

Stages B–F. Read [PHASE11_SOURCE_INVENTORY.md](PHASE11_SOURCE_INVENTORY.md) first.

## 1. Two environments, one interface

```
PUBLIC (GitHub Pages)                       PRIVATE (server/, authenticated)
index.html → data.js (51 fictional)         /login → Google Sign-In → allowlist check
          → data-adapter.js  mode=sample    /     → index.html with data.js REPLACED by
          → app.js / monitoring.js                  /private/payload.js (no-store)
No credentials · no network calls           data-adapter.js mode=connected
                                            server ──GET only──▶ Airtable / Sheets / Calendar
```

- The **same** `index.html`, `app.js`, `monitoring.js` and CSS serve both environments. The private server swaps one script tag. Fictional records are never loaded in private mode, and connected records never reach GitHub Pages.
- `data-adapter.js` contains no network code in either mode. Connected data arrives only through the authenticated `window.MJ_CONNECTED_PAYLOAD` script.
- If the connected snapshot is missing or invalid, the UI shows an error. It **never** falls back to fictional data.

## 2. Private service components (`server/`, Node 22, zero dependencies)

| File | Responsibility |
| --- | --- |
| `lib/readonly-http.js` | The only outbound client. GET-only (POST allowed solely to Google's OAuth token endpoint), HTTPS host allowlist, timeout, retry with exponential backoff and jitter on 429/5xx, `Retry-After`, sanitized errors |
| `mapping.js` | **Single source of truth** for every source field, 201 rule, status set, department map, attendance types, baseline and precedence |
| `providers/airtable.js` | Paginated reads of People, Departments, Tardiness/Leave Tracker, Development Monitoring. Requests mapped fields only; reduces attachments to booleans at ingest; 5 req/s throttle |
| `providers/google.js` | Refresh-token exchange (in memory), Sheets masterlist columns E–F, Drive `modifiedTime`, Calendar events (singleEvents, Asia/Manila) |
| `reconcile.js` | Pure functions: ID normalization, roster issues, masterlist comparison, record-link counts |
| `normalize.js` | Provider records → existing frontend contract + provenance + coverage |
| `snapshot-service.js` | Orchestration, partial failure, in-memory last-known snapshot, staleness |
| `auth.js` | Google ID-token verification (RS256, `iss`/`aud`/`exp`/`email_verified`), allowlist, HMAC session cookies |
| `server.js` | Static allowlist, private index, payload script, security headers/CSP, 405 for non-GET |
| `index.js` | `serve` (refuses to start unless auth is fully configured) and `--check` (aggregate-only dry run) |

## 3. Field mapping and transformation rules

Source: Airtable *P&C Operations · People* unless stated. Field IDs are in `server/mapping.js`.

| Contract field | Source field | Rule |
| --- | --- | --- |
| `id` | Employee ID | Trim; numeric only; canonical 4-digit zero-padded (`269` → `0269`). Missing, invalid or duplicate → `AT-<airtable record id>` plus an issue. **Never derived from names** |
| `name` | First Name + Last Name | Concatenated. Display only, never a join key |
| `division` | Department (link) → Departments.Name | Unambiguous matches reuse prototype IDs (rmd, corp, media, gencon, bd). DESIGN/OPERATION, CEO TEAM, COO TEAM and EXEC get their own IDs. No link → `unassigned` + issue |
| `jobTitle` | Position/Role | Select name, or "Position not recorded" |
| `employmentStatus`, `cohort` | Employment Status | Active = Regular, Probationary, Part-Time, Contract, On Leave. Inactive = Resigned, Terminated, AWOL. Blank or unknown → `unknown-status` (kept, flagged) |
| `startDate` | Hire Date → Hiring Date (text) | Hire Date takes precedence. Text parsed (`March 21, 2024`). Disagreement → issue |
| `regularizationDate`, `separationDate` | same-named fields | Copied. Contradictions → issues (§4) |
| `files201[doc]` | Attachment columns (table below) | All mapped columns have an attachment → `complete`. Otherwise `missing`. No column → `source-unavailable`. `files201Evidence` notes partial attachments and `verified:false` |
| `attendance[]` | Tardiness/Leave Tracker | Joined by linked **record ID**. Types grouped (Late, Absent=Awol, Halfday, Leave, Work arrangement). `verified:false`, `approval:'Not recorded in source'` |
| `journey`, `kit`, `scores`, `review` | — | `null` / "Not sourced". Never `false` or `0` |
| `provenance` | — | provider, dataset, record ID, raw Employee ID, ID state, source created, `sourceModified:null` (no such field), retrieval time, `verification:'retrieved-not-hr-verified'`, per-record issues |
| `email`, `birthday` | — | **Not delivered** in v3.8 (minimization) |

**201 requirement → tracker column**

| Requirement | Column(s) | Notes |
| --- | --- | --- |
| Probationary Employment Contract | Employment Contract | Not specific to probation |
| Regularization Contract | — | `source-unavailable` |
| NDA | Confidentiality/NDA | |
| Non-Compete | Non-Compete/Non-Solicitation Agreement | "If applicable" in checklist; applicability not recorded |
| Personal Data Sheet | Personal Data Sheet (PDS) | |
| Government ID | Two (2) Valid IDs (Photocopy) | |
| Tax / TIN | TIN ID (Photocopy) | |
| SSS / PhilHealth / Pag-IBIG | the three photocopy columns | All three required |
| Emergency Contact | Emergency Contact Form | |

Row status precedence: conflict > missing > not checked > source unavailable > complete. An unsourced requirement can never make a person "complete".

**Never requested:** compensation and allowances, government ID numbers, bank details, addresses, phone and personal email, emergency contacts, family data, attachments' content, filenames or URLs, disciplinary, counseling and PIP tables, and any credential-like column. The Airtable request lists exactly the mapped fields; a test asserts this.

## 4. Reconciliation and precedence

| Field | Authoritative | Compared against | On disagreement |
| --- | --- | --- | --- |
| Employee ID, status, department | Airtable People | Sheets masterlist | Listed as status mismatch / only-in-one-source |
| Start date | Airtable Hire Date | Airtable Hiring Date text, Sheet | `hire-date-conflict` issue |
| 201 files | Airtable attachments | (Drive not linked) | — |
| Attendance | Airtable tracker | (Lark exports stale) | — |

Roster issue kinds: `missing-employee-id`, `invalid-employee-id`, `employee-id-format`, `duplicate-employee-id`, `unknown-status`, `missing-department`, `missing-hire-date`, `hire-date-conflict`, `missing-separation-date`, `status-date-conflict`, `date-order-conflict`.

Cohort rules:
- Denominators = active cohort only. Inactive records are counted and shown on Data & Sources, never deleted.
- The 51 baseline is shown with the signed difference. Records are never added or removed to match it.
- Linked tracker records are counted as active, inactive or orphaned.

## 5. Connected interface behavior

| Screen | Connected v3.8 |
| --- | --- |
| People directory | Roster columns: status, hire date, record checks. No Journey/Kit/KPI columns. **CSV export disabled** |
| 201 Files | Live tracker statuses plus "Source unavailable" / "Conflicting evidence" filters when present |
| Data & Sources | Provider states, datasets, freshness, module coverage, cohort reconciliation, masterlist comparison, record issues |
| About | Connected governance summary |
| Overview, Divisions, Journey, Welcome Kit, KPI, Reviews, Milestones, Calendar, Attendance | **"No verified source" panel** naming the missing source. No summary cards, no percentages |
| Employee preview | Profile → source record and issues. 201 Files → evidence notes. Other tabs → "No verified source" |

Navigation, routes, filters, keyboard behavior and the 13 screens are unchanged. Screens are gated, not removed. Top bar: "Connected · Read-only" (or "Stale"). Footer: freshness and sign-out.

## 6. Security

- **Secrets** live only in the private host's environment (`server/.env.example` lists names, not values). `.gitignore` excludes `.env`. A test scans every tracked file for token, key, base ID, Drive ID and personal-email patterns.
- **Viewer auth:** existing Google accounts, no account creation. Verified email must be on `MJ_ALLOWED_VIEWERS`. The server refuses to start without a session secret, sign-in client ID, allowlist and HTTPS origin.
- **Sessions:** HMAC-SHA256 signed, 8-hour expiry, `HttpOnly; Secure; SameSite=Strict`. Sign-in POST requires an exact `Origin` match.
- **Read-only:** provider client is GET-only by construction. The server answers 405 to every non-GET except `/auth/session` and `/auth/logout`. There is no write code path to any provider.
- **Data delivery:** one authenticated `no-store` script. No unauthenticated data route, no bulk JSON API, payload escaped for script context.
- **Headers:** CSP (`default-src 'self'`, hashed inline theme script, `frame-ancestors 'none'`), HSTS, nosniff, no-referrer, X-Frame-Options DENY.
- **Caching:** last-known snapshot in server memory only. Nothing is written to disk.
- **Least privilege:** use an Airtable token scoped to `data.records:read` + `schema.bases:read` on one base, and Google read-only scopes.

## 7. Deployment runbook (when authorized)

1. Create an Airtable personal access token (read scopes, P&C Operations base only).
2. In Google Cloud (no billing needed), create an OAuth **Web** client for Sign-In with the private origin as an authorized JavaScript origin. Optionally create a second client and generate a refresh token with the three read-only scopes.
3. On the private host: set the variables from `server/.env.example` in the host's secret store, then run `node server/index.js --check`. It prints aggregate counts and provider states only; confirm `requestMethods` shows only GET/POST-token.
4. Run `node server/index.js` behind HTTPS (reverse proxy or the host's TLS). Visit `/login`.
5. Compare Data & Sources with this inventory: 60 records, 54 active, 10 without Employee ID at discovery time.

## 8. Testing

- `node tests/smoke.js`: 119 existing regression checks (sample mode unchanged).
- `node tests/connectors.js`: 37 connector-contract, security and connected-UI checks on anonymized fixtures. No network access.
- CI runs both on every pull request.

## 9. Not done / blocked

| Item | Blocker |
| --- | --- |
| Live run of the private service | Airtable token, Google OAuth credentials, sign-in client ID, private host (§7) |
| Journey, Welcome Kit, KPI, Reviews, Follow-ups | No authoritative per-employee source exists (inventory §4) |
| Attendance screen | Tracker lacks approval/verification. Needs an HR decision on what counts as verified |
| Calendar screen | Events retrieved but not yet merged into the snapshot. Computed milestones need approval to deliver birthdays |
| Drive / Docs evidence | No per-employee 201 folder convention |
| Gmail | No authorized follow-up tracker. Indiscriminate mailbox ingestion is not acceptable |
| Persistent last-known snapshot | Needs an encrypted private store; memory only for now |
| Physical device, screen reader and connected-mode browser QA | Manual. See PHASE10_ACCESSIBILITY_QA.md |
