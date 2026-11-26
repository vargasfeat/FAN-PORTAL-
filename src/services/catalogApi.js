import { API_TIMEOUT_MS, API_URL } from '../config';
import { fetchProducts as fetchMockProducts } from '../data/mockData';

/**
 * Catalogo de indumentaria desde el backend (archivo backend/data/catalog.json).
 * Si el backend no responde, usa los datos de ejemplo para que la tienda nunca quede vacia.
 * Firma identica a la del mock: fetchProducts({ page, limit }) -> { items, hasMore }
 */
export async function fetchProducts({ page = 0, limit = 6 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/api/products?page=${page}&limit=${limit}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { items: json.items, hasMore: json.hasMore, source: 'live' };
  } catch (e) {
    const fallback = await fetchMockProducts({ page, limit });
    return { ...fallback, source: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}
