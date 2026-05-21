// Bootstrap local: crea índices y semilla mínima usando el driver de MongoDB
// que ya viene con mongoose. Uso: node scripts/init-db.js
/* eslint-disable no-console */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mesoft';

async function ensureIndex(coll, keys, opts) {
  await coll.createIndex(keys, opts || {});
  console.log(`  - index ${coll.collectionName} ${JSON.stringify(keys)} ${opts ? JSON.stringify(opts) : ''}`);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  console.log(`[Mesoft] DB: ${db.databaseName}`);

  const names = [
    'counters', 'restaurantes', 'usuarios', 'meseros', 'mesas',
    'productos', 'pedidos', 'detallepedido', 'movimientoscontables', 'nomina_movimientos',
  ];
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  for (const n of names) {
    if (!existing.has(n)) {
      await db.createCollection(n);
      console.log(`- createCollection: ${n}`);
    }
  }

  console.log('[Mesoft] Índices...');
  await ensureIndex(db.collection('restaurantes'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('restaurantes'), { nombre: 1 }, { unique: true });

  await ensureIndex(db.collection('usuarios'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('usuarios'), { correo: 1 }, { unique: true });
  await ensureIndex(db.collection('usuarios'), { restaurant_id: 1 });

  await ensureIndex(db.collection('meseros'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('meseros'), { restaurant_id: 1, nombre: 1 });
  await ensureIndex(db.collection('meseros'), { usuario_id: 1 });

  await ensureIndex(db.collection('mesas'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('mesas'), { restaurant_id: 1, numero: 1 }, { unique: true });
  await ensureIndex(db.collection('mesas'), { restaurant_id: 1 });
  await ensureIndex(db.collection('mesas'), { mesero_id: 1 });

  await ensureIndex(db.collection('productos'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('productos'), { restaurant_id: 1, sku: 1 }, { unique: true });
  await ensureIndex(db.collection('productos'), { restaurant_id: 1, nombre: 1 });

  await ensureIndex(db.collection('pedidos'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('pedidos'), { restaurant_id: 1, estado: 1, fecha_hora: -1 });
  await ensureIndex(db.collection('pedidos'), { mesa_id: 1 });
  await ensureIndex(db.collection('pedidos'), { mesero_id: 1 });

  await ensureIndex(db.collection('detallepedido'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('detallepedido'), { pedido_id: 1, id: 1 });
  await ensureIndex(db.collection('detallepedido'), { producto_id: 1 });

  await ensureIndex(db.collection('movimientoscontables'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('movimientoscontables'), { restaurant_id: 1, tipo: 1, fecha: -1 });
  await ensureIndex(db.collection('movimientoscontables'), { pedido_id: 1, tipo: 1, categoria: 1, fecha: -1 });

  await ensureIndex(db.collection('nomina_movimientos'), { id: 1 }, { unique: true });
  await ensureIndex(db.collection('nomina_movimientos'), { restaurant_id: 1, mesero_id: 1, fecha: 1 });

  console.log('[Mesoft] Seed...');
  const rests = db.collection('restaurantes');
  const rest = await rests.findOne({});
  if (!rest) {
    await rests.insertOne({ id: 1, nombre: 'Mi Restaurante', created_at: new Date(), updated_at: new Date() });
    console.log('- seed restaurante id=1');
  } else {
    console.log(`- ya existe restaurante id=${rest.id}`);
  }

  const counters = db.collection('counters');
  for (const n of ['restaurantes', 'usuarios', 'meseros', 'mesas', 'productos', 'pedidos', 'detallepedido', 'movimientoscontables', 'nomina_movimientos']) {
    await counters.updateOne({ _id: n }, { $setOnInsert: { seq: 0 } }, { upsert: true });
  }
  console.log('- counters upsert');

  await client.close();
  console.log('[Mesoft] OK.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
