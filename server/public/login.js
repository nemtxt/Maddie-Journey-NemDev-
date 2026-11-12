/* Sends the Google ID token to this server for verification. No token is stored in the browser. */
(function () {
  'use strict';
  window.mjSignIn = function (response) {
    var status = document.getElementById('signin-status');
    status.textContent = 'Verifying access…';
    fetch('/auth/session', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response && response.credential })
    }).then(function (res) {
      if (res.status === 204) { window.location.replace('/'); return; }
      return res.text().then(function (text) { status.textContent = text || 'Access was not granted.'; });
    }).catch(function () { status.textContent = 'The private server could not be reached.'; });
  };
})();
