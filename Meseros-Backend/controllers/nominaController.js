const db = require('../config/db');

exports.listarMovimientos = (req, res) => {
  const { mesero_id, desde, hasta } = req.query;
  if (!desde || !hasta) return res.status(400).json({ error: 'desde y hasta requeridos (YYYY-MM-DD)' });
  const rid = req.restaurantId;
  const params = [];
  let where = 'restaurant_id = ? AND fecha BETWEEN ? AND ?';
  params.push(rid, `${desde} 00:00:00`, `${hasta} 23:59:59`);
  if (mesero_id) {
    where += ' AND mesero_id = ?';
    params.push(mesero_id);
  }
  const sql = `SELECT * FROM nomina_movimientos WHERE ${where} ORDER BY fecha ASC`;
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.crearMovimiento = (req, res) => {
  const { mesero_id, tipo, monto, descripcion, fecha } = req.body;
  const rid = req.restaurantId;
  if (!mesero_id || !tipo || monto == null) return res.status(400).json({ error: 'mesero_id, tipo, monto requeridos' });
  const sql = 'INSERT INTO nomina_movimientos (mesero_id, tipo, monto, descripcion, fecha, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [mesero_id, tipo, monto, descripcion || null, fecha || new Date(), rid], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, id: result.insertId });
  });
};

exports.eliminarMovimiento = (req, res) => {
  const id = req.params.id;
  const rid = req.restaurantId;
  db.query('DELETE FROM nomina_movimientos WHERE id = ? AND restaurant_id = ?', [id, rid], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ error: 'Movimiento no encontrado' });
    res.json({ ok: true });
  });
};
