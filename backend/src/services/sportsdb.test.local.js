// Verificacion manual contra la API real de TheSportsDB (no forma parte de produccion).
// Ejecutar desde la carpeta backend:  npm run test:sports
require('dotenv').config();
const { getTeamSafe, getNextMatchesSafe } = require('./sportsdb.service');

(async () => {
  console.log('--- TheSportsDB: consulta de prueba ---');

  const team = await getTeamSafe();
  console.log(`Club:        ${team.data.name}  [${team.source}]`);
  console.log(`Liga:        ${team.data.league}`);
  console.log(`Estadio:     ${team.data.stadium}`);

  const next = await getNextMatchesSafe();
  console.log(`\nProximos partidos [${next.source}]: ${next.data.length}`);
  next.data.slice(0, 3).forEach((m) => console.log(` - ${m.date} ${m.time || ''}  ${m.homeTeam} vs ${m.awayTeam}`));

  if (team.error || next.error) console.log(`\nAviso: ${team.error || next.error}`);
})();
