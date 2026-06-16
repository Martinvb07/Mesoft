<div align="center">

<img src="Meseros-Fronted/public/logopngmesoft.png" alt="Mesoft Logo" width="160"/>

# Mesoft

**La plataforma para gestionar tu restaurante, desde la mesa hasta el cierre**

_Control de mesas, pedidos y finanzas para tu equipo, en cualquier dispositivo_

---

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## ¿Qué es Mesoft?

**Mesoft** es una aplicación web para restaurantes que centraliza todo en un solo lugar: el mesero gestiona sus mesas y pedidos desde el celular, y el administrador controla finanzas, inventario, nómina y reportes desde un panel completo.

Diseñada para funcionar en celular, tablet y PC, sin instalaciones y accesible desde cualquier lugar.

---

## ¿Qué podés hacer con Mesoft?

### 🪑 Gestión de Mesas

Visualizá el estado de todas las mesas en tiempo real: libre, ocupada, en limpieza o reservada. Asigná un mesero a cada mesa con un click.

### 📋 Pedidos en mesa

Tomá pedidos directamente desde el celular, agregá ítems del menú, registrá propinas y cerrá la cuenta al finalizar. Todo queda registrado automáticamente en las finanzas.

### 👨‍💼 Administración de Meseros

Registrá el personal, asignales mesas y controlá sus movimientos de nómina: adelantos, pagos y saldo pendiente.

### 💰 Finanzas completas

Consultá el resumen del día, registrá ingresos y egresos, hacé cierres de caja, gestioná el inventario del menú y manejá la nómina de tu equipo, todo desde el panel de finanzas.

### 📊 Reportes

Visualizá reportes de ventas, balance del período y movimientos detallados para tomar mejores decisiones sobre tu negocio.

### 🔐 Multi-tenant

Cada restaurante maneja sus propios datos de forma aislada. Un mismo sistema puede operar múltiples restaurantes sin que se mezcle la información.

---

## ¿Para quién es?

| Perfil                    | Beneficio principal                                               |
| ------------------------- | ----------------------------------------------------------------- |
| 🍽️ Dueño de restaurante   | Control financiero completo: ventas, egresos, inventario y nómina |
| 📋 Administrador          | Gestión operativa del negocio con reportes en tiempo real         |
| 🧑‍🍳 Mesero                 | Vista rápida y simple de mesas y pedidos desde el celular         |
| 🎓 Proyecto universitario | Arquitectura moderna: NestJS + MongoDB + React multi-tenant       |

---

## Tecnologías

### 🖥️ Interfaz (Frontend)

| Tecnología                                                                                         | Para qué se usa                    |
| -------------------------------------------------------------------------------------------------- | ---------------------------------- |
| ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white)                     | Construcción de la interfaz visual |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)                        | Herramienta de construcción rápida |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?logo=reactrouter&logoColor=white) | Navegación entre páginas           |
| ![SweetAlert2](https://img.shields.io/badge/SweetAlert2-FF6384?logoColor=white)                    | Alertas y confirmaciones visuales  |
| ![React Icons](https://img.shields.io/badge/React_Icons-E91E63?logoColor=white)                    | Iconos de la interfaz              |
| ![TanStack Table](https://img.shields.io/badge/TanStack_Table-FF4154?logoColor=white)              | Tablas con filtros y paginación    |

### ⚙️ Servidor (Backend)

| Tecnología                                                                                    | Para qué se usa                          |
| --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| ![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)             | Framework modular para la API REST       |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) | Tipado estático y seguridad en el código |
| ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)          | Base de datos documental                 |
| ![Mongoose](https://img.shields.io/badge/Mongoose-880000?logoColor=white)                     | ODM para modelado y validación           |
| ![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)            | Seguridad y autenticación de usuarios    |
| ![Bcrypt](https://img.shields.io/badge/Bcrypt-4A90E2?logoColor=white)                         | Encriptación de contraseñas              |

---

## Estructura del proyecto

```
Mesoft/
│
├── 📁 Meseros-Backend/          → Servidor NestJS + MongoDB
│   ├── src/
│   │   ├── common/
│   │   │   ├── db/              → Conexión MongoDB + schemas Mongoose
│   │   │   └── middleware/      → Resolución de tenant por restaurante
│   │   ├── usuarios/            → Autenticación y gestión de usuarios
│   │   ├── mesas/               → Control de mesas y reservas
│   │   ├── meseros/             → Gestión del personal
│   │   ├── pedidos/             → Pedidos e ítems
│   │   ├── productos/           → Catálogo del menú e inventario
│   │   ├── finanzas/            → Movimientos contables y reportes
│   │   ├── nomina/              → Nómina y pagos al personal
│   │   ├── solicitud/           → Formulario de solicitud de acceso
│   │   └── health/              → Health check
│   └── dist/                    → Código compilado (generado)
│
└── 📁 Meseros-Fronted/          → Interfaz React + Vite
    └── src/
        ├── assets/components/
        │   ├── Inicio/          → Landing, login y solicitud (público)
        │   ├── Menu-Admin/      → Panel completo del administrador
        │   └── Menu-Mesero/     → Vista operativa del mesero
        ├── api/                 → Cliente HTTP y bootstrap de datos
        └── App.jsx              → Definición de rutas por rol
```

---

## Producción

- **Sitio:** https://mesoft.store/
- **API:** https://mesoft.store/api/healthz

---

## Roadmap

### ✅ Completado

- [x] Panel de mesas con estados en tiempo real (libre, ocupada, limpieza, reservada)
- [x] Gestión de pedidos con ítems, cobro y propinas
- [x] CRUD completo de meseros con control de nómina
- [x] Módulo de finanzas: ingresos, egresos, cierre de caja, inventario
- [x] Reportes de ventas y balance del período
- [x] Autenticación segura con JWT + bcrypt
- [x] Arquitectura multi-tenant (múltiples restaurantes aislados)
- [x] API NestJS + MongoDB con Mongoose y TypeScript
- [x] Formulario de solicitud con límite de tasa (48h por NIT)
- [x] Frontend responsive (móvil, tablet, PC)

### 🔜 Próximamente

- [ ] Aplicación móvil nativa
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Integración con impresoras de tickets
- [ ] Dashboard con gráficos históricos

---

## Documentación

- 📘 **Backend** — Módulos, colecciones MongoDB y endpoints: `Meseros-Backend/README.md`
- 🖥️ **Frontend** — Páginas, rutas y componentes: `Meseros-Fronted/README.md`

---

## Licencia

Proyecto universitario © 2026 — Mesoft. Todos los derechos reservados.

---

<div align="center">

Hecho con ❤️ para la industria restaurantera

**[Reportar un problema](https://github.com/Martinvb07/Mesoft/issues)** · **[Solicitar una función](https://github.com/Martinvb07/Mesoft/issues/new)**

</div>
