const db = require('../config/db');
const bcrypt = require('bcrypt');

module.exports = {
  // 🔹 Obtener todos los usuarios
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM usuarios');
    return rows;
  },

  // 🔹 Obtener usuario por ID
  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return rows[0];
  },

  // 🔹 Crear usuario
  create: async (usuario) => {
    const [result] = await db.query('INSERT INTO usuarios SET ?', usuario);
    return result.insertId;
  },

  // 🔹 Buscar usuario por correo
  findByCorreo: async (correo) => {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    return rows[0];
  },

  // 🔹 Validar login (soporta contraseñas con hash y sin hash)
  validateLogin: async (correo, contrasena) => {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    if (!rows.length) return false;

    const usuario = rows[0];
    const hash = usuario.contrasena || '';

    try {
      // Si la contraseña guardada parece hash bcrypt
      if (hash.startsWith('$2')) {
        const coincide = await bcrypt.compare(contrasena, hash);
        return coincide ? usuario : false;
      }

      // Si la contraseña es texto plano (antigua)
      if (hash === contrasena) {
        const nuevoHash = await bcrypt.hash(contrasena, 10);
        await db.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [nuevoHash, usuario.id]);
        console.log(`🔐 Usuario ${usuario.id} actualizado a hash bcrypt`);
        return usuario;
      }

      // Si no coincide
      return false;
    } catch (error) {
      console.error('Error en validación de login:', error);
      throw error;
    }
  }
};
