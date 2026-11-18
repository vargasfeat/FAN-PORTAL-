/**
 * Rutas de carrito y checkout — Fan Portal
 */

const express = require('express');
const router = express.Router();
const { getDiscount } = require('../controllers/cart.controller');

// PC-03: calcula el 15% de descuento de socio sobre el subtotal del carrito
router.post('/discount', getDiscount);

// TODO: POST /api/checkout -> simula el pago y registra el pedido (PC-04)

module.exports = router;
