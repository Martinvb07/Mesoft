// config/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'meseros',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión inicial
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message);
  } else {
    console.log('✅ Conexión exitosa a la base de datos');
    conn.release();
  }
});

// Pool en modo promesa
const p = pool.promise();

/**
 * Adapter híbrido:
 * - Si llamas con callback (legacy): db.query(sql, params?, cb)
 * - Si llamas con await: const [rows, fields] = await db.query(sql, params)
 */
const db = {
  query(sql, params, cb) {
    // params opcional
    if (typeof params === 'function') { cb = params; params = []; }

    const promise = p.query(sql, params || []);

    if (typeof cb === 'function') {
      // Compatibilidad con código antiguo: callback(err, rows)
      promise
        .then(([rows]) => cb(null, rows))
        .catch((err) => cb(err, null));
      return; // cuando hay callback no devolvemos promesa
    }

    // Modo moderno: devuelve una promesa [rows, fields]
    return promise;
  },

  // escape/format
  escape: mysql.escape,
  format: mysql.format,
  pool,      // acceso al pool original (por si acaso)
  p          // acceso al promise pool (si lo requieres explícito)
};

module.exports = db;
