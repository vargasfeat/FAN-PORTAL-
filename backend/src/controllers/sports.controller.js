/**
 * Controller de datos deportivos — Fan Portal
 * Expone al frontend la informacion del club, sus partidos y la tabla de la liga.
 */
const {
  getTeamSafe,
  getNextMatchesSafe,
  getLastMatchesSafe,
  getStandingsSafe,
} = require('../services/sportsdb.service');

/** GET /api/sports/team */
async function team(req, res) {
  res.status(200).json(await getTeamSafe());
}

/** GET /api/sports/matches/next */
async function nextMatches(req, res) {
  res.status(200).json(await getNextMatchesSafe());
}

/** GET /api/sports/matches/last */
async function lastMatches(req, res) {
  res.status(200).json(await getLastMatchesSafe());
}

/** GET /api/sports/standings */
async function standings(req, res) {
  res.status(200).json(await getStandingsSafe());
}

module.exports = { team, nextMatches, lastMatches, standings };
