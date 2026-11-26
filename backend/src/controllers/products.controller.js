/**
 * Controller del catalogo — Fan Portal
 * GET /api/products?page=0&limit=6
 */
const { listProducts } = require('../services/catalog.service');

async function list(req, res) {
  const page = Math.max(0, parseInt(req.query.page, 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
  const baseUrl = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

  try {
    const data = await listProducts({ page, limit, baseUrl });
    res.status(200).json(data);
  } catch (error) {
    console.error(`[Catalogo] ${error.message}`);
    res.status(500).json({ error: 'No se pudo leer el catalogo desde la base de datos.' });
  }
}

module.exports = { list };