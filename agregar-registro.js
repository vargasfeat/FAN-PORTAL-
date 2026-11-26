const fs = require('fs');
const path = require('path');

function buscarArchivoConLogin(dir) {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      const encontrado = buscarArchivoConLogin(fullPath);
      if (encontrado) return encontrado;
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) && entry.name !== 'agregar-registro.js') {
      const contenido = fs.readFileSync(fullPath, 'utf8');
      if (contenido.includes("'/login'") || contenido.includes('"/login"')) {
        return fullPath;
      }
    }
  }
  return null;
}

const targetFile = buscarArchivoConLogin(process.cwd());

if (!targetFile) {
  console.error('No se encontró ningún archivo con la ruta /login en:', process.cwd());
  process.exit(1);
}

let codigo = fs.readFileSync(targetFile, 'utf8');

if (codigo.includes('/register')) {
  console.log('La ruta /register ya existe en:', targetFile);
  process.exit(0);
}

const rutaRegistro = `
// Ruta agregada automáticamente para crear usuarios y probar login
router.post('/register', async (req, res) => {
  try {
    const { rut, nombre, email, password, rol } = req.body;

    if (!rut || !password) {
      return res.status(400).json({ error: 'RUT y contraseña obligatorios' });
    }

    const rutNormalizado = String(rut).replace(/\\./g, '').trim().toUpperCase();
    const bcryptLib = typeof bcrypt !== 'undefined' ? bcrypt : require('bcryptjs');
    const hash = await bcryptLib.hash(String(password), 10);

    const query = \`
      INSERT INTO users (rut, nombre, email, password_hash, rol)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, rut, nombre, rol
    \`;

    const values = [
      rutNormalizado,
      nombre || 'Usuario Prueba',
      email || null,
      hash,
      rol || 'socio'
    ];

    const result = await pool.query(query, values);
    return res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error en /register:', error);
    return res.status(500).json({
      error: 'Error interno al crear usuario',
      detalle: error.message
    });
  }
});
`;

if (codigo.includes('module.exports')) {
  codigo = codigo.replace(/module\.exports\s*=\s*router\s*;?/, `${rutaRegistro}\nmodule.exports = router;\n`);
} else {
  codigo = `${codigo}\n${rutaRegistro}\n`;
}

fs.writeFileSync(targetFile, codigo, 'utf8');
console.log('Listo: se agregó POST /register en', targetFile);

