const db = require('../config/db');
const { DateTime } = require('luxon');
const APP_TZ = process.env.APP_TZ || 'America/Bogota';

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

// Resumen de nómina del mes actual para un mesero
// Si no se pasa mesero_id, toma el usuario actual (X-Usuario-Id)
exports.resumenMesero = (req, res) => {
  const rid = req.restaurantId;
  const midQ = req.query.mesero_id;
  const now = DateTime.now().setZone(APP_TZ);
  const start = now.startOf('month').toFormat('yyyy-MM-dd HH:mm:ss');
  const end = now.endOf('month').toFormat('yyyy-MM-dd HH:mm:ss');

  const resolveMeseroId = (cb) => {
    if (midQ) return cb(null, Number(midQ));
    const uid = req.userId || null;
    if (!uid) return cb(null, null);
    db.query('SELECT id FROM meseros WHERE usuario_id = ? AND restaurant_id = ? LIMIT 1', [uid, rid], (e, r) => {
      if (e) return cb(e);
      cb(null, r?.[0]?.id || null);
    });
  };

  resolveMeseroId((e0, mid) => {
    if (e0) return res.status(500).json({ error: e0.message });
    if (!mid) return res.status(404).json({ error: 'Mesero no encontrado' });

    // 1) Sueldo base e id de usuario
    const q1 = 'SELECT sueldo_base, usuario_id FROM meseros WHERE id = ? AND restaurant_id = ? LIMIT 1';
    db.query(q1, [mid, rid], (e1, r1) => {
      if (e1) return res.status(500).json({ error: e1.message });
      const sueldo_base = Number(r1?.[0]?.sueldo_base || 0);
      const uid = r1?.[0]?.usuario_id || null;

      // 2) Movimientos de nómina agrupados por tipo en el mes
      const q2 = `SELECT LOWER(tipo) AS tipo, COALESCE(SUM(monto),0) AS total
                  FROM nomina_movimientos
                  WHERE mesero_id = ? AND restaurant_id = ? AND fecha BETWEEN ? AND ?
                  GROUP BY tipo`;
      db.query(q2, [mid, rid, start, end], (e2, r2) => {
        if (e2) return res.status(500).json({ error: e2.message });
        const map = new Map((r2 || []).map(x => [String(x.tipo).toLowerCase(), Number(x.total || 0)]));
        const bonos = (map.get('bono') || 0) + (map.get('extra') || 0);
        const adelantos = map.get('adelanto') || 0;
        const descuentos = (map.get('descuento') || 0) + (map.get('deduccion') || 0);
        const pagado = map.get('pago') || 0;

        // 3) Propinas del mes (no incluidas en saldo)
        if (!uid) {
          const saldo = Math.max(0, sueldo_base + bonos - adelantos - descuentos - pagado);
          return res.json({ mesero_id: mid, sueldo_base, bonos, adelantos, descuentos, pagado, saldo, propinas_mes: 0 });
        }
        const q3 = `SELECT COALESCE(SUM(monto),0) AS propinas
                    FROM movimientoscontables
                    WHERE restaurant_id = ? AND usuario_id = ? AND tipo='ingreso'
                      AND (categoria='propina' OR descripcion LIKE 'Propina %')
                      AND fecha BETWEEN ? AND ?`;
        db.query(q3, [rid, uid, start, end], (e3, r3) => {
          if (e3) return res.status(500).json({ error: e3.message });
          const propinas_mes = Number(r3?.[0]?.propinas || 0);
          const saldo = Math.max(0, sueldo_base + bonos - adelantos - descuentos - pagado);
          res.json({ mesero_id: mid, sueldo_base, bonos, adelantos, descuentos, pagado, saldo, propinas_mes });
        });
      });
    });
  });
};
