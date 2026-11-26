import { API_TIMEOUT_MS, API_URL } from '../config';

async function request(token, method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS * 2); // las fotos tardan mas en subir
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
    return json;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('El servidor tardó demasiado en responder.');
    if (e.message === 'Network request failed' || e.message === 'Failed to fetch') {
      throw new Error('No hay conexión con el servidor.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const listAdminProducts = (token) => request(token, 'GET', '/api/admin/products');
export const createProduct = (token, data) => request(token, 'POST', '/api/admin/products', data);
export const updateProduct = (token, id, data) => request(token, 'PUT', `/api/admin/products/${id}`, data);
export const uploadProductImage = (token, id, base64) =>
  request(token, 'POST', `/api/admin/products/${id}/image`, { image: base64 });
