const db = require('../config/db');

let cacheNameToId = new Map();

function getFirstRestaurantId(cb){
  db.query('SELECT id FROM restaurantes ORDER BY id ASC LIMIT 1', (err, rows)=>{
    if(err) return cb(err, null);
    cb(null, rows[0]?.id || null);
  });
}

function fetchByName(nombre, cb){
  if(!nombre) return cb(null, null);
  if(cacheNameToId.has(nombre)) return cb(null, cacheNameToId.get(nombre));
  db.query('SELECT id FROM restaurantes WHERE nombre = ? LIMIT 1', [nombre], (err, rows)=>{
    if(err) return cb(err, null);
    const id = rows[0]?.id || null;
    if(id) cacheNameToId.set(nombre, id);
    cb(null, id);
  });
}

module.exports = function resolveTenant(req, res, next){
  const headerId = req.headers['x-restaurant-id'] || req.headers['restaurant-id'];
  if(headerId && Number(headerId) > 0){
    req.restaurantId = Number(headerId);
    return next();
  }
  const userRest = req.user?.restaurante || req.user?.restaurant || null;
  fetchByName(userRest, (err, rid)=>{
    if(err) return res.status(500).json({ error: 'Error resolviendo restaurante' });
    if(rid){
      req.restaurantId = rid;
      return next();
    }
    getFirstRestaurantId((e2, firstId)=>{
      if(!e2 && firstId) req.restaurantId = firstId;
      next();
    });
  });
};
