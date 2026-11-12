/* Private monitoring server (Node 22, no dependencies).
 *
 * Boundaries enforced here:
 *  - Only allowlisted frontend files are served; server/, tests/, docs/, .git and
 *    the fictional data.js are never served in private mode.
 *  - Connected data is delivered through ONE authenticated, no-store script
 *    (/private/payload.js). There is no unauthenticated data endpoint and no
 *    bulk snapshot API.
 *  - GET/HEAD only, except POST /auth/session and POST /auth/logout (viewer
 *    session management on this server — never provider writes). Everything
 *    else returns 405.
 *  - Strict security headers and a CSP. */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_FILES = new Set([
  'app.js', 'data-adapter.js', 'icons.js', 'monitoring.js', 'motion.js',
  'styles.css', 'theme.css', 'operations.css', 'palette.css', 'landing.css', 'workspace.css', 'reader.css', 'refined.css', 'mono.css'
]);
const LOGIN_FILES = { '/login.js': ['server/public/login.js', 'text/javascript'], '/login.css': ['server/public/login.css', 'text/css'] };
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function privateIndex() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const inline = /<script>([\s\S]*?)<\/script>/.exec(html);
  const out = html
    .replace('<script src="./data.js" defer></script>', '<script src="/private/payload.js" defer></script>')
    .replace('Preparing the fictional monitoring snapshot…', 'Preparing the connected monitoring snapshot…')
    .replace('JavaScript must be enabled for this prototype.', 'JavaScript must be enabled for the private monitoring view.');
  if (out.indexOf('/private/payload.js') < 0) throw new Error('index.html no longer contains the data.js script tag expected by the private server.');
  return { html: out, inlineHash: inline ? crypto.createHash('sha256').update(inline[1]).digest('base64') : '' };
}

function createServer(options) {
  const config = options.config, service = options.service, verifier = options.verifier, sessions = options.sessions;
  const secureCookies = !config.insecureLocalCookies;
  const index = privateIndex();
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'sha256-" + index.inlineHash + "' https://accounts.google.com/gsi/client https://cdn.jsdelivr.net/npm/animejs@4.5.0/",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
    "font-src https://fonts.gstatic.com", "img-src 'self' data: https://*.googleusercontent.com",
    "frame-src https://accounts.google.com/gsi/", "connect-src 'self' https://accounts.google.com/gsi/",
    "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'"
  ].join('; ');

  function send(res, status, body, type, extra) {
    const headers = Object.assign({
      'Content-Type': type || 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Content-Security-Policy': csp
    }, secureCookies ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}, extra || {});
    res.writeHead(status, headers);
    res.end(res.req && res.req.method === 'HEAD' ? undefined : body);
  }
  function readBody(req, limit) {
    return new Promise(function (resolve, reject) {
      let size = 0; const chunks = [];
      req.on('data', function (c) { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
      req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
      req.on('error', reject);
    });
  }
  function sameOrigin(req) { return config.publicOrigin && req.headers.origin === config.publicOrigin; }

  function loginPage() {
    return fs.readFileSync(path.join(__dirname, 'public', 'login.html'), 'utf8')
      .replace('%CLIENT_ID%', String(config.signInClientId).replace(/[^A-Za-z0-9._-]/g, ''));
  }

  async function handle(req, res) {
    res.req = req;
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    const method = req.method;
    const session = sessions.read(req.headers.cookie);

    if (method === 'POST' && p === '/auth/session') {
      if (!sameOrigin(req)) return send(res, 403, 'Cross-origin sign-in refused.');
      let credential = '';
      try { credential = JSON.parse(await readBody(req, 8192)).credential; } catch (err) { return send(res, 400, 'Invalid request.'); }
      try {
        const viewer = await verifier.verifyIdToken(credential);
        return send(res, 204, '', 'text/plain', { 'Set-Cookie': sessions.cookie(sessions.issue(viewer.email), secureCookies) });
      } catch (err) {
        return send(res, 401, err.code === 'unauthorized' ? err.message : 'Sign-in could not be verified.');
      }
    }
    if (method === 'POST' && p === '/auth/logout') {
      if (!sameOrigin(req)) return send(res, 403, 'Cross-origin request refused.');
      return send(res, 303, '', 'text/plain', { 'Set-Cookie': sessions.cookie('', secureCookies, 0), Location: '/login' });
    }
    if (method !== 'GET' && method !== 'HEAD') return send(res, 405, 'Read-only service: method not allowed.', 'text/plain', { Allow: 'GET, HEAD' });

    if (p === '/healthz') return send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    if (p === '/login') return send(res, 200, loginPage(), 'text/html; charset=utf-8');
    if (LOGIN_FILES[p]) return send(res, 200, fs.readFileSync(path.join(ROOT, LOGIN_FILES[p][0])), LOGIN_FILES[p][1] + '; charset=utf-8');
    if (p === '/logout') return send(res, 200, fs.readFileSync(path.join(__dirname, 'public', 'logout.html'), 'utf8'), 'text/html; charset=utf-8');

    if (!session) {
      if (p === '/' || p === '/index.html') return send(res, 302, '', 'text/plain', { Location: '/login' });
      if (p.indexOf('/private/') === 0) return send(res, 401, 'Authentication required.');
    }
    if (p === '/' || p === '/index.html') return send(res, 200, index.html, 'text/html; charset=utf-8');
    if (p === '/private/payload.js') {
      const state = await service.get();
      const payload = Object.assign({}, state, { viewer: { email: session.email } });
      return send(res, 200, 'window.MJ_CONNECTED_PAYLOAD=' + scriptJson(payload) + ';', 'text/javascript; charset=utf-8');
    }
    const name = p.replace(/^\/+/, '');
    if (PUBLIC_FILES.has(name)) return send(res, 200, fs.readFileSync(path.join(ROOT, name)), TYPES[path.extname(name)], { 'Cache-Control': 'private, max-age=60' });
    if (/^assets\/[A-Za-z0-9._-]+$/.test(name) && TYPES[path.extname(name)]) {
      const file = path.join(ROOT, name);
      if (fs.existsSync(file)) return send(res, 200, fs.readFileSync(file), TYPES[path.extname(name)], { 'Cache-Control': 'private, max-age=3600' });
    }
    return send(res, 404, 'Not found.');
  }

  return http.createServer(function (req, res) {
    handle(req, res).catch(function () { if (!res.headersSent) send(res, 500, 'The private monitoring service encountered an error.'); });
  });
}

module.exports = { createServer, scriptJson, privateIndex, PUBLIC_FILES };
