import { apiRequest } from './httpClient';

// Datos de respaldo: si el backend esta caido, la app sigue mostrando algo coherente.
const OFFLINE = {
  team: {
    id: null,
    name: 'Tu club',
    league: 'Liga de Primera',
    stadium: null,
    location: 'Chile',
    formedYear: null,
    badge: null,
    description: null,
  },
  matches: [],
};

async function get(path) {
  return apiRequest(path, {
    fallbackErrorMessage: 'No se pudieron obtener los datos deportivos.',
  }); // { source: 'live' | 'fallback', data }
}

/** Nunca lanza error: ante una caida del middleware devuelve source = 'offline'. */
export async function fetchTeam() {
  try {
    return await get('/api/sports/team');
  } catch (e) {
    return { source: 'offline', data: OFFLINE.team };
  }
}

export async function fetchNextMatches() {
  try {
    return await get('/api/sports/matches/next');
  } catch (e) {
    return { source: 'offline', data: OFFLINE.matches };
  }
}

export async function fetchLastMatches() {
  try {
    return await get('/api/sports/matches/last');
  } catch (e) {
    return { source: 'offline', data: [] };
  }
}

export async function fetchStandings() {
  try {
    return await get('/api/sports/standings');
  } catch (e) {
    return { source: 'offline', data: [] };
  }
}

/** "2026-11-28" -> "sáb 28 nov" */
export function formatMatchDate(dateStr) {
  if (!dateStr) return 'Fecha por confirmar';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${days[date.getDay()]} ${d} ${months[m - 1]}`;
}
