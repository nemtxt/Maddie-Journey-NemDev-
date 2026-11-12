/* Snapshot service: runs provider adapters, tolerates partial failure, keeps a
 * last-known snapshot IN MEMORY ONLY (never written to disk or public storage)
 * and labels it stale when a refresh fails or ages past the freshness window. */
'use strict';

const { buildSnapshot } = require('./normalize');
const { createClient } = require('./lib/readonly-http');
const { createAirtableAdapter } = require('./providers/airtable');
const { createGoogleTokenProvider, createSheetsAdapter, createCalendarAdapter } = require('./providers/google');

const CATALOG = [
  { id: 'airtable', name: 'Airtable', kind: 'Roster, departments, attendance tracker', scope: 'P&C Operations base · read-only' },
  { id: 'sheets', name: 'Google Sheets', kind: 'Employee Masterlist (reconciliation only)', scope: 'EE Number and Status columns · read-only' },
  { id: 'calendar', name: 'Google Calendar', kind: 'Confirmed events', scope: 'Configured calendar · read-only' },
  { id: 'drive', name: 'Google Drive', kind: 'Document evidence', scope: 'Not implemented' },
  { id: 'docs', name: 'Google Docs', kind: 'Evaluation and checklist documents', scope: 'Not implemented' },
  { id: 'gmail', name: 'Gmail', kind: 'Follow-up correspondence', scope: 'Not implemented' }
];
const NOT_IMPLEMENTED = {
  drive: 'No per-employee 201 folder convention exists to link Drive files to Employee IDs reliably. Not connected.',
  docs: 'The P&C Docs found are templates and policies, not per-employee records. Not connected.',
  gmail: 'Mailbox ingestion is not implemented: no tracker identifies which threads are authorized follow-up records.'
};
const STATE_LABELS = {
  'connected': 'Connected', 'partial': 'Partially connected', 'permission-limited': 'Permission limited',
  'error': 'Error', 'not-configured': 'Not configured', 'not-implemented': 'Not implemented'
};

function manilaDate(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

function createSnapshotService(config, deps) {
  const now = (deps && deps.now) || Date.now;
  const client = (deps && deps.client) || createClient({ fetch: deps && deps.fetch });
  const airtable = (deps && deps.airtable) || createAirtableAdapter(config, client, deps);
  const tokens = createGoogleTokenProvider(config, client, deps);
  const sheets = (deps && deps.sheets) || createSheetsAdapter(config, client, tokens);
  const calendar = (deps && deps.calendar) || createCalendarAdapter(config, client, tokens);
  const staleAfterMs = config.staleAfterMs || 15 * 60 * 1000;
  let lastGood = null;      // { payload, at }
  let lastAttempt = null;   // { at, error }
  let inflight = null;

  function status(id, patch) {
    const base = CATALOG.find(function (c) { return c.id === id; });
    const s = Object.assign({}, base, { state: 'not-configured', lastSuccessfulRetrieval: null, sourceModified: null,
      recordCount: null, validRecords: null, invalidRecords: null, conflicts: null, partial: false, lastError: null, datasets: [] }, patch);
    s.label = STATE_LABELS[s.state] || s.state;
    return s;
  }
  function errorState(err) { return err && err.code === 'permission' ? 'permission-limited' : err && err.code === 'config' ? 'not-configured' : 'error'; }
  function safe(err) { return err && err.safeMessage ? err.safeMessage : 'The provider request failed.'; }

  async function attempt(fn) { try { return { ok: true, value: await fn() }; } catch (err) { return { ok: false, error: err }; } }

  async function collect() {
    const t = now(), at = new Date(t).toISOString();
    const statuses = [];
    const input = {};

    // Airtable — roster is mandatory; the other tables degrade to partial.
    if (!airtable.configured()) {
      statuses.push(status('airtable', { state: 'not-configured', lastError: 'Airtable token or base ID is not set on the private server.' }));
    } else {
      const people = await attempt(airtable.fetchPeople);
      const departments = await attempt(airtable.fetchDepartments);
      const attendance = await attempt(airtable.fetchAttendance);
      const development = await attempt(airtable.fetchDevelopment);
      const parts = [['People', people], ['Departments', departments], ['Tardiness/Leave Tracker', attendance], ['Employee Development Monitoring', development]];
      const failed = parts.filter(function (p) { return !p[1].ok; });
      if (people.ok) input.people = people.value;
      if (departments.ok) input.departments = departments.value;
      if (attendance.ok) input.attendance = attendance.value;
      if (development.ok) input.development = development.value;
      statuses.push(status('airtable', {
        state: !people.ok ? errorState(people.error) : failed.length ? 'partial' : 'connected',
        partial: people.ok && failed.length > 0,
        lastSuccessfulRetrieval: people.ok ? at : null,
        recordCount: people.ok ? people.value.length : null,
        datasets: parts.map(function (p) { return { name: p[0], ok: p[1].ok, records: p[1].ok ? p[1].value.length : null, error: p[1].ok ? null : safe(p[1].error) }; }),
        lastError: failed.length ? failed.map(function (p) { return p[0] + ': ' + safe(p[1].error); }).join(' ') : null
      }));
    }

    // Google Sheets masterlist — reconciliation only.
    if (!sheets.configured()) statuses.push(status('sheets', { lastError: 'Google read-only OAuth credentials or masterlist ID are not set.' }));
    else {
      const r = await attempt(sheets.fetchMasterlist);
      if (r.ok) input.masterlist = r.value;
      statuses.push(status('sheets', r.ok
        ? { state: 'connected', lastSuccessfulRetrieval: at, sourceModified: r.value.modifiedTime, recordCount: r.value.rows.length }
        : { state: errorState(r.error), lastError: safe(r.error) }));
    }

    // Google Calendar — three-month Manila window starting this month.
    if (!calendar.configured()) statuses.push(status('calendar', { lastError: 'Google read-only OAuth credentials or calendar ID are not set.' }));
    else {
      const start = manilaDate(t).slice(0, 8) + '01';
      const s = new Date(start + 'T00:00:00+08:00');
      const e = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 3, 1) - 8 * 3600 * 1000);
      const r = await attempt(function () { return calendar.fetchEvents(s.toISOString(), e.toISOString()); });
      if (r.ok) input.calendarEvents = r.value;
      statuses.push(status('calendar', r.ok
        ? { state: 'connected', lastSuccessfulRetrieval: at, recordCount: r.value.filter(function (x) { return x.status !== 'cancelled'; }).length }
        : { state: errorState(r.error), lastError: safe(r.error) }));
    }

    ['drive', 'docs', 'gmail'].forEach(function (id) { statuses.push(status(id, { state: 'not-implemented', lastError: NOT_IMPLEMENTED[id] })); });

    if (!input.people) {
      const err = new Error('Roster unavailable');
      err.statuses = statuses;
      throw err;
    }
    const payload = buildSnapshot(Object.assign({ sources: statuses }, input), t);
    // Attach validation counts to the Airtable status from the reconciliation.
    const air = statuses.find(function (s) { return s.id === 'airtable'; });
    const sum = payload.reconciliation.roster;
    air.validRecords = sum.withEmployeeId - sum.duplicateEmployeeIds;
    air.invalidRecords = sum.missingEmployeeId + sum.unknownStatusRecords;
    air.conflicts = payload.reconciliation.openIssueCount;
    const sh = statuses.find(function (s) { return s.id === 'sheets'; });
    if (sh && payload.reconciliation.masterlist) {
      const m = payload.reconciliation.masterlist;
      sh.validRecords = m.matchedIds;
      sh.invalidRecords = m.onlyInSheet.length;
      sh.conflicts = m.statusMismatch.length;
    }
    return payload;
  }

  async function refresh() {
    if (inflight) return inflight;
    inflight = (async function () {
      try {
        const payload = await collect();
        lastGood = { payload: payload, at: now() };
        lastAttempt = { at: now(), error: null };
        return current();
      } catch (err) {
        lastAttempt = { at: now(), error: err, statuses: err.statuses || null };
        return current();
      } finally { inflight = null; }
    })();
    return inflight;
  }

  function current() {
    if (!lastGood) {
      return { available: false, sources: lastAttempt && lastAttempt.statuses ? lastAttempt.statuses : CATALOG.map(function (c) { return status(c.id, {}); }),
        reason: 'No roster snapshot has been retrieved successfully yet.' };
    }
    const age = now() - lastGood.at;
    const failedSince = lastAttempt && lastAttempt.error && lastAttempt.at > lastGood.at;
    const payload = JSON.parse(JSON.stringify(lastGood.payload));
    payload.freshness = {
      retrievedAt: new Date(lastGood.at).toISOString(), ageSeconds: Math.round(age / 1000),
      stale: age > staleAfterMs || !!failedSince, refreshFailed: !!failedSince,
      lastAttemptAt: lastAttempt ? new Date(lastAttempt.at).toISOString() : null,
      note: failedSince ? 'Latest refresh failed. Showing the last-known snapshot held in server memory.' :
        age > staleAfterMs ? 'Snapshot is older than the freshness window.' : 'Snapshot is within the freshness window.'
    };
    if (failedSince && lastAttempt.statuses) payload.sources = lastAttempt.statuses;
    return Object.assign({ available: true }, payload);
  }

  async function get() {
    if (!lastGood || now() - lastGood.at > staleAfterMs) await refresh();
    return current();
  }
  return { get, refresh, current, client };
}

module.exports = { createSnapshotService, CATALOG, STATE_LABELS };
