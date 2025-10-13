    const express = require('express');
    const router = express.Router();
    const Usuario = require('../models/usuario');
    const db = require('../config/db');

    router.get('/', (req, res) => {
    Usuario.getAll((err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
    });

    router.get('/:id', (req, res) => {
    Usuario.getById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results[0]);
    });
    });

    router.post('/', (req, res) => {
    Usuario.create(req.body, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ id: results.insertId, ...req.body });
    });
    });

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

            // 1) Si el usuario ya tiene restaurant_id numérico, usarlo
            const rid = Number(usuario.restaurant_id);
            const hasRid = Number.isFinite(rid) && rid > 0;

            function persistAndRespond(restaurantId) {
                const { contrasena, ...userData } = usuario; // excluir hash
                // Guardar restaurant_id en el usuario si no lo tiene aún
                if (!usuario.restaurant_id && Number(restaurantId) > 0) {
                    db.query('UPDATE usuarios SET restaurant_id = ? WHERE id = ?', [restaurantId, usuario.id], (eUpd) => {
                        if (eUpd) console.warn('[login] no se pudo persistir restaurant_id para usuario', usuario.id, eUpd.message);
                        res.json({ success: true, usuario: { ...userData, restaurant_id: restaurantId }, restaurantId });
                    });
                    return;
                }
                res.json({ success: true, usuario: userData, restaurantId });
            }

            if (hasRid) {
                return persistAndRespond(rid);
            }

            // 2) Resolver por nombre (columna 'restaurante' o 'restaurant')
            const restauranteNombre = usuario.restaurante || usuario.restaurant || null;

            if (!restauranteNombre) {
                // 3) Fallback: primer restaurante existente
                db.query('SELECT id FROM restaurantes ORDER BY id ASC LIMIT 1', (e2, rows) => {
                    if (e2) return res.status(500).json({ success: false, error: 'Error obteniendo restaurante.' });
                    const fallbackId = rows[0]?.id || null;
                    persistAndRespond(fallbackId);
                });
                return;
            }

            // Buscar restaurante por nombre
            db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [restauranteNombre], (e3, rows) => {
                if (e3) return res.status(500).json({ success: false, error: 'Error buscando restaurante.' });
                if (rows.length) {
                    return persistAndRespond(rows[0].id);
                }
                // Crear restaurante si no existe (requiere UNIQUE en nombre para robustez)
                db.query('INSERT INTO restaurantes (nombre) VALUES (?)', [restauranteNombre], (e4, result) => {
                    if (e4) {
                        if (e4.code === 'ER_DUP_ENTRY') {
                            return db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [restauranteNombre], (e5, r2) => {
                                if (e5) return res.status(500).json({ success: false, error: 'Error recuperando restaurante.' });
                                return respond(r2[0]?.id || null);
                            });
                        }
                        return res.status(500).json({ success: false, error: 'Error creando restaurante.' });
                    }
                    persistAndRespond(result.insertId);
                });
            });
        });
    });

    module.exports = router;
