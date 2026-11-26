const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');

router.post('/login', login);


// Ruta agregada automáticamente para crear usuarios y probar login
router.post('/register', async (req, res) => {
  try {
    const { rut, nombre, email, password, rol } = req.body;

    if (!rut || !password) {
      return res.status(400).json({ error: 'RUT y contraseña obligatorios' });
    }

    const rutNormalizado = String(rut).replace(/\./g, '').trim().toUpperCase();
    const bcryptLib = typeof bcrypt !== 'undefined' ? bcrypt : require('bcryptjs');
    const hash = await bcryptLib.hash(String(password), 10);

    const query = `
      INSERT INTO users (rut, nombre, email, password_hash, rol)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, rut, nombre, rol
    `;

    const values = [
      rutNormalizado,
      nombre || 'Usuario Prueba',
      email || null,
      hash,
      rol || 'socio'
    ];

    const result = await pool.query(query, values);
    return res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error en /register:', error);
    return res.status(500).json({
      error: 'Error interno al crear usuario',
      detalle: error.message
    });
  }
});

module.exports = router;

