require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// Utilidad para detectar si un string parece un hash bcrypt válido
function isBcryptHash(value) {
  return typeof value === 'string' && value.startsWith('$2') && value.length >= 50;
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function run() {
  try {
    console.log('Buscando usuarios con contraseñas sin encriptar...');
    const usuarios = await query('SELECT id, correo, contrasena FROM usuarios');

    const pendientes = usuarios.filter(u => !isBcryptHash(u.contrasena));
    if (!pendientes.length) {
      console.log('No se encontraron contraseñas en texto plano. Nada que hacer.');
      process.exit(0);
    }

    console.log(`Se encontraron ${pendientes.length} usuario(s) con contraseña en texto plano. Procediendo a encriptar...`);

    let ok = 0;
    let fail = 0;
    for (const u of pendientes) {
      const plain = String(u.contrasena || '');
      if (!plain) {
        console.warn(`Usuario id=${u.id} correo=${u.correo} tiene contraseña vacía o nula. Omitiendo.`);
        continue;
      }
      try {
        const hash = await bcrypt.hash(plain, 10);
        await query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [hash, u.id]);
        ok++;
        console.log(`✔ Actualizado id=${u.id} (${u.correo})`);
      } catch (e) {
        fail++;
        console.error(`✖ Error actualizando id=${u.id} (${u.correo}):`, e.message);
      }
    }

    console.log(`Hecho. Exitosos: ${ok}, Fallidos: ${fail}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    // Cierra la conexión de manera ordenada
    try { db.end && db.end(); } catch (_) {}
  }
}

run();
