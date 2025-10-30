try {
  require('../controllers/pedidosController');
  require('../controllers/nominaController');
  console.log('controllers loaded OK');
  process.exit(0);
} catch (e) {
  console.error('controllers load FAILED:', e && e.stack || e);
  process.exit(1);
}
