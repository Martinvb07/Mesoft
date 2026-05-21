<div align="center">

# Mesoft Backend — Servidor API

**El corazón de la plataforma Mesoft**

---

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

</div>

---

## 📋 ¿Qué es?

Este es el **servidor** (backend) de Mesoft. Es el "cerebro" de la aplicación que:

- Guarda toda la información (mesas, pedidos, productos, usuarios, etc.)
- Procesa requests del frontend
- Maneja la autenticación y seguridad
- Ejecuta la lógica de negocio

---

## 🏗️ Estructura

El backend está dividido en **módulos independientes**:

| Módulo          | Qué hace                           |
| --------------- | ---------------------------------- |
| **Mesas**       | Crear, editar, ver estado de mesas |
| **Meseros**     | Registro y gestión de personal     |
| **Pedidos**     | Control de comidas y bebidas       |
| **Productos**   | Catálogo del menú                  |
| **Usuarios**    | Autenticación y usuarios           |
| **Finanzas**    | Ingresos, egresos, reportes        |
| **Nómina**      | Pagos y movimientos de personal    |
| **Solicitudes** | Consultas y solicitudes            |

---

## 🗄️ Base de datos

Usa **MongoDB** para guardar toda la información en **colecciones**:

- `mesas` — Información de mesas
- `pedidos` — Pedidos realizados
- `productos` — Menú del restaurante
- `usuarios` — Usuarios del sistema
- `meseros` — Personal del restaurante
- `finanzas` — Movimientos de dinero
- Y más...

---

## 📡 Principales endpoints

```
GET    /healthz                 → ¿El servidor está vivo?
POST   /api/usuarios/login      → Login de usuarios
POST   /api/usuarios/register   → Registrar usuario
GET    /api/mesas               → Listar mesas
POST   /api/mesas               → Crear mesa
GET    /api/pedidos             → Listar pedidos
POST   /api/pedidos             → Crear pedido
GET    /api/productos           → Listar productos
GET    /api/finanzas            → Resumen financiero
```

---

## 🔒 Seguridad

- Las contraseñas se **encriptan** con Bcrypt
- Los usuarios se **autentican** con JWT
- Solo usuarios autenticados acceden a datos
- Cada usuario solo ve sus datos según su rol

---

## 🛠️ Tecnologías

- **NestJS** — Framework profesional
- **MongoDB** — Base de datos
- **Mongoose** — Librería MongoDB
- **TypeScript** — Código seguro
- **Bcrypt** — Encriptación
- **JWT** — Autenticación

---

## 📝 Licencia

Proyecto universitario © 2026 — Mesoft.

---

## 📧 ¿Preguntas?

Abre un issue en el repositorio.
