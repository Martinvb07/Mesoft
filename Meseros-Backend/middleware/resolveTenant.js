const db = require('../config/db');

let cacheNameToId = new Map();

// Obtiene el primer restaurante disponible
async function getFirstRestaurantId() {
  const [rows] = await db.query('SELECT id FROM restaurantes ORDER BY id ASC LIMIT 1');
  return rows[0]?.id || null;
}

// Busca un restaurante por nombre y guarda en caché
async function fetchByName(nombre) {
  if (!nombre) return null;
  if (cacheNameToId.has(nombre)) return cacheNameToId.get(nombre);

  const [rows] = await db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [nombre]);
  const id = rows[0]?.id || null;
  if (id) cacheNameToId.set(nombre, id);

  return id;
}

// Middleware principal
module.exports = async function resolveTenant(req, res, next) {
  try {
    // Resolver usuario actual opcionalmente desde cabecera (simple, sin auth)
    const uid = req.headers['x-usuario-id'] || req.headers['x-user-id'];
    if (uid && Number(uid) > 0) {
      req.userId = Number(uid);
    }

    const headerId = req.headers['x-restaurant-id'] || req.headers['restaurant-id'];
    if (headerId && Number(headerId) > 0) {
      req.restaurantId = Number(headerId);
      return next();
    }

    const userRest = req.user?.restaurante || req.user?.restaurant || null;

    // Buscar restaurante por nombre
    let rid = await fetchByName(userRest);
    if (rid) {
      req.restaurantId = rid;
      return next();
    }

    // Si no hay restaurante por nombre, usar el primero disponible
    const firstId = await getFirstRestaurantId();
    if (firstId) req.restaurantId = firstId;

    next();
  } catch (err) {
    console.error('❌ Error resolviendo restaurante:', err);
    res.status(500).json({ error: 'Error resolviendo restaurante' });
  }
};
