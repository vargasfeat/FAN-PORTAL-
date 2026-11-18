/**
 * Servidor Express — Fan Portal (middleware)
 * Ejecutar: npm start   (puerto 3000 por defecto)
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cartRoutes = require('./routes/cart.routes');
const sportsRoutes = require('./routes/sports.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'fan-portal-backend' }));

app.use('/api/cart', cartRoutes); // PC-03: descuento de socio
app.use('/api/sports', sportsRoutes); // TheSportsDB: club y proximos partidos

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fan Portal backend escuchando en http://localhost:${PORT}`);
});
