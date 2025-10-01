
const db = require('../config/db');

// Si prefieres usar Sequelize, aquí tienes un ejemplo de modelo de Usuario
// Si usas mysql2 puro, puedes omitir Sequelize y usar consultas directas

// Ejemplo con Sequelize:
// const sequelize = new Sequelize('meseros_db', 'root', '', { dialect: 'mysql' });
// const Usuario = sequelize.define('Usuario', { ... });

// Ejemplo con mysql2:
// Aquí solo exportamos funciones para interactuar con la tabla

const bcrypt = require('bcrypt');

module.exports = {
    getAll: (callback) => {
        db.query('SELECT * FROM usuarios', callback);
    },
    getById: (id, callback) => {
        db.query('SELECT * FROM usuarios WHERE id = ?', [id], callback);
    },
    create: (usuario, callback) => {
        db.query('INSERT INTO usuarios SET ?', usuario, callback);
    },
    findByCorreo: (correo, callback) => {
        db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },
    validateLogin: (correo, contrasena, callback) => {
        db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
            if (err) return callback(err);
            if (!results.length) return callback(null, false);
            const usuario = results[0];
            bcrypt.compare(contrasena, usuario.contrasena, (err, match) => {
                if (err) return callback(err);
                if (!match) return callback(null, false);
                callback(null, usuario);
            });
        });
    }
};
