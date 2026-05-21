<div align="center">

# Mesoft — Backend

**API REST y motor de base de datos MongoDB para la plataforma de gestión de restaurantes**

[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

</div>

---

## ¿Qué es esta parte?

El Backend es el servidor que da vida a toda la plataforma. Recibe las peticiones del Frontend, las procesa, consulta la base de datos MongoDB y devuelve la información. Contiene toda la lógica de negocio: autenticación, gestión de pedidos, cálculo de finanzas y control de nómina.

Está construido con **NestJS** (framework modular para Node.js) y **TypeScript**, lo que garantiza tipado estático, inyección de dependencias y una estructura clara por módulos.

---

## Módulos de la API

El servidor expone una API REST organizada en módulos. Cada módulo incluye su controlador, servicio y schema de base de datos:

### 🔐 Usuarios
Autenticación y gestión de cuentas. Valida credenciales, genera tokens JWT y administra roles (admin / mesero). Cada usuario pertenece a un restaurante específico.

### 🪑 Mesas
Control completo del estado de las mesas: libre, ocupada, en limpieza o reservada. Permite asignar meseros, registrar reservas con datos del cliente y liberar mesas al cerrar un pedido.

### 👤 Meseros
Gestión del personal del restaurante: creación, edición, activación/desactivación y consulta del mesero vinculado al usuario autenticado.

### 🍽️ Productos
Catálogo del menú con control de inventario. Cada producto tiene SKU, categoría, precio de venta, costo, stock actual y stock mínimo de alerta.

### 📋 Pedidos
Núcleo operativo de la plataforma. Gestiona el ciclo completo de un pedido:
- Crear pedido sobre una mesa
- Agregar y eliminar ítems del pedido
- Consultar pedidos en curso (todos o solo los del mesero autenticado)
- Cerrar el pedido al terminar el servicio
- Registrar el pago y generar el movimiento contable automáticamente

### 💰 Finanzas
Motor financiero del restaurante. Maneja:
- **KPIs diarios**: ventas del día, balance, ticket promedio
- **Ingresos y egresos**: registro manual de movimientos contables con categorías
- **Cierres de caja**: resumen del período con total de ingresos, egresos y balance
- **Inventario**: estado actual del stock de productos
- **Reportes**: movimientos filtrados por fecha y tipo

### 💼 Nómina
Gestión de pagos al personal. Registra movimientos de nómina por mesero (adelantos, pagos, descuentos), calcula el saldo pendiente y marca pagos como realizados.

### 📩 Solicitud
Formulario de solicitud de acceso al sistema. Envía un email al administrador con los datos del restaurante solicitante. Implementa límite de tasa (rate limit) de 48h por NIT para evitar spam.

### ❤️ Health
Endpoint de comprobación de estado del servidor (`GET /healthz`).

---

## Base de Datos MongoDB

### Colecciones

| Colección | Descripción | Índices clave |
|-----------|-------------|---------------|
| `usuarios` | Cuentas de acceso al sistema | `id` (único), `correo` (único) |
| `restaurantes` | Restaurantes registrados | `id` (único), `nombre` (único) |
| `meseros` | Personal del restaurante | `id` (único), `(restaurant_id, nombre)` |
| `mesas` | Mesas del restaurante | `id` (único), `(restaurant_id, numero)` único |
| `productos` | Menú e inventario | `id` (único), `(restaurant_id, sku)` único |
| `pedidos` | Pedidos activos y cerrados | `id` (único), `(restaurant_id, estado, fecha_hora)` |
| `detallepedido` | Ítems de cada pedido | `id` (único), `(pedido_id, id)` |
| `movimientoscontables` | Ingresos y egresos | `id` (único), `(restaurant_id, tipo, fecha)` |
| `nomina_movimientos` | Pagos al personal | `id` (único), `(restaurant_id, mesero_id, fecha)` |
| `counters` | Secuencias para IDs numéricos | `_id` (nombre de la entidad) |

### Multi-tenant
Cada registro lleva `restaurant_id`. El middleware `ResolveTenantMiddleware` extrae el restaurante desde los headers (`X-Restaurant-Id`) en cada petición, garantizando que cada restaurante solo acceda a sus propios datos.

---

## Seguridad

- Autenticación mediante **JWT** en cada petición protegida
- Contraseñas almacenadas con **bcrypt** — nunca en texto plano
- CORS configurado para aceptar solo orígenes autorizados (`CORS_ORIGIN`)
- Aislamiento de datos por `restaurant_id` en todas las consultas

---

## Estructura de carpetas

```
Meseros-Backend/
├── src/
│   ├── app.module.ts              → Módulo raíz, registra todos los módulos
│   ├── main.ts                    → Bootstrap NestJS, configura puerto y CORS
│   │
│   ├── common/
│   │   ├── db/
│   │   │   ├── database.module.ts → Conexión a MongoDB vía Mongoose
│   │   │   ├── id.service.ts      → Servicio de IDs auto-incrementales
│   │   │   └── schemas/           → 10 schemas Mongoose (uno por colección)
│   │   ├── middleware/
│   │   │   └── resolve-tenant.middleware.ts → Extrae restaurant_id del header
│   │   └── types/
│   │       └── request-with-tenant.ts
│   │
│   ├── usuarios/                  → usuarios.controller / .service / .module
│   ├── mesas/                     → mesas.controller / .service / .module
│   ├── meseros/                   → meseros.controller / .service / .module
│   ├── productos/                 → productos.controller / .service / .module
│   ├── pedidos/                   → pedidos.controller / .service / .module
│   ├── finanzas/                  → finanzas.controller / .service / .module
│   ├── nomina/                    → nomina.controller / .service / .module
│   ├── solicitud/                 → solicitud.controller / .service / .module
│   └── health/                    → health.controller
│
├── dist/                          → Compilado TypeScript (generado por npm run build)
├── nest-cli.json                  → Configuración del CLI de NestJS
├── tsconfig.json                  → Configuración TypeScript
└── package.json
```

