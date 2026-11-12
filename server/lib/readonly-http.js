/* Maddie Journey private service — READ-ONLY provider HTTP client.
 *
 * Every provider request in the private service goes through this module.
 * It enforces, in code rather than by convention:
 *   - GET only for provider data. The single exception is the OAuth token
 *     exchange endpoint, which is an authentication call, not a data write.
 *   - An explicit host allowlist (no arbitrary outbound requests).
 *   - Bounded retries with exponential backoff + jitter on 429 / 5xx,
 *     honouring Retry-After.
 *   - A per-request timeout.
 * Error messages are sanitized: they never include tokens, query strings
 * or response bodies, so they are safe to show on the Data & Sources screen.
 */
'use strict';

const DATA_HOSTS = new Set([
  'api.airtable.com',
  'sheets.googleapis.com',
  'www.googleapis.com'
]);
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

class ProviderError extends Error {
  constructor(code, safeMessage, status) {
    super(safeMessage);
    this.name = 'ProviderError';
    this.code = code;        // machine-readable: permission, not-found, rate-limit, network, http, config
    this.status = status || 0;
    this.safeMessage = safeMessage;
  }
}

function classify(status) {
  if (status === 401 || status === 403) return ['permission', 'The provider refused access (missing or insufficient permission).'];
  if (status === 404) return ['not-found', 'The configured dataset was not found or is not shared with the service identity.'];
  if (status === 422) return ['schema', 'The provider rejected the request; a mapped field or table may have been renamed or removed.'];
  if (status === 429) return ['rate-limit', 'The provider rate limit was reached after retries.'];
  if (status >= 500) return ['http', 'The provider returned a server error after retries.'];
  return ['http', 'The provider returned an unexpected response (HTTP ' + status + ').'];
}

function createClient(options) {
  const opts = Object.assign({ retries: 3, baseDelayMs: 400, timeoutMs: 15000 }, options || {});
  const fetchImpl = opts.fetch || globalThis.fetch;
  const sleep = opts.sleep || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const random = opts.random || Math.random;
  const log = { requests: 0, retries: 0, methods: [] };

  function assertAllowed(url, method) {
    let parsed;
    try { parsed = new URL(url); } catch (err) { throw new ProviderError('config', 'Invalid provider URL.'); }
    if (parsed.protocol !== 'https:') throw new ProviderError('config', 'Provider requests must use HTTPS.');
    if (method === 'POST') {
      if (url.split('?')[0] !== TOKEN_ENDPOINT) {
        throw new ProviderError('read-only', 'Blocked: write methods are not permitted against provider data APIs.');
      }
      return;
    }
    if (method !== 'GET') throw new ProviderError('read-only', 'Blocked: only GET requests are permitted against provider APIs.');
    if (!DATA_HOSTS.has(parsed.hostname)) throw new ProviderError('config', 'Blocked: host is not on the provider allowlist.');
  }

  async function request(url, init) {
    const method = String((init && init.method) || 'GET').toUpperCase();
    assertAllowed(url, method);
    let attempt = 0;
    for (;;) {
      attempt += 1;
      log.requests += 1;
      log.methods.push(method);
      let response;
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = controller ? setTimeout(function () { controller.abort(); }, opts.timeoutMs) : null;
      try {
        response = await fetchImpl(url, Object.assign({}, init, { method: method, signal: controller ? controller.signal : undefined }));
      } catch (err) {
        if (timer) clearTimeout(timer);
        if (attempt <= opts.retries) { log.retries += 1; await sleep(backoff(attempt)); continue; }
        throw new ProviderError('network', 'The provider could not be reached (network error or timeout).');
      }
      if (timer) clearTimeout(timer);
      if (response.ok) return response.json();
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt <= opts.retries) {
        log.retries += 1;
        const header = response.headers && typeof response.headers.get === 'function' ? response.headers.get('retry-after') : null;
        const hinted = header && /^\d+$/.test(header) ? Math.min(Number(header) * 1000, 30000) : 0;
        await sleep(Math.max(hinted, backoff(attempt)));
        continue;
      }
      const c = classify(response.status);
      throw new ProviderError(c[0], c[1], response.status);
    }
  }
  function backoff(attempt) {
    const base = opts.baseDelayMs * Math.pow(2, attempt - 1);
    return Math.round(base + base * 0.25 * random());
  }
  function getJson(url, headers) { return request(url, { method: 'GET', headers: headers || {} }); }
  return { getJson: getJson, request: request, log: log };
}

module.exports = { createClient: createClient, ProviderError: ProviderError, DATA_HOSTS: DATA_HOSTS, TOKEN_ENDPOINT: TOKEN_ENDPOINT };
