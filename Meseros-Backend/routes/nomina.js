const express = require('express');
const router = express.Router();
const nominaController = require('../controllers/nominaController');

router.get('/movimientos', nominaController.listarMovimientos);
router.post('/movimientos', nominaController.crearMovimiento);
router.delete('/movimientos/:id', nominaController.eliminarMovimiento);
router.post('/pago', nominaController.marcarPago);
router.get('/resumen', nominaController.resumenMesero);

module.exports = router;
