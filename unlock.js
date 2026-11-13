/* Maddie Journey v3.8 — passphrase lock for the encrypted monitoring snapshot.
 *
 * GitHub Pages is public, so the real snapshot is published ONLY as ciphertext
 * (data/monitoring.enc.json: AES-256-GCM, key from PBKDF2-SHA256). This page asks
 * for the passphrase, decrypts in the browser with Web Crypto, and only then loads
 * the read-only monitoring application. The passphrase and decrypted data are kept
 * in memory only: nothing is stored, sent or logged. Reloading locks the page.
 *
 * When the private server has already injected window.MJ_CONNECTED_PAYLOAD
 * (authenticated deployment), the lock is skipped. */
(function () {
  'use strict';
  var SNAPSHOT_URL = './data/monitoring.enc.json';
  // Application scripts, in dependency order (formerly static tags in index.html).
  var APP_SCRIPTS = ['./data-adapter.js', './icons.js', './monitoring.js', './app.js',
    'https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.umd.min.js', './motion.js'];

  function el(id) { return document.getElementById(id); }
  function b64(text) {
    var bin = atob(text), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function loadApp() {
    APP_SCRIPTS.forEach(function (src) {
      var s = document.createElement('script');
      s.src = src; s.async = false; // preserve execution order
      if (/^https:/.test(src)) s.crossOrigin = 'anonymous';
      document.body.appendChild(s);
    });
  }
  function freshen(payload) {
    var f = payload.freshness || {};
    var age = Date.now() - Date.parse(f.retrievedAt || '');
    var limit = (f.staleAfterDays || 7) * 86400000;
    f.ageSeconds = isNaN(age) ? null : Math.round(age / 1000);
    f.stale = isNaN(age) || age > limit;
    f.refreshFailed = false;
    f.note = f.stale ? 'This snapshot is older than ' + (f.staleAfterDays || 7) + ' days. Ask P&C to refresh it.' :
      'Snapshot retrieved within the last ' + (f.staleAfterDays || 7) + ' days. It does not update live.';
    payload.freshness = f;
    return payload;
  }
  async function decrypt(envelope, passphrase) {
    if (!envelope || envelope.format !== 'mj-encrypted-snapshot' || envelope.version !== 1) throw new Error('format');
    var material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(envelope.kdf.salt), iterations: envelope.kdf.iterations },
      material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    var plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(envelope.cipher.iv) }, key, b64(envelope.data));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  function render(message) {
    var app = el('app');
    app.innerHTML =
      '<main id="main-content" class="data-error-screen lock-screen" tabindex="-1">' +
      '<section class="data-error-card lock-card" aria-labelledby="lock-title">' +
      '<span class="boot-eyebrow">MADHOUSE DESIGN STUDIO / PEOPLE &amp; CULTURE</span>' +
      '<h1 id="lock-title">Maddie Journey</h1>' +
      '<p>This monitoring view contains confidential employee records. Enter the passphrase shared with you by People &amp; Culture.</p>' +
      '<form id="lock-form" class="lock-form" autocomplete="off">' +
      '<label for="lock-passphrase" class="field-label">Passphrase</label>' +
      '<input id="lock-passphrase" class="field lock-input" type="password" required spellcheck="false" autocapitalize="off" autocomplete="current-password">' +
      '<button class="button primary" type="submit" id="lock-submit">Unlock</button>' +
      '</form>' +
      '<p class="lock-status" id="lock-status" role="status" aria-live="polite">' + (message || '') + '</p>' +
      '<p class="data-error-footnote">Read-only. The data is decrypted only in this browser and is not stored. Reloading the page locks it again.</p>' +
      '</section></main>';
    document.title = 'Locked · Maddie Journey';
    var input = el('lock-passphrase');
    input.focus();
    el('lock-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var status = el('lock-status'), button = el('lock-submit'), value = input.value;
      if (!window.crypto || !crypto.subtle) { status.textContent = 'This browser cannot decrypt the snapshot. Use a current browser over HTTPS.'; return; }
      button.disabled = true; status.textContent = 'Unlocking…';
      try {
        var response = await fetch(SNAPSHOT_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('missing');
        var payload = await decrypt(await response.json(), value);
        input.value = ''; value = '';
        window.MJ_CONNECTED_PAYLOAD = freshen(payload);
        el('app').innerHTML = '<div class="boot" role="status" aria-live="polite"><span class="boot-eyebrow">MADDIE JOURNEY</span>' +
          '<strong class="boot-title">Maddie Journey</strong><p>Opening the monitoring snapshot…</p></div>';
        loadApp();
      } catch (err) {
        await new Promise(function (r) { setTimeout(r, 900); }); // slow repeated guessing in the UI
        button.disabled = false; input.select();
        status.textContent = err && err.message === 'missing' ? 'The encrypted snapshot could not be loaded. Try again later.' :
          'That passphrase did not unlock the snapshot.';
      }
    });
  }
  function start() {
    if (window.MJ_CONNECTED_PAYLOAD) { loadApp(); return; } // authenticated private server
    render('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
