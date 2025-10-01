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

            // Extraer nombre de restaurante del registro de usuario (columna 'restaurante')
            const restauranteNombre = usuario.restaurante || usuario.restaurant || null;

            function respond(restaurantId) {
                const { contrasena, ...userData } = usuario; // excluir hash
                res.json({ success: true, usuario: userData, restaurantId });
            }

            if (!restauranteNombre) {
                // Si el usuario no tiene nombre de restaurante asociado, usar el primero existente como fallback
                db.query('SELECT id FROM restaurantes ORDER BY id ASC LIMIT 1', (e2, rows) => {
                    if (e2) return res.status(500).json({ success: false, error: 'Error obteniendo restaurante.' });
                    const fallbackId = rows[0]?.id || null;
                    respond(fallbackId);
                });
                return;
            }

            // Buscar restaurante por nombre
            db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [restauranteNombre], (e3, rows) => {
                if (e3) return res.status(500).json({ success: false, error: 'Error buscando restaurante.' });
                if (rows.length) {
                    return respond(rows[0].id);
                }
                // Crear restaurante si no existe
                db.query('INSERT INTO restaurantes (nombre) VALUES (?)', [restauranteNombre], (e4, result) => {
                    if (e4) {
                        // Condición race: alguien lo creó entre SELECT e INSERT -> intentar leer de nuevo
                        if (e4.code === 'ER_DUP_ENTRY') {
                            return db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [restauranteNombre], (e5, r2) => {
                                if (e5) return res.status(500).json({ success: false, error: 'Error recuperando restaurante.' });
                                return respond(r2[0]?.id || null);
                            });
                        }
                        return res.status(500).json({ success: false, error: 'Error creando restaurante.' });
                    }
                    respond(result.insertId);
                });
            });
        });
    });

    module.exports = router;
