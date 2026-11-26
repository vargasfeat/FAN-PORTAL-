/**
 * Servidor Express — Fan Portal (middleware)
 * Ejecutar: npm start   (puerto 3000 por defecto)
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

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

app.use('/api/auth', authRoutes); // login y emision de token (JWT)
app.use('/api/admin', adminRoutes); // edicion del catalogo (solo administradores)
app.use('/api/products', productsRoutes); // catalogo de indumentaria (catalog.json)
app.use('/api/cart', cartRoutes); // PC-03: descuento de socio
app.use('/api/sports', sportsRoutes); // TheSportsDB: club, partidos y tabla

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fan Portal backend escuchando en http://localhost:${PORT}`);
});
