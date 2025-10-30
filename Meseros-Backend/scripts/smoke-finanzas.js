try {
  require('../controllers/finanzasController.js');
  console.log('finanzasController loaded OK');
  process.exit(0);
} catch (e) {
  console.error('Load failed:', e && e.message ? e.message : e);
  process.exit(1);
}
