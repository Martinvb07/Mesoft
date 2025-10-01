const db = require('../config/db');

function recalcPedidoTotal(pedidoId, cb) {
  const sql = 'SELECT COALESCE(SUM(subtotal),0) AS total FROM detallepedido WHERE pedido_id = ?';
  db.query(sql, [pedidoId], (err, rows) => {
    if (err) return cb(err);
    const total = rows[0]?.total || 0;
    db.query('UPDATE pedidos SET total = ? WHERE id = ?', [total, pedidoId], (err2) => {
      if (err2) return cb(err2);
      cb(null, total);
    });
  });
}

exports.obtenerPedido = (req, res) => {
  const id = req.params.id;
  const rid = req.restaurantId;
  db.query('SELECT * FROM pedidos WHERE id = ? AND restaurant_id = ?', [id, rid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0] || null);
  });
};

exports.listarItems = (req, res) => {
  const id = req.params.id;
  const rid = req.restaurantId;
  // Asegurar que el pedido pertenece al restaurante
  const qCheck = 'SELECT id FROM pedidos WHERE id = ? AND restaurant_id = ?';
  db.query(qCheck, [id, rid], (e0, r0) => {
    if (e0) return res.status(500).json({ error: e0.message });
    if (!r0.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    const sql = `SELECT d.*, p.nombre, p.precio FROM detallepedido d 
                 JOIN productos p ON p.id = d.producto_id 
                 WHERE d.pedido_id = ? ORDER BY d.id ASC`;
    db.query(sql, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
};

exports.agregarItem = (req, res) => {
  const pedidoId = req.params.id;
  const rid = req.restaurantId;
  const { producto_id, cantidad } = req.body;
  if (!producto_id || !cantidad) return res.status(400).json({ error: 'producto_id y cantidad requeridos' });
  // Verificar pedido pertenece al restaurante
  db.query('SELECT id FROM pedidos WHERE id = ? AND restaurant_id = ?', [pedidoId, rid], (e0, r0) => {
    if (e0) return res.status(500).json({ error: e0.message });
    if (!r0.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    // Obtener precio del producto (en el futuro podría filtrarse por restaurant_id si productos es multi-tenant)
    db.query('SELECT precio FROM productos WHERE id = ?', [producto_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
      const precio = rows[0].precio;
      const subtotal = Number(precio) * Number(cantidad);
      const insert = 'INSERT INTO detallepedido (pedido_id, producto_id, cantidad, subtotal) VALUES (?, ?, ?, ?)';
      db.query(insert, [pedidoId, producto_id, cantidad, subtotal], (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });
        recalcPedidoTotal(pedidoId, (err3, total) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({ ok: true, id: result.insertId, total });
        });
      });
    });
  });
};

exports.eliminarItem = (req, res) => {
  const pedidoId = req.params.id;
  const rid = req.restaurantId;
  const itemId = req.params.itemId;
  // Validar pedido
  db.query('SELECT id FROM pedidos WHERE id = ? AND restaurant_id = ?', [pedidoId, rid], (e0, r0) => {
    if (e0) return res.status(500).json({ error: e0.message });
    if (!r0.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    db.query('DELETE FROM detallepedido WHERE id = ? AND pedido_id = ?', [itemId, pedidoId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      recalcPedidoTotal(pedidoId, (err2, total) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ok: true, total });
      });
    });
  });
};

exports.cerrarPedido = (req, res) => {
  const pedidoId = req.params.id;
  const rid = req.restaurantId;
  db.query('UPDATE pedidos SET estado = \'cerrado\' WHERE id = ? AND restaurant_id = ?', [pedidoId, rid], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ ok: true });
  });
};

exports.registrarPago = (req, res) => {
  const pedidoId = req.params.id;
  const rid = req.restaurantId;
  const { recibido, propina = 0, mesero_id, usuario_id } = req.body;
  if (recibido == null) return res.status(400).json({ error: 'Monto recibido requerido' });

  // Obtener pedido (validando restaurant_id) y mesa
  const qPedido = 'SELECT p.*, m.id AS mesaId FROM pedidos p JOIN mesas m ON m.id = p.mesa_id WHERE p.id = ? AND p.restaurant_id = ?';
  db.query(qPedido, [pedidoId, rid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    const pedido = rows[0];
    const total = Number(pedido.total || 0);
    const recibidoNum = Number(recibido || 0);
    const propinaNum = Number(propina || 0);
    const cambio = Math.max(0, recibidoNum - total - propinaNum);

    const resolveUsuarioId = (cb) => {
      if (usuario_id) return cb(null, usuario_id);
      if (mesero_id) {
        db.query('SELECT usuario_id FROM meseros WHERE id = ?', [mesero_id], (e, r) => {
          if (e) return cb(e);
          return cb(null, r[0]?.usuario_id || null);
        });
      } else {
        cb(null, null);
      }
    };

    resolveUsuarioId((resErr, usuarioIdMov) => {
      if (resErr) return res.status(500).json({ error: resErr.message });
      // Inserción de venta
      const insVenta = 'INSERT INTO movimientoscontables (fecha, tipo, categoria, monto, descripcion, mesa_id, pedido_id, usuario_id, restaurant_id) VALUES (NOW(), \'ingreso\', ?, ?, ?, ?, ?, ?, ?)';
      const ventaDesc = `Venta pedido #${pedidoId} mesa ${pedido.mesa_id}`;
      db.query(insVenta, ['venta', total, ventaDesc, pedido.mesa_id, pedidoId, usuarioIdMov, rid], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const next = () => {
          // Cerrar pedido y marcar mesa a limpieza
          db.query('UPDATE pedidos SET estado = \'cerrado\' WHERE id = ? AND restaurant_id = ?', [pedidoId, rid], (err4) => {
            if (err4) return res.status(500).json({ error: err4.message });
            db.query('UPDATE mesas SET estado = \'limpieza\' WHERE id = ? AND restaurant_id = ?', [pedido.mesa_id, rid], (err5) => {
              if (err5) return res.status(500).json({ error: err5.message });
              res.json({ ok: true, cambio, total, propina: propinaNum });
            });
          });
        };
        if (propinaNum > 0) {
          const insProp = 'INSERT INTO movimientoscontables (fecha, tipo, categoria, monto, descripcion, mesa_id, pedido_id, usuario_id, restaurant_id) VALUES (NOW(), \'ingreso\', ?, ?, ?, ?, ?, ?, ?)';
          const propDesc = `Propina pedido #${pedidoId} mesa ${pedido.mesa_id}`;
          db.query(insProp, ['propina', propinaNum, propDesc, pedido.mesa_id, pedidoId, usuarioIdMov, rid], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            next();
          });
        } else {
          next();
        }
      });
    });
  });
};

// Pedidos en curso (para KPIs)
exports.listarEnCurso = (req, res) => {
  const rid = req.restaurantId;
  const sql = "SELECT id, mesa_id, mesero_id, total, fecha_hora FROM pedidos WHERE estado = 'en proceso' AND restaurant_id = ? ORDER BY fecha_hora DESC";
  db.query(sql, [rid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: rows.length, pedidos: rows });
  });
};
