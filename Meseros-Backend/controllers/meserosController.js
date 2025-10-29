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

  const {
    usuario_id = null,
    nombre,
    estado = 'activo',
    sueldo_base = null,
    correo,           // requerido
    contrasena,       // requerido
    apellido,         // opcional (para nombre completo del usuario)
  } = req.body || {};

  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios para crear un mesero con acceso' });
  }

  // helper para insertar mesero una vez que tengamos un usuario
  const insertMesero = (uid) => {
    const sql = 'INSERT INTO meseros (usuario_id, nombre, estado, sueldo_base, restaurant_id) VALUES (?, ?, ?, ?, ?)';
    const params = [uid ?? usuario_id, nombre, estado, sueldo_base, rid].map(v => (v === undefined ? null : v));
    db.query(sql, params, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const linkedUserId = (uid ?? usuario_id) || null;
      res.json({ ok: true, id: result.insertId, usuario_id: linkedUserId });
    });
  };

  // Crear usuario y luego el mesero dentro de una transacción para consistencia
  const mysql = db; // misma conexión
  mysql.beginTransaction((errTx) => {
    if (errTx) return res.status(500).json({ error: 'No se pudo iniciar la transacción' });

    // 1) Verificar unicidad de correo
    mysql.query('SELECT id FROM usuarios WHERE correo = ? LIMIT 1', [correo], (errSel, rows) => {
      if (errSel) {
        return mysql.rollback(() => res.status(500).json({ error: errSel.message }));
      }
      if (rows && rows.length) {
        // correo ya existe -> evitar duplicados
        return mysql.rollback(() => res.status(409).json({ error: 'El correo ya está registrado' }));
      }

      // 2) Obtener nombre del restaurante y verificar si existe columna 'restaurante' en usuarios
      mysql.query('SELECT nombre FROM restaurantes WHERE id = ? LIMIT 1', [rid], (errR, rrows) => {
        if (errR) {
          return mysql.rollback(() => res.status(500).json({ error: 'Error obteniendo restaurante' }));
        }
        const restauranteNombre = rrows?.[0]?.nombre || null;

        // 3) Validar contraseña
        if (!contrasena || String(contrasena).length < 6) {
          return mysql.rollback(() => res.status(400).json({ error: 'Contraseña requerida (mínimo 6 caracteres)' }));
        }

        const bcrypt = require('bcrypt');
        bcrypt.hash(String(contrasena), 10, (errHash, hash) => {
          if (errHash) {
            return mysql.rollback(() => res.status(500).json({ error: 'Error generando hash' }));
          }

          // ¿Existe columna 'restaurante'?
          const includeRestaurantColumn = (cb) => {
            if (!restauranteNombre) return cb(null, false);
            mysql.query("SHOW COLUMNS FROM usuarios LIKE 'restaurante'", (eCol, cRows) => {
              if (eCol) return cb(null, false); // en caso de error, seguimos sin la columna
              const exists = Array.isArray(cRows) && cRows.length > 0;
              cb(null, exists);
            });
          };

          includeRestaurantColumn((_e, hasRestCol) => {
            const fullName = [String(nombre || '').trim(), String(apellido || '').trim()].filter(Boolean).join(' ');
            const usuario = {
              correo,
              contrasena: hash,
              nombre: fullName || String(nombre || '').trim() || null,
              rol: 'mesero',
            };
            if (hasRestCol && restauranteNombre) usuario.restaurante = restauranteNombre;

            // 4) Insertar usuario
            mysql.query('INSERT INTO usuarios SET ?', usuario, (errInsU, resultU) => {
            if (errInsU) {
              // posible colisión única
              return mysql.rollback(() => res.status(500).json({ error: errInsU.message }));
            }
            const newUserId = resultU.insertId;

            // 5) Insertar mesero con usuario_id nuevo
            const sql = 'INSERT INTO meseros (usuario_id, nombre, estado, sueldo_base, restaurant_id) VALUES (?, ?, ?, ?, ?)';
            const params = [newUserId, nombre, estado, sueldo_base, rid].map(v => (v === undefined ? null : v));
            mysql.query(sql, params, (errInsM, resultM) => {
              if (errInsM) {
                return mysql.rollback(() => res.status(500).json({ error: errInsM.message }));
              }
              mysql.commit((errC) => {
                if (errC) {
                  return mysql.rollback(() => res.status(500).json({ error: 'No se pudo confirmar la transacción' }));
                }
                res.json({ ok: true, id: resultM.insertId, usuario_id: newUserId });
              });
            });
            });
          });
        });
      });
    });
  });
};

exports.actualizarMesero = (req, res) => {
  const rid = req.restaurantId;
  if (!rid) return res.status(400).json({ error: 'restaurantId no resuelto' });
  const id = Number(req.params.id);
  const { usuario_id, nombre, estado, sueldo_base, correo, contrasena, confirm_correo } = req.body || {};

  // Si se pretende cambiar correo o contraseña, pedir confirmación del correo
  const wantsUserChange = (correo !== undefined) || (contrasena !== undefined && contrasena !== '');
  if (wantsUserChange) {
    if (!correo || !confirm_correo || String(correo).trim().toLowerCase() !== String(confirm_correo).trim().toLowerCase()) {
      return res.status(400).json({ error: 'Debes confirmar el correo para actualizar correo o contraseña' });
    }
  }

  // Primero obtener el registro actual para conocer usuario_id
  db.query('SELECT id, usuario_id FROM meseros WHERE id = ? AND restaurant_id = ? LIMIT 1', [id, rid], (errF, rowsF) => {
    if (errF) return res.status(500).json({ error: errF.message });
    const current = rowsF?.[0];
    if (!current) return res.status(404).json({ error: 'Mesero no encontrado' });

    const mysql = db;
    mysql.beginTransaction((errTx) => {
      if (errTx) return res.status(500).json({ error: 'No se pudo iniciar la transacción' });

      const doRollback = (msg, code = 500) => mysql.rollback(() => res.status(code).json({ error: msg }));

      const proceedUpdateMesero = (finalUserId) => {
        const fields = [];
        const params = [];
        if (finalUserId !== undefined) { fields.push('usuario_id = ?'); params.push(finalUserId); }
        if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
        if (estado !== undefined) { fields.push('estado = ?'); params.push(estado); }
        if (sueldo_base !== undefined) { fields.push('sueldo_base = ?'); params.push(sueldo_base); }
        if (!fields.length) {
          // Nada que actualizar en meseros, solo commit si hubo cambios de usuario
          return mysql.commit((eC) => {
            if (eC) return doRollback('No se pudo confirmar la transacción');
            res.json({ ok: true, affectedRows: 0, usuario_id: finalUserId ?? current.usuario_id });
          });
        }
        const sql = `UPDATE meseros SET ${fields.join(', ')} WHERE id = ? AND restaurant_id = ?`;
        params.push(id, rid);
        mysql.query(sql, params, (errUp, result) => {
          if (errUp) return doRollback(errUp.message);
          mysql.commit((eC) => {
            if (eC) return doRollback('No se pudo confirmar la transacción');
            res.json({ ok: true, affectedRows: result.affectedRows, usuario_id: finalUserId ?? current.usuario_id });
          });
        });
      };

      if (!wantsUserChange) {
        // Solo cambios en meseros
        return proceedUpdateMesero(undefined);
      }

      // Cambios en usuario (correo/contraseña)
      const ensureUserExistsThenUpdate = () => {
        const updateExisting = (uid) => {
          const tasks = [];

          // Verificar unicidad si cambia correo
          tasks.push((cb) => {
            if (!correo) return cb();
            mysql.query('SELECT id FROM usuarios WHERE correo = ? AND id <> ? LIMIT 1', [correo, uid], (e1, r1) => {
              if (e1) return cb(e1);
              if (r1 && r1.length) return cb(new Error('El correo ya está registrado'));
              cb();
            });
          });

          tasks.push((cb) => {
            if (contrasena && String(contrasena).length < 6) return cb(new Error('La contraseña debe tener al menos 6 caracteres'));
            cb();
          });

          const runTasks = (i = 0) => {
            if (i >= tasks.length) return afterValidation();
            tasks[i]((err) => err ? doRollback(err.message, err.message.includes('registrado') ? 409 : 400) : runTasks(i + 1));
          };

          const afterValidation = () => {
            const doUpdate = (hashOrNull) => {
              const fieldsU = [];
              const paramsU = [];
              if (correo) { fieldsU.push('correo = ?'); paramsU.push(correo); }
              if (hashOrNull) { fieldsU.push('contrasena = ?'); paramsU.push(hashOrNull); }
              if (!fieldsU.length) return proceedUpdateMesero(uid);
              const sqlU = `UPDATE usuarios SET ${fieldsU.join(', ')} WHERE id = ?`;
              paramsU.push(uid);
              mysql.query(sqlU, paramsU, (eU, rU) => {
                if (eU) return doRollback(eU.message);
                proceedUpdateMesero(uid);
              });
            };

            if (contrasena) {
              const bcrypt = require('bcrypt');
              return bcrypt.hash(String(contrasena), 10, (eH, hash) => {
                if (eH) return doRollback('Error generando hash');
                doUpdate(hash);
              });
            }
            doUpdate(null);
          };

          runTasks();
        };

        if (current.usuario_id) return updateExisting(current.usuario_id);

        // Si no tiene usuario asociado, crearlo y enlazarlo
        if (!contrasena || String(contrasena).length < 6) return doRollback('La contraseña debe tener al menos 6 caracteres', 400);
        mysql.query('SELECT id FROM usuarios WHERE correo = ? LIMIT 1', [correo], (eSel, rSel) => {
          if (eSel) return doRollback(eSel.message);
          if (rSel && rSel.length) return doRollback('El correo ya está registrado', 409);
          const bcrypt = require('bcrypt');
          bcrypt.hash(String(contrasena), 10, (eH, hash) => {
            if (eH) return doRollback('Error generando hash');
            // construir payload con nombre y rol requeridos por tu esquema
            const getRestNameSql = 'SELECT nombre FROM restaurantes WHERE id = ? LIMIT 1';
            mysql.query(getRestNameSql, [rid], (eRN, rRN) => {
              const restName = (!eRN && rRN && rRN[0]) ? rRN[0].nombre : null;
              const columns = ['correo', 'contrasena', 'nombre', 'rol'];
              const values = [correo, hash, nombre || null, 'mesero'];
              let colSql = 'INSERT INTO usuarios (' + columns.join(',') + ') VALUES (?,?,?,?)';
              if (restName) {
                colSql = 'INSERT INTO usuarios (' + columns.concat('restaurante').join(',') + ') VALUES (?,?,?,?,?)';
                values.push(restName);
              }
              mysql.query(colSql, values, (eI, rI) => {
              if (eI) return doRollback(eI.message);
              const newUid = rI.insertId;
              // enlazar en meseros junto con otros cambios
              return proceedUpdateMesero(newUid);
              });
            });
          });
        });
      };

      ensureUserExistsThenUpdate();
    });
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

// Nuevo: obtener el mesero del usuario actual (según header X-Usuario-Id)
exports.obtenerMiPerfilMesero = (req, res) => {
  const rid = req.restaurantId;
  const uid = req.userId;
  if (!rid) return res.status(400).json({ error: 'restaurantId no resuelto' });
  if (!uid) return res.status(400).json({ error: 'usuario_id requerido (X-Usuario-Id)' });
  const sql = `SELECT me.id, me.usuario_id, me.nombre, me.estado, me.sueldo_base,
                      u.correo, u.restaurante
               FROM meseros me
               LEFT JOIN usuarios u ON u.id = me.usuario_id
               WHERE me.restaurant_id = ? AND me.usuario_id = ?
               LIMIT 1`;
  db.query(sql, [rid, uid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || !rows.length) return res.status(404).json({ error: 'Mesero no encontrado para el usuario' });
    res.json(rows[0]);
  });
};
