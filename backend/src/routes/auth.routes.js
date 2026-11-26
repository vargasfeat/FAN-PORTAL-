const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { login, register, updateProfile } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/register', register);
router.put('/profile', requireAuth, updateProfile);

module.exports = router;

