const mysql = require('mysql2');

// Pool de conexiones para evitar que una única conexión fija se "muera"
// y deje la API colgada. El pool abre/cierra conexiones según la carga.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'meseros',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Error inicial al conectar al pool de base de datos:', err);
        return;
    }
    console.log('✅ Pool de base de datos inicializado correctamente');
    conn.release();
});

pool.on('error', (err) => {
    // Logueamos pero no matamos el proceso; el pool puede crear nuevas conexiones
    console.error('⚠️  Error en conexión MySQL del pool:', err);
});

module.exports = pool;
