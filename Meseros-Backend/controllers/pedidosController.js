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

    const mysql = db;
    mysql.beginTransaction((errTx) => {
      if (errTx) return res.status(500).json({ error: 'No se pudo iniciar la transacción' });

      // 1) Obtener producto para conocer precio y stock
      const getProducto = (cb) => {
        const sql = 'SELECT id, nombre, precio, stock, min_stock, restaurant_id FROM productos WHERE id = ?';
        mysql.query(sql, [producto_id], (errP, rowsP) => {
          if (errP) return cb(errP);
          if (!rowsP.length) return cb(Object.assign(new Error('Producto no encontrado'), { status: 404 }));
          const prod = rowsP[0];
          // Si hay restaurant_id en productos y no coincide, bloquear
          if (prod.restaurant_id != null && Number(prod.restaurant_id) !== Number(rid)) {
            return cb(Object.assign(new Error('Producto no pertenece al restaurante'), { status: 400 }));
          }
          cb(null, {
            nombre: prod.nombre,
            precio: Number(prod.precio || 0),
            stock: Number(prod.stock ?? 0),
            min_stock: (prod.min_stock == null ? null : Number(prod.min_stock)),
            // Consideramos que hay gestión de stock si la columna existe, aunque su valor sea NULL.
            // Esto permite inicializar de facto el stock en 0 y aplicar reglas/alertas.
            hasStock: Object.prototype.hasOwnProperty.call(prod, 'stock')
          });
        });
      };

      getProducto((eP, info) => {
        if (eP) {
          const code = eP.status || 500;
          return mysql.rollback(() => res.status(code).json({ error: eP.message }));
        }
        const cant = Number(cantidad || 0);
        if (!Number.isFinite(cant) || cant <= 0) {
          return mysql.rollback(() => res.status(400).json({ error: 'Cantidad inválida' }));
        }
        const precio = info.precio;
        const subtotal = precio * cant;

        // 2) Intentar decrementar stock de forma atómica si hay gestión de stock
        const updateStock = (cb) => {
          if (!info.hasStock) return cb(); // si la tabla no tiene columna stock, no gestionamos
          // Tratamos NULL como 0 para permitir gestión desde 0 unidades.
          const sqlUpdRid = 'UPDATE productos SET stock = IFNULL(stock,0) - ? WHERE id = ? AND restaurant_id = ? AND IFNULL(stock,0) >= ?';
          mysql.query(sqlUpdRid, [cant, producto_id, rid, cant], (eU, rU) => {
            if (eU && eU.code === 'ER_BAD_FIELD_ERROR') {
              const sqlUpd = 'UPDATE productos SET stock = IFNULL(stock,0) - ? WHERE id = ? AND IFNULL(stock,0) >= ?';
              return mysql.query(sqlUpd, [cant, producto_id, cant], (eU2, rU2) => {
                if (eU2) return cb(eU2);
                if (!rU2.affectedRows) {
                  const err = Object.assign(new Error('Stock insuficiente'), { code: 'STOCK_INSUFICIENTE', disponible: info.stock });
                  return cb(err);
                }
                cb();
              });
            }
            if (eU) return cb(eU);
            if (!rU.affectedRows) {
              const err = Object.assign(new Error('Stock insuficiente'), { code: 'STOCK_INSUFICIENTE', disponible: info.stock });
              return cb(err);
            }
            cb();
          });
        };

        updateStock((eS) => {
          if (eS) {
            const payload = { error: eS.message };
            if (eS.code === 'STOCK_INSUFICIENTE') {
              payload.code = 'STOCK_INSUFICIENTE';
              if (typeof eS.disponible === 'number') payload.disponible = eS.disponible;
            }
            return mysql.rollback(() => res.status(409).json(payload));
          }

          // 3) Insertar detalle
          const insert = 'INSERT INTO detallepedido (pedido_id, producto_id, cantidad, subtotal) VALUES (?, ?, ?, ?)';
          mysql.query(insert, [pedidoId, producto_id, cant, subtotal], (err2, result) => {
            if (err2) return mysql.rollback(() => res.status(500).json({ error: err2.message }));
            recalcPedidoTotal(pedidoId, (err3, total) => {
              if (err3) return mysql.rollback(() => res.status(500).json({ error: err3.message }));
              mysql.commit((errC) => {
                if (errC) return mysql.rollback(() => res.status(500).json({ error: 'No se pudo confirmar' }));
                // Advertencia de bajo stock para el cliente
                let warnings = undefined;
                if (info.hasStock && info.min_stock != null) {
                  const restante = Number((info.stock || 0) - cant);
                  if (restante <= Number(info.min_stock)) {
                    warnings = {
                      lowStock: true,
                      producto_id: Number(producto_id),
                      nombre: info.nombre,
                      restante,
                      min_stock: Number(info.min_stock)
                    };
                  }
                }
                res.json({ ok: true, id: result.insertId, total, warnings });
              });
            });
          });
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

    const mysql = db;
    mysql.beginTransaction((errTx) => {
      if (errTx) return res.status(500).json({ error: 'No se pudo iniciar la transacción' });
      // 1) Obtener detalle para saber producto y cantidad
      const qDet = 'SELECT producto_id, cantidad FROM detallepedido WHERE id = ? AND pedido_id = ?';
      mysql.query(qDet, [itemId, pedidoId], (eD, rD) => {
        if (eD) return mysql.rollback(() => res.status(500).json({ error: eD.message }));
        const det = rD?.[0];
        if (!det) return mysql.rollback(() => res.status(404).json({ error: 'Item no encontrado' }));
        const pid = det.producto_id;
        const cant = Number(det.cantidad || 0);

        // 2) Borrar item
        mysql.query('DELETE FROM detallepedido WHERE id = ? AND pedido_id = ?', [itemId, pedidoId], (errDel) => {
          if (errDel) return mysql.rollback(() => res.status(500).json({ error: errDel.message }));
          // 3) Devolver stock (si existe columna)
          const sqlUpRid = 'UPDATE productos SET stock = IFNULL(stock,0) + ? WHERE id = ? AND restaurant_id = ?';
          mysql.query(sqlUpRid, [cant, pid, rid], (eUp, rUp) => {
            if (eUp && eUp.code === 'ER_BAD_FIELD_ERROR') {
              return mysql.query('UPDATE productos SET stock = IFNULL(stock,0) + ? WHERE id = ?', [cant, pid], (eUp2) => {
                if (eUp2) return mysql.rollback(() => res.status(500).json({ error: eUp2.message }));
                recalcPedidoTotal(pedidoId, (eT, total) => {
                  if (eT) return mysql.rollback(() => res.status(500).json({ error: eT.message }));
                  mysql.commit((eC) => {
                    if (eC) return mysql.rollback(() => res.status(500).json({ error: 'No se pudo confirmar' }));
                    res.json({ ok: true, total });
                  });
                });
              });
            }
            if (eUp) return mysql.rollback(() => res.status(500).json({ error: eUp.message }));
            recalcPedidoTotal(pedidoId, (eT, total) => {
              if (eT) return mysql.rollback(() => res.status(500).json({ error: eT.message }));
              mysql.commit((eC) => {
                if (eC) return mysql.rollback(() => res.status(500).json({ error: 'No se pudo confirmar' }));
                res.json({ ok: true, total });
              });
            });
          });
        });
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

    resolveUsuarioId((resErr, usuarioIdMov0) => {
      if (resErr) return res.status(500).json({ error: resErr.message });
      const usuarioIdMov = usuarioIdMov0 || req.userId || null;
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

// Facturas (ventas cerradas) con items y propina.
exports.listarFacturas = (req, res) => {
  const rid = req.restaurantId;
  const { desde, hasta, limit = 100 } = req.query || {};
  const params = [rid];
  let whereDate = '';
  if (desde && hasta) { whereDate = ' AND DATE(m.fecha) BETWEEN ? AND ?'; params.push(desde, hasta); }
  else if (desde) { whereDate = ' AND DATE(m.fecha) >= ?'; params.push(desde); }
  else if (hasta) { whereDate = ' AND DATE(m.fecha) <= ?'; params.push(hasta); }

  const sql = `
    SELECT p.id AS pedido_id, p.mesa_id, p.mesero_id,
           COALESCE(me.nombre, meu.nombre) AS mesero_nombre,
           m.monto AS total, m.fecha AS pagado_en,
           COALESCE(SUM(mp.monto),0) AS propina
    FROM movimientoscontables m
    JOIN pedidos p ON p.id = m.pedido_id
    LEFT JOIN meseros me ON me.id = p.mesero_id
    LEFT JOIN meseros meu ON meu.usuario_id = m.usuario_id
    LEFT JOIN movimientoscontables mp ON mp.pedido_id = p.id AND mp.tipo='ingreso' AND mp.categoria='propina'
    WHERE m.restaurant_id = ? AND m.tipo='ingreso' AND m.categoria='venta' ${whereDate}
    GROUP BY p.id, p.mesa_id, p.mesero_id, mesero_nombre, m.monto, m.fecha
    ORDER BY m.fecha DESC
    LIMIT ${Number(limit) || 100}`;

  db.query(sql, params, async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const facturas = rows || [];
    if (!facturas.length) return res.json([]);
    // Traer items por pedido
    const getItems = (pedidoId) => new Promise((resolve) => {
      const q = `SELECT d.cantidad, d.subtotal, pr.nombre, pr.precio
                 FROM detallepedido d
                 LEFT JOIN productos pr ON pr.id = d.producto_id
                 WHERE d.pedido_id = ?
                 ORDER BY d.id ASC`;
      db.query(q, [pedidoId], (e, r) => {
        if (e) return resolve([]);
        resolve(r || []);
      });
    });
    const enriched = await Promise.all(facturas.map(async f => ({
      ...f,
      items: await getItems(f.pedido_id),
    })));
    res.json(enriched);
  });
};
