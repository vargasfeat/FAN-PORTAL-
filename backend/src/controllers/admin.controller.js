/**
 * Controller de administracion — Fan Portal
 * Todas estas rutas pasan antes por requireAdmin (token con rol "admin").
 */
const catalog = require('../services/catalog.service');

const baseUrlOf = (req) => (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

async function handle(res, fn) {
  try {
    const result = await fn();
    res.status(200).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error(`[Admin] ${error.message}`);
    res.status(500).json({ error: 'Error interno al guardar el catálogo.' });
  }
}

const list = (req, res) =>
  handle(res, async () => ({ items: await catalog.listAllForAdmin(baseUrlOf(req)) }));

const create = (req, res) =>
  handle(res, () => catalog.createProduct(req.body, baseUrlOf(req)));

const update = (req, res) =>
  handle(res, () => catalog.updateProduct(req.params.id, req.body, baseUrlOf(req)));

const uploadImage = (req, res) =>
  handle(res, () => catalog.saveProductImage(req.params.id, (req.body || {}).image, baseUrlOf(req)));

module.exports = { list, create, update, uploadImage };