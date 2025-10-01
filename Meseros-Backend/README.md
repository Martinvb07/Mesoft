# Meseros Backend

## Requisitos

- Node.js 18+
- MySQL 8+

## Configuración

Crea un archivo `.env` en `Meseros-Backend/` con tus credenciales:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=meseros
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Opcional: variables para correo si usas `solicitudController` (recomendado mover a .env).

## Migraciones

Ejecuta el SQL para ajustar el esquema según el frontend:

1. Importa primero tu `meseros.sql` en MySQL.
2. Aplica la migración nueva:

```
# PowerShell
Get-Content .\sql\migrations\2025-09-21_additions.sql
```

Cópialo y ejecútalo en tu cliente MySQL (phpMyAdmin o MySQL Shell).

## Ejecutar

Instala dependencias y levanta el server:

```
# PowerShell (en Meseros-Backend)
npm install
npm run dev
```

El backend quedará en `http://localhost:3001`.

## Endpoints clave

- `GET /mesas` lista mesas
- `POST /mesas/:id/asignar` body: `{ mesero_id }`
- `POST /mesas/:id/limpieza` → estado `limpieza`
- `POST /mesas/:id/fin-limpieza` → estado `libre`
- `GET /pedidos/:id/items` items de pedido
- `POST /pedidos/:id/items` body: `{ producto_id, cantidad }`
- `POST /pedidos/:id/pagar` body: `{ recibido, propina, mesero_id }` → registra venta y propina, cierra pedido y pone mesa en limpieza
- `GET /productos` catálogo
- `GET /finanzas/ventas-hoy`
- `GET /finanzas/propinas?mesero_id=1&desde=2025-09-01&hasta=2025-09-30`
- `GET /finanzas/balance-hoy`
- `GET /nomina/movimientos?mesero_id=1&desde=2025-09-01&hasta=2025-09-30`
- `POST /nomina/movimientos` body: `{ mesero_id, tipo, monto, descripcion?, fecha? }`

Ajusta los controladores conforme vayas integrando el frontend y añadiendo seguridad (JWT, validación).
