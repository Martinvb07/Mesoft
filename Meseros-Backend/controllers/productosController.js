const db = require('../config/db');

exports.listarProductos = (req, res) => {
  const rid = req.restaurantId;
  // Si la tabla productos aún no tiene restaurant_id, esto retornará todos; manejar error de columna desconocida.
  const sql = 'SELECT id, nombre, precio, descripcion FROM productos WHERE restaurant_id = ? ORDER BY nombre ASC';
  db.query(sql, [rid], (err, rows) => {
    if (err) {
      // fallback si aún no se migró productos para multi-tenant
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return db.query('SELECT id, nombre, precio, descripcion FROM productos ORDER BY nombre ASC', (e2, r2) => {
          if (e2) return res.status(500).json({ error: e2.message });
          res.json(r2);
        });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};
