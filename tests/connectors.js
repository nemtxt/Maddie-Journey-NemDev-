/* Maddie Journey v3.8 — connector-contract, security and connected-UI checks.
   Run from repository root: node tests/connectors.js
   Uses only anonymized synthetic fixtures; makes NO real network requests. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fx = require('./fixtures/connected-fixtures');
const { createClient, ProviderError } = require('../server/lib/readonly-http');
const { createAirtableAdapter } = require('../server/providers/airtable');
const rec = require('../server/reconcile');
const { buildSnapshot } = require('../server/normalize');
const { createSnapshotService } = require('../server/snapshot-service');
const { createVerifier, createSessions } = require('../server/auth');
const { createServer, scriptJson } = require('../server/server');
const { loadConfig, validateForServe } = require('../server/config');
const map = require('../server/mapping');

const results = [];
const queue = [];
function check(name, fn) { queue.push([name, fn]); }
const noSleep = function () { return Promise.resolve(); };
const NOW = Date.parse('2026-11-12T03:00:00Z');

function service(fetchOpts, extra) {
  const fetch = fx.fakeFetch(fetchOpts);
  let t = NOW;
  const clock = function () { return t; };
  const client = createClient({ fetch: fetch, sleep: noSleep, random: function () { return 0; } });
  const svc = createSnapshotService(Object.assign({}, fx.config, extra || {}), { client: client, now: clock, sleep: noSleep });
  return { svc, fetch, advance: function (ms) { t += ms; }, client };
}

/* ---------- Read-only HTTP client ---------- */
check('Read-only client blocks every write method against provider data APIs', async () => {
  const client = createClient({ fetch: fx.fakeFetch(), sleep: noSleep });
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    await assert.rejects(client.request('https://api.airtable.com/v0/appX/tblY', { method }), (e) => e.code === 'read-only');
    await assert.rejects(client.request('https://sheets.googleapis.com/v4/spreadsheets/x/values/A1', { method }), (e) => e.code === 'read-only');
  }
});
check('Read-only client enforces HTTPS and a host allowlist', async () => {
  const client = createClient({ fetch: fx.fakeFetch(), sleep: noSleep });
  await assert.rejects(client.getJson('http://api.airtable.com/v0/x'), (e) => e.code === 'config');
  await assert.rejects(client.getJson('https://evil.example.com/collect'), (e) => e.code === 'config');
  await assert.rejects(client.request('https://oauth2.googleapis.com/revoke', { method: 'POST' }), (e) => e.code === 'read-only');
  const token = await client.request('https://oauth2.googleapis.com/token', { method: 'POST', body: '' });
  assert.equal(token.access_token, 'synthetic-access-token');
});
check('Read-only client retries 429/5xx with backoff and honours Retry-After', async () => {
  let n = 0; const waits = [];
  const fetch = async () => {
    n += 1;
    if (n === 1) return { ok: false, status: 429, headers: { get: (h) => (h === 'retry-after' ? '2' : null) } };
    if (n === 2) return { ok: false, status: 503, headers: { get: () => null } };
    return { ok: true, status: 200, json: async () => ({ ok: 1 }) };
  };
  const client = createClient({ fetch, sleep: async (ms) => { waits.push(ms); }, random: () => 0, baseDelayMs: 100 });
  assert.deepEqual(await client.getJson('https://api.airtable.com/v0/a/b'), { ok: 1 });
  assert.equal(n, 3);
  assert.equal(waits[0], 2000); // Retry-After wins over the 100ms base delay
  assert.equal(waits[1], 200);  // exponential backoff
});
check('Provider errors are classified and never leak tokens, URLs or bodies', async () => {
  const fetch = async () => ({ ok: false, status: 403, headers: { get: () => null }, json: async () => ({ secret: 'body' }) });
  const client = createClient({ fetch, sleep: noSleep });
  try { await client.getJson('https://api.airtable.com/v0/appSECRET/tbl?token=abc'); assert.fail('expected error'); }
  catch (e) {
    assert(e instanceof ProviderError);
    assert.equal(e.code, 'permission');
    assert(!/appSECRET|token=|abc|body/.test(e.safeMessage));
  }
  const failing = createClient({ fetch: async () => ({ ok: false, status: 500, headers: { get: () => null } }), sleep: noSleep, retries: 2 });
  await assert.rejects(failing.getJson('https://api.airtable.com/v0/a/b'), (e) => e.code === 'http');
});

/* ---------- Airtable adapter ---------- */
check('Airtable adapter paginates and requests only mapped, non-sensitive fields', async () => {
  const fetch = fx.fakeFetch({ pageSize: 5 });
  const client = createClient({ fetch, sleep: noSleep });
  const air = createAirtableAdapter(fx.config, client, { sleep: noSleep });
  const people = await air.fetchPeople();
  assert.equal(people.length, fx.people.length);
  const peopleCalls = fetch.calls.filter((c) => c.url.includes(map.AIRTABLE.people.table));
  assert.equal(peopleCalls.length, 3); // 12 records / 5 per page
  assert(fetch.calls.every((c) => c.method === 'GET'));
  assert(fetch.calls.every((c) => c.headers.Authorization === 'Bearer ' + fx.config.airtableToken));
  const requested = new URL(peopleCalls[0].url).searchParams.getAll('fields[]');
  // Allowlist, not denylist: exactly the mapped scalar fields plus 201 attachment columns.
  const allowed = new Set(Object.values(map.AIRTABLE.people.fields).concat(...map.FILES_201.map((d) => d.fields)));
  assert.deepEqual(new Set(new URL(peopleCalls[0].url).searchParams.getAll('fields[]')), allowed);
  const sensitive = [fx.SALARY_FIELD, 'fldPV7FA6RyE40xCN' /* SSS */, 'fldXfMS9rFj13nyEC' /* TIN */,
    'fldNyJpINErvo1cp6' /* bank account */, 'fldJQ9bbhTTfkPFoB' /* address */, 'fldaTUisJryAbsA9K' /* phone */];
  sensitive.forEach((f) => assert(!requested.includes(f), 'sensitive field requested: ' + f));
  assert(requested.includes(map.AIRTABLE.people.fields.employeeId));
});
check('Airtable adapter reduces attachments to presence and drops unmapped fields', async () => {
  const air = createAirtableAdapter(fx.config, createClient({ fetch: fx.fakeFetch(), sleep: noSleep }), { sleep: noSleep });
  const people = await air.fetchPeople();
  const first = people.find((p) => p.recordId === fx.rid(1));
  assert(Object.values(first.attachments).every((v) => v === true));
  const text = JSON.stringify(people);
  assert(!text.includes('synthetic.pdf') && !text.includes('example.invalid'));
  assert(!text.includes('99999'));
  assert.equal(first.values.salary, undefined);
});
check('Attendance links are kept as record IDs and display names are discarded', async () => {
  const air = createAirtableAdapter(fx.config, createClient({ fetch: fx.fakeFetch(), sleep: noSleep }), { sleep: noSleep });
  const rows = await air.fetchAttendance();
  assert.equal(rows.length, 5);
  assert.deepEqual(rows[0].employeeRecordIds, [fx.rid(1)]);
  assert.deepEqual(rows[4].employeeRecordIds, []);
});
check('Unconfigured Airtable reports a configuration state instead of fabricating data', async () => {
  const air = createAirtableAdapter({}, createClient({ fetch: fx.fakeFetch(), sleep: noSleep }), { sleep: noSleep });
  assert.equal(air.configured(), false);
  await assert.rejects(air.fetchPeople(), (e) => e.code === 'config');
});

/* ---------- Reconciliation ---------- */
check('Employee IDs normalize without name matching', () => {
  assert.deepEqual(rec.normalizeEmployeeId('0269'), { canonical: '0269', state: 'ok', raw: '0269' });
  assert.equal(rec.normalizeEmployeeId('269').canonical, '0269');
  assert.equal(rec.normalizeEmployeeId(' 269 ').state, 'format-normalized');
  assert.equal(rec.normalizeEmployeeId('').state, 'missing');
  assert.equal(rec.normalizeEmployeeId(undefined).state, 'missing');
  assert.equal(rec.normalizeEmployeeId('EMP-1').state, 'invalid');
  assert.equal(rec.parseLongDate('March 21, 2024'), '2024-03-21');
  assert.equal(rec.parseLongDate('Sept. 5, 2025'), '2025-09-05');
  assert.equal(rec.parseLongDate('soon'), null);
});
async function roster() {
  const air = createAirtableAdapter(fx.config, createClient({ fetch: fx.fakeFetch(), sleep: noSleep }), { sleep: noSleep });
  return { people: await air.fetchPeople(), departments: await air.fetchDepartments(), attendance: await air.fetchAttendance(), development: await air.fetchDevelopment() };
}
check('Roster reconciliation counts every record and never drops or invents one', async () => {
  const { people } = await roster();
  const r = rec.reconcileRoster(people);
  const s = r.summary;
  assert.equal(s.totalRecords, 12);
  assert.equal(s.activeRecords + s.inactiveRecords + s.unknownStatusRecords, s.totalRecords);
  assert.equal(s.activeRecords, 8);
  assert.equal(s.inactiveRecords, 3);
  assert.equal(s.unknownStatusRecords, 1);
  assert.equal(s.missingEmployeeId, 1);
  assert.equal(s.activeMissingEmployeeId, 1);
  assert.equal(s.duplicateEmployeeIds, 1);
  assert.equal(s.formatNormalizedIds, 2);
  assert.equal(s.baseline, 51);
  assert.equal(s.baselineDifference, 8 - 51);
  assert.deepEqual(s.statusCounts, { Regular: 5, Probationary: 2, 'Part-Time': 1, Resigned: 2, AWOL: 1, '(blank)': 1 });
});
check('Reconciliation reports duplicates, missing values and date conflicts explicitly', async () => {
  const { people } = await roster();
  const kinds = {};
  rec.reconcileRoster(people).issues.forEach((i) => { (kinds[i.kind] = kinds[i.kind] || []).push(i.recordId); });
  assert.deepEqual(kinds['duplicate-employee-id'].sort(), [fx.rid(4), fx.rid(5)]);
  assert.deepEqual(kinds['missing-employee-id'], [fx.rid(3)]);
  assert.deepEqual(kinds['unknown-status'], [fx.rid(11)]);
  assert.deepEqual(kinds['missing-department'], [fx.rid(10)]);
  assert.deepEqual(kinds['hire-date-conflict'], [fx.rid(12)]);
  assert.deepEqual(kinds['missing-separation-date'], [fx.rid(6)]);
  assert.deepEqual(kinds['status-date-conflict'], [fx.rid(7)]);
  assert.deepEqual(kinds['date-order-conflict'], [fx.rid(8)]);
  assert.deepEqual(kinds['missing-hire-date'], [fx.rid(9)]);
  assert.deepEqual(kinds['employee-id-format'].sort(), [fx.rid(2), fx.rid(5)]);
});
check('Records sharing a display name stay separate; joins use IDs only', async () => {
  const data = await roster();
  const out = buildSnapshot(Object.assign({ sources: [{ id: 'airtable', state: 'connected' }] }, data), NOW);
  const same = out.snapshot.employees.filter((e) => e.name === 'Sample Person 01');
  assert.equal(same.length, 2);
  assert.notEqual(same[0].id, same[1].id);
  assert.deepEqual(same.map((e) => e.provenance.recordId).sort(), [fx.rid(1), fx.rid(12)]);
});
check('Sheets masterlist comparison names authoritative source and ignores summary rows', async () => {
  const { people } = await roster();
  const m = rec.reconcileMasterlist(rec.reconcileRoster(people).rows, fx.masterlistRows);
  assert.equal(m.sheetIdCount, 4);
  assert.equal(m.matchedIds, 3);
  assert.deepEqual(m.onlyInSheet.map((x) => x.employeeId), ['0199']);
  assert.equal(m.onlyInRoster.length, 7);
  assert.deepEqual(m.statusMismatch, [{ employeeId: '0106', rosterStatus: 'Resigned', sheetStatus: 'Regular', authoritative: 'airtable.people' }]);
  assert.equal(m.nonIdRows, 2);
});
check('Tracker links count active, inactive and orphaned records separately', async () => {
  const { people, attendance, development } = await roster();
  const rows = rec.reconcileRoster(people).rows;
  assert.deepEqual(rec.reconcileLinks(rows, attendance), { total: 5, linkedActive: 2, linkedInactive: 1, orphans: 2, multiLinked: 0 });
  assert.deepEqual(rec.reconcileLinks(rows, development), { total: 2, linkedActive: 2, linkedInactive: 0, orphans: 0, multiLinked: 0 });
});

/* ---------- Normalization ---------- */
check('Normalized snapshot excludes inactive records from denominators and keeps provenance', async () => {
  const data = await roster();
  const out = buildSnapshot(Object.assign({ sources: [{ id: 'airtable', state: 'connected' }] }, data), NOW);
  const emps = out.snapshot.employees;
  assert.equal(emps.length, 9); // 8 active + 1 unknown-status (flagged, not silently dropped)
  assert(!emps.some((e) => ['Resigned', 'AWOL'].includes(e.employmentStatus)));
  assert.equal(new Set(emps.map((e) => e.id)).size, emps.length);
  assert(emps.find((e) => e.id === '0102'));
  assert(emps.find((e) => e.id === 'AT-' + fx.rid(3)));
  assert(emps.find((e) => e.id === 'AT-' + fx.rid(4)) && emps.find((e) => e.id === 'AT-' + fx.rid(5)));
  emps.forEach((e) => {
    assert.equal(e.provenance.provider, 'airtable');
    assert.equal(e.provenance.retrievedAt, new Date(NOW).toISOString());
    assert.equal(e.provenance.sourceModified, null);
    assert.equal(e.provenance.verification, 'retrieved-not-hr-verified');
  });
  assert.equal(emps.find((e) => e.id === '0102').startDate, '2026-03-03'); // from Hiring Date text when Hire Date is empty
});
check('Unsourced modules are null, never false or zero', async () => {
  const data = await roster();
  const e = buildSnapshot(Object.assign({ sources: [{ id: 'airtable', state: 'connected' }] }, data), NOW).snapshot.employees[0];
  assert(e.journey.flat().every((v) => v === null));
  assert(e.kit.every((v) => v === null));
  assert(Object.values(e.scores).every((v) => v === null));
  assert.equal(e.review.coo.status, 'Not sourced');
  assert.deepEqual(e.disciplinaryActions, []);
});
check('201 statuses follow documented attachment rules and never imply HR approval', async () => {
  const data = await roster();
  const emps = buildSnapshot(Object.assign({ sources: [{ id: 'airtable', state: 'connected' }] }, data), NOW).snapshot.employees;
  const one = emps.find((e) => e.id === '0101'), two = emps.find((e) => e.id === '0102');
  assert.equal(one.files201['regularization-contract'], 'source-unavailable');
  assert(Object.entries(one.files201).filter(([k]) => k !== 'regularization-contract').every(([, v]) => v === 'complete'));
  assert(Object.values(one.files201Evidence).every((x) => x.verified === false || x.state === 'source-unavailable'));
  assert.equal(two.files201.benefits, 'missing');
  assert.equal(two.files201Evidence.benefits.state, 'partial-attachments');
  assert.equal(two.files201.nda, 'missing');
});
check('Normalized payload contains no compensation, credential or attachment data', async () => {
  const data = await roster();
  const text = JSON.stringify(buildSnapshot(Object.assign({ sources: [{ id: 'airtable', state: 'connected' }] }, data), NOW));
  ['99999', 'synthetic.pdf', 'example.invalid', fx.SALARY_FIELD, 'Bank', 'TIN ID (Photocopy)', 'salary'].forEach((needle) => {
    if (needle === 'TIN ID (Photocopy)') return; // mapping notes may name the requirement, not values
    assert(!text.includes(needle), 'payload leaked ' + needle);
  });
  assert(!/"email":"[^"]+"/.test(text));
  assert(!/"birthday":"[^"]+"/.test(text));
});
check('Connected snapshot satisfies the browser adapter contract', async () => {
  const data = await roster();
  const out = buildSnapshot(Object.assign({ sources: [{ id: 'airtable', state: 'connected' }] }, data), NOW);
  const win = { MJ_CONNECTED_PAYLOAD: Object.assign({ available: true }, out) };
  new Function('window', fs.readFileSync(path.join(root, 'data-adapter.js'), 'utf8'))(win);
  const a = win.MJ_SOURCE_ADAPTER;
  assert.equal(a.mode, 'connected');
  assert.equal(a.contractVersion, 3);
  assert(a.validateSnapshot(a.getSnapshot()));
  const bad = a.getSnapshot(); bad.employees[0].files201.nda = 'approved-by-hr';
  assert(!a.validateSnapshot(bad));
  assert.equal(a.screenAvailability('kpi').available, false);
  assert.equal(a.screenAvailability('employees').available, true);
  assert.equal(a.screenAvailability('files201').available, true);
  assert.equal(a.screenAvailability('attendance').available, false); // no approval/verification field in source
});

/* ---------- Snapshot service ---------- */
check('Snapshot service reports real provider states including not-implemented connectors', async () => {
  const { svc, fetch } = service();
  const state = await svc.refresh();
  assert(state.available);
  const by = Object.fromEntries(state.sources.map((s) => [s.id, s]));
  assert.equal(by.airtable.state, 'connected');
  assert.equal(by.airtable.recordCount, 12);
  assert.equal(by.airtable.datasets.length, 4);
  assert.equal(by.sheets.state, 'connected');
  assert.equal(by.sheets.sourceModified, '2026-05-05T08:22:42.438Z');
  assert.equal(by.sheets.conflicts, 1);
  assert.equal(by.calendar.state, 'connected');
  assert.equal(by.calendar.recordCount, 1); // cancelled events are not counted
  ['drive', 'docs', 'gmail'].forEach((id) => { assert.equal(by[id].state, 'not-implemented'); assert.equal(by[id].lastSuccessfulRetrieval, null); });
  const methods = new Set(fetch.calls.map((c) => c.method + ' ' + new URL(c.url).hostname));
  assert.deepEqual([...methods].filter((m) => !m.startsWith('GET ')), ['POST oauth2.googleapis.com']);
  assert.equal(state.freshness.stale, false);
});
check('Partial provider failure degrades one dataset without hiding the roster', async () => {
  const { svc } = service({ fail: { [map.AIRTABLE.attendance.table]: 500, sheets: 403 } });
  const state = await svc.refresh();
  assert(state.available);
  const by = Object.fromEntries(state.sources.map((s) => [s.id, s]));
  assert.equal(by.airtable.state, 'partial');
  assert(by.airtable.lastError.includes('Tardiness/Leave Tracker'));
  assert.equal(by.sheets.state, 'permission-limited');
  assert.equal(state.snapshot.coverage.attendance, 'error');
  assert.equal(state.reconciliation.masterlist, null);
});
check('Roster failure keeps last-known snapshot labelled stale; no snapshot means unavailable', async () => {
  const empty = service({ fail: { [map.AIRTABLE.people.table]: 401 } });
  const none = await empty.svc.refresh();
  assert.equal(none.available, false);
  assert.equal(none.sources.find((s) => s.id === 'airtable').state, 'permission-limited');

  const healthy = fx.fakeFetch(), failing = fx.fakeFetch({ fail: { [map.AIRTABLE.people.table]: 503 } });
  let failPeople = false, t = NOW;
  const svc = createSnapshotService(fx.config, {
    client: createClient({ fetch: (u, i) => (failPeople && u.includes(map.AIRTABLE.people.table) ? failing(u, i) : healthy(u, i)), sleep: noSleep, retries: 0 }),
    now: () => t, sleep: noSleep
  });
  const good = await svc.refresh();
  assert(good.available && !good.freshness.stale);
  failPeople = true; t += 1000;
  const after = await svc.refresh();
  assert(after.available, 'last-known snapshot should still be served');
  assert.equal(after.freshness.stale, true);
  assert.equal(after.freshness.refreshFailed, true);
  assert.equal(after.sources.find((s) => s.id === 'airtable').state, 'error');
  assert.equal(after.snapshot.employees.length, good.snapshot.employees.length);
});
check('Snapshot ages past the freshness window are flagged stale', async () => {
  const ctx = service(undefined, { staleAfterMs: 1000 });
  await ctx.svc.refresh();
  ctx.advance(5000);
  assert.equal(ctx.svc.current().freshness.stale, true);
});
check('Unconfigured Google providers are reported as not configured', async () => {
  const ctx = service(undefined, { googleRefreshToken: '' });
  const state = await ctx.svc.refresh();
  const by = Object.fromEntries(state.sources.map((s) => [s.id, s]));
  assert.equal(by.sheets.state, 'not-configured');
  assert.equal(by.calendar.state, 'not-configured');
  assert.equal(state.snapshot.coverage.calendar, 'not-configured');
});

/* ---------- Authentication ---------- */
const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = Object.assign(keys.publicKey.export({ format: 'jwk' }), { kid: 'k1', alg: 'RS256', use: 'sig' });
function idToken(claims, opts) {
  const header = { alg: 'RS256', kid: (opts && opts.kid) || 'k1', typ: 'JWT' };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const body = Object.assign({ iss: 'https://accounts.google.com', aud: 'client-123', exp: Math.floor(NOW / 1000) + 600,
    email: 'viewer@example.com', email_verified: true }, claims);
  const input = enc(header) + '.' + enc(body);
  const sig = crypto.sign('RSA-SHA256', Buffer.from(input), (opts && opts.key) || keys.privateKey).toString('base64url');
  return input + '.' + sig;
}
const certClient = { getJson: async () => ({ keys: [jwk] }) };
const verifier = createVerifier({ signInClientId: 'client-123', allowedViewers: ['Viewer@Example.com'] }, certClient, { now: () => NOW });
check('Google ID tokens are verified by signature, audience, expiry and allowlist', async () => {
  assert.deepEqual(await verifier.verifyIdToken(idToken({})), { email: 'viewer@example.com' });
  const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const reject = async (t) => assert.rejects(verifier.verifyIdToken(t), (e) => e.code === 'unauthorized');
  await reject(idToken({ aud: 'another-app' }));
  await reject(idToken({ exp: Math.floor(NOW / 1000) - 1 }));
  await reject(idToken({ email_verified: false }));
  await reject(idToken({ email: 'stranger@example.com' }));
  await reject(idToken({ iss: 'https://evil.example.com' }));
  await reject(idToken({}, { key: other.privateKey }));
  await reject(idToken({}, { kid: 'unknown' }));
  await reject('not.a.token');
  const closed = createVerifier({ signInClientId: 'client-123', allowedViewers: [] }, certClient, { now: () => NOW });
  await assert.rejects(closed.verifyIdToken(idToken({})), /No viewers are authorized/);
});
check('Session cookies are signed, expire and reject tampering', () => {
  let t = NOW;
  const s = createSessions('x'.repeat(40), { now: () => t });
  const v = s.issue('viewer@example.com');
  assert.deepEqual(s.read('a=b; mj_session=' + v), { email: 'viewer@example.com' });
  assert.equal(s.read('mj_session=' + v.slice(0, -2) + 'AA'), null);
  const forged = Buffer.from(JSON.stringify({ e: 'admin@example.com', x: NOW + 1e9 })).toString('base64url') + '.' + v.split('.')[1];
  assert.equal(s.read('mj_session=' + forged), null);
  t += 9 * 3600 * 1000;
  assert.equal(s.read('mj_session=' + v), null);
  const c = s.cookie(v, true);
  assert(/HttpOnly/.test(c) && /SameSite=Strict/.test(c) && /Secure/.test(c));
  assert.throws(() => createSessions('short'), /32 characters/);
});
check('Server configuration fails closed without secrets, allowlist or HTTPS origin', () => {
  const problems = validateForServe(loadConfig({}));
  assert(problems.length >= 4);
  assert.deepEqual(validateForServe(loadConfig({ MJ_SESSION_SECRET: 'y'.repeat(40), MJ_GOOGLE_SIGNIN_CLIENT_ID: 'c', MJ_ALLOWED_VIEWERS: 'a@example.com', MJ_PUBLIC_ORIGIN: 'https://hr.example.com' })), []);
  assert.equal(validateForServe(loadConfig({ MJ_SESSION_SECRET: 'y'.repeat(40), MJ_GOOGLE_SIGNIN_CLIENT_ID: 'c', MJ_ALLOWED_VIEWERS: 'a@example.com', MJ_PUBLIC_ORIGIN: 'http://hr.example.com' })).length, 1);
});

/* ---------- Private HTTP server ---------- */
function request(port, method, p, headers, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: p, headers: headers || {} }, (res) => {
      let data = ''; res.on('data', (c) => { data += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject); if (body) req.write(body); req.end();
  });
}
check('Private server enforces authentication, read-only methods and file allowlist', async () => {
  const ctx = service();
  await ctx.svc.refresh();
  const sessions = createSessions('z'.repeat(40));
  const origin = 'https://hr.example.com';
  const server = createServer({ config: { publicOrigin: origin, signInClientId: 'client-123', insecureLocalCookies: false }, service: ctx.svc, verifier, sessions });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    let r = await request(port, 'GET', '/');
    assert.equal(r.status, 302); assert.equal(r.headers.location, '/login');
    r = await request(port, 'GET', '/private/payload.js');
    assert.equal(r.status, 401); assert(!r.body.includes('Sample Person'));
    for (const m of ['PUT', 'PATCH', 'DELETE']) assert.equal((await request(port, m, '/private/payload.js')).status, 405);
    assert.equal((await request(port, 'POST', '/api/snapshot')).status, 405);
    assert.equal((await request(port, 'GET', '/api/snapshot')).status, 404); // no bulk snapshot API exists
    r = await request(port, 'POST', '/auth/session', { Origin: 'https://evil.example.com', 'Content-Type': 'application/json' }, JSON.stringify({ credential: idToken({}) }));
    assert.equal(r.status, 403);
    r = await request(port, 'POST', '/auth/session', { Origin: origin, 'Content-Type': 'application/json' }, JSON.stringify({ credential: idToken({ email: 'stranger@example.com' }) }));
    assert.equal(r.status, 401);
    r = await request(port, 'POST', '/auth/session', { Origin: origin, 'Content-Type': 'application/json' }, JSON.stringify({ credential: idToken({}) }));
    assert.equal(r.status, 204);
    const cookie = r.headers['set-cookie'][0].split(';')[0];
    assert(/HttpOnly/.test(r.headers['set-cookie'][0]) && /Secure/.test(r.headers['set-cookie'][0]));
    r = await request(port, 'GET', '/', { Cookie: cookie });
    assert.equal(r.status, 200);
    assert(r.body.includes('/private/payload.js') && !r.body.includes('./data.js'));
    assert(r.headers['content-security-policy'].includes("frame-ancestors 'none'"));
    r = await request(port, 'GET', '/private/payload.js', { Cookie: cookie });
    assert.equal(r.status, 200);
    assert.equal(r.headers['cache-control'], 'no-store');
    assert(r.body.startsWith('window.MJ_CONNECTED_PAYLOAD='));
    assert(r.body.includes('Sample Person') && r.body.includes('"viewer":{"email":"viewer@example.com"}'));
    for (const p of ['/data.js', '/server/mapping.js', '/server/.env.example', '/tests/connectors.js', '/docs/PHASE11_SOURCE_INVENTORY.md', '/.git/config', '/assets/../server/auth.js', '/%2e%2e/server/auth.js']) {
      assert.equal((await request(port, 'GET', p, { Cookie: cookie })).status, 404, p);
    }
    assert.equal((await request(port, 'GET', '/app.js', { Cookie: cookie })).status, 200);
    assert.equal((await request(port, 'GET', '/healthz')).body, '{"ok":true}');
  } finally { server.close(); }
});
check('Presenter mode admits only this computer with the one-time link and stays read-only', async () => {
  const ctx = service();
  await ctx.svc.refresh();
  const sessions = createSessions('p'.repeat(40));
  const token = 'presenter-token-abcdefghijklmnop';
  const server = createServer({ config: { publicOrigin: 'http://127.0.0.1:0', localAccessToken: token, insecureLocalCookies: true, signInClientId: '' },
    service: ctx.svc, verifier: { verifyIdToken: async () => { throw Object.assign(new Error('disabled'), { code: 'unauthorized' }); } }, sessions });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const host = { Host: '127.0.0.1:' + port };
  try {
    assert.equal((await request(port, 'GET', '/private/payload.js', host)).status, 401);
    assert.equal((await request(port, 'GET', '/local-access?token=wrong', host)).status, 403);
    assert.equal((await request(port, 'GET', '/local-access', host)).status, 403);
    // DNS rebinding: a foreign Host header is refused even from loopback.
    assert.equal((await request(port, 'GET', '/local-access?token=' + token, { Host: 'attacker.example:' + port })).status, 403);
    const login = await request(port, 'GET', '/login', host);
    assert(login.body.includes('PRESENTER MODE') && !login.body.includes('accounts.google.com'));
    const r = await request(port, 'GET', '/local-access?token=' + token, host);
    assert.equal(r.status, 302);
    assert.equal(r.headers.location, '/');
    const cookie = r.headers['set-cookie'][0];
    assert(/HttpOnly/.test(cookie) && /SameSite=Strict/.test(cookie));
    const auth = Object.assign({ Cookie: cookie.split(';')[0] }, host);
    const payload = await request(port, 'GET', '/private/payload.js', auth);
    assert.equal(payload.status, 200);
    assert(payload.body.includes('Sample Person'));
    assert.equal((await request(port, 'POST', '/auth/session', Object.assign({ Origin: 'http://127.0.0.1:0' }, host), '{}')).status, 405);
    assert.equal((await request(port, 'DELETE', '/private/payload.js', auth)).status, 405);
  } finally { server.close(); }
});
check('Normal private server has no presenter access route', async () => {
  const ctx = service();
  const server = createServer({ config: { publicOrigin: 'https://hr.example.com', signInClientId: 'client-123' }, service: ctx.svc, verifier, sessions: createSessions('q'.repeat(40)) });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try { assert.equal((await request(server.address().port, 'GET', '/local-access?token=')).status, 404); }
  finally { server.close(); }
});
check('Payload script escaping prevents script-context injection', () => {
  const out = scriptJson({ name: '</script><script>alert(1)</script>\u2028' });
  assert(!out.includes('</script>') && !out.includes('\u2028'));
  assert.equal(JSON.parse(out).name, '</script><script>alert(1)</script>\u2028');
});

/* ---------- Connected UI (real app.js, no fictional fixture) ---------- */
async function connectedBoot(payloadPatch) {
  const ctx = service();
  const state = await ctx.svc.refresh();
  const payload = Object.assign(JSON.parse(JSON.stringify(state)), { viewer: { email: 'viewer@example.com' } }, payloadPatch || {});
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const mount = { innerHTML: '', querySelector() { return null; } }, nodes = { app: mount }, events = {}, mem = {};
  const doc = { title: '', activeElement: null, documentElement: { dataset: {} }, body: { appendChild(el) { nodes[el.id] = el; } },
    getElementById(id) { return nodes[id] || null; }, querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener(n, fn) { events[n] = fn; },
    createElement(tag) { return { tagName: tag, id: '', className: '', textContent: '', setAttribute() {}, click() {}, remove() {}, addEventListener() {}, querySelectorAll() { return []; }, querySelector() { return { focus() {}, addEventListener() {} }; } }; } };
  const win = { handlers: {}, addEventListener(n, fn) { this.handlers[n] = fn; }, scrollTo() {}, MJ_CONNECTED_PAYLOAD: payload };
  const store = { getItem(k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; }, setItem(k, v) { mem[k] = v; } };
  new Function('window', read('data-adapter.js'))(win);
  new Function('window', read('icons.js'))(win);
  new Function('window', read('monitoring.js'))(win);
  const loc = { hash: '' };
  new Function('window', 'document', 'localStorage', 'sessionStorage', 'location', 'setTimeout', 'Blob', 'URL', read('app.js'))(win, doc, store, store, loc, () => {}, function () {}, { createObjectURL() { return ''; }, revokeObjectURL() {} });
  const click = (name, attrs) => events.click({ target: { dataset: {}, closest(sel) { return sel === '[data-action]' ? { dataset: Object.assign({ action: name }, attrs || {}) } : null; } }, preventDefault() {} });
  return { win, html: () => mount.innerHTML, nav: (tab) => click('nav', { tab }), click, nodes };
}
check('Connected UI never loads fictional employees and states unsourced screens honestly', async () => {
  const ui = await connectedBoot();
  assert.equal(ui.win.MJ_SOURCE_ADAPTER.mode, 'connected');
  assert.equal(ui.win.MJ_SEED, undefined);
  for (const tab of ['overview', 'journey', 'kit', 'kpi', 'approvals', 'milestones', 'attendance', 'calendar', 'divisions']) {
    ui.nav(tab);
    const html = ui.html();
    assert(html.includes('NO VERIFIED SOURCE'), tab + ' should be guarded');
    assert(!html.includes('SCREEN SUMMARY'), tab + ' must not show computed summary cards');
    assert(!/\d+%/.test(html.split('NO VERIFIED SOURCE')[0].split('</nav>').pop()), tab + ' must not show percentages');
    assert(html.includes('Connected · Read-only') && !html.includes('Sample · Not connected'));
    assert(!/MJ-0\d\d/.test(html), tab + ' leaked fictional IDs');
    assert(html.includes('read-only'));
  }
});
check('Connected directory shows sourced roster facts only and blocks CSV export', async () => {
  const ui = await connectedBoot();
  ui.nav('employees');
  const html = ui.html();
  assert(html.includes('CONNECTED ROSTER') && html.includes('connected-roster-table'));
  assert(html.includes('Employment status') && !html.includes('<th scope="col">KPI score</th>'));
  assert(html.includes('Sample Person') && !html.includes('51 fictional'));
  assert(html.includes('Records without Employee ID'));
  assert(!html.includes('Export visible CSV'));
  ui.click('export-csv');
  assert(ui.nodes.toast && /disabled/.test(ui.nodes.toast.textContent));
});
check('Connected 201 Files and employee profile show source evidence and statuses', async () => {
  const ui = await connectedBoot();
  ui.nav('files201');
  let html = ui.html();
  assert(html.includes('Connected tracker snapshot') && html.includes('not HR approval'));
  assert(html.includes('Regularization Contract'));
  ui.click('open', { id: '0101', detail: 'files201' });
  html = ui.html();
  assert(html.includes('Source unavailable') && html.includes('Airtable tracker attachment presence'));
  ui.click('detail', { tab: 'kpi' });
  assert(ui.html().includes('NO VERIFIED SOURCE'));
  ui.click('detail', { tab: 'info' });
  html = ui.html();
  assert(html.includes('Source record') && html.includes(fx.rid(1)) && !html.includes('Org level (sample)'));
});
check('Connected Data & Sources shows provider states, baseline difference and record issues', async () => {
  const ui = await connectedBoot();
  ui.nav('sources');
  const html = ui.html();
  ['Airtable', 'Google Sheets', 'Google Calendar', 'Google Drive', 'Google Docs', 'Gmail'].forEach((n) => assert(html.includes(n), n));
  assert(html.includes('Not implemented') && html.includes('Connected'));
  assert(html.includes('Differs from baseline by -43'));
  assert(html.includes('Duplicate Employee ID') && html.includes('Resigned without separation date'));
  assert(html.includes('Status disagreements (Airtable authoritative)'));
  assert(html.includes('viewer@example.com'));
});
check('Rendered connected screens never describe real records as fictional or sample data', async () => {
  const ui = await connectedBoot();
  const clean = (html, where) => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/fictional records are never substituted/g, '');
    assert(!/fictional|sample data|demo values|Sample workspace|Sample · Not connected|\b51 \b/i.test(text), where + ' contains sample wording: ' +
      (text.match(/.{0,60}(fictional|sample data|demo values|Sample workspace|\b51 \b).{0,60}/i) || [''])[0]);
  };
  for (const tab of ['employees', 'files201', 'sources', 'audit']) { ui.nav(tab); clean(ui.html(), tab); }
  for (const filter of ['missing', 'not-checked', 'complete', 'source-unavailable', 'all']) { ui.nav('files201'); ui.click('files-filter', { kind: filter }); clean(ui.html(), 'files201/' + filter); }
  for (const tab of ['info', 'files201', 'kpi', 'journey', 'attendance', 'preview']) { ui.click('open', { id: '0101', detail: tab }); clean(ui.html(), 'modal/' + tab); ui.click('close'); }
});
check('Unavailable connected snapshot shows an error instead of fictional data', async () => {
  const ui = await connectedBoot({ available: false, snapshot: undefined });
  const html = ui.html();
  assert(html.includes('Connected snapshot unavailable') && html.includes('sample records are not substituted'));
  assert(!html.includes('Sample Person'));
});

/* ---------- Public repository safety ---------- */
check('Tracked public files contain no credentials, private source IDs or real contact data', () => {
  const files = execSync('git ls-files -co --exclude-standard', { cwd: root }).toString().split('\n').filter(Boolean)
    .filter((f) => !/\.(png|jpe?g|webp|ico)$/i.test(f));
  const patterns = [
    [/pat[A-Za-z0-9]{14}\.[a-f0-9]{64}/, 'Airtable personal access token'],
    [/GOCSPX-[A-Za-z0-9_-]{10,}/, 'Google OAuth client secret'],
    [/1\/\/0[A-Za-z0-9_-]{30,}/, 'Google refresh token'],
    [/ya29\.[A-Za-z0-9_-]{20,}/, 'Google access token'],
    [/-----BEGIN (RSA |EC )?PRIVATE KEY-----/, 'private key'],
    [/\bapp(?!SYNTHETIC)[A-Za-z0-9]{14}\b(?=["'`\s,)])/, 'Airtable base ID'],
    [/\b1[A-Za-z0-9_-]{32,}\b/, 'Google Drive file ID'],
    [/[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com/i, 'personal email address']
  ];
  const hits = [];
  files.forEach((f) => {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    patterns.forEach(([re, label]) => { if (re.test(text)) hits.push(f + ': ' + label); });
  });
  assert.deepEqual(hits, []);
});
check('GitHub Pages entry point remains the fictional sample with no connected payload', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert(index.includes('<script src="./data.js" defer></script>'));
  assert(!index.includes('payload.js') && !index.includes('MJ_CONNECTED_PAYLOAD'));
  const appSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon/.test(appSrc));
  assert(!/fetch\(|XMLHttpRequest/.test(fs.readFileSync(path.join(root, 'data-adapter.js'), 'utf8')));
});

(async function run() {
  for (const [name, fn] of queue) {
    try { await fn(); results.push(name); console.log('PASS ' + name); }
    catch (err) { console.error('FAIL ' + name); console.error(err); process.exit(1); }
  }
  console.log('\n' + results.length + ' connector, security and connected-UI tests passed. No real provider was contacted.');
})();
