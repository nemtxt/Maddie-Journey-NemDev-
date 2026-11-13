/* ANONYMIZED, SYNTHETIC connector fixtures. No real person, ID or record.
 * Shapes mirror the provider REST responses (Airtable v0 with
 * returnFieldsByFieldId=true; Sheets values API) observed during Phase 11
 * discovery, and include every reconciliation edge case found in the real
 * roster: unpadded IDs, missing IDs, duplicate IDs, inactive statuses,
 * missing/contradictory dates, missing departments and partial attachments. */
'use strict';

const { AIRTABLE, FILES_201 } = require('../../server/mapping');

const F = AIRTABLE.people.fields;
const DEPT = {
  rmd: 'recD00000000000RM', design: 'recD00000000000DS', media: 'recD00000000000ME',
  corp: 'recD00000000000CO', bd: 'recD00000000000BD', ceo: 'recD00000000000CE'
};
const rid = function (n) { return 'recP' + String(n).padStart(13, '0'); };
const attachment = function (name) { return [{ id: 'att' + name, url: 'https://example.invalid/' + name + '.pdf', filename: name + '-synthetic.pdf' }]; };
const allDocs = function () {
  const out = {};
  FILES_201.forEach(function (d) { d.fields.forEach(function (f) { out[f] = attachment(f); }); });
  return out;
};

function person(n, values, extra) {
  const fields = {};
  fields[F.firstName] = 'Sample';
  fields[F.lastName] = 'Person ' + String(n).padStart(2, '0');
  fields[F.created] = '2026-05-05T06:39:28.000Z';
  Object.keys(values).forEach(function (k) { fields[F[k]] = values[k]; });
  return { id: rid(n), createdTime: '2026-05-05T06:39:28.000Z', fields: Object.assign(fields, extra || {}) };
}

const SALARY_FIELD = 'fldMzQ3oSPnanmWiA';   // "Basic Pay" — must never survive normalization

const people = [
  person(1, { employeeId: '0101', status: 'Regular', department: [DEPT.rmd], position: 'Analyst', hireDate: '2024-01-15', hiringDateText: 'January 15, 2024', regularizationDate: '2024-07-15' },
    Object.assign(allDocs(), { [SALARY_FIELD]: 99999 })),
  person(2, { employeeId: '102', status: 'Probationary', department: [DEPT.design], position: 'Designer', hiringDateText: 'March 3, 2026' },
    { fldOyHxm0gi4fk5XJ: attachment('sss-only') }),
  person(3, { status: 'Probationary', department: [DEPT.media], position: 'Editor', hireDate: '2026-10-05' }),
  person(4, { employeeId: '0104', status: 'Regular', department: [DEPT.corp], hireDate: '2020-02-01' }),
  person(5, { employeeId: '104', status: 'Regular', department: [DEPT.bd], hireDate: '2022-04-18' }),
  person(6, { employeeId: '0106', status: 'Resigned', department: [DEPT.rmd], hireDate: '2025-01-23' }),
  person(7, { employeeId: '0107', status: 'Regular', department: [DEPT.corp], hireDate: '2019-08-19', separationDate: '2026-06-12' }),
  person(8, { employeeId: '0108', status: 'Resigned', department: [DEPT.bd], hireDate: '2026-04-15', regularizationDate: '2026-10-15', separationDate: '2026-10-02' }),
  person(9, { employeeId: '0109', status: 'AWOL', department: [DEPT.corp] }),
  person(10, { employeeId: '0110', status: 'Part-Time', hireDate: '2026-08-10' }),
  person(11, { employeeId: '0111', department: [DEPT.ceo], hireDate: '2021-01-25' }),
  // Same display name as record 1 on purpose: records must stay separate (no name joins).
  person(12, { employeeId: '0112', status: 'Regular', department: [DEPT.ceo], hireDate: '2025-02-01', hiringDateText: 'February 3, 2025' },
    { [F.lastName]: 'Person 01' })
];

const departments = [
  { id: DEPT.rmd, createdTime: '2026-05-05T06:35:13.000Z', fields: { fldkrnTAtVUs49xHN: 'RMD', fldHgY85j6l5j6p5D: 2 } },
  { id: DEPT.design, createdTime: '2026-05-05T06:35:13.000Z', fields: { fldkrnTAtVUs49xHN: 'DESIGN/OPERATION', fldHgY85j6l5j6p5D: 1 } },
  { id: DEPT.media, createdTime: '2026-05-05T06:35:13.000Z', fields: { fldkrnTAtVUs49xHN: 'MEDIA', fldHgY85j6l5j6p5D: 1 } },
  { id: DEPT.corp, createdTime: '2026-05-05T06:35:13.000Z', fields: { fldkrnTAtVUs49xHN: 'CORP OPS', fldHgY85j6l5j6p5D: 3 } },
  { id: DEPT.bd, createdTime: '2026-05-05T06:35:13.000Z', fields: { fldkrnTAtVUs49xHN: 'BUSINESS DEV', fldHgY85j6l5j6p5D: 2 } },
  { id: DEPT.ceo, createdTime: '2026-05-05T06:35:13.000Z', fields: { fldkrnTAtVUs49xHN: 'CEO TEAM', fldHgY85j6l5j6p5D: 2 } }
];

const A = AIRTABLE.attendance.fields;
const att = function (n, link, type, date) {
  const fields = {}; fields[A.incidentId] = n; fields[A.date] = date; fields[A.type] = type;
  if (link) fields[A.employee] = link; fields[A.created] = date + 'T03:38:07.000Z';
  return { id: 'recT' + String(n).padStart(13, '0'), createdTime: date + 'T03:38:07.000Z', fields: fields };
};
const attendance = [
  att(1, [rid(1)], 'Late', '2026-11-10'),
  att(2, [rid(2)], 'Sick Leave', '2026-11-11'),
  att(3, [rid(6)], 'Late', '2026-09-01'),                // inactive employee
  att(4, ['recPZZZZZZZZZZZZZ'], 'Late', '2026-11-12'),     // orphan link
  att(5, null, 'Vacation Leave', '2026-11-12')            // no link
];

const D = AIRTABLE.development.fields;
const development = [
  { id: 'recV0000000000001', createdTime: '2026-10-16T03:37:54.000Z', fields: { [D.employee]: [rid(2)], [D.developmentType]: 'Probationary', [D.status]: 'Ongoing', [D.fifthMonthStatus]: 'Pending' } },
  { id: 'recV0000000000002', createdTime: '2026-10-16T03:37:54.000Z', fields: { [D.employee]: [rid(3)], [D.developmentType]: 'Probationary', [D.status]: 'For Evaluation' } }
];

const masterlistRows = [
  ['EE Number', 'Status'], ['0101', 'Regular'], ['102', 'Probationary'], ['0106', 'Regular'],
  ['0199', 'Regular'], [], ['Head counts', 'Total'], ['TOTAL', '9']
];

/* A fetch double that answers like the providers, records every request, and
 * can be told to fail specific tables. */
function fakeFetch(options) {
  const opts = Object.assign({ fail: {}, pageSize: 7 }, options || {});
  const calls = [];
  const tables = {};
  tables[AIRTABLE.people.table] = people;
  tables[AIRTABLE.departments.table] = departments;
  tables[AIRTABLE.attendance.table] = attendance;
  tables[AIRTABLE.development.table] = development;
  async function impl(url, init) {
    calls.push({ url: url, method: (init && init.method) || 'GET', headers: (init && init.headers) || {} });
    const u = new URL(url);
    const respond = function (status, body) {
      return { ok: status >= 200 && status < 300, status: status, headers: { get: function () { return null; } }, json: async function () { return body; } };
    };
    if (u.hostname === 'api.airtable.com') {
      const table = decodeURIComponent(u.pathname.split('/')[3]);
      if (opts.fail[table]) return respond(opts.fail[table], { error: 'synthetic failure' });
      const rows = tables[table] || [];
      const start = Number(u.searchParams.get('offset') || 0);
      const page = rows.slice(start, start + opts.pageSize);
      const body = { records: page };
      if (start + opts.pageSize < rows.length) body.offset = String(start + opts.pageSize);
      return respond(200, body);
    }
    if (u.hostname === 'oauth2.googleapis.com') return respond(200, { access_token: 'synthetic-access-token', expires_in: 3600 });
    if (u.hostname === 'sheets.googleapis.com') return opts.fail.sheets ? respond(opts.fail.sheets, {}) : respond(200, { values: masterlistRows });
    if (u.hostname === 'www.googleapis.com' && u.pathname.indexOf('/drive/') === 0) return respond(200, { modifiedTime: '2026-05-05T08:22:42.438Z' });
    if (u.hostname === 'www.googleapis.com' && u.pathname.indexOf('/calendar/') === 0) {
      return respond(200, { items: [{ id: 'evt1', status: 'confirmed', summary: 'CSO x P&C Generalist', start: { dateTime: '2026-11-20T10:00:00+08:00' }, end: { dateTime: '2026-11-20T11:00:00+08:00' } },
        { id: 'evt3', status: 'confirmed', summary: 'P&C x Sample Person 02', start: { dateTime: '2026-11-21T01:30:00Z' }, end: { dateTime: '2026-11-21T02:00:00Z' } },
        { id: 'evt4', status: 'confirmed', summary: 'PIP midpoint review', start: { dateTime: '2026-11-22T10:00:00+08:00' }, end: { dateTime: '2026-11-22T11:00:00+08:00' } },
        { id: 'evt5', status: 'confirmed', summary: 'Client site visit', start: { dateTime: '2026-11-23T10:00:00+08:00' }, end: { dateTime: '2026-11-23T11:00:00+08:00' } },
        { id: 'evt2', status: 'cancelled', summary: 'Synthetic cancelled', start: { date: '2026-12-01' }, end: { date: '2026-12-02' } }] });
    }
    return respond(404, {});
  }
  impl.calls = calls;
  return impl;
}

const config = {
  airtableToken: 'synthetic-airtable-token-value', airtableBaseId: 'appSYNTHETIC00000',
  googleClientId: 'synthetic-client', googleClientSecret: 'synthetic-secret', googleRefreshToken: 'synthetic-refresh',
  sheetsMasterlistId: 'synthetic-sheet', calendarId: 'synthetic-calendar', staleAfterMs: 15 * 60 * 1000
};

module.exports = { people, departments, attendance, development, masterlistRows, fakeFetch, config, rid, SALARY_FIELD };
