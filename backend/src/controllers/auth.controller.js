/** POST /api/auth/login  { rut, password } -> { token, user } */
const { login } = require('../services/auth.service');

async function loginHandler(req, res) {
  try {
    const { rut, password } = req.body || {};
    const session = await login(rut, password);
    res.status(200).json(session);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.status ? error.message : 'Error interno del servidor.',
    });
  }
}

module.exports = { login: loginHandler };