/* Google read-only adapters: OAuth access-token provider, Sheets values,
 * Drive file metadata and Calendar events. Scopes required are read-only:
 *   https://www.googleapis.com/auth/spreadsheets.readonly
 *   https://www.googleapis.com/auth/drive.metadata.readonly
 *   https://www.googleapis.com/auth/calendar.readonly
 * Credentials (client ID/secret/refresh token) come from the private server's
 * environment. The access token stays in memory and is never logged or delivered. */
'use strict';

const { ProviderError, TOKEN_ENDPOINT } = require('../lib/readonly-http');

function createGoogleTokenProvider(config, client, deps) {
  const now = (deps && deps.now) || Date.now;
  let cached = null;
  function configured() { return !!(config.googleClientId && config.googleClientSecret && config.googleRefreshToken); }
  async function token() {
    if (!configured()) throw new ProviderError('config', 'Google read-only OAuth credentials are not configured on the private server.');
    if (cached && cached.expires > now() + 60000) return cached.value;
    const body = new URLSearchParams({
      client_id: config.googleClientId, client_secret: config.googleClientSecret,
      refresh_token: config.googleRefreshToken, grant_type: 'refresh_token'
    }).toString();
    const result = await client.request(TOKEN_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body
    });
    if (!result || !result.access_token) throw new ProviderError('permission', 'Google did not issue an access token for the configured credentials.');
    cached = { value: result.access_token, expires: now() + (Number(result.expires_in) || 3000) * 1000 };
    return cached.value;
  }
  return { configured, token };
}

function createSheetsAdapter(config, client, tokens) {
  function configured() { return tokens.configured() && !!config.sheetsMasterlistId; }
  async function fetchMasterlist() {
    if (!configured()) throw new ProviderError('config', 'The Sheets masterlist is not configured on the private server.');
    const auth = { Authorization: 'Bearer ' + await tokens.token() };
    const id = encodeURIComponent(config.sheetsMasterlistId);
    // Only the EE Number (E) and Status (F) columns are requested: enough to reconcile
    // IDs and statuses without retrieving compensation or personal columns.
    const range = encodeURIComponent((config.sheetsMasterlistTab || 'Masterlist') + '!E1:F2000');
    const values = await client.getJson('https://sheets.googleapis.com/v4/spreadsheets/' + id + '/values/' + range, auth);
    let modifiedTime = null;
    try {
      const meta = await client.getJson('https://www.googleapis.com/drive/v3/files/' + id + '?fields=modifiedTime', auth);
      modifiedTime = meta.modifiedTime || null;
    } catch (err) { modifiedTime = null; } // metadata scope optional; absence is reported, not invented
    return { rows: values.values || [], modifiedTime };
  }
  return { id: 'sheets', configured, fetchMasterlist };
}

function createCalendarAdapter(config, client, tokens) {
  function configured() { return tokens.configured() && !!config.calendarId; }
  async function fetchEvents(timeMin, timeMax) {
    if (!configured()) throw new ProviderError('config', 'Google Calendar is not configured on the private server.');
    const auth = { Authorization: 'Bearer ' + await tokens.token() };
    const items = [];
    let pageToken = '';
    let pages = 0;
    do {
      const p = new URLSearchParams({
        timeMin: timeMin, timeMax: timeMax, singleEvents: 'true', orderBy: 'startTime',
        maxResults: '250', timeZone: 'Asia/Manila',
        fields: 'items(id,status,summary,start,end,updated,attendees(email)),nextPageToken,timeZone'
      });
      if (pageToken) p.set('pageToken', pageToken);
      const body = await client.getJson('https://www.googleapis.com/calendar/v3/calendars/' +
        encodeURIComponent(config.calendarId) + '/events?' + p.toString(), auth);
      (body.items || []).forEach(function (e) { items.push(e); });
      pageToken = body.nextPageToken || '';
      pages += 1;
      if (pages > 20) break;
    } while (pageToken);
    return items;
  }
  return { id: 'calendar', configured, fetchEvents };
}

module.exports = { createGoogleTokenProvider, createSheetsAdapter, createCalendarAdapter };
