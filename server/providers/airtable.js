/* Airtable read-only adapter (REST API v0, GET only).
 * Requests only mapped field IDs; attachment columns are reduced to a boolean
 * immediately so filenames and signed URLs never leave this module. */
'use strict';

const { AIRTABLE, FILES_201 } = require('../mapping');
const { ProviderError } = require('../lib/readonly-http');

const API = 'https://api.airtable.com/v0/';
const MIN_INTERVAL_MS = 220; // Airtable allows 5 requests/second per base.

function createAirtableAdapter(config, client, deps) {
  const sleep = (deps && deps.sleep) || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  let last = 0;
  const now = (deps && deps.now) || Date.now;

  function configured() { return !!(config.airtableToken && config.airtableBaseId); }

  async function listAll(tableId, fieldIds) {
    if (!configured()) throw new ProviderError('config', 'Airtable token or base is not configured on the private server.');
    const records = [];
    let offset = '';
    let pages = 0;
    do {
      const wait = last + MIN_INTERVAL_MS - now();
      if (wait > 0) await sleep(wait);
      last = now();
      const params = new URLSearchParams();
      params.set('pageSize', '100');
      params.set('returnFieldsByFieldId', 'true');
      fieldIds.forEach(function (f) { params.append('fields[]', f); });
      if (offset) params.set('offset', offset);
      const url = API + encodeURIComponent(config.airtableBaseId) + '/' + encodeURIComponent(tableId) + '?' + params.toString();
      const body = await client.getJson(url, { Authorization: 'Bearer ' + config.airtableToken });
      (body.records || []).forEach(function (r) { records.push(r); });
      offset = body.offset || '';
      pages += 1;
      if (pages > 200) throw new ProviderError('http', 'Airtable pagination exceeded the safety limit.');
    } while (offset);
    return records;
  }

  async function fetchPeople() {
    const f = AIRTABLE.people.fields;
    const attachmentFields = Array.from(new Set(FILES_201.reduce(function (all, d) { return all.concat(d.fields); }, [])));
    const scalar = Object.keys(f).map(function (k) { return f[k]; });
    const raw = await listAll(AIRTABLE.people.table, scalar.concat(attachmentFields));
    return raw.map(function (r) {
      const fields = r.fields || {};
      const out = { recordId: r.id, createdTime: r.createdTime, values: {}, attachments: {} };
      Object.keys(f).forEach(function (k) { if (fields[f[k]] !== undefined) out.values[k] = fields[f[k]]; });
      attachmentFields.forEach(function (id) {
        out.attachments[id] = Array.isArray(fields[id]) && fields[id].length > 0; // presence only
      });
      return out;
    });
  }
  async function fetchDepartments() {
    const f = AIRTABLE.departments.fields;
    const raw = await listAll(AIRTABLE.departments.table, [f.name, f.memberCount]);
    return raw.map(function (r) { return { recordId: r.id, name: (r.fields || {})[f.name] || '', memberCount: (r.fields || {})[f.memberCount] }; });
  }
  async function fetchAttendance() {
    const f = AIRTABLE.attendance.fields;
    const raw = await listAll(AIRTABLE.attendance.table, [f.incidentId, f.employee, f.date, f.type, f.created]);
    return raw.map(function (r) {
      const v = r.fields || {};
      const links = Array.isArray(v[f.employee]) ? v[f.employee] : [];
      return {
        recordId: r.id, incidentId: v[f.incidentId], date: v[f.date] || '',
        type: typeof v[f.type] === 'string' ? v[f.type] : (v[f.type] && v[f.type].name) || '',
        // Linked record IDs only. Airtable's API returns plain IDs here; display names are discarded if present.
        employeeRecordIds: links.map(function (l) { return typeof l === 'string' ? l : l && l.id; }).filter(Boolean),
        created: v[f.created] || r.createdTime
      };
    });
  }
  async function fetchDevelopment() {
    const f = AIRTABLE.development.fields;
    const raw = await listAll(AIRTABLE.development.table, [f.employee, f.developmentType, f.status, f.fifthMonthStatus, f.regularizationStatus, f.created]);
    const name = function (v) { return typeof v === 'string' ? v : (v && v.name) || ''; };
    return raw.map(function (r) {
      const v = r.fields || {};
      const links = Array.isArray(v[f.employee]) ? v[f.employee] : [];
      return {
        recordId: r.id,
        employeeRecordIds: links.map(function (l) { return typeof l === 'string' ? l : l && l.id; }).filter(Boolean),
        developmentType: name(v[f.developmentType]), status: name(v[f.status]),
        fifthMonthStatus: name(v[f.fifthMonthStatus]), regularizationStatus: name(v[f.regularizationStatus]),
        created: v[f.created] || r.createdTime
      };
    });
  }
  return { id: 'airtable', configured: configured, fetchPeople, fetchDepartments, fetchAttendance, fetchDevelopment };
}

module.exports = { createAirtableAdapter };
