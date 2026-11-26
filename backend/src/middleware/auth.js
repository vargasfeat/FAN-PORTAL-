/** Protege rutas: exige "Authorization: Bearer <token>" con rol de administrador. */
const { verify } = require('../utils/jwt');

function requireAdmin(req, res, next) {
  const [type, token] = (req.headers.authorization || '').split(' ');
  const payload = type === 'Bearer' ? verify(token) : null;
  if (!payload) return res.status(401).json({ error: 'Sesión no válida o expirada. Vuelve a iniciar sesión.' });
  if (payload.role !== 'admin') return res.status(403).json({ error: 'Esta acción es solo para administradores.' });
  req.user = payload;
  next();
}

module.exports = { requireAdmin };
