/** Protege rutas: exige "Authorization: Bearer <token>". */
const { verify } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const [type, token] = (req.headers.authorization || '').split(' ');
  const payload = type === 'Bearer' ? verify(token) : null;
  if (!payload) return res.status(401).json({ error: 'Sesión no válida o expirada. Vuelve a iniciar sesión.' });
  req.user = payload;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Esta acción es solo para administradores.' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
