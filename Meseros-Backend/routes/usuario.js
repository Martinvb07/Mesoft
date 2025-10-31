const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const db = require('../config/db');
const bcrypt = require('bcrypt');

// 🧩 Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const results = await Usuario.getAll();
    res.json(results);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🧩 Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.getById(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error('Error obteniendo usuario por ID:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🧩 Crear usuario manualmente (solo admins)
router.post('/', async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    const raw = String(payload.contrasena || '');
    const looksHashed = raw.startsWith('$2');

    // Rol por defecto
    if (!payload.rol) payload.rol = 'mesero';

    // Si la contraseña viene en texto plano, hashearla
    if (raw && !looksHashed) {
      const hash = await bcrypt.hash(raw, 10);
      payload.contrasena = hash;
    }

    const id = await Usuario.create(payload);
    res.json({ id, ...payload });
  } catch (err) {
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// 🧩 Login
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ success: false, error: 'Correo y contraseña requeridos.' });
    }

    const usuario = await Usuario.validateLogin(correo, contrasena);
    console.log('Resultado validación:', usuario ? 'OK' : 'FALLÓ');

    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });
    }

    // ✅ Limpiar contraseña antes de responder
    const { contrasena: _, ...userData } = usuario;

    const rid = Number(usuario.restaurant_id);
    const hasRid = Number.isFinite(rid) && rid > 0;

    function respondOk(restaurantId) {
      res.json({ success: true, usuario: userData, restaurantId });
    }

    if (hasRid) {
      return respondOk(rid);
    }

    // 2️⃣ Resolver restaurante por nombre
    const restauranteNombre = usuario.restaurante || usuario.restaurant || null;
    if (!restauranteNombre) {
      const [rows] = await db.query('SELECT id FROM restaurantes ORDER BY id ASC LIMIT 1');
      return respondOk(rows[0]?.id || null);
    }

    // 3️⃣ Buscar restaurante por nombre o crearlo
    const [rows] = await db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [restauranteNombre]);
    if (rows.length) {
      return respondOk(rows[0].id);
    }

    try {
      const [insert] = await db.query('INSERT INTO restaurantes (nombre) VALUES (?)', [restauranteNombre]);
      respondOk(insert.insertId);
    } catch (e4) {
      if (e4.code === 'ER_DUP_ENTRY') {
        const [r2] = await db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [restauranteNombre]);
        return respondOk(r2[0]?.id || null);
      }
      console.error('Error creando restaurante:', e4);
      res.status(500).json({ success: false, error: 'Error creando restaurante.' });
    }

  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ success: false, error: 'Error interno en login.' });
  }
});

module.exports = router;