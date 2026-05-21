// Mesoft - MongoDB schema bootstrap (mongosh)
// Uso:
//   mongosh "mongodb://127.0.0.1:27017/mesoft" --file mongo-schema.mongosh.js
// o en mongosh interactivo:
//   load('mongo-schema.mongosh.js')

/* global db */

// Si no especificas DB, mongosh usa "test" por defecto.
// Puedes forzar la DB de estas formas:
//   1) En la URI: mongosh "mongodb://127.0.0.1:27017/mesoft" --file mongo-schema.mongosh.js
//   2) Con una variable global antes de cargar el script:
//      mongosh "mongodb://127.0.0.1:27017" --eval "var MESOFT_DB='mesoft'" --file mongo-schema.mongosh.js
//      (o dentro del shell: MESOFT_DB='mesoft'; load('mongo-schema.mongosh.js'))

const targetDbName = (globalThis.MESOFT_DB && String(globalThis.MESOFT_DB)) || null;
const runDb = targetDbName ? db.getSiblingDB(targetDbName) : db;

print(`\n[Mesoft] Inicializando esquema en DB: ${runDb.getName()}`);

function ensureCollection(name) {
  const exists = runDb.getCollectionNames().includes(name);
  if (!exists) {
    runDb.createCollection(name);
    print(`- createCollection: ${name}`);
  } else {
    print(`- collection exists: ${name}`);
  }
  return runDb.getCollection(name);
}

function ensureIndex(coll, keys, opts) {
  const name = coll.createIndex(keys, opts || {});
  print(`  - index: ${coll.getName()} ${JSON.stringify(keys)} ${opts ? JSON.stringify(opts) : ''}`);
  return name;
}

// --- Collections ---
const counters = ensureCollection('counters');
const restaurantes = ensureCollection('restaurantes');
const usuarios = ensureCollection('usuarios');
const meseros = ensureCollection('meseros');
const mesas = ensureCollection('mesas');
const productos = ensureCollection('productos');
const pedidos = ensureCollection('pedidos');
const detallepedido = ensureCollection('detallepedido');
const movimientoscontables = ensureCollection('movimientoscontables');
const nomina_movimientos = ensureCollection('nomina_movimientos');

print('\n[Mesoft] Creando índices...');

// restaurantes
ensureIndex(restaurantes, { id: 1 }, { unique: true });
ensureIndex(restaurantes, { nombre: 1 }, { unique: true });

// usuarios
ensureIndex(usuarios, { id: 1 }, { unique: true });
ensureIndex(usuarios, { correo: 1 }, { unique: true });
ensureIndex(usuarios, { restaurant_id: 1 });

// meseros
ensureIndex(meseros, { id: 1 }, { unique: true });
ensureIndex(meseros, { restaurant_id: 1, nombre: 1 });
ensureIndex(meseros, { usuario_id: 1 });

// mesas
ensureIndex(mesas, { id: 1 }, { unique: true });
ensureIndex(mesas, { restaurant_id: 1, numero: 1 }, { unique: true });
ensureIndex(mesas, { restaurant_id: 1 });
ensureIndex(mesas, { mesero_id: 1 });

// productos
ensureIndex(productos, { id: 1 }, { unique: true });
ensureIndex(productos, { restaurant_id: 1, sku: 1 }, { unique: true });
ensureIndex(productos, { restaurant_id: 1, nombre: 1 });

// pedidos
ensureIndex(pedidos, { id: 1 }, { unique: true });
ensureIndex(pedidos, { restaurant_id: 1, estado: 1, fecha_hora: -1 });
ensureIndex(pedidos, { mesa_id: 1 });
ensureIndex(pedidos, { mesero_id: 1 });

// detallepedido
ensureIndex(detallepedido, { id: 1 }, { unique: true });
ensureIndex(detallepedido, { pedido_id: 1, id: 1 });
ensureIndex(detallepedido, { producto_id: 1 });

// movimientoscontables
ensureIndex(movimientoscontables, { id: 1 }, { unique: true });
ensureIndex(movimientoscontables, { restaurant_id: 1, tipo: 1, fecha: -1 });
ensureIndex(movimientoscontables, { pedido_id: 1, tipo: 1, categoria: 1, fecha: -1 });

// nomina_movimientos
ensureIndex(nomina_movimientos, { id: 1 }, { unique: true });
ensureIndex(nomina_movimientos, { restaurant_id: 1, mesero_id: 1, fecha: 1 });

print('\n[Mesoft] Seed mínimo (opcional)...');

// Crea un restaurante base si no existe ninguno.
// Nota: el backend puede crear/restaurantes dinámicamente, pero tener uno ayuda a iniciar.
const existingRestaurant = restaurantes.findOne({}, { projection: { _id: 1, id: 1, nombre: 1 } });
if (!existingRestaurant) {
  restaurantes.insertOne({
    id: 1,
    nombre: 'Mi Restaurante',
    created_at: new Date(),
    updated_at: new Date(),
  });
  print('- Seed: restaurante id=1 nombre="Mi Restaurante"');
} else {
  print(`- Seed: omitido (ya existe restaurante id=${existingRestaurant.id} nombre=${existingRestaurant.nombre})`);
}

// Inicializa counters típicos (opcional).
// El backend también lo hace por upsert, esto solo deja todo listo.
const counterNames = [
  'restaurantes',
  'usuarios',
  'meseros',
  'mesas',
  'productos',
  'pedidos',
  'detallepedido',
  'movimientoscontables',
  'nomina_movimientos',
];

for (const name of counterNames) {
  counters.updateOne(
    { _id: name },
    { $setOnInsert: { seq: 0 } },
    { upsert: true },
  );
}
print(`- Seed: counters upsert (${counterNames.length})`);

print('\n[Mesoft] OK.');
