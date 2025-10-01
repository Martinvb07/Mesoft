# Meseros Frontend (React + Vite)

Este frontend consume el backend Express de Meseros para reemplazar localStorage por persistencia real (MySQL).

## Variables de entorno

Crea un archivo `.env` en `Meseros-Fronted/` (junto a `package.json`) con:

```
VITE_API_BASE=http://localhost:3001
```

Esto apunta al puerto del backend. Cambia el host/puerto según tu entorno.

## Cómo ejecutar

1. Inicia el backend (en otra terminal):

```
node ../Meseros-Backend/index.js
```

2. Inicia el frontend (esta carpeta):

```
npm install
npm run dev
```

Abre el navegador en la URL que Vite indique (por defecto `http://localhost:5173`).

## Secciones integradas con la API

- Menu-Admin → Meseros: listado/crear/editar/eliminar via `/meseros`.
- Menu-Admin → Mesas: listado y estados via `/mesas` (solo lectura en Admin por ahora).
- Menu-Admin → Home: KPIs usando `/finanzas/ventas-hoy`, `/finanzas/balance-hoy` y `/mesas`.
- Menu-Admin → Nóminas: movimientos vía `/nomina/movimientos` y selección de meseros con `/meseros`.

Si el backend no está disponible, algunas vistas muestran datos de ejemplo mínimos para no romper la UI.
