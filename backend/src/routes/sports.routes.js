/**
 * Rutas de datos deportivos (TheSportsDB) — Fan Portal
 */
const express = require('express');
const router = express.Router();
const { team, nextMatches, lastMatches, standings } = require('../controllers/sports.controller');

router.get('/team', team); // escudo y datos del club
router.get('/matches/next', nextMatches); // proximos partidos
router.get('/matches/last', lastMatches); // ultimos resultados
router.get('/standings', standings); // tabla de posiciones de la liga

module.exports = router;
