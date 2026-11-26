const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const origenBackend = path.join(__dirname, 'backend');
const zipSalida = path.join(os.homedir(), 'Desktop', 'backend-api.zip');
const tempDir = path.join(os.tmpdir(), '_temp_backend_pack');

if (!fs.existsSync(origenBackend)) {
  console.error('No se encontró la carpeta backend en:', origenBackend);
  process.exit(1);
}

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
if (fs.existsSync(zipSalida)) fs.rmSync(zipSalida, { force: true });

fs.cpSync(origenBackend, tempDir, {
  recursive: true,
  filter: (src) => {
    const base = path.basename(src);
    return base !== 'node_modules' && base !== '.git' && base !== 'agregar-registro.js';
  }
});

const cmd = `powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipSalida}' -Force"`;
execSync(cmd, { stdio: 'inherit' });

fs.rmSync(tempDir, { recursive: true, force: true });

console.log('Listo! Archivo ZIP guardado en el Escritorio:', zipSalida);
