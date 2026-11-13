/* Encrypted monitoring snapshot format (shared by the builder and tests).
 * AES-256-GCM with a key derived from a passphrase by PBKDF2-SHA256.
 * Ciphertext is stored as ciphertext||tag so browsers can decrypt it with
 * Web Crypto (unlock.js). Only ciphertext, salt and IV are ever published. */
'use strict';
const crypto = require('node:crypto');

const FORMAT = 'mj-encrypted-snapshot';
const ITERATIONS = 600000;
const MIN_PASSPHRASE = 20;

function encrypt(payload, passphrase, options) {
  if (!passphrase || String(passphrase).length < MIN_PASSPHRASE) {
    throw new Error('Passphrase must be at least ' + MIN_PASSPHRASE + ' characters.');
  }
  const iterations = (options && options.iterations) || ITERATIONS;
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(Buffer.from(passphrase, 'utf8'), salt, iterations, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(payload), 'utf8')), cipher.final(), cipher.getAuthTag()]);
  return {
    format: FORMAT, version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: iterations, salt: salt.toString('base64') },
    cipher: { name: 'AES-GCM', iv: iv.toString('base64') },
    data: body.toString('base64')
  };
}

function decrypt(envelope, passphrase) {
  if (!envelope || envelope.format !== FORMAT || envelope.version !== 1) throw new Error('Unsupported snapshot format.');
  const salt = Buffer.from(envelope.kdf.salt, 'base64'), iv = Buffer.from(envelope.cipher.iv, 'base64');
  const body = Buffer.from(envelope.data, 'base64');
  const key = crypto.pbkdf2Sync(Buffer.from(String(passphrase), 'utf8'), salt, envelope.kdf.iterations, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(body.subarray(body.length - 16));
  const plain = Buffer.concat([decipher.update(body.subarray(0, body.length - 16)), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

module.exports = { encrypt, decrypt, FORMAT, ITERATIONS, MIN_PASSPHRASE };
