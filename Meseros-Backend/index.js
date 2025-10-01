const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const app = express();

const usuarioRoutes = require('./routes/usuario');
const solicitudRoutes = require('./routes/solicitud');
const mesasRoutes = require('./routes/mesas');
const pedidosRoutes = require('./routes/pedidos');
const productosRoutes = require('./routes/productos');
const finanzasRoutes = require('./routes/finanzas');
const nominaRoutes = require('./routes/nomina');
const meserosRoutes = require('./routes/meseros');
const resolveTenant = require('./middleware/resolveTenant');

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
// No es necesario declarar app.options('*') en Express 5 + cors: el propio middleware maneja preflight.
app.use(express.json());

// Middleware de tenant (multi-restaurante)
app.use(resolveTenant);


// Routes without prefix
app.use('/usuarios', usuarioRoutes);
app.use('/solicitud', solicitudRoutes);
app.use('/mesas', mesasRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/productos', productosRoutes);
app.use('/finanzas', finanzasRoutes);
app.use('/nomina', nominaRoutes);
app.use('/meseros', meserosRoutes);

// Duplicate mounts under /api prefix (for clients using API base with /api)
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/solicitud', solicitudRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/nomina', nominaRoutes);
app.use('/api/meseros', meserosRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
