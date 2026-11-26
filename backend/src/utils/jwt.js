/**
 * JWT (HS256) minimo con el modulo crypto de Node: sin dependencias extra.
 * Define JWT_SECRET en .env para que las sesiones sobrevivan a un reinicio del servidor;
 * si falta, se genera una llave aleatoria al arrancar (las sesiones se cierran al reiniciar).
 */
const crypto = require('crypto');

let secret = null;
function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex');
    console.warn('[Auth] JWT_SECRET no definido: se uso una llave temporal (las sesiones se cierran al reiniciar).');
  }
  return secret;
}

const b64u = (input) => Buffer.from(input).toString('base64url');
const hmac = (data) => crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');

function sign(payload, expiresInSec = 8 * 60 * 60) {
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSec }));
  return `${header}.${body}.${hmac(`${header}.${body}`)}`;
}

/** Devuelve el payload si la firma y la vigencia son validas; si no, null. */
function verify(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = Buffer.from(hmac(`${header}.${body}`));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp && payload.exp > Date.now() / 1000 ? payload : null;
  } catch (e) {
    return null;
  }
}

module.exports = { sign, verify };
