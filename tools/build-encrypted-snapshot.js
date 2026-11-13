#!/usr/bin/env node
/* Build the ENCRYPTED monitoring snapshot published on GitHub Pages.
 *
 *   MJ_SNAPSHOT_PASSPHRASE='…' node tools/build-encrypted-snapshot.js <raw-dir> [output]
 *
 * <raw-dir> holds read-only exports retrieved through Claude connectors. It must live
 * OUTSIDE the repository (it contains plaintext personal data) and is never committed:
 *   people.json            Airtable People records ({records:[{id,createdTime,cellValuesByFieldId}]})
 *   attendance.json        Airtable Tardiness/Leave Tracker records (same shape)
 *   departments.json       [[recordId, name, memberCount], ...]
 *   development.json       [[recordId, employeeRecordId, type, status, fifthMonth, regularization, created], ...]
 *   masterlist.json        {modifiedTime, rows:[["EE Number","Status"], ...]}   (Sheets columns E–F only)
 *   calendar-primary.json  {events:[Google Calendar events]}
 *   holidays.json          [[date, title, "Public holiday"|"Observance"], ...]
 *   meta.json              {retrieved:{airtable, sheets, calendar}, notes:{...}}
 *
 * The plaintext payload is built in memory with the same normalization and
 * reconciliation code as the private server, then encrypted (AES-256-GCM,
 * PBKDF2-SHA256 600k). Only the ciphertext file is written. Output: a summary of
 * aggregate counts (no names). */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { buildSnapshot } = require('../server/normalize');
const { AIRTABLE, FILES_201 } = require('../server/mapping');
const { encrypt } = require('./snapshot-crypto');

const STATE_LABELS = { connected: 'Connected', reviewed: 'Reviewed · no per-employee records' };

function readJson(dir, name) { return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); }

function toPeople(raw) {
  const f = AIRTABLE.people.fields;
  const attachmentFields = Array.from(new Set(FILES_201.reduce(function (a, d) { return a.concat(d.fields); }, [])));
  return raw.records.map(function (r) {
    const cells = r.cellValuesByFieldId || r.fields || {};
    const values = {};
    Object.keys(f).forEach(function (k) { if (cells[f[k]] !== undefined && f[k] !== f.companyEmail && f[k] !== f.birthday) values[k] = cells[f[k]]; });
    const attachments = {};
    attachmentFields.forEach(function (id) { attachments[id] = Array.isArray(cells[id]) && cells[id].length > 0; });
    return { recordId: r.id, createdTime: r.createdTime, values: values, attachments: attachments };
  });
}
function linkIds(v) { return (Array.isArray(v) ? v : []).map(function (l) { return typeof l === 'string' ? l : l && l.id; }).filter(Boolean); }
function selectName(v) { return typeof v === 'string' ? v : (v && v.name) || ''; }
function toAttendance(raw) {
  const f = AIRTABLE.attendance.fields;
  return raw.records.map(function (r) {
    const c = r.cellValuesByFieldId || r.fields || {};
    return { recordId: r.id, incidentId: c[f.incidentId], date: c[f.date] || '', type: selectName(c[f.type]),
      employeeRecordIds: linkIds(c[f.employee]), created: c[f.created] || r.createdTime };
  });
}

function build(dir, now) {
  const meta = readJson(dir, 'meta.json');
  const people = toPeople(readJson(dir, 'people.json'));
  const attendance = toAttendance(readJson(dir, 'attendance.json'));
  const departments = readJson(dir, 'departments.json').map(function (d) { return { recordId: d[0], name: d[1], memberCount: d[2] }; });
  const development = readJson(dir, 'development.json').map(function (d) {
    return { recordId: d[0], employeeRecordIds: [d[1]], developmentType: d[2], status: d[3], fifthMonthStatus: d[4], regularizationStatus: d[5], created: d[6] };
  });
  const masterlist = readJson(dir, 'masterlist.json');
  const primary = readJson(dir, 'calendar-primary.json').events || [];
  const holidays = readJson(dir, 'holidays.json').map(function (h, i) {
    return { id: 'holiday-' + h[0] + '-' + i, status: 'confirmed', summary: h[1], description: h[2], start: { date: h[0] } };
  });
  const status = function (id, name, kind, scope, extra) {
    const s = Object.assign({ id, name, kind, scope, state: 'connected', lastSuccessfulRetrieval: null, sourceModified: null,
      recordCount: null, validRecords: null, invalidRecords: null, conflicts: null, partial: false, lastError: null, note: null, datasets: [] }, extra);
    s.label = STATE_LABELS[s.state] || s.state;
    return s;
  };
  const sources = [
    status('airtable', 'Airtable', 'Roster, departments, attendance and development trackers', 'P&C Operations base · read-only via Claude connector', {
      lastSuccessfulRetrieval: meta.retrieved.airtable, recordCount: people.length,
      datasets: [{ name: 'People', ok: true, records: people.length }, { name: 'Departments', ok: true, records: departments.length },
        { name: 'Tardiness/Leave Tracker', ok: true, records: attendance.length }, { name: 'Employee Development Monitoring', ok: true, records: development.length }],
      note: 'Read-only snapshot. Sensitive columns (compensation, government IDs, bank, contact, disciplinary, credentials) were not retrieved.' }),
    status('sheets', 'Google Sheets', 'Employee Masterlist 2026 (reconciliation only)', 'EE Number and Status columns · read-only via Claude connector', {
      lastSuccessfulRetrieval: meta.retrieved.sheets, sourceModified: masterlist.modifiedTime, recordCount: masterlist.rows.length,
      note: meta.notes && meta.notes.sheets || null }),
    status('calendar', 'Google Calendar', 'Confirmed P&C meetings and Philippine holidays', 'Primary and holidays calendars · read-only via Claude connector', {
      lastSuccessfulRetrieval: meta.retrieved.calendar,
      datasets: [{ name: 'Primary calendar events (window)', ok: true, records: primary.length }, { name: 'Holidays in Philippines', ok: true, records: holidays.length }],
      note: 'Window ' + (meta.calendarWindow || 'Nov 2026 – Jan 2027') + '. Only P&C-relevant events kept; restricted meetings withheld; one-on-one titles generalized.' }),
    status('drive', 'Google Drive', 'Document evidence', 'Reviewed via Claude connector', { state: 'reviewed',
      note: 'No per-employee 201 folders found. Lark attendance exports end Dec 2025 (superseded by the Airtable tracker). Nothing linked.' }),
    status('docs', 'Google Docs', 'Checklists, evaluations and forms', 'Reviewed via Claude connector', { state: 'reviewed',
      note: 'Only templates and policies found (e.g. the Employee Checklist that defines the 201 requirements). No per-employee records.' }),
    status('gmail', 'Gmail', 'Follow-up correspondence', 'Reviewed via Claude connector (thread IDs only)', { state: 'reviewed',
      note: 'No tracker identifies authorized follow-up threads; mailbox content was not read or ingested.' })
  ];
  const retrievedAt = meta.retrieved.airtable;
  const out = buildSnapshot({ sources, people, departments, attendance, development, masterlist,
    calendarEvents: primary, holidayEvents: holidays }, Date.parse(retrievedAt));
  const sum = out.reconciliation.roster;
  Object.assign(sources[0], { validRecords: sum.withEmployeeId - sum.duplicateEmployeeIds, invalidRecords: sum.missingEmployeeId + sum.unknownStatusRecords, conflicts: out.reconciliation.openIssueCount });
  if (out.reconciliation.masterlist) {
    const m = out.reconciliation.masterlist;
    Object.assign(sources[1], { validRecords: m.matchedIds, invalidRecords: m.onlyInSheet.length, conflicts: m.statusMismatch.length });
  }
  const cal = out.reconciliation.calendar;
  sources[2].recordCount = (cal.primary ? cal.primary.included : 0) + (cal.holidays ? cal.holidays.included : 0);
  out.provenance.note = 'Encrypted read-only snapshot retrieved through Claude connectors. It does not update live; retrieval does not mean HR has verified each record.';
  out.provenance.asOf = retrievedAt;
  return Object.assign({ available: true, deployment: 'encrypted-static', builtAt: new Date(now).toISOString(),
    freshness: { retrievedAt: retrievedAt, staleAfterDays: 7 }, viewer: null }, out);
}

function main() {
  const dir = process.argv[2];
  const output = process.argv[3] || path.join(__dirname, '..', 'data', 'monitoring.enc.json');
  if (!dir) { process.stderr.write('Usage: MJ_SNAPSHOT_PASSPHRASE=… node tools/build-encrypted-snapshot.js <raw-dir> [output]\n'); process.exit(1); }
  const repo = path.resolve(__dirname, '..');
  if (path.resolve(dir).indexOf(repo + path.sep) === 0) { process.stderr.write('Refusing: the raw export folder must be outside the repository.\n'); process.exit(1); }
  const payload = build(dir, Date.now());
  fs.writeFileSync(output, JSON.stringify(encrypt(payload, process.env.MJ_SNAPSHOT_PASSPHRASE)) + '\n');
  const r = payload.reconciliation;
  process.stdout.write(JSON.stringify({ written: path.relative(repo, output), roster: r.roster,
    issueKinds: r.issues.reduce(function (a, i) { a[i.kind] = (a[i.kind] || 0) + 1; return a; }, {}),
    masterlist: r.masterlist && { matched: r.masterlist.matchedIds, onlyInRoster: r.masterlist.onlyInRoster.length, onlyInSheet: r.masterlist.onlyInSheet.length, statusMismatch: r.masterlist.statusMismatch.length },
    attendanceLinks: r.attendanceLinks, developmentLinks: r.developmentLinks, calendar: r.calendar,
    employeesDelivered: payload.snapshot.employees.length, divisions: payload.snapshot.divisions.length,
    calendarEventsDelivered: payload.snapshot.calendarEvents.length, coverage: payload.snapshot.coverage }, null, 2) + '\n');
}

if (require.main === module) main();
module.exports = { build };
