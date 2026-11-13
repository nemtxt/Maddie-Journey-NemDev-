#!/usr/bin/env node
/* Maddie Journey private connected service.
 *   node server/index.js           start the authenticated private server
 *   node server/index.js --check   one read-only refresh; prints AGGREGATE counts
 *                                  and provider states only (no names, no IDs)
 *   node server/index.js --local   presenter mode on THIS computer only: binds to
 *                                  127.0.0.1, prints a one-time access link, needs
 *                                  no Google sign-in setup (Airtable token only)
 * Configuration comes from environment variables (see server/.env.example). */
'use strict';

const { loadConfig, validateForServe } = require('./config');
const { createSnapshotService } = require('./snapshot-service');
const { createVerifier, createSessions } = require('./auth');
const { createServer } = require('./server');
const crypto = require('node:crypto');

async function local(config) {
  const port = config.port;
  const token = crypto.randomBytes(24).toString('base64url');
  const localConfig = Object.assign({}, config, {
    localAccessToken: token, insecureLocalCookies: true, publicOrigin: 'http://127.0.0.1:' + port,
    sessionSecret: crypto.randomBytes(32).toString('base64url') // new every run; links expire when the server stops
  });
  const service = createSnapshotService(localConfig);
  const verifier = { verifyIdToken: async function () { const e = new Error('Google sign-in is disabled in presenter mode.'); e.code = 'unauthorized'; throw e; } };
  const server = createServer({ config: localConfig, service, verifier, sessions: createSessions(localConfig.sessionSecret) });
  server.listen(port, '127.0.0.1', async function () {
    process.stdout.write('\nMaddie Journey presenter mode (read-only, this computer only).\n' +
      (config.airtableToken && config.airtableBaseId ? '' : 'WARNING: MJ_AIRTABLE_TOKEN / MJ_AIRTABLE_BASE_ID are not set; no roster can be loaded.\n') +
      'Retrieving the roster...\n');
    const state = await service.refresh();
    process.stdout.write((state.available ? 'Roster loaded: ' + state.snapshot.employees.length + ' active records.\n' :
      'Roster NOT loaded: ' + ((state.sources.find(function (x) { return x.id === 'airtable'; }) || {}).lastError || 'unknown error') + '\n') +
      '\nOpen this link in your browser (do not share it):\n  http://127.0.0.1:' + port + '/local-access?token=' + token +
      '\n\nPress Ctrl+C to stop. The link stops working when the server stops.\n');
  });
}

async function check(config) {
  const service = createSnapshotService(config);
  const state = await service.refresh();
  const out = {
    available: state.available,
    sources: state.sources.map(function (s) {
      return { id: s.id, state: s.state, records: s.recordCount, conflicts: s.conflicts, error: s.lastError,
        datasets: (s.datasets || []).map(function (d) { return { name: d.name, ok: d.ok, records: d.records }; }) };
    }),
    requestMethods: Array.from(new Set(service.client.log.methods))
  };
  if (state.available) {
    const r = state.reconciliation;
    out.roster = r.roster;
    out.issueKinds = r.issues.reduce(function (acc, i) { acc[i.kind] = (acc[i.kind] || 0) + 1; return acc; }, {});
    out.masterlist = r.masterlist && { sheetIds: r.masterlist.sheetIdCount, matched: r.masterlist.matchedIds,
      onlyInRoster: r.masterlist.onlyInRoster.length, onlyInSheet: r.masterlist.onlyInSheet.length, statusMismatch: r.masterlist.statusMismatch.length };
    out.attendanceLinks = r.attendanceLinks;
    out.developmentLinks = r.developmentLinks;
    out.coverage = state.snapshot.coverage;
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

async function main() {
  const config = loadConfig();
  if (process.argv.includes('--check')) return check(config);
  if (process.argv.includes('--local')) return local(config);
  const problems = validateForServe(config);
  if (problems.length) {
    process.stderr.write('Refusing to start the private server:\n- ' + problems.join('\n- ') + '\n');
    process.exit(1);
  }
  const service = createSnapshotService(config);
  const verifier = createVerifier(config, service.client);
  const sessions = createSessions(config.sessionSecret);
  const server = createServer({ config, service, verifier, sessions });
  server.listen(config.port, function () {
    process.stdout.write('Maddie Journey private service listening on port ' + config.port + ' (read-only).\n');
  });
  service.refresh();
}

main().catch(function (err) { process.stderr.write('Startup failed: ' + (err && err.message) + '\n'); process.exit(1); });
