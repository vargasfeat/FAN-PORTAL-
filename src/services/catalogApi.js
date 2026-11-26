import { fetchProducts as fetchMockProducts } from '../data/mockData';
import { apiRequest } from './httpClient';

/**
 * Catalogo de indumentaria desde el backend (archivo backend/data/catalog.json).
 * Si el backend no responde, usa los datos de ejemplo para que la tienda nunca quede vacia.
 * Firma identica a la del mock: fetchProducts({ page, limit }) -> { items, hasMore }
 */
export async function fetchProducts({ page = 0, limit = 6 } = {}) {
  try {
    const json = await apiRequest(`/api/products?page=${page}&limit=${limit}`, {
      fallbackErrorMessage: 'No se pudo cargar el catálogo.',
    });
    return { items: json.items, hasMore: json.hasMore, source: 'live' };
  } catch (e) {
    const fallback = await fetchMockProducts({ page, limit });
    return { ...fallback, source: 'offline' };
  }
}
