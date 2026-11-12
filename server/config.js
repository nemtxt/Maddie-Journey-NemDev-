/* Private service configuration — read from the environment ONLY.
 * Never commit real values. See server/.env.example and
 * docs/PHASE11_SECURE_ARCHITECTURE.md §6 for how each value is obtained. */
'use strict';

function list(value) { return String(value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }

function loadConfig(env) {
  const e = env || process.env;
  return {
    port: Number(e.PORT || e.MJ_PORT || 8787),
    publicOrigin: (e.MJ_PUBLIC_ORIGIN || '').replace(/\/+$/, ''),
    insecureLocalCookies: e.MJ_INSECURE_LOCAL_COOKIES === '1',
    sessionSecret: e.MJ_SESSION_SECRET || '',
    signInClientId: e.MJ_GOOGLE_SIGNIN_CLIENT_ID || '',
    allowedViewers: list(e.MJ_ALLOWED_VIEWERS),
    airtableToken: e.MJ_AIRTABLE_TOKEN || '',
    airtableBaseId: e.MJ_AIRTABLE_BASE_ID || '',
    googleClientId: e.MJ_GOOGLE_OAUTH_CLIENT_ID || '',
    googleClientSecret: e.MJ_GOOGLE_OAUTH_CLIENT_SECRET || '',
    googleRefreshToken: e.MJ_GOOGLE_OAUTH_REFRESH_TOKEN || '',
    sheetsMasterlistId: e.MJ_SHEETS_MASTERLIST_ID || '',
    sheetsMasterlistTab: e.MJ_SHEETS_MASTERLIST_TAB || 'Masterlist',
    calendarId: e.MJ_CALENDAR_ID || '',
    staleAfterMs: Number(e.MJ_STALE_AFTER_MINUTES || 15) * 60 * 1000
  };
}

/* Fail closed: the server will not start in a state that could expose data. */
function validateForServe(config) {
  const problems = [];
  if (!config.sessionSecret || config.sessionSecret.length < 32) problems.push('MJ_SESSION_SECRET (32+ random characters) is required.');
  if (!config.signInClientId) problems.push('MJ_GOOGLE_SIGNIN_CLIENT_ID is required for viewer sign-in.');
  if (!config.allowedViewers.length) problems.push('MJ_ALLOWED_VIEWERS must list at least one authorized Google account.');
  if (!config.publicOrigin) problems.push('MJ_PUBLIC_ORIGIN is required (exact https origin viewers use).');
  if (config.publicOrigin && !/^https:\/\//.test(config.publicOrigin) && !config.insecureLocalCookies)
    problems.push('MJ_PUBLIC_ORIGIN must be https unless MJ_INSECURE_LOCAL_COOKIES=1 for localhost testing.');
  return problems;
}

module.exports = { loadConfig, validateForServe };
