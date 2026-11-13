/* Normalization: provider records -> the existing frontend snapshot contract,
 * plus source coverage, provenance and reconciliation. Pure (no I/O).
 *
 * Source facts and computed values are kept apart:
 *   - employee.provenance names the provider record each fact came from;
 *   - modules with no verified source are delivered as null/"not-sourced",
 *     never as false/0, so the UI cannot turn "unknown" into "incomplete".
 * Only the fields the monitoring UI needs are delivered (data minimization). */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const map = require('./mapping');
const rec = require('./reconcile');

/* Process definitions (Journey stages, Welcome Kit items, 201 requirement labels)
 * are reused from data.js. They describe the monitoring framework, not people.
 * The fictional employees in data.js are discarded and never mixed in. */
function loadDefinitions() {
  const win = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8'), { window: win });
  const seed = win.MJ_SEED;
  return { stages: seed.stages, kit: seed.kit, documents201: seed.documents201 };
}

/* Module coverage states shown on Data & Sources and used to guard screens. */
const COVERAGE_LABELS = {
  'connected': 'Connected',
  'partial': 'Partially sourced',
  'not-sourced': 'No verified source',
  'not-configured': 'Not configured',
  'error': 'Error'
};

function files201For(person) {
  const statuses = {}, evidence = {};
  map.FILES_201.forEach(function (doc) {
    if (!doc.fields.length) {
      statuses[doc.id] = 'source-unavailable';
      evidence[doc.id] = { state: 'source-unavailable', note: doc.note };
      return;
    }
    const present = doc.fields.map(function (f) { return person.attachments[f] === true; });
    const all = present.every(Boolean), any = present.some(Boolean);
    statuses[doc.id] = all ? 'complete' : 'missing';
    evidence[doc.id] = {
      state: all ? 'attachment-on-file' : any ? 'partial-attachments' : 'no-attachment',
      verified: false, // presence of a file is not HR approval
      note: doc.note + (all ? '' : any ? ' — only some required attachments are on file' : ' — no attachment in tracker')
    };
  });
  return { statuses, evidence };
}

/* Calendar rules (data minimization):
 *  - holidays calendar: every confirmed event is kept (public data);
 *  - primary calendar: only People & Culture-relevant events are kept;
 *  - restricted meetings (PIP, NTE, discipline, counseling, exits...) are WITHHELD:
 *    counted, never delivered;
 *  - one-on-one titles ("P&C x <name>") are generalized so no person is named. */
const PC_RELEVANT = /p&c|people\s*&\s*culture|\bhr\b|onboard|orientation|evaluat|regulari|probation|revalida|culture code|maddie hour/i;
const RESTRICTED = /\bpip\b|\bnte\b|notice to explain|disciplin|counsel|warning|incident|terminat|resign|exit interview|investigat|\blip\b/i;
const ONE_ON_ONE = /^\s*p&c\s*x\s+/i;
function manilaDateTime(start) {
  if (!start) return null;
  if (start.date) return { date: start.date, time: '' };
  if (!start.dateTime) return null;
  const d = new Date(start.dateTime);
  if (isNaN(d.getTime())) return null;
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return { date: date, time: time };
}
function normalizeCalendarEvents(events, source) {
  const counts = { retrieved: 0, cancelled: 0, outOfScope: 0, withheld: 0, included: 0 };
  const out = [];
  (events || []).forEach(function (e) {
    counts.retrieved += 1;
    if (e.status === 'cancelled') { counts.cancelled += 1; return; }
    const when = manilaDateTime(e.start);
    if (!when) { counts.outOfScope += 1; return; }
    const title = String(e.summary || '').trim();
    if (source === 'holidays') {
      out.push({ id: String(e.id || ''), date: when.date, time: '', title: title || 'Holiday', category: 'holiday',
        detail: e.description && /observance/i.test(e.description) ? 'Observance' : 'Public holiday',
        source: 'Google Calendar · Holidays in Philippines', titleWithheld: false });
      counts.included += 1; return;
    }
    if (RESTRICTED.test(title)) { counts.withheld += 1; return; }   // checked first: never delivered
    if (!PC_RELEVANT.test(title)) { counts.outOfScope += 1; return; }
    const generalized = ONE_ON_ONE.test(title);
    out.push({ id: String(e.id || ''), date: when.date, time: when.time,
      title: generalized ? 'P&C one-on-one (title withheld)' : title, category: 'pc-meeting', detail: 'Confirmed meeting',
      source: 'Google Calendar · primary', titleWithheld: generalized });
    counts.included += 1;
  });
  out.sort(function (a, b) { return a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title); });
  return { events: out, counts: counts };
}

function buildSnapshot(input, now) {
  const retrievedAt = new Date(now).toISOString();
  const defs = input.definitions || loadDefinitions();
  const sources = input.sources; // provider status objects (see snapshot-service)
  const people = input.people || [];
  const roster = rec.reconcileRoster(people);

  const deptById = new Map((input.departments || []).map(function (d) { return [d.recordId, d]; }));
  const divisions = new Map();
  const divisionFor = function (person) {
    const link = Array.isArray(person.values.department) ? person.values.department[0] : null;
    const linkId = typeof link === 'string' ? link : link && link.id;
    const dept = linkId ? deptById.get(linkId) : null;
    const known = dept && map.DEPARTMENT_DIVISIONS[String(dept.name).trim().toUpperCase()];
    let d;
    if (known) d = known;
    else if (dept) d = { id: 'dept-' + dept.recordId.toLowerCase(), short: dept.name, name: dept.name + ' (unmapped department)' };
    else d = map.UNASSIGNED_DIVISION;
    if (!divisions.has(d.id)) divisions.set(d.id, { id: d.id, name: d.name, short: d.short, evaluators: [],
      sourceDepartment: dept ? dept.name : null, sourceRecordId: dept ? dept.recordId : null });
    return d.id;
  };

  const attendanceByRecord = new Map();
  (input.attendance || []).forEach(function (a) {
    if (a.employeeRecordIds.length !== 1) return;
    const list = attendanceByRecord.get(a.employeeRecordIds[0]) || [];
    list.push({
      id: a.recordId, date: a.date, type: map.ATTENDANCE_TYPES[a.type] || 'Other', sourceType: a.type || 'Unspecified',
      reason: '', approval: 'Not recorded in source', verified: false,
      remarks: 'Airtable Tardiness/Leave Tracker entry · approval and verification are not captured in this source'
    });
    attendanceByRecord.set(a.employeeRecordIds[0], list);
  });

  const notSourced = { status: 'Not sourced', comment: '', at: '' };
  const employees = roster.rows.filter(function (r) { return r.cohort !== 'inactive'; }).map(function (r) {
    const v = r.person.values;
    const files = files201For(r.person);
    const textHire = rec.parseLongDate(v.hiringDateText);
    const conflicts = roster.issues.filter(function (i) { return i.recordId === r.person.recordId; })
      .map(function (i) { return { kind: i.kind, severity: i.severity, detail: i.detail }; });
    return {
      id: r.key,
      name: [v.firstName, v.lastName].filter(Boolean).join(' ').trim() || 'Name not recorded (' + r.key + ')',
      division: divisionFor(r.person),
      jobTitle: rec.selectName(v.position) || 'Position not recorded',
      email: '', // company email is used server-side for Calendar matching only
      startDate: v.hireDate || textHire || '',
      birthday: '', // not delivered in this release; milestone screens are guarded
      employmentStatus: r.status || 'Not recorded',
      cohort: r.cohort,
      regularizationDate: v.regularizationDate || '',
      separationDate: v.separationDate || '',
      journey: defs.stages.map(function (s) { return s.items.map(function () { return null; }); }),
      journeyNotes: {},
      kit: defs.kit.map(function () { return null; }),
      kitNotes: {},
      attendance: attendanceByRecord.get(r.person.recordId) || [],
      scores: { division: null, individual: null, values: null, behavior: null },
      kpiItems: [], kpiSource: 'No approved KPI scorecard source is connected', kpiValidated: false,
      promotions: [], attendanceAwards: [], disciplinaryActions: [],
      review: { division: notSourced, corp: notSourced, cso: notSourced, coo: notSourced },
      comments: {},
      files201: files.statuses,
      files201Evidence: files.evidence,
      orgLevel: null, reportsTo: null,
      provenance: {
        provider: 'airtable', dataset: 'P&C Operations · People', recordId: r.person.recordId,
        employeeIdRaw: r.id.raw, employeeIdState: r.id.state,
        sourceCreated: v.created || r.person.createdTime || null,
        sourceModified: null, // the People table has no last-modified field; not invented
        retrievedAt: retrievedAt,
        verification: 'retrieved-not-hr-verified',
        conflicts: conflicts
      }
    };
  });

  const masterlist = input.masterlist ? rec.reconcileMasterlist(roster.rows, input.masterlist.rows) : null;
  const attendanceLinks = input.attendance ? rec.reconcileLinks(roster.rows, input.attendance) : null;
  const developmentLinks = input.development ? rec.reconcileLinks(roster.rows, input.development) : null;

  const ok = function (id) { return sources.some(function (s) { return s.id === id && s.state === 'connected'; }); };
  const primaryCal = input.calendarEvents ? normalizeCalendarEvents(input.calendarEvents, 'primary') : null;
  const holidayCal = input.holidayEvents ? normalizeCalendarEvents(input.holidayEvents, 'holidays') : null;
  const calendarEvents = (primaryCal ? primaryCal.events : []).concat(holidayCal ? holidayCal.events : [])
    .sort(function (a, b) { return a.date.localeCompare(b.date) || a.time.localeCompare(b.time); });
  const coverage = {
    roster: ok('airtable') && input.people ? 'connected' : 'error',
    divisions: ok('airtable') && input.departments ? 'connected' : 'error',
    files201: input.people ? 'partial' : 'error',          // tracker attachments only; Drive evidence not linked
    attendance: input.attendance ? 'partial' : 'error',    // entries retrieved; approval/verification not in source
    journey: 'not-sourced', kit: 'not-sourced', kpi: 'not-sourced', reviews: 'not-sourced',
    milestones: 'not-sourced', calendar: ok('calendar') ? 'partial' : 'not-configured', followups: 'not-sourced',
    // Calendar screen: confirmed events plus milestones computed from roster dates.
    'calendar-events': (primaryCal || holidayCal) && ok('calendar') ? 'partial' : 'not-sourced'
  };

  const statusIssues = roster.issues.filter(function (i) { return i.kind !== 'employee-id-format'; });
  return {
    snapshot: {
      version: 'connected-1', mode: 'connected',
      divisions: Array.from(divisions.values()).sort(function (a, b) { return a.name.localeCompare(b.name); }),
      viewers: [], stages: defs.stages, kit: defs.kit, documents201: defs.documents201,
      employees: employees,
      calendarEvents: calendarEvents,
      coverage: coverage, coverageLabels: COVERAGE_LABELS
    },
    sources: sources,
    reconciliation: {
      generatedAt: retrievedAt,
      roster: roster.summary,
      issues: roster.issues,
      openIssueCount: statusIssues.length,
      masterlist: masterlist,
      attendanceLinks: attendanceLinks,
      developmentLinks: developmentLinks,
      calendar: (primaryCal || holidayCal) ? { primary: primaryCal && primaryCal.counts, holidays: holidayCal && holidayCal.counts } : null,
      notes: [
        'Active cohort = Regular, Probationary, Part-Time, Contract or On Leave in the Airtable roster.',
        'Inactive records (Resigned, Terminated, AWOL) are counted here and excluded from monitoring denominators; they are not deleted.',
        'The ' + map.BASELINE_HEADCOUNT + '-person baseline is a reference only. No records are added or removed to match it.'
      ]
    },
    provenance: {
      mode: 'connected', readOnly: true, live: true, asOf: retrievedAt,
      recordCount: employees.length, divisionCount: divisions.size,
      note: 'Connected snapshot retrieved read-only from authorized sources. Retrieval success does not mean HR has verified each record.'
    }
  };
}

module.exports = { buildSnapshot, loadDefinitions, files201For, normalizeCalendarEvents, COVERAGE_LABELS };
