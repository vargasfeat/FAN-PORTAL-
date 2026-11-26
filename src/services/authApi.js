import { API_TIMEOUT_MS, API_URL } from '../config';
import { authenticate } from '../data/mockData';

/**
 * Inicio de sesion contra el backend (token JWT).
 *  - Credenciales incorrectas -> error visible para el usuario.
 *  - Servidor caido -> se usa el acceso de demostracion local (sin token, sin modo admin).
 */
export async function login(rut, password) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut, password }),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));

    if (res.status === 400 || res.status === 401 || res.status === 429) {
      const err = new Error(json.error || 'No se pudo iniciar sesión.');
      err.isAuthError = true;
      throw err;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ...json.user, token: json.token };
  } catch (e) {
    if (e.isAuthError) throw e;
    const user = await authenticate(rut, password); // modo demostracion sin servidor
    return { ...user, token: null };
  } finally {
    clearTimeout(timer);
  }
}
export async function register({ rut, nombre, email, password }) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rut, nombre, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrar usuario');
  return data.usuario;
}

export async function updateProfile({ rut, nombre, email, password, token }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ rut, nombre, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar el perfil');
  return data.usuario;
}