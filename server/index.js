#!/usr/bin/env node
/* Maddie Journey private connected service.
 *   node server/index.js           start the authenticated private server
 *   node server/index.js --check   one read-only refresh; prints AGGREGATE counts
 *                                  and provider states only (no names, no IDs)
 * Configuration comes from environment variables (see server/.env.example). */
'use strict';

const { loadConfig, validateForServe } = require('./config');
const { createSnapshotService } = require('./snapshot-service');
const { createVerifier, createSessions } = require('./auth');
const { createServer } = require('./server');

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
