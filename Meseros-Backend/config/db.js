const mysql = require('mysql2');

// Crear un pool de conexiones (en lugar de una sola conexión)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'meseros',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión inicial
pool.getConnection((err, connection) => {
  if (err) {
    console.error(' Error al conectar a la base de datos:', err.message);
  } else {
    console.log('✅Conexión exitosa a la base de datos');
    connection.release();
  }
});

// Mantener viva la conexión con un ping cada minuto
setInterval(async () => {
  try {
    const promisePool = pool.promise();
    await promisePool.query('SELECT 1');
    
  } catch (err) {
    console.error('Error en ping DB:', err.message);
  }
}, 60000); // cada 60 segundos

// Exportar el pool como promesa
module.exports = pool.promise();
