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
  // Tipos permitidos pensados para la UI: sueldo, extra, bono, deduccion, pago (y legacy: adelanto, descuento)
  const allowed = new Set(['sueldo','extra','bono','deduccion','pago','adelanto','descuento']);
  const normalized = String(tipo).toLowerCase();
  if (!allowed.has(normalized)) return res.status(400).json({ error: `tipo inválido: ${tipo}` });
  // Compatibilidad: si la BD antigua usa 'descuento' en vez de 'deduccion', lo mapeamos
  const tipoDb = normalized === 'deduccion' ? 'deduccion' : normalized;
  const sql = 'INSERT INTO nomina_movimientos (mesero_id, tipo, monto, descripcion, fecha, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [mesero_id, tipoDb, monto, descripcion || null, fecha || new Date(), rid], (err, result) => {
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

// Marcar o desmarcar pago de nómina para un mesero en una fecha (simple):
// body: { mesero_id, fecha (YYYY-MM-DD), pagado: boolean, monto?, descripcion? }
exports.marcarPago = (req, res) => {
  const { mesero_id, fecha, pagado, monto, descripcion } = req.body || {};
  const rid = req.restaurantId;
  if (!mesero_id || !fecha || typeof pagado !== 'boolean') return res.status(400).json({ error: 'mesero_id, fecha y pagado son requeridos' });
  const fechaIni = `${fecha} 00:00:00`;
  const fechaFin = `${fecha} 23:59:59`;

  if (pagado) {
    const sql = 'INSERT INTO nomina_movimientos (mesero_id, tipo, monto, descripcion, fecha, restaurant_id) VALUES (?, "pago", ?, ?, ?, ?)';
    db.query(sql, [mesero_id, Number(monto||0), descripcion || 'Pago nómina', `${fecha} 12:00:00`, rid], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, id: result.insertId });
    });
  } else {
    const sql = 'DELETE FROM nomina_movimientos WHERE mesero_id = ? AND tipo = "pago" AND fecha BETWEEN ? AND ? AND restaurant_id = ?';
    db.query(sql, [mesero_id, fechaIni, fechaFin, rid], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, deleted: result.affectedRows });
    });
  }
};
