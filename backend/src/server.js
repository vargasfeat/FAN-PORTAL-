/**
 * Servidor Express — Fan Portal (middleware)
 * Ejecutar: npm start   (puerto 3000 por defecto)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const cartRoutes = require('./routes/cart.routes');
const sportsRoutes = require('./routes/sports.routes');
const productsRoutes = require('./routes/products.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Detras del servidor web de cPanel: respeta el protocolo original (https) al armar URLs
app.set('trust proxy', true);

// CORS_ORIGIN (opcional): dominios del navegador autorizados, separados por coma.
// Ejemplo: https://app.midominio.cl   Si queda vacio, se permite cualquier origen.
// (La app movil nativa no se ve afectada: CORS solo aplica a navegadores.)
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '6mb' })); // las fotos del panel admin viajan en base64

// Fotos de productos: backend/public/products/<archivo>
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'fan-portal-backend' }));

// Verifica conectividad con PostgreSQL sin exponer credenciales
app.get('/api/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS server_time, current_database() AS database_name');
    const row = result.rows[0] || {};
    res.json({
      status: 'ok',
      database: row.database_name,
      serverTime: row.server_time,
    });
  } catch (error) {
    console.error('Error al verificar conexion con PostgreSQL:', error.message);
    res.status(503).json({
      status: 'error',
      error: 'No se pudo conectar con la base de datos.',
      detalle: error.message,
    });
  }
});

app.use('/api/auth', authRoutes); // login y emision de token (JWT)
app.use('/api/admin', adminRoutes); // edicion del catalogo (solo administradores)
app.use('/api/products', productsRoutes); // catalogo de indumentaria (catalog.json)
app.use('/api/cart', cartRoutes); // PC-03: descuento de socio
app.use('/api/sports', sportsRoutes); // TheSportsDB: club, partidos y tabla

// Respuesta JSON consistente para rutas /api/* no encontradas
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fan Portal backend escuchando en http://localhost:${PORT}`);
});
