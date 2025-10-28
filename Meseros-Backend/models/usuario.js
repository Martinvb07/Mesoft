const db = require('../config/db');
const bcrypt = require('bcrypt');

module.exports = {
  // 🧩 Obtener todos los usuarios
  getAll: (callback) => {
    db.query('SELECT * FROM usuarios', callback);
  },

  // 🧩 Obtener usuario por ID
  getById: (id, callback) => {
    db.query('SELECT * FROM usuarios WHERE id = ?', [id], callback);
  },

  // 🧩 Crear usuario
  create: (usuario, callback) => {
    db.query('INSERT INTO usuarios SET ?', usuario, callback);
  },

  // 🧩 Buscar usuario por correo
  findByCorreo: (correo, callback) => {
    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  // 🧩 Validar login (soporta contraseñas con hash y sin hash)
  validateLogin: (correo, contrasena, callback) => {
    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
      if (err) return callback(err);
      if (!results.length) return callback(null, false);

      const usuario = results[0];
      const hash = usuario.contrasena || '';

      try {
        // 🔹 Si la contraseña guardada parece hash bcrypt
        if (hash.startsWith('$2')) {
          const coincide = await bcrypt.compare(contrasena, hash);
          return callback(null, coincide ? usuario : false);
        }

        // 🔹 Si la contraseña es texto plano (antigua)
        if (hash === contrasena) {
          // ✅ Actualizar automáticamente a hash seguro
          const nuevoHash = await bcrypt.hash(contrasena, 10);
          db.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [nuevoHash, usuario.id], () => {
            console.log(`🔐 Usuario ${usuario.id} actualizado a hash bcrypt`);
          });
          return callback(null, usuario);
        }

        // ❌ Si no coincide
        return callback(null, false);
      } catch (error) {
        console.error('Error en validación de login:', error);
        return callback(error);
      }
    });
  }
};
