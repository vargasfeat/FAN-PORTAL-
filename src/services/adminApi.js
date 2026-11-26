import { API_TIMEOUT_MS } from '../config';
import { apiRequest } from './httpClient';

async function request(token, method, path, body) {
  return apiRequest(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
    timeoutMs: API_TIMEOUT_MS * 2, // las fotos tardan mas en subir
    fallbackErrorMessage: 'Error en la operación de administración.',
  });
}

export const listAdminProducts = (token) => request(token, 'GET', '/api/admin/products');
export const createProduct = (token, data) => request(token, 'POST', '/api/admin/products', data);
export const updateProduct = (token, id, data) => request(token, 'PUT', `/api/admin/products/${id}`, data);
export const uploadProductImage = (token, id, base64) =>
  request(token, 'POST', `/api/admin/products/${id}/image`, { image: base64 });
