# Meseros Backend (Node.js + Express + MySQL)

API REST para gestionar mesas, pedidos, productos, finanzas e información de meseros. Diseñado para producción con dominios (sin depender de localhost) y con CORS configurable.

## Producción (REAL)

- Base URL del API: https://srv1037585.hstgr.cloud/api

## Requisitos

- Node.js 18+
- MySQL 8+

## Configuración (.env)

Crea o ajusta `Meseros-Backend/.env` con tus valores. Usa dominios de frontend reales en `CORS_ORIGIN` (puedes listar varios separados por coma). En tu despliegue actual:

```
DB_HOST=<host_mysql>
DB_USER=<usuario_mysql>
DB_PASSWORD=<password_mysql>
DB_NAME=meseros
PORT=3001
# Uno o varios dominios del frontend (separados por coma)
CORS_ORIGIN=https://srv1037585.hstgr.cloud
# Si estás detrás de proxy (Nginx/Apache), deja TRUST_PROXY=1
TRUST_PROXY=1

# (Opcional) SMTP si usas envío de correos en solicitudes
# SMTP_HOST=...
# SMTP_PORT=...
# SMTP_USER=...
# SMTP_PASS=...
```

## Ejecución

Desarrollo:

```pwsh
npm install
npm run dev
```

Producción (detrás de Nginx/Apache):

- Ejecuta `npm start` o usa PM2/systemd.
- Expón el API como `https://tu-backend.com` o bajo subruta `/api`.
- Asegúrate que `CORS_ORIGIN` incluya el dominio del frontend.

Healthcheck: `GET /healthz` y `GET /api/healthz`.

## Rutas principales

Las rutas están disponibles en raíz y bajo `/api`:

- Usuarios: `/usuarios`, `/api/usuarios`
- Solicitud: `/solicitud`, `/api/solicitud`
- Mesas: `/mesas`, `/api/mesas`
- Pedidos: `/pedidos`, `/api/pedidos`
- Productos: `/productos`, `/api/productos`
- Finanzas: `/finanzas`, `/api/finanzas`
- Nómina: `/nomina`, `/api/nomina`
- Meseros: `/meseros`, `/api/meseros`

Endpoints de ejemplo:

- `GET /mesas` – listar mesas
- `POST /mesas/:id/asignar` body: `{ mesero_id }`
- `POST /mesas/:id/limpieza` → estado `limpieza`
- `POST /mesas/:id/fin-limpieza` → estado `libre`
- `GET /pedidos/:id/items`
- `POST /pedidos/:id/items` body: `{ producto_id, cantidad }`
- `POST /pedidos/:id/pagar` body: `{ recibido, propina, mesero_id }`
- `GET /productos`
- `GET /finanzas/ventas-hoy`, `GET /finanzas/balance-hoy`
- `GET /finanzas/propinas?mesero_id=1&desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- `GET /nomina/movimientos?mesero_id=1&desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- `POST /nomina/movimientos` body: `{ mesero_id, tipo, monto, descripcion?, fecha? }`

## Multi-tenant y seguridad

- CORS: orígenes permitidos leídos de `CORS_ORIGIN`.
- `resolveTenant` establece `req.restaurantId` por prioridad:
  1.  Cabecera `X-Restaurant-Id`/`Restaurant-Id` con id válido.
  2.  Nombre en `req.user` (si lo pueblas tras auth) que se mapea a id.
  3.  Fallback: primer restaurante en BD.
- Cabecera opcional `X-Usuario-Id` para identificar usuario simple (sugerido migrar a JWT con roles).

## Scripts

- `npm run dev` – desarrollo con nodemon.
- `npm start` – ejecución en Node (producción o staging).
- `npm run hash:usuarios` – utilitario para generar hashes de contraseñas.
- `scripts/smoke-*.js` – pruebas rápidas a endpoints.

## Notas y problemas comunes

- Conexión MySQL: verifica credenciales y que el servicio esté activo.
- CORS bloqueado: revisa que el dominio del frontend esté en `CORS_ORIGIN`.
- Prefijo `/api`: el backend expone rutas tanto en raíz como en `/api` para compatibilidad; el frontend suele apuntar a `/api`.
