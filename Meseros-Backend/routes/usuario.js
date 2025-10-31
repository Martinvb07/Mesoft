const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const db = require('../config/db');
const bcrypt = require('bcrypt');

// 🧩 Obtener todos los usuarios
router.get('/', (req, res) => {
  Usuario.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 🧩 Obtener usuario por ID
router.get('/:id', (req, res) => {
  Usuario.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

// 🧩 Crear usuario manualmente (poco usado, solo admins)
router.post('/', (req, res) => {
  const payload = { ...(req.body || {}) };
  const raw = String(payload.contrasena || '');
  const looksHashed = raw.startsWith('$2');

  if (!payload.rol) payload.rol = 'mesero';

  const doCreate = (finalPayload) => {
    Usuario.create(finalPayload, (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: results.insertId, ...finalPayload });
    });
  };

  if (raw && !looksHashed) {
    bcrypt.hash(raw, 10, (eH, hash) => {
      if (eH) return res.status(500).json({ error: 'Error generando hash' });
      payload.contrasena = hash;
      doCreate(payload);
    });
    return;
  }
  doCreate(payload);
});

// 🧩 Login
router.post('/login', (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ success: false, error: 'Correo y contraseña requeridos.' });
  }

  Usuario.validateLogin(correo, contrasena, (err, usuario) => {
    console.log('Resultado validación:', usuario ? 'OK' : 'FALLÓ');
    if (err) return res.status(500).json({ success: false, error: 'Error interno.' });
    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });
    }

    const { contrasena: _, ...userData } = usuario;
    const rid = Number(usuario.restaurant_id);
    const hasRid = Number.isFinite(rid) && rid > 0;

    function respondOk(restaurantId) {
      res.json({ success: true, usuario: userData, restaurantId });
    }

    if (hasRid) {
      return respondOk(rid);
    }

    const restauranteNombre = usuario.restaurante || usuario.restaurant || null;

    if (!restauranteNombre) {
      db.query('SELECT id FROM restaurantes ORDER BY id ASC LIMIT 1', (e2, rows) => {
        if (e2) return res.status(500).json({ success: false, error: 'Error obteniendo restaurante.' });
        const fallbackId = rows[0]?.id || null;
        respondOk(fallbackId);
      });
      return;
    }

    db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [restauranteNombre], (e3, rows) => {
      if (e3) return res.status(500).json({ success: false, error: 'Error buscando restaurante.' });
      if (rows.length) {
        return respondOk(rows[0].id);
      }

      db.query('INSERT INTO restaurantes (nombre) VALUES (?)', [restauranteNombre], (e4, result) => {
        if (e4) {
          if (e4.code === 'ER_DUP_ENTRY') {
            return db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [restauranteNombre], (e5, r2) => {
              if (e5) return res.status(500).json({ success: false, error: 'Error recuperando restaurante.' });
              return respondOk(r2[0]?.id || null);
            });
          }
          return res.status(500).json({ success: false, error: 'Error creando restaurante.' });
        }
        respondOk(result.insertId);
      });
    });
  });
});

module.exports = router;
