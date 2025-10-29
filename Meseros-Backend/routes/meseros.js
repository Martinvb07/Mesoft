const express = require('express');
const router = express.Router();
const meserosController = require('../controllers/meserosController');

router.get('/', meserosController.listarMeseros);
router.get('/me', meserosController.obtenerMiPerfilMesero);
router.post('/', meserosController.crearMesero);
router.put('/:id', meserosController.actualizarMesero);
router.delete('/:id', meserosController.eliminarMesero);

module.exports = router;
