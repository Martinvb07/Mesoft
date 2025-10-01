const express = require('express');
const router = express.Router();
const { sendSolicitud } = require('../controllers/solicitudController');

router.post('/', sendSolicitud);

module.exports = router;
