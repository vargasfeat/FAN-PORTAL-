/**
 * Rutas del catalogo — Fan Portal
 */
const express = require('express');
const router = express.Router();
const { list } = require('../controllers/products.controller');

router.get('/', list);

module.exports = router;
