/**
 * Validador del catalogo. Ejecutar desde la carpeta backend:  npm run catalog:check
 * Detecta errores tipicos al editar catalog.json (comas, precios, fotos que faltan).
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'data', 'catalog.json');
const imagesDir = path.join(__dirname, '..', 'public', 'products');

let list;
try {
  list = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.log('❌ catalog.json tiene un error de formato (revisa comas, comillas y llaves):');
  console.log('   ' + e.message);
  process.exit(1);
}
if (!Array.isArray(list)) {
  console.log('❌ catalog.json debe empezar con [ y terminar con ]');
  process.exit(1);
}

const problems = [];
const warnings = [];
const ids = new Set();

list.forEach((p, i) => {
  const label = `#${i + 1} ${p.name || '(sin nombre)'}`;
  if (!p.id) problems.push(`${label}: falta "id"`);
  else if (ids.has(p.id)) problems.push(`${label}: el id "${p.id}" esta repetido`);
  else ids.add(p.id);
  if (!p.name) problems.push(`${label}: falta "name"`);
  if (!Number.isInteger(p.price) || p.price < 0) problems.push(`${label}: "price" debe ser un numero entero sin puntos (ej. 34990)`);
  if (!Number.isInteger(p.stock) || p.stock < 0) problems.push(`${label}: "stock" debe ser un numero entero (0 = agotado)`);
  if (p.image && !/^https?:\/\//i.test(p.image) && !fs.existsSync(path.join(imagesDir, path.basename(p.image)))) {
    warnings.push(`${label}: no existe la foto "${p.image}" en public/products (se mostrara el icono)`);
  }
});

console.log(`Productos: ${list.length} | Activos: ${list.filter((p) => p.active !== false).length}`);
warnings.forEach((w) => console.log('⚠️  ' + w));
problems.forEach((w) => console.log('❌ ' + w));
if (problems.length) process.exit(1);
console.log('✅ Catalogo correcto.');
