const pool = require('../db');
const { sign } = require('../utils/jwt');
const { hashPassword, verifyPassword } = require('../utils/password');

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

async function register({ rut, nombre, email, password }) {
  const key = cleanRut(rut);
  if (!key || !password) {
    throw new AuthError('RUT y contraseña obligatorios.', 400);
  }
  if (String(password).length < 4) {
    throw new AuthError('La contraseña debe tener al menos 4 caracteres.', 400);
  }

  const existing = await pool.query(
    `SELECT id FROM usuarios WHERE regexp_replace(rut, '[^0-9kK]', '', 'g') ILIKE $1 LIMIT 1`,
    [key]
  );
  if (existing.rows.length > 0) {
    throw new AuthError('Ya existe un usuario registrado con ese RUT.', 409);
  }

  const rutNormalizado = String(rut).replace(/\./g, '').trim().toUpperCase();
  const hash = hashPassword(String(password));

  const result = await pool.query(
    `INSERT INTO usuarios (rut, nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, rut, nombre, email, rol`,
    [rutNormalizado, (nombre && String(nombre).trim()) || 'Usuario', email ? String(email).trim() : null, hash, 'socio']
  );

  return result.rows[0];
}

async function updateProfile(userId, { nombre, email, password }) {
  if (!userId) throw new AuthError('Sesión no válida.', 401);

  const cleanName = nombre !== undefined ? String(nombre).trim() : '';
  if (cleanName.length < 2) {
    throw new AuthError('El nombre debe tener al menos 2 caracteres.', 400);
  }
  if (password && String(password).length < 4) {
    throw new AuthError('La nueva contraseña debe tener al menos 4 caracteres.', 400);
  }

  const cleanEmail = email ? String(email).trim() : null;

  let result;
  if (password) {
    const hash = hashPassword(String(password));
    result = await pool.query(
      `UPDATE usuarios
       SET nombre = $1, email = $2, password_hash = $3
       WHERE id = $4
       RETURNING id, rut, nombre, email, rol, estado_afiliacion`,
      [cleanName, cleanEmail, hash, userId]
    );
  } else {
    result = await pool.query(
      `UPDATE usuarios
       SET nombre = $1, email = $2
       WHERE id = $3
       RETURNING id, rut, nombre, email, rol, estado_afiliacion`,
      [cleanName, cleanEmail, userId]
    );
  }

  if (result.rows.length === 0) {
    throw new AuthError('Usuario no encontrado.', 404);
  }

  return result.rows[0];
}

module.exports = { login, register, updateProfile, AuthError };