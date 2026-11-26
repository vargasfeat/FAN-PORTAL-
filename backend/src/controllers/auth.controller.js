/** Controlador de autenticacion: login, registro y actualizacion de perfil. */
const { login, register, updateProfile } = require('../services/auth.service');

function handleAuthError(res, error) {
  if (!error.status) console.error('Error en auth.controller:', error);
  return res.status(error.status || 500).json({
    error: error.status ? error.message : 'Error interno del servidor.',
  });
}

async function loginHandler(req, res) {
  try {
    const { rut, password } = req.body || {};
    const session = await login(rut, password);
    res.status(200).json(session);
  } catch (error) {
    handleAuthError(res, error);
  }
}

async function registerHandler(req, res) {
  try {
    const { rut, nombre, email, password } = req.body || {};
    const usuario = await register({ rut, nombre, email, password });
    res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario,
    });
  } catch (error) {
    handleAuthError(res, error);
  }
}

async function updateProfileHandler(req, res) {
  try {
    const { nombre, email, password } = req.body || {};
    const usuario = await updateProfile(req.user?.sub, { nombre, email, password });
    res.status(200).json({
      mensaje: 'Perfil actualizado correctamente',
      usuario,
    });
  } catch (error) {
    handleAuthError(res, error);
  }
}

module.exports = {
  login: loginHandler,
  register: registerHandler,
  updateProfile: updateProfileHandler,
};