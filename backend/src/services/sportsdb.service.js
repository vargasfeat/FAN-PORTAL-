/**
 * Servicio TheSportsDB — Fan Portal
 *
 * Consume la API v1 de TheSportsDB desde el middleware, de modo que:
 *  - la llave de API nunca viaja en la app movil,
 *  - se respeta el limite del plan gratuito (30 peticiones/min) con cache en memoria,
 *  - si la API falla, se responde con datos de respaldo (degradacion suave).
 *
 * Limites del plan gratuito (segun la documentacion oficial):
 *  proximo/ultimo partido por equipo: 1 (solo de local) | tabla de posiciones: 5 filas
 *  Con llave Premium suben a 10 partidos y 100 filas, sin cambiar este codigo.
 *
 * Documentacion: https://www.thesportsdb.com/documentation
 */
const cache = require('../utils/cache');
const { buildFallback } = require('../data/sportsFallback');

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
const REQUEST_TIMEOUT_MS = 8000;
const FREE_KEYS = ['123', '3'];

function getConfig() {
  const apiKey = process.env.SPORTSDB_API_KEY || '123';
  return {
    apiKey,
    isFreeKey: FREE_KEYS.includes(apiKey),
    leagueId: process.env.SPORTSDB_LEAGUE_ID || '4627', // Chile Primera Division
    season: process.env.SPORTSDB_SEASON || String(new Date().getFullYear()), // la liga chilena usa un solo año
    teamName: process.env.TEAM_NAME || 'Colo-Colo',
    teamId: (process.env.TEAM_ID || '').trim(), // opcional: evita la busqueda por nombre
    ttlMs: Number(process.env.CACHE_TTL_MINUTES || 10) * 60 * 1000,
  };
}

/** GET a TheSportsDB con tiempo maximo de espera. Lanza error si la respuesta no es valida. */
async function request(endpoint, params = {}) {
  const { apiKey } = getConfig();
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/${apiKey}/${endpoint}${query ? `?${query}` : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 429) throw new Error('Limite de peticiones de TheSportsDB alcanzado (429).');
    if (!res.ok) throw new Error(`TheSportsDB respondio ${res.status}.`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

/** Normaliza un equipo al formato que usa el Fan Portal. */
function mapTeam(t) {
  return {
    id: t.idTeam,
    name: t.strTeam,
    league: t.strLeague,
    stadium: t.strStadium || null,
    location: t.strLocation || t.strCountry || null,
    formedYear: num(t.intFormedYear),
    badge: t.strBadge || t.strTeamBadge || null,
    description: t.strDescriptionES || t.strDescriptionEN || null,
  };
}

/** Normaliza un partido al formato que usa el Fan Portal. */
function mapEvent(e) {
  return {
    id: e.idEvent,
    name: e.strEvent,
    league: e.strLeague,
    homeTeam: e.strHomeTeam,
    awayTeam: e.strAwayTeam,
    homeBadge: e.strHomeTeamBadge || null,
    awayBadge: e.strAwayTeamBadge || null,
    homeScore: num(e.intHomeScore),
    awayScore: num(e.intAwayScore),
    date: e.dateEvent || null, // AAAA-MM-DD
    time: e.strTime ? e.strTime.slice(0, 5) : null, // HH:MM (hora UTC segun TheSportsDB)
    venue: e.strVenue || null,
    round: num(e.intRound),
  };
}

/** Normaliza una fila de la tabla de posiciones. */
function mapStanding(r) {
  return {
    rank: num(r.intRank),
    teamId: r.idTeam,
    team: r.strTeam,
    badge: r.strBadge || r.strTeamBadge || null,
    played: num(r.intPlayed),
    won: num(r.intWin),
    drawn: num(r.intDraw),
    lost: num(r.intLoss),
    goalsFor: num(r.intGoalsFor),
    goalsAgainst: num(r.intGoalsAgainst),
    goalDifference: num(r.intGoalDifference),
    points: num(r.intPoints),
    form: r.strForm || null,
  };
}

const sameTeam = (a, b) => !!a && !!b && a.toLowerCase().includes(b.toLowerCase());
const byDateAsc = (a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
const byDateDesc = (a, b) => byDateAsc(b, a);

/**
 * Obtiene el club configurado.
 *  - Con TEAM_ID: lookupteam.php (lo mas confiable con la llave gratuita).
 *  - Sin TEAM_ID: busca TEAM_NAME dentro de lookup_all_teams (por ID de liga),
 *    porque searchteams del plan gratuito solo devuelve un equipo de ejemplo.
 */
async function getTeam() {
  const { leagueId, teamName, teamId, ttlMs } = getConfig();
  const key = teamId ? `team:id:${teamId}` : `team:${leagueId}:${teamName}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let raw;
  if (teamId) {
    const data = await request('lookupteam.php', { id: teamId });
    raw = (data.teams || [])[0];
    if (!raw) throw new Error(`TheSportsDB no devolvio datos para TEAM_ID=${teamId}.`);
  } else {
    const data = await request('lookup_all_teams.php', { id: leagueId });
    const teams = data.teams || [];
    const wanted = teamName.trim().toLowerCase();
    raw =
      teams.find((t) => (t.strTeam || '').toLowerCase() === wanted) ||
      teams.find((t) => (t.strTeam || '').toLowerCase().includes(wanted));

    if (!raw) {
      const names = teams.map((t) => t.strTeam).filter(Boolean);
      throw new Error(
        names.length
          ? `No se encontro "${teamName}" entre los equipos que entrega tu llave: ${names.join(', ')}. ` +
              'Cambia TEAM_NAME o define TEAM_ID en el archivo .env.'
          : `TheSportsDB no devolvio equipos para la liga ${leagueId} con tu llave. Define TEAM_ID en el archivo .env.`
      );
    }
  }

  const team = mapTeam(raw);
  cache.set(key, team, ttlMs);
  return team;
}

/**
 * Partidos del club. Primero consulta por equipo (eventsnext / eventslast);
 * si no hay resultados, busca en los de la liga los que involucran al club.
 */
async function fetchClubEvents(teamEndpoint, leagueEndpoint) {
  const { leagueId } = getConfig();
  const team = await getTeam();
  let events = (await request(teamEndpoint, { id: team.id })).events || [];

  if (events.length === 0) {
    const league = (await request(leagueEndpoint, { id: leagueId })).events || [];
    events = league.filter((e) => sameTeam(e.strHomeTeam, team.name) || sameTeam(e.strAwayTeam, team.name));
  }
  return { team, events: events.map(mapEvent) };
}

/** Proximos partidos del club, ordenados por fecha. */
async function getNextMatches() {
  const { teamId, teamName, ttlMs } = getConfig();
  const key = `next:${teamId || teamName}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { events } = await fetchClubEvents('eventsnext.php', 'eventsnextleague.php');
  const matches = events.sort(byDateAsc);
  cache.set(key, matches, ttlMs);
  return matches;
}

/** Ultimos resultados del club (el mas reciente primero), con el desenlace para el club. */
async function getLastMatches() {
  const { teamId, teamName, ttlMs } = getConfig();
  const key = `last:${teamId || teamName}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { team, events } = await fetchClubEvents('eventslast.php', 'eventspastleague.php');
  const matches = events
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .map((m) => {
      const isHome = sameTeam(m.homeTeam, team.name);
      const mine = isHome ? m.homeScore : m.awayScore;
      const theirs = isHome ? m.awayScore : m.homeScore;
      return { ...m, outcome: mine > theirs ? 'W' : mine < theirs ? 'L' : 'D' };
    })
    .sort(byDateDesc);

  cache.set(key, matches, ttlMs);
  return matches;
}

/** Tabla de posiciones de la liga; marca la fila del club con isClub. */
async function getStandings() {
  const { leagueId, season, ttlMs } = getConfig();
  const key = `table:${leagueId}:${season}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await request('lookuptable.php', { l: leagueId, s: season });
  const rows = (data.table || []).map(mapStanding).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  if (rows.length === 0) {
    throw new Error(`TheSportsDB no entrego la tabla de la liga ${leagueId} (temporada ${season}) con tu llave.`);
  }

  let club = null;
  try {
    club = await getTeam();
  } catch (e) {
    /* sin club identificado: la tabla se muestra igual, solo sin resaltar */
  }
  const table = rows.map((r) => ({
    ...r,
    isClub: !!club && (String(r.teamId) === String(club.id) || sameTeam(r.team, club.name)),
  }));

  cache.set(key, table, ttlMs);
  return table;
}

/**
 * Envuelve una consulta con respaldo: si falla, devuelve datos de respaldo
 * y marca source = "fallback" para que la app pueda avisar al usuario.
 * "limited" indica que se usa la llave gratuita (datos acotados por el proveedor).
 */
async function withFallback(fn, pick) {
  const { teamName, isFreeKey } = getConfig();
  try {
    return { source: 'live', limited: isFreeKey, data: await fn() };
  } catch (error) {
    console.warn(`[TheSportsDB] ${error.message}`);
    return { source: 'fallback', limited: isFreeKey, data: pick(buildFallback(teamName)), error: error.message };
  }
}

const getTeamSafe = () => withFallback(getTeam, (f) => f.team);
const getNextMatchesSafe = () => withFallback(getNextMatches, (f) => f.matches);
const getLastMatchesSafe = () => withFallback(getLastMatches, (f) => f.matches);
const getStandingsSafe = () => withFallback(getStandings, (f) => f.standings);

module.exports = {
  getTeam,
  getNextMatches,
  getLastMatches,
  getStandings,
  getTeamSafe,
  getNextMatchesSafe,
  getLastMatchesSafe,
  getStandingsSafe,
  mapTeam,
  mapEvent,
  mapStanding,
};
