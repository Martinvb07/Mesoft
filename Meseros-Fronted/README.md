# Meseros Frontend (React + Vite)

Frontend responsive (móvil/tablet/desktop) para la operación de meseros y el panel administrativo. Consume el backend de Meseros expuesto bajo una URL pública (no requiere localhost).

## Producción (REAL)

- Sitio: https://srv1037585.hstgr.cloud
- API base: https://srv1037585.hstgr.cloud/api

## URL del API (VITE_API_BASE)

Este proyecto ya incluye un archivo de producción apuntando a tu backend en la nube:

```
Meseros-Fronted/.env.production
VITE_API_BASE=https://srv1037585.hstgr.cloud/api
```

Si tu dominio cambia, ajusta ese valor. En desarrollo, también puedes crear `.env.development.local` y poner ahí tu `VITE_API_BASE`.

Ejemplos:

```
# Producción
VITE_API_BASE=https://tu-backend.com/api

# Desarrollo (apuntando a backend remoto)
VITE_API_BASE=https://tu-backend.com/api
```

## Ejecutar

Producción (recomendado):

1. Instala dependencias y genera build estático:

```pwsh
npm install
npm run build
```

2. Sube el contenido de `dist/` a tu hosting/CDN.

Desarrollo local (opcional):

```pwsh
npm install
npm run dev
```

Vite mostrará la URL local. El frontend usará la `VITE_API_BASE` configurada (remota o local) para consumir la API.

## Estructura y estilos

- Rutas en `src/App.jsx` separadas por roles (Admin, Mesero) y landing pública.
- Estilos responsive globales en `src/styles/responsive.css` y `src/styles/navbar.responsive.css`.
- Utilidades disponibles: `.container`, `.grid`, `.table-responsive`, helpers de visibilidad y flex.

## Integraciones con la API

- Admin → Meseros: CRUD vía `/meseros`.
- Admin → Mesas: listado y estados vía `/mesas`.
- Admin → Home: KPIs con `/finanzas/ventas-hoy`, `/finanzas/balance-hoy` y `/mesas`.
- Admin → Nóminas: movimientos vía `/nomina/movimientos` y selección con `/meseros`.

## Solución de problemas

- CORS: asegúrate que el backend permita el dominio del frontend en `CORS_ORIGIN`.
- 404/500: revisa `/healthz` del backend y consola del navegador.
- Estilos: si ves overflow en móvil, usa `.table-responsive` o evita anchos fijos en CSS.
