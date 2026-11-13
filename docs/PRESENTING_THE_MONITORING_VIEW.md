# Presenting Maddie Journey to leadership

There are two ways to show the system. Choose based on whether real employee records may be shown.

| | A. Public sample | B. Real data, presenter mode |
| --- | --- | --- |
| Shows | The full interface with **51 fictional employees** | The real P&C roster, read-only |
| Where | Any browser: https://nemtxt.github.io/Maddie-Journey-NemDev-/ | Only on the presenting computer |
| Setup | None | Node.js plus a read-only Airtable key (below) |
| Use for | Explaining screens, navigation and design | Showing actual coverage, reconciliation and gaps |

## A. Public sample (no setup)

Open https://nemtxt.github.io/Maddie-Journey-NemDev-/ and walk through Dashboard → People → Journey → Performance → Data & Sources. Every figure is fictional and labelled as such.

## B. Real data in presenter mode

Presenter mode runs on **your own computer only**. It listens on `127.0.0.1`, so no other device can open it. It prints a one-time link, needs no Google sign-in setup, and never writes to any source. Nothing is uploaded or published.

> **No connector is changed by this.** Presenter mode does not use Claude's connectors. It reads Airtable only if the base owner chooses to create and supply a read-only key. Creating that key is the owner's decision and can be revoked at any time.

### One-time preparation

1. **Install Node.js 22 LTS** from https://nodejs.org (Windows or macOS installer, default options).
2. **Download the code.** On GitHub, open the branch `claude/trusting-cori-ixprfj` (or `main` once merged), then **Code → Download ZIP**, and unzip it.
3. **Read-only Airtable key (owner's decision).** At https://airtable.com/create/tokens, create a token with:
   - Scopes: `data.records:read` and `schema.bases:read`. **No write scopes.**
   - Access: the **P&C Operations** base only.
4. **Private settings file.** In the unzipped folder, open `server`, copy `.env.example` to a new file named `.env`, and fill in:
   ```
   MJ_AIRTABLE_TOKEN=<the read-only token>
   MJ_AIRTABLE_BASE_ID=<the P&C Operations base ID: the part starting with "app" in the base's Airtable URL>
   ```
   Leave the other lines as they are. `.env` is git-ignored and must never be uploaded or shared.

### Each presentation

1. Open a terminal in the unzipped folder (Windows: right-click the folder → **Open in Terminal**; macOS: **Terminal**, then `cd` into the folder).
2. Run:
   ```
   node --env-file=server/.env server/index.js --local
   ```
3. The terminal prints `Roster loaded: N active records` and a link like `http://127.0.0.1:8787/local-access?token=…`. Open that link in your browser.
4. When finished, press **Ctrl+C** in the terminal. The link stops working immediately.

### What leaders will see

| Screen | Content |
| --- | --- |
| People directory | Real active roster: status, hire date and record checks per person |
| 201 Files | Document evidence per person from Airtable tracker attachments |
| Data & Sources | Provider status, freshness, the 51-baseline comparison, and every missing or conflicting record value |
| Journey, Welcome Kit, KPI, Reviews, Milestones, Calendar, Attendance | A clear **"No verified source"** notice naming what is missing. These are the decisions to bring to leadership |

### Presenting responsibly

- Real names and employment details are on screen. Present only to people authorized to see them; avoid recording or broadcasting the session.
- Do not share the access link. It works only on your computer, and only while the terminal is running.
- Use **Data & Sources** to frame the discussion: what is connected, what is missing, and which HR decisions would close each gap.
