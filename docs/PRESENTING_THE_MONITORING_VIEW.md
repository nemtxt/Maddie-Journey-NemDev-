# Presenting Maddie Journey to leadership

## Recommended: the passphrase-protected site

1. Open **https://nemtxt.github.io/Maddie-Journey-NemDev-/** in any current browser (desktop or phone).
2. Enter the **passphrase** that People & Culture gave you, then select **Unlock**.
3. When finished, select **Lock** in the footer or close the tab. Reloading the page always locks it again.

No download, account or billing is involved. The real roster is published only in encrypted form (AES-256), and it is decrypted inside your browser after the passphrase is entered. Without the passphrase, the published file is unreadable.

**Share the passphrase only with authorized leaders, by a private channel** (in person or a direct message, never in a group chat, email thread or slide). Anyone who has it can open the view.

### What leaders will see

| Screen | Content |
| --- | --- |
| People directory | 54 active employees: status, hire date and record checks |
| 201 Files | Document evidence per person from Airtable tracker attachments |
| Calendar | Confirmed Google Calendar P&C meetings and Philippine holidays, plus check-ins, probation checkpoints and anniversaries calculated from hiring dates |
| Data & Sources | Provider status, snapshot date, the 51-baseline comparison (54 active), and every missing or conflicting record value |
| Journey, Welcome Kit, KPI, Reviews, Milestones, Attendance | A **"No verified source"** notice naming what is missing. These are the decisions to bring to leadership |

The snapshot does not update live. Data & Sources shows when it was retrieved, and it is marked stale after 7 days. Ask for a refresh before an important meeting.

## Alternative: presenter mode on one computer

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
