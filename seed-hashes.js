const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

const usuarios = [
  { rut: '18.456.789-3', nombre: 'Camila Rojas Soto', email: 'camila.rojas@demo.cl', pass: 'Socio2026!', rol: 'socio', estado: 'ACTIVO' },
  { rut: '16.234.567-6', nombre: 'Matias Fuentes Diaz', email: 'matias.fuentes@demo.cl', pass: 'Socio2026!', rol: 'socio', estado: 'ATRASADO' },
  { rut: '20.111.222-K', nombre: 'Valentina Munoz Perez', email: 'valentina.munoz@demo.cl', pass: 'Hincha2026!', rol: 'hincha', estado: 'INACTIVO' },
  { rut: '12.345.678-5', nombre: 'Javier Castro Morales', email: 'javier.castro@demo.cl', pass: 'Admin2026!', rol: 'admin', estado: 'ACTIVO' },
  { rut: '19.876.543-4', nombre: 'Diego Silva Vera', email: 'diego.silva@demo.cl', pass: 'Bloqueo2026!', rol: 'socio', estado: 'ACTIVO' }
];

for (const u of usuarios) {
  const hash = hashPassword(u.pass);
  console.log(
    `INSERT INTO usuarios (rut, nombre, email, password_hash, rol, estado_afiliacion, intentos_fallidos) VALUES ('${u.rut}', '${u.nombre}', '${u.email}', '${hash}', '${u.rol}', '${u.estado}', 0);`
  );
}
