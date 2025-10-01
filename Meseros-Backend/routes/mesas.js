const express = require('express');
const router = express.Router();
const mesasController = require('../controllers/mesasController');

router.get('/', mesasController.listarMesas);
router.post('/', mesasController.crearMesa);
router.get('/:id/pedido-abierto', mesasController.obtenerPedidoAbiertoDeMesa);
router.put('/:id', mesasController.actualizarMesa);
router.delete('/:id', mesasController.eliminarMesa);
router.post('/:id/asignar', mesasController.asignarMesa);
router.post('/:id/liberar', mesasController.liberarMesa);
router.post('/:id/limpieza', mesasController.ponerMesaEnLimpieza);
router.post('/:id/fin-limpieza', mesasController.finalizarLimpieza);
router.post('/:id/reservar', mesasController.reservarMesa);
router.post('/:id/cancelar-reserva', mesasController.cancelarReservaMesa);

module.exports = router;
