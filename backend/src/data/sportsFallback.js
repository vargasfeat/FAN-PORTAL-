/**
 * Datos de respaldo para cuando TheSportsDB no responde o el plan gratuito
 * no entrega el dato (degradacion suave: la app nunca queda sin informacion).
 */
function buildFallback(teamName) {
  return {
    team: {
      id: null,
      name: teamName,
      league: 'Liga de Primera',
      stadium: 'Estadio por confirmar',
      location: 'Chile',
      formedYear: null,
      badge: null,
      description: 'Informacion del club no disponible por el momento.',
    },
    matches: [],
    standings: [],
  };
}

module.exports = { buildFallback };
