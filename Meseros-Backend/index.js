const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const app = express();

const isProd = (process.env.NODE_ENV || 'production') === 'production';

// Habilitar trust proxy (relevante detrás de proxy)
app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));

const usuarioRoutes = require('./routes/usuario');
const solicitudRoutes = require('./routes/solicitud');
const mesasRoutes = require('./routes/mesas');
const pedidosRoutes = require('./routes/pedidos');
const productosRoutes = require('./routes/productos');
const finanzasRoutes = require('./routes/finanzas');
const nominaRoutes = require('./routes/nomina');
const meserosRoutes = require('./routes/meseros');
const resolveTenant = require('./middleware/resolveTenant');

// --------- CORS GLOBAL ---------
// Admite lista separada por comas en CORS_ORIGIN (ej: https://miapp.com,https://admin.miapp.com)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-site / curl / SSR
    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.warn('[CORS] Bloqueado origen no permitido:', origin);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Restaurant-Id', 'Restaurant-Id']
}));

// Preflight genérico: Express 5 + path-to-regexp v8 es más estricto con '*'
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Montar usuarios ANTES del tenant (login sin header)
app.use('/api/usuarios', usuarioRoutes);

// Middleware de tenant
app.use(resolveTenant);

// Resto de rutas bajo /api (requieren tenant)
app.use('/api/solicitud', solicitudRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/nomina', nominaRoutes);
app.use('/api/meseros', meserosRoutes);

// Salud
app.get('/api/healthz', (req, res) => res.status(200).send('ok'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});