import { API_TIMEOUT_MS, API_URL } from '../config';

const BASE_URL = String(API_URL || '').replace(/\/+$/, '');

function isJsonResponse(response) {
  return Boolean(response.headers?.get('content-type')?.toLowerCase().includes('application/json'));
}

/**
 * Parsea de forma segura una respuesta fetch:
 * - Verifica `content-type` y `response.ok` antes de ejecutar `response.json()`.
 * - Evita errores de parseo JSON cuando el servidor responde HTML (404/500/proxy).
 */
export async function parseJsonResponse(response, fallbackErrorMessage = 'Error al comunicarse con el servidor.') {
  const isJson = isJsonResponse(response);

  if (!response.ok) {
    let errorData = null;
    if (isJson) {
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
    }

    const message =
      (errorData && (errorData.error || errorData.message)) ||
      (isJson
        ? `${fallbackErrorMessage} (HTTP ${response.status})`
        : `El servidor devolvió una respuesta no válida (HTTP ${response.status}).`);

    const err = new Error(message);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  if (!isJson) {
    const err = new Error(`Respuesta inesperada del servidor: se esperaba JSON (HTTP ${response.status}).`);
    err.status = response.status;
    throw err;
  }

  try {
    return await response.json();
  } catch {
    const err = new Error('No se pudo interpretar la respuesta JSON del servidor.');
    err.status = response.status;
    throw err;
  }
}

/**
 * Cliente HTTP centralizado con timeout y parseo seguro de respuestas JSON.
 */
export async function apiRequest(
  path,
  { method = 'GET', headers = {}, body, timeoutMs = API_TIMEOUT_MS, fallbackErrorMessage } = {}
) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = { ...headers };
  let requestBody = body;

  if (body !== undefined && typeof body !== 'string') {
    if (!requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }
    requestBody = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${normalizedPath}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });
    return await parseJsonResponse(response, fallbackErrorMessage);
  } catch (e) {
    if (e?.name === 'AbortError') {
      const err = new Error('El servidor tardó demasiado en responder.');
      err.isTimeout = true;
      throw err;
    }
    if (e?.message === 'Network request failed' || e?.message === 'Failed to fetch') {
      const err = new Error('No hay conexión con el servidor.');
      err.isNetworkError = true;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
