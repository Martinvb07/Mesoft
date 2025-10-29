const express = require('express');
const router = express.Router();
const finanzasController = require('../controllers/finanzasController');

router.get('/ventas-hoy', finanzasController.ventasHoy);
router.get('/propinas', finanzasController.propinasPorMeseroYRango);
router.get('/balance-hoy', finanzasController.balanceHoy);
router.get('/ticket-promedio-hoy', finanzasController.ticketPromedioHoy);
router.get('/variacion-ventas-dia', finanzasController.variacionVentasDia);
router.get('/top-productos', finanzasController.topProductos);
router.get('/egresos-categorias-hoy', finanzasController.egresosCategoriasHoy);
// Nuevos endpoints
router.get('/ventas-por-producto', finanzasController.ventasPorProducto);
router.get('/egresos', finanzasController.egresosListar);
router.post('/egresos', finanzasController.egresoCrear);
router.put('/egresos/:id', finanzasController.egresoActualizar);
router.delete('/egresos/:id', finanzasController.egresoEliminar);
router.get('/egresos-categorias', finanzasController.egresosCategorias);
router.get('/meta-hoy', finanzasController.metaHoy);

module.exports = router;
