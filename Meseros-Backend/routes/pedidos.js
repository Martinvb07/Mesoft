const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');

router.get('/en-curso', pedidosController.listarEnCurso);
router.get('/:id', pedidosController.obtenerPedido);
router.get('/:id/items', pedidosController.listarItems);
router.post('/:id/items', pedidosController.agregarItem);
router.delete('/:id/items/:itemId', pedidosController.eliminarItem);
router.post('/:id/cerrar', pedidosController.cerrarPedido);
router.post('/:id/pagar', pedidosController.registrarPago);

module.exports = router;
