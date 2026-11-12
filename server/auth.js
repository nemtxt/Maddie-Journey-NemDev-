/* Viewer authentication for the private deployment.
 * Uses the viewer's existing Google identity (Google Identity Services ID token):
 * no new account system and no passwords stored here. Access is granted only to
 * verified emails on the explicit MJ_ALLOWED_VIEWERS allowlist (fail closed).
 * Sessions are stateless HMAC-signed cookies: HttpOnly, Secure, SameSite=Strict. */
'use strict';

const crypto = require('node:crypto');

const GOOGLE_CERTS = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const SESSION_COOKIE = 'mj_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const b64url = function (buf) { return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); };
const fromB64url = function (s) { return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64'); };

function createVerifier(config, client, deps) {
  const now = (deps && deps.now) || Date.now;
  const allowed = new Set((config.allowedViewers || []).map(function (e) { return String(e).trim().toLowerCase(); }).filter(Boolean));
  let keys = null;
  async function jwks() {
    if (keys && keys.expires > now()) return keys.byKid;
    const body = await client.getJson(GOOGLE_CERTS);
    const byKid = new Map((body.keys || []).map(function (k) { return [k.kid, k]; }));
    keys = { byKid, expires: now() + 60 * 60 * 1000 };
    return byKid;
  }
  async function verifyIdToken(token) {
    const fail = function (reason) { const e = new Error(reason); e.code = 'unauthorized'; throw e; };
    if (!config.signInClientId) fail('Sign-in is not configured on this server.');
    if (!allowed.size) fail('No viewers are authorized on this server.');
    const parts = String(token || '').split('.');
    if (parts.length !== 3) fail('Malformed credential.');
    let header, claims;
    try { header = JSON.parse(fromB64url(parts[0]).toString('utf8')); claims = JSON.parse(fromB64url(parts[1]).toString('utf8')); }
    catch (err) { fail('Malformed credential.'); }
    if (header.alg !== 'RS256' || !header.kid) fail('Unsupported credential.');
    const jwk = (await jwks()).get(header.kid);
    if (!jwk) fail('Unknown signing key.');
    const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const valid = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), key, fromB64url(parts[2]));
    if (!valid) fail('Invalid credential signature.');
    const t = Math.floor(now() / 1000);
    if (!ISSUERS.has(claims.iss)) fail('Unexpected issuer.');
    if (claims.aud !== config.signInClientId) fail('Credential was issued for another application.');
    if (!(claims.exp > t) || (claims.nbf && claims.nbf > t + 60)) fail('Credential expired.');
    if (claims.email_verified !== true) fail('Email is not verified.');
    const email = String(claims.email || '').toLowerCase();
    if (!allowed.has(email)) fail('This Google account is not authorized for the private monitoring view.');
    return { email: email };
  }
  return { verifyIdToken, allowedCount: allowed.size };
}

function createSessions(secret, deps) {
  if (!secret || String(secret).length < 32) throw new Error('MJ_SESSION_SECRET must be at least 32 characters.');
  const now = (deps && deps.now) || Date.now;
  const sign = function (data) { return b64url(crypto.createHmac('sha256', secret).update(data).digest()); };
  function issue(email) {
    const data = b64url(JSON.stringify({ e: email, x: now() + SESSION_TTL_MS }));
    return data + '.' + sign(data);
  }
  function read(cookieHeader) {
    const match = String(cookieHeader || '').split(/;\s*/).find(function (c) { return c.indexOf(SESSION_COOKIE + '=') === 0; });
    if (!match) return null;
    const value = match.slice(SESSION_COOKIE.length + 1);
    const dot = value.lastIndexOf('.');
    if (dot < 1) return null;
    const data = value.slice(0, dot), sig = value.slice(dot + 1);
    const expected = sign(data);
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
      const parsed = JSON.parse(fromB64url(data).toString('utf8'));
      if (!parsed.x || parsed.x < now()) return null;
      return { email: parsed.e };
    } catch (err) { return null; }
  }
  function cookie(value, secure, maxAgeMs) {
    return SESSION_COOKIE + '=' + value + '; Path=/; HttpOnly; SameSite=Strict' + (secure ? '; Secure' : '') +
      '; Max-Age=' + Math.floor((maxAgeMs === undefined ? SESSION_TTL_MS : maxAgeMs) / 1000);
  }
  return { issue, read, cookie };
}

module.exports = { createVerifier, createSessions, SESSION_COOKIE, GOOGLE_CERTS };
