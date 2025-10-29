const db = require('../config/db');

function getRestaurantId(req) {
  // Orígenes posibles del id (cabecera, query, body o variable de entorno)
  const hdr = req.headers['x-restaurant-id'] || req.headers['x-restaurant'] || req.headers['restaurant-id'];
  const q = req.query.restaurant_id || req.query.restaurante_id;
  const b = req.body ? (req.body.restaurant_id || req.body.restaurante_id) : undefined;
  // Si no se define DEFAULT_RESTAURANT_ID asumimos '1' para instalación monorestaurante

  const envDefault = process.env.DEFAULT_RESTAURANT_ID || '1';
  const val = hdr || q || b || envDefault;
  // Debug (se puede desactivar luego):
  if (process.env.DEBUG_RESTAURANT_ID === '1') {
    console.log('[mesasController] getRestaurantId ->', { hdr, q, b, envDefault, chosen: val });
  }
  if (val == null || val === '') return null; // última barrera; sólo retornará null si envDefault está vacío explícitamente
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
}

exports.listarMesas = (req, res) => {
  const restaurantId = req.restaurantId;
  const sql = `SELECT m.*, me.nombre AS mesero_nombre
               FROM mesas m
               LEFT JOIN meseros me ON me.id = m.mesero_id
               WHERE m.restaurant_id = ?
               ORDER BY m.numero ASC`;
  db.query(sql, [restaurantId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Nuevo: listar solo las mesas asignadas al usuario actual (X-Usuario-Id)
exports.listarMisMesas = (req, res) => {
  const restaurantId = req.restaurantId;
  const uid = req.userId;
  if (!restaurantId) return res.status(400).json({ error: 'restaurantId no resuelto' });
  if (!uid) return res.status(400).json({ error: 'usuario_id requerido (X-Usuario-Id)' });
  const sql = `SELECT m.*, me.nombre AS mesero_nombre
               FROM mesas m
               INNER JOIN meseros me ON me.id = m.mesero_id
               WHERE me.usuario_id = ? AND m.restaurant_id = ?
               ORDER BY m.numero ASC`;
  db.query(sql, [uid, restaurantId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.crearMesa = (req, res) => {
  const restaurantId = req.restaurantId;
  const { numero, capacidad = 4, estado = 'libre' } = req.body || {};
  if (numero == null || numero === '') return res.status(400).json({ error: 'numero requerido' });
  const cap = Number(capacidad) || 1;
  const est = String(estado || 'libre').toLowerCase();
  const sql = 'INSERT INTO mesas (numero, capacidad, estado, restaurant_id) VALUES (?, ?, ?, ?)';
  db.query(sql, [numero, cap, est, restaurantId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, id: result.insertId });
  });
};

exports.actualizarMesa = (req, res) => {
  const restaurantId = req.restaurantId;
  const id = req.params.id;
  const { numero, capacidad, estado, mesero_id } = req.body || {};
  const fields = [];
  const params = [];
  if (numero !== undefined) { fields.push('numero = ?'); params.push(numero); }
  if (capacidad !== undefined) { fields.push('capacidad = ?'); params.push(Number(capacidad) || 1); }
  if (estado !== undefined) { fields.push('estado = ?'); params.push(String(estado)); }
  if (mesero_id !== undefined) { fields.push('mesero_id = ?'); params.push(mesero_id || null); }
  if (!fields.length) return res.status(400).json({ error: 'Nada para actualizar' });
  const sql = `UPDATE mesas SET ${fields.join(', ')} WHERE id = ? AND restaurant_id = ?`;
  params.push(id, restaurantId);
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};

exports.eliminarMesa = (req, res) => {
  const restaurantId = req.restaurantId;
  const id = req.params.id;
  db.query('DELETE FROM mesas WHERE id = ? AND restaurant_id = ?', [id, restaurantId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};

exports.obtenerPedidoAbiertoDeMesa = (req, res) => {
  const restaurantId = req.restaurantId;
  const mesaId = req.params.id;
  const sql = `SELECT p.*, me.nombre AS mesero_nombre
               FROM pedidos p
               LEFT JOIN meseros me ON me.id = p.mesero_id
               WHERE p.mesa_id = ?
                 AND p.estado IN ('en proceso', 'entregado')
                 AND p.restaurant_id = ?
               ORDER BY p.fecha_hora DESC LIMIT 1`;
  db.query(sql, [mesaId, restaurantId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0] || null);
  });
};

exports.asignarMesa = (req, res) => {
  const restaurantId = req.restaurantId;
  const mesaId = req.params.id;
  const { mesero_id, usuario_id } = req.body;

  const resolveMeseroId = (cb) => {
    if (mesero_id) return cb(null, mesero_id);
    const uid = usuario_id || req.userId || null;
    if (uid) {
      db.query('SELECT id FROM meseros WHERE usuario_id = ?', [uid], (e, r) => {
        if (e) return cb(e);
        const mid = r[0]?.id || null;
        cb(null, mid);
      });
      return;
    }
    cb(null, null);
  };

  resolveMeseroId((errMid, meseroId) => {
    if (errMid) return res.status(500).json({ error: errMid.message });
    // Cambia estado a 'ocupada' y abre pedido si no hay
    const setMesa = meseroId
      ? 'UPDATE mesas SET estado = \'ocupada\', mesero_id = ? WHERE id = ? AND restaurant_id = ?'
      : 'UPDATE mesas SET estado = \'ocupada\' WHERE id = ? AND restaurant_id = ?';
    const setMesaParams = meseroId ? [meseroId, mesaId, restaurantId] : [mesaId, restaurantId];
    db.query(setMesa, setMesaParams, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      const find = 'SELECT id, mesero_id FROM pedidos WHERE mesa_id = ? AND restaurant_id = ? AND estado IN (\'en proceso\', \'entregado\') ORDER BY fecha_hora DESC LIMIT 1';
      db.query(find, [mesaId, restaurantId], (err2, rows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (rows.length) {
          const pedido = rows[0];
          if (meseroId && pedido.mesero_id && Number(pedido.mesero_id) !== Number(meseroId)) {
            return res.status(409).json({ ok: false, code: 'MESA_OCUPADA', message: 'Mesa ya asignada a otro mesero.' });
          }
          if (meseroId && !pedido.mesero_id) {
            db.query('UPDATE pedidos SET mesero_id = ? WHERE id = ?', [meseroId, pedido.id], () => {
              return res.json({ ok: true, pedido_id: pedido.id });
            });
          } else {
            return res.json({ ok: true, pedido_id: pedido.id });
          }
          return;
        }
        const insert = 'INSERT INTO pedidos (mesa_id, mesero_id, restaurant_id, fecha_hora, estado, total) VALUES (?, ?, ?, NOW(), \'en proceso\', 0)';
        db.query(insert, [mesaId, meseroId || null, restaurantId], (err3, result) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({ ok: true, pedido_id: result.insertId });
        });
      });
    });
  });
};

exports.liberarMesa = (req, res) => {
  const restaurantId = req.restaurantId;
  const mesaId = req.params.id;
  const sql = 'UPDATE mesas SET estado = \'libre\' WHERE id = ? AND restaurant_id = ?';
  db.query(sql, [mesaId, restaurantId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};

exports.ponerMesaEnLimpieza = (req, res) => {
  const restaurantId = req.restaurantId;
  const mesaId = req.params.id;
  const sql = 'UPDATE mesas SET estado = \'limpieza\' WHERE id = ? AND restaurant_id = ?';
  db.query(sql, [mesaId, restaurantId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};

exports.finalizarLimpieza = (req, res) => {
  const restaurantId = req.restaurantId;
  const mesaId = req.params.id;
  const sql = 'UPDATE mesas SET estado = \'libre\' WHERE id = ? AND restaurant_id = ?';
  db.query(sql, [mesaId, restaurantId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};

// Reservas
exports.reservarMesa = (req, res) => {
  const restaurantId = req.restaurantId;
  const id = req.params.id;
  const { reserva_at, reservado_por, telefono } = req.body || {};
  if (!reserva_at) return res.status(400).json({ error: 'reserva_at requerido (YYYY-MM-DD HH:mm:ss)' });
  const sql = `UPDATE mesas SET estado = 'reservada', reserva_at = ?, reservado_por = ?, telefono_reserva = ? WHERE id = ? AND restaurant_id = ?`;
  db.query(sql, [reserva_at, reservado_por || null, telefono || null, id, restaurantId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};

exports.cancelarReservaMesa = (req, res) => {
  const restaurantId = req.restaurantId;
  const id = req.params.id;
  const sql = `UPDATE mesas SET estado = 'libre', reserva_at = NULL, reservado_por = NULL, telefono_reserva = NULL WHERE id = ? AND restaurant_id = ?`;
  db.query(sql, [id, restaurantId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, affectedRows: result.affectedRows });
  });
};
