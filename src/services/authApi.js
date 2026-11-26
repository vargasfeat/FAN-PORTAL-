import { authenticate } from '../data/mockData';
import { apiRequest } from './httpClient';

/**
 * Inicio de sesion contra el backend (token JWT).
 *  - Credenciales incorrectas -> error visible para el usuario.
 *  - Servidor caido -> se usa el acceso de demostracion local (sin token, sin modo admin).
 */
export async function login(rut, password) {
  try {
    const json = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { rut, password },
      fallbackErrorMessage: 'No se pudo iniciar sesión.',
    });
    return { ...json.user, token: json.token };
  } catch (e) {
    if (e.status === 400 || e.status === 401 || e.status === 429) {
      e.isAuthError = true;
      throw e;
    }
    const user = await authenticate(rut, password); // modo demostracion sin servidor
    return { ...user, token: null };
  }
}

export async function register({ rut, nombre, email, password }) {
  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { rut, nombre, email, password },
    fallbackErrorMessage: 'Error al registrar usuario',
  });
  return data.usuario;
}

export async function updateProfile({ rut, nombre, email, password, token }) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const data = await apiRequest('/api/auth/profile', {
    method: 'PUT',
    headers,
    body: { rut, nombre, email, password },
    fallbackErrorMessage: 'Error al actualizar el perfil',
  });
  return data.usuario;
}
