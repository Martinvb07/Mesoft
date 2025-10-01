const db = require('../config/db');

// Versión simplificada post-migración: asumimos que la columna restaurant_id existe y es NOT NULL (o al menos siempre se envía rid)

exports.listarMeseros = (req, res) => {
  const rid = req.restaurantId;
  if (!rid) return res.status(400).json({ error: 'restaurantId no resuelto' });
  const sql = `SELECT me.id, me.usuario_id, me.nombre, me.estado, me.sueldo_base,
                      u.correo, u.restaurante
                FROM meseros me
                LEFT JOIN usuarios u ON u.id = me.usuario_id
                WHERE me.restaurant_id = ?
                ORDER BY me.nombre ASC`;
  db.query(sql, [rid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.crearMesero = (req, res) => {
  const rid = req.restaurantId;
  if (!rid) return res.status(400).json({ error: 'restaurantId no resuelto' });
  const { usuario_id = null, nombre, estado = 'activo', sueldo_base = null } = req.body || {};
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  const sql = 'INSERT INTO meseros (usuario_id, nombre, estado, sueldo_base, restaurant_id) VALUES (?, ?, ?, ?, ?)';
  const params = [usuario_id, nombre, estado, sueldo_base, rid].map(v => (v === undefined ? null : v));
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, id: result.insertId });
  });
};

exports.actualizarMesero = (req, res) => {
  const rid = req.restaurantId;
  if (!rid) return res.status(400).json({ error: 'restaurantId no resuelto' });
  const id = req.params.id;
  const { usuario_id, nombre, estado, sueldo_base } = req.body || {};
  const fields = [];
  const params = [];
  if (usuario_id !== undefined) { fields.push('usuario_id = ?'); params.push(usuario_id); }
  if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
  if (estado !== undefined) { fields.push('estado = ?'); params.push(estado); }
  if (sueldo_base !== undefined) { fields.push('sueldo_base = ?'); params.push(sueldo_base); }
  if (!fields.length) return res.status(400).json({ error: 'Nada para actualizar' });
  const sql = `UPDATE meseros SET ${fields.join(', ')} WHERE id = ? AND restaurant_id = ?`;
  params.push(id, rid);
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ error: 'Mesero no encontrado' });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};

exports.eliminarMesero = (req, res) => {
  const rid = req.restaurantId;
  if (!rid) return res.status(400).json({ error: 'restaurantId no resuelto' });
  const id = req.params.id;
  const sql = 'DELETE FROM meseros WHERE id = ? AND restaurant_id = ?';
  db.query(sql, [id, rid], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ error: 'Mesero no encontrado' });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};
