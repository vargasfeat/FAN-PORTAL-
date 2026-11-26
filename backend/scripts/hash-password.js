/**
 * Genera el hash de una contrasena para pegarlo en data/members.json
 * Uso (desde backend):  node scripts/hash-password.js MiClaveNueva
 */
const { hashPassword } = require('../src/utils/password');
const pwd = process.argv[2];
if (!pwd) {
  console.log('Uso: node scripts/hash-password.js <contrasena>');
  process.exit(1);
}
console.log(hashPassword(pwd));
