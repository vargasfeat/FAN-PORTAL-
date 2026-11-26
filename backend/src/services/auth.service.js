const pool = require('../db');
const { sign } = require('../utils/jwt');
const { verifyPassword } = require('../utils/password');

const MAX_FAILS = 5;
const WINDOW_MS = 60 * 1000;
const fails = new Map(); // rut limpio -> { count, resetAt }

const cleanRut = (v = '') => String(v).replace(/[^0-9kK]/g, '').toUpperCase();

class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}

function isBlocked(key) {
  const f = fails.get(key);
  if (!f) return false;
  if (Date.now() > f.resetAt) {
    fails.delete(key);
    return false;
  }
  return f.count >= MAX_FAILS;
}

function registerFail(key) {
  const f = fails.get(key);
  if (!f || Date.now() > f.resetAt) fails.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  else f.count += 1;
}

function getDiscountByStatus(estadoAfiliacion) {
  return String(estadoAfiliacion || '').toUpperCase() === 'ACTIVO' ? 0.15 : 0;
}

async function login(rut, password) {
  const key = cleanRut(rut);
  if (!key || !password) throw new AuthError('Ingresa RUT y contraseña.', 400);
  if (isBlocked(key)) throw new AuthError('Demasiados intentos. Espera un minuto e intenta de nuevo.', 429);

  const result = await pool.query(
    `SELECT id, rut, nombre, email, password_hash, rol, estado_afiliacion, intentos_fallidos
     FROM usuarios
     WHERE regexp_replace(rut, '[^0-9kK]', '', 'g') ILIKE $1
     LIMIT 1`,
    [key]
  );

  const userRow = result.rows[0];

  if (!userRow || !verifyPassword(password, userRow.password_hash)) {
    registerFail(key);
    if (userRow) {
      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = COALESCE(intentos_fallidos, 0) + 1 WHERE id = $1',
        [userRow.id]
      );
    }
    throw new AuthError('RUT o contraseña incorrectos.');
  }

  fails.delete(key);
  await pool.query('UPDATE usuarios SET intentos_fallidos = 0 WHERE id = $1', [userRow.id]);

  const role = userRow.rol || 'socio';
  const estado = userRow.estado_afiliacion || 'INACTIVO';
  const discountRate = getDiscountByStatus(estado);

  const token = sign({ sub: userRow.id, rut: cleanRut(userRow.rut), name: userRow.nombre, role });

  return {
    token,
    user: {
      id: userRow.id,
      rut: userRow.rut,
      name: userRow.nombre,
      email: userRow.email,
      role,
      memberType: role,
      subscriptionStatus: estado,
      discountRate,
    },
  };
}

module.exports = { login, AuthError };