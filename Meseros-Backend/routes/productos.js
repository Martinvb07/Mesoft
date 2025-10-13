const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

// Listado
router.get('/', productosController.listarProductos);
// Crear
router.post('/', productosController.crearProducto);
// Actualizar
router.put('/:id', productosController.actualizarProducto);
// Eliminar
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;
