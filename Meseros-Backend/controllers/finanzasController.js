const db = require('../config/db');

function todayRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const start = `${y}-${m}-${d} 00:00:00`;
  const end = `${y}-${m}-${d} 23:59:59`;
  return { start, end };
}

function dayRange(offsetDays = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return { start: `${y}-${m}-${d} 00:00:00`, end: `${y}-${m}-${d} 23:59:59` };
}

function parseDateOnly(s) {
  if (!s) return null;
  // Expect YYYY-MM-DD
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return { start: `${y}-${m}-${d} 00:00:00`, end: `${y}-${m}-${d} 23:59:59` };
}

exports.ventasHoy = (req, res) => {
  const { start, end } = todayRange();
  const rid = req.restaurantId;
  // Heurística: descripcion comienza con 'Venta'
  const sql = `SELECT COALESCE(SUM(monto),0) AS ventas FROM movimientoscontables 
                WHERE tipo='ingreso' AND restaurant_id = ? AND fecha BETWEEN ? AND ? 
                AND (categoria='venta' OR descripcion LIKE 'Venta %')`;
  db.query(sql, [rid, start, end], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ventas: Number(rows[0].ventas || 0) });
  });
};

exports.propinasPorMeseroYRango = (req, res) => {
  const { mesero_id, desde, hasta } = req.query;
  if (!mesero_id || !desde || !hasta) return res.status(400).json({ error: 'mesero_id, desde, hasta requeridos' });
  const rid = req.restaurantId;
  // Heurística: descripcion comienza con 'Propina'
  const sql = `SELECT COALESCE(SUM(monto),0) AS propinas FROM movimientoscontables 
               WHERE tipo='ingreso' AND restaurant_id = ? AND usuario_id = ? 
                 AND fecha BETWEEN ? AND ? AND (categoria='propina' OR descripcion LIKE 'Propina %')`;
  db.query(sql, [rid, mesero_id, `${desde} 00:00:00`, `${hasta} 23:59:59`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ propinas: Number(rows[0].propinas || 0) });
  });
};

exports.balanceHoy = (req, res) => {
  const { start, end } = todayRange();
  const rid = req.restaurantId;
  const sqlIng = `SELECT COALESCE(SUM(monto),0) AS total FROM movimientoscontables 
                  WHERE tipo='ingreso' AND restaurant_id = ? AND fecha BETWEEN ? AND ? 
                    AND (categoria='venta' OR descripcion LIKE 'Venta %')`;
  const sqlEgr = `SELECT COALESCE(SUM(monto),0) AS total FROM movimientoscontables 
                  WHERE tipo='egreso' AND restaurant_id = ? AND fecha BETWEEN ? AND ?`;
  db.query(sqlIng, [rid, start, end], (err, rowsIng) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(sqlEgr, [rid, start, end], (err2, rowsEgr) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const ingresos = Number(rowsIng[0].total || 0);
      const egresos = Number(rowsEgr[0].total || 0);
      res.json({ balance: ingresos - egresos, ingresos, egresos });
    });
  });
};

// Ticket promedio del día (ventas/numero de pedidos cerrados con movimiento de venta)
exports.ticketPromedioHoy = (req, res) => {
  const { start, end } = todayRange();
  const rid = req.restaurantId;
  const sql = `SELECT COALESCE(SUM(monto),0) AS ventas, COALESCE(COUNT(DISTINCT pedido_id),0) AS pedidos
               FROM movimientoscontables
               WHERE tipo='ingreso' AND restaurant_id = ? AND fecha BETWEEN ? AND ? AND (categoria='venta' OR descripcion LIKE 'Venta %')`;
  db.query(sql, [rid, start, end], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const ventas = Number(rows[0]?.ventas || 0);
    const pedidos = Number(rows[0]?.pedidos || 0);
    const ticket_promedio = pedidos > 0 ? ventas / pedidos : 0;
    res.json({ ventas, pedidos, ticket_promedio });
  });
};

// Variación de ventas: hoy vs ayer
exports.variacionVentasDia = (req, res) => {
  const { start: hStart, end: hEnd } = dayRange(0);
  const { start: aStart, end: aEnd } = dayRange(-1);
  const rid = req.restaurantId;
  const sql = `SELECT COALESCE(SUM(monto),0) AS total FROM movimientoscontables 
               WHERE tipo='ingreso' AND restaurant_id = ? AND fecha BETWEEN ? AND ? 
                 AND (categoria='venta' OR descripcion LIKE 'Venta %')`;
  db.query(sql, [rid, hStart, hEnd], (err, rowsH) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(sql, [rid, aStart, aEnd], (err2, rowsA) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const actual = Number(rowsH[0]?.total || 0);
      const previo = Number(rowsA[0]?.total || 0);
      const variacionPct = previo > 0 ? ((actual - previo) / previo) * 100 : (actual > 0 ? 100 : 0);
      res.json({ actual, previo, variacionPct });
    });
  });
};

// Top productos por unidades e ingresos en un rango (default: últimos 7 días)
exports.topProductos = (req, res) => {
  const { desde, hasta, limit = 5 } = req.query;
  let start, end;
  if (desde && hasta) {
    const r1 = parseDateOnly(desde); const r2 = parseDateOnly(hasta);
    start = r1?.start; end = r2?.end;
  }
  if (!start || !end) {
    // last 7 days including today
    const to = dayRange(0); const from = dayRange(-6);
    start = from.start; end = to.end;
  }
  // previous window of the same length right before 'start'
  const startDate = new Date(start.replace(' ', 'T'));
  const endDate = new Date(end.replace(' ', 'T'));
  const msLen = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1000); // just before start
  const prevStart = new Date(prevEnd.getTime() - msLen);
  const toSQL = (dt, endOfDay = false) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} ${endOfDay ? '23:59:59' : '00:00:00'}`;
  };
  const pStart = toSQL(prevStart, false);
  const pEnd = toSQL(prevEnd, true);

  const sql = `SELECT dp.producto_id, p.nombre, COALESCE(SUM(dp.cantidad),0) AS unidades, COALESCE(SUM(dp.subtotal),0) AS ingresos
               FROM detallepedido dp
               JOIN pedidos pe ON pe.id = dp.pedido_id
               JOIN productos p ON p.id = dp.producto_id
               WHERE pe.fecha_hora BETWEEN ? AND ? AND pe.restaurant_id = ?
               GROUP BY dp.producto_id
               ORDER BY unidades DESC
               LIMIT ?`;
  const rid = req.restaurantId;
  db.query(sql, [start, end, rid, Number(limit)], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const ids = rows.map(r => r.producto_id);
    if (!ids.length) return res.json([]);
  const sqlPrev = `SELECT dp.producto_id, COALESCE(SUM(dp.cantidad),0) AS unidades
           FROM detallepedido dp
           JOIN pedidos pe ON pe.id = dp.pedido_id
           WHERE pe.fecha_hora BETWEEN ? AND ? AND pe.restaurant_id = ? AND dp.producto_id IN (${ids.map(() => '?').join(',')})
           GROUP BY dp.producto_id`;
  db.query(sqlPrev, [pStart, pEnd, rid, ...ids], (e2, prevRows) => {
      if (e2) return res.status(500).json({ error: e2.message });
      const prevMap = new Map(prevRows.map(r => [r.producto_id, Number(r.unidades || 0)]));
      const out = rows.map(r => {
        const unidadesPrev = prevMap.get(r.producto_id) || 0;
        const unidadesAct = Number(r.unidades || 0);
        const tendenciaPct = unidadesPrev > 0 ? ((unidadesAct - unidadesPrev) / unidadesPrev) * 100 : (unidadesAct > 0 ? 100 : 0);
        return {
          producto_id: r.producto_id,
          nombre: r.nombre,
          unidades: unidadesAct,
          ingresos: Number(r.ingresos || 0),
          tendenciaPct,
        };
      });
      res.json(out);
    });
  });
};

// Egresos por categoría del día
exports.egresosCategoriasHoy = (req, res) => {
  const { start, end } = todayRange();
  const rid = req.restaurantId;
  const sql = `SELECT IFNULL(categoria,'(sin categoria)') AS categoria, COUNT(*) AS movimientos, COALESCE(SUM(monto),0) AS total
               FROM movimientoscontables
               WHERE tipo='egreso' AND restaurant_id = ? AND fecha BETWEEN ? AND ?
               GROUP BY categoria
               ORDER BY total DESC`;
  db.query(sql, [rid, start, end], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Progreso hacia meta diaria: usa env META_DIARIA como objetivo
exports.metaHoy = (req, res) => {
  const meta = Number(process.env.META_DIARIA || 1000000);
  const { start, end } = todayRange();
  const rid = req.restaurantId;
  const sql = `SELECT COALESCE(SUM(monto),0) AS ventas FROM movimientoscontables 
               WHERE tipo='ingreso' AND restaurant_id = ? AND fecha BETWEEN ? AND ? 
                 AND (categoria='venta' OR descripcion LIKE 'Venta %')`;
  db.query(sql, [rid, start, end], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const ventas = Number(rows[0]?.ventas || 0);
    const progresoPct = meta > 0 ? Math.min(100, (ventas / meta) * 100) : 0;
    res.json({ meta, ventas, progresoPct });
  });
};
