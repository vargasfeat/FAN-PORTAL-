/** Rutas de administracion del catalogo (requieren token de administrador). */
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { list, create, update, uploadImage } = require('../controllers/admin.controller');

router.use(requireAdmin);

router.get('/products', list); // todos los productos, incluso los ocultos
router.post('/products', create); // nuevo producto
router.put('/products/:id', update); // editar nombre, precio, stock, visibilidad
router.post('/products/:id/image', uploadImage); // subir foto (base64)

module.exports = router;
