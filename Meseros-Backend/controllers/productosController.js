const db = require('../config/db');

// Normaliza resultado DB -> objeto frontend Inventario
function mapRow(r){
  return {
    id: r.id,
    sku: r.sku || `SKU-${r.id}`,
    nombre: r.nombre,
    categoria: r.categoria || r.descripcion || '',
    costo: Number(r.costo ?? 0),
    precio: Number(r.precio ?? 0),
    stock: Number(r.stock ?? 0),
    minStock: Number(r.min_stock ?? r.minStock ?? 0),
    activo: r.activo == null ? true : Boolean(r.activo),
    createdAt: r.created_at || r.createdAt || null,
    updatedAt: r.updated_at || r.updatedAt || null,
  };
}

exports.listarProductos = (req, res) => {
  const rid = req.restaurantId;
  // Query params para filtros y paginación
  const q = (req.query.q || '').toString().trim();
  const categoria = (req.query.categoria || '').toString().trim();
  const estado = (req.query.estado || 'todos').toString(); // activos|inactivos|todos
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  const allowedSort = new Set(['nombre','precio','costo','stock','min_stock','sku','categoria','updated_at','created_at']);
  const sortBy = allowedSort.has((req.query.sortBy || '').toString()) ? req.query.sortBy : 'nombre';
  const sortDir = (req.query.sortDir || 'asc').toString().toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const where = ['restaurant_id = ?'];
  const params = [rid];
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    where.push('(LOWER(nombre) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(categoria) LIKE ? OR LOWER(descripcion) LIKE ?)');
    params.push(like, like, like, like);
  }
  if (categoria) { where.push('categoria = ?'); params.push(categoria); }
  if (estado === 'activos') where.push('activo = 1');
  else if (estado === 'inactivos') where.push('activo = 0');

  const whereSql = where.join(' AND ');
  const base = `FROM productos WHERE ${whereSql}`;
  const sqlCount = `SELECT COUNT(1) AS total ${base}`;
  const sqlData = `SELECT id, sku, nombre, categoria, costo, precio, stock, min_stock, activo, descripcion, created_at, updated_at ${base} ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`;

  const handleFallback = (err) => {
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      const where2 = [];
      const params2 = [];
      if (q) {
        const like = `%${q.toLowerCase()}%`;
        where2.push('(LOWER(nombre) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(categoria) LIKE ? OR LOWER(descripcion) LIKE ?)');
        params2.push(like, like, like, like);
      }
      if (categoria) { where2.push('categoria = ?'); params2.push(categoria); }
      if (estado === 'activos') where2.push('activo = 1');
      else if (estado === 'inactivos') where2.push('activo = 0');
      const whereSql2 = where2.length ? `WHERE ${where2.join(' AND ')}` : '';
      const sqlCount2 = `SELECT COUNT(1) AS total FROM productos ${whereSql2}`;
      const sqlData2 = `SELECT id, sku, nombre, categoria, costo, precio, stock, min_stock, activo, descripcion, created_at, updated_at FROM productos ${whereSql2} ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`;
      return db.query(sqlCount2, params2, (e2, r2) => {
        if (e2) return res.status(500).json({ error: e2.message });
        const total2 = r2[0]?.total || 0;
        db.query(sqlData2, [...params2, pageSize, (page-1)*pageSize], (e3, r3) => {
          if (e3) return res.status(500).json({ error: e3.message });
          res.json({ items: r3.map(mapRow), meta: { total: total2, page, pageSize } });
        });
      });
    }
    return res.status(500).json({ error: err?.message || 'DB error' });
  };

  db.query(sqlCount, params, (errC, rowsC) => {
    if (errC) return handleFallback(errC);
    const total = rowsC[0]?.total || 0;
    db.query(sqlData, [...params, pageSize, (page-1)*pageSize], (errD, rowsD) => {
      if (errD) return handleFallback(errD);
      res.json({ items: rowsD.map(mapRow), meta: { total, page, pageSize } });
    });
  });
};

exports.crearProducto = (req, res) => {
  const rid = req.restaurantId;
  const { sku, nombre, categoria, costo, precio, stock, minStock, activo, descripcion } = req.body || {};
  if(!nombre || nombre.trim().length === 0){
    return res.status(400).json({ error: 'Nombre es requerido' });
  }
  const p = isNaN(Number(precio)) ? 0 : Number(precio);
  const c = isNaN(Number(costo)) ? 0 : Number(costo);
  const st = Number.isFinite(Number(stock)) ? Number(stock) : 0;
  const ms = Number.isFinite(Number(minStock)) ? Number(minStock) : 0;
  const act = activo == null ? 1 : (activo ? 1 : 0);
  const cat = (categoria || '').trim();
  const desc = (descripcion || '').trim();
  if (p < 0 || c < 0) return res.status(400).json({ error: 'Precios y costos no pueden ser negativos' });
  if (st < 0 || ms < 0) return res.status(400).json({ error: 'Stock y mínimo no pueden ser negativos' });
  if (!sku || String(sku).trim().length === 0) return res.status(400).json({ error: 'SKU es requerido' });
  const sql = 'INSERT INTO productos (sku, nombre, categoria, costo, precio, stock, min_stock, activo, descripcion, restaurant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [sku || null, nombre.trim(), cat, c, p, st, ms, act, desc, rid], (err, result) => {
    if (err) {
      // si no existe restaurant_id, insertar sin la columna
      if (err.code === 'ER_BAD_FIELD_ERROR'){
        return db.query('INSERT INTO productos (sku, nombre, categoria, costo, precio, stock, min_stock, activo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [sku || null, nombre.trim(), cat, c, p, st, ms, act, desc], (e2, r2) => {
          if (e2) return res.status(500).json({ error: e2.message });
          res.status(201).json({ id: r2.insertId, sku, nombre, categoria: cat, costo: c, precio: p, stock: st, minStock: ms, activo: !!act, descripcion: desc });
        });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'SKU ya existe para este restaurante' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: result.insertId, sku, nombre, categoria: cat, costo: c, precio: p, stock: st, minStock: ms, activo: !!act, descripcion: desc });
  });
};

exports.actualizarProducto = (req, res) => {
  const rid = req.restaurantId;
  const { id } = req.params;
  const { sku, nombre, categoria, costo, precio, stock, minStock, activo, descripcion } = req.body || {};
  if(!id) return res.status(400).json({ error: 'ID requerido' });
  const values = [
    sku || null,
    nombre?.trim() || '',
    (categoria || '').trim(),
    isNaN(Number(costo)) ? 0 : Number(costo),
    isNaN(Number(precio)) ? 0 : Number(precio),
    Number.isFinite(Number(stock)) ? Number(stock) : 0,
    Number.isFinite(Number(minStock)) ? Number(minStock) : 0,
    activo == null ? 1 : (activo ? 1 : 0),
    (descripcion || '').trim(),
  ];
  if (values[3] < 0 || values[4] < 0) return res.status(400).json({ error: 'Precios y costos no pueden ser negativos' });
  if (values[5] < 0 || values[6] < 0) return res.status(400).json({ error: 'Stock y mínimo no pueden ser negativos' });
  if (!values[0] || String(values[0]).trim().length === 0) return res.status(400).json({ error: 'SKU es requerido' });
  const sql = 'UPDATE productos SET sku=?, nombre=?, categoria=?, costo=?, precio=?, stock=?, min_stock=?, activo=?, descripcion=? WHERE id = ? AND restaurant_id = ?';
  db.query(sql, [...values, id, rid], (err, result) => {
    if (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR'){
        return db.query('UPDATE productos SET sku=?, nombre=?, categoria=?, costo=?, precio=?, stock=?, min_stock=?, activo=?, descripcion=? WHERE id = ?', [...values, id], (e2, r2) => {
          if (e2) return res.status(500).json({ error: e2.message });
          res.json({ id: Number(id), sku: values[0], nombre: values[1], categoria: values[2], costo: values[3], precio: values[4], stock: values[5], minStock: values[6], activo: !!values[7], descripcion: values[8] });
        });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'SKU ya existe para este restaurante' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: Number(id), sku: values[0], nombre: values[1], categoria: values[2], costo: values[3], precio: values[4], stock: values[5], minStock: values[6], activo: !!values[7], descripcion: values[8] });
  });
};

exports.eliminarProducto = (req, res) => {
  const rid = req.restaurantId;
  const { id } = req.params;
  if(!id) return res.status(400).json({ error: 'ID requerido' });
  const sql = 'DELETE FROM productos WHERE id = ? AND restaurant_id = ?';
  db.query(sql, [id, rid], (err, result) => {
    if (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR'){
        return db.query('DELETE FROM productos WHERE id = ?', [id], (e2, r2) => {
          if (e2) return res.status(500).json({ error: e2.message });
          res.json({ success: true });
        });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
};
