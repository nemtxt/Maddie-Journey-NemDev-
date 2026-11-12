/* Cross-source reconciliation. Pure functions: no I/O, fully unit-tested.
 * Rules (see docs/PHASE11_SECURE_ARCHITECTURE.md §4):
 *  - Records are joined by normalized Employee ID or Airtable record ID, never by name.
 *  - Nothing is added or dropped to reach a target headcount.
 *  - Disagreements are listed as conflicts with the authoritative value named. */
'use strict';

const { ACTIVE_STATUSES, INACTIVE_STATUSES, BASELINE_HEADCOUNT } = require('./mapping');

/* "0269", "269" and " 269 " are the same identifier; "0269" is canonical (4-digit,
 * matching the majority of source values). Non-numeric values are invalid. */
function normalizeEmployeeId(raw) {
  if (raw === undefined || raw === null) return { canonical: null, state: 'missing', raw: '' };
  const text = String(raw).trim();
  if (!text) return { canonical: null, state: 'missing', raw: '' };
  if (!/^\d{1,6}$/.test(text)) return { canonical: null, state: 'invalid', raw: text };
  const canonical = String(Number(text)).padStart(4, '0');
  return { canonical, state: canonical === text ? 'ok' : 'format-normalized', raw: text };
}

const selectName = function (v) { return typeof v === 'string' ? v : (v && v.name) || ''; };

/* Parse "March 21, 2024" (free-text Hiring Date) to ISO for comparison only. */
function parseLongDate(text) {
  const m = /^([A-Za-z]+)\.?\s+(\d{1,2}),\s*(\d{4})$/.exec(String(text || '').trim());
  if (!m) return null;
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const i = months.indexOf(m[1].slice(0, 3).toLowerCase());
  if (i < 0) return null;
  return m[3] + '-' + String(i + 1).padStart(2, '0') + '-' + String(Number(m[2])).padStart(2, '0');
}

function reconcileRoster(people) {
  const issues = [];
  const byCanonical = new Map();
  const statusCounts = {};
  const rows = people.map(function (p) {
    const id = normalizeEmployeeId(p.values.employeeId);
    const status = selectName(p.values.status);
    statusCounts[status || '(blank)'] = (statusCounts[status || '(blank)'] || 0) + 1;
    if (id.canonical) {
      if (!byCanonical.has(id.canonical)) byCanonical.set(id.canonical, []);
      byCanonical.get(id.canonical).push(p.recordId);
    }
    return { person: p, id, status };
  });
  const duplicates = Array.from(byCanonical.entries()).filter(function (e) { return e[1].length > 1; });
  const duplicateSet = new Set(duplicates.reduce(function (a, e) { return a.concat(e[1]); }, []));

  rows.forEach(function (row) {
    const p = row.person, v = p.values;
    const ref = { recordId: p.recordId, employeeId: row.id.canonical };
    const active = ACTIVE_STATUSES.has(row.status);
    const inactive = INACTIVE_STATUSES.has(row.status);
    row.cohort = active ? 'active' : inactive ? 'inactive' : 'unknown-status';
    row.key = row.id.canonical && !duplicateSet.has(p.recordId) ? row.id.canonical : 'AT-' + p.recordId;
    if (row.id.state === 'missing') issues.push(Object.assign({ kind: 'missing-employee-id', severity: active ? 'high' : 'low',
      detail: 'No Employee ID in the roster; keyed by Airtable record ID until HR assigns one.' }, ref));
    if (row.id.state === 'invalid') issues.push(Object.assign({ kind: 'invalid-employee-id', severity: 'high',
      detail: 'Employee ID is not numeric and cannot be used as a join key.' }, ref));
    if (row.id.state === 'format-normalized') issues.push(Object.assign({ kind: 'employee-id-format', severity: 'low',
      detail: 'Employee ID stored without zero padding; normalized to the 4-digit form for joins.' }, ref));
    if (duplicateSet.has(p.recordId)) issues.push(Object.assign({ kind: 'duplicate-employee-id', severity: 'high',
      detail: 'Employee ID is shared by more than one roster record; neither record is merged or dropped.' }, ref));
    if (row.cohort === 'unknown-status') issues.push(Object.assign({ kind: 'unknown-status', severity: 'high',
      detail: 'Employment status is blank or unrecognized; record kept in a separate unknown-status group.' }, ref));
    if (!Array.isArray(v.department) || !v.department.length) issues.push(Object.assign({ kind: 'missing-department', severity: active ? 'medium' : 'low',
      detail: 'No department linked in the roster.' }, ref));
    const textHire = parseLongDate(v.hiringDateText);
    if (!v.hireDate && !textHire) issues.push(Object.assign({ kind: 'missing-hire-date', severity: active ? 'medium' : 'low',
      detail: 'Neither the Hire Date nor the Hiring Date text field is populated.' }, ref));
    if (v.hireDate && textHire && v.hireDate !== textHire) issues.push(Object.assign({ kind: 'hire-date-conflict', severity: 'medium',
      detail: 'Hire Date (' + v.hireDate + ') differs from Hiring Date text (' + textHire + '). Hire Date takes precedence.' }, ref));
    if (row.status === 'Resigned' && !v.separationDate) issues.push(Object.assign({ kind: 'missing-separation-date', severity: 'medium',
      detail: 'Status is Resigned but no Separation Date is recorded.' }, ref));
    if (active && v.separationDate) issues.push(Object.assign({ kind: 'status-date-conflict', severity: 'high',
      detail: 'Status is ' + row.status + ' but a Separation Date is recorded.' }, ref));
    if (v.separationDate && v.regularizationDate && v.regularizationDate > v.separationDate) issues.push(Object.assign({ kind: 'date-order-conflict', severity: 'medium',
      detail: 'Regularization Date is later than the Separation Date.' }, ref));
  });

  const active = rows.filter(function (r) { return r.cohort === 'active'; });
  return {
    rows,
    issues,
    summary: {
      totalRecords: rows.length,
      activeRecords: active.length,
      inactiveRecords: rows.filter(function (r) { return r.cohort === 'inactive'; }).length,
      unknownStatusRecords: rows.filter(function (r) { return r.cohort === 'unknown-status'; }).length,
      statusCounts,
      withEmployeeId: rows.filter(function (r) { return !!r.id.canonical; }).length,
      missingEmployeeId: rows.filter(function (r) { return r.id.state === 'missing'; }).length,
      activeMissingEmployeeId: active.filter(function (r) { return r.id.state === 'missing'; }).length,
      duplicateEmployeeIds: duplicates.length,
      formatNormalizedIds: rows.filter(function (r) { return r.id.state === 'format-normalized'; }).length,
      baseline: BASELINE_HEADCOUNT,
      baselineDifference: active.length - BASELINE_HEADCOUNT
    }
  };
}

/* Compare the Sheets masterlist (EE Number, Status) with the Airtable roster. */
function reconcileMasterlist(rosterRows, sheetRows) {
  const sheet = new Map();
  const invalid = [];
  (sheetRows || []).forEach(function (row, index) {
    if (!row || !row.length || index === 0) return; // header row
    const id = normalizeEmployeeId(row[0]);
    if (!id.canonical) { if (row[0]) invalid.push(index + 1); return; } // summary rows such as "Head counts" are not IDs
    if (!sheet.has(id.canonical)) sheet.set(id.canonical, []);
    sheet.get(id.canonical).push(String(row[1] || '').trim());
  });
  const roster = new Map();
  rosterRows.forEach(function (r) { if (r.id.canonical) roster.set(r.id.canonical, r); });
  const onlyInRoster = [], onlyInSheet = [], statusMismatch = [], duplicateInSheet = [];
  roster.forEach(function (r, id) { if (!sheet.has(id)) onlyInRoster.push({ employeeId: id, rosterStatus: r.status }); });
  sheet.forEach(function (statuses, id) {
    if (statuses.length > 1) duplicateInSheet.push({ employeeId: id, occurrences: statuses.length });
    const r = roster.get(id);
    if (!r) { onlyInSheet.push({ employeeId: id, sheetStatus: statuses[0] }); return; }
    if (statuses[0] && r.status && statuses[0] !== r.status) {
      statusMismatch.push({ employeeId: id, rosterStatus: r.status, sheetStatus: statuses[0], authoritative: 'airtable.people' });
    }
  });
  return {
    sheetIdCount: sheet.size, matchedIds: sheet.size - onlyInSheet.length,
    onlyInRoster, onlyInSheet, statusMismatch, duplicateInSheet, nonIdRows: invalid.length
  };
}

/* Attendance/development records join to the roster by Airtable record ID. */
function reconcileLinks(rosterRows, records) {
  const keyByRecord = new Map(rosterRows.map(function (r) { return [r.person.recordId, r]; }));
  let linkedActive = 0, linkedInactive = 0;
  const orphans = [], multiLinked = [];
  records.forEach(function (rec) {
    if (rec.employeeRecordIds.length !== 1) {
      (rec.employeeRecordIds.length ? multiLinked : orphans).push(rec.recordId);
      return;
    }
    const r = keyByRecord.get(rec.employeeRecordIds[0]);
    if (!r) orphans.push(rec.recordId);
    else if (r.cohort === 'active') linkedActive += 1;
    else linkedInactive += 1;
  });
  return { total: records.length, linkedActive, linkedInactive, orphans: orphans.length, multiLinked: multiLinked.length };
}

module.exports = { normalizeEmployeeId, parseLongDate, reconcileRoster, reconcileMasterlist, reconcileLinks, selectName };
