<div align="center">

# Mesoft — Frontend

**Interfaz web de gestión de restaurantes construida con React 19 + Vite**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)](https://reactrouter.com/)

</div>

---

## ¿Qué es esta parte?

El Frontend es la interfaz visual de Mesoft. Es lo que el usuario ve y usa: el panel de mesas para el mesero, el panel de finanzas para el administrador y la landing pública para solicitar acceso. Se conecta al Backend a través de la API REST.

Es una SPA (Single Page Application) responsive que funciona desde el navegador en celular, tablet y PC sin recargas.

---

## Páginas y pantallas

### 🏠 Landing — Página pública de inicio
La primera pantalla que ve cualquier visitante. Presenta la plataforma, sus funcionalidades y el acceso al login.

### 👥 ¿Quiénes somos?
Página informativa sobre el equipo y el proyecto.

### 📩 Solicitar acceso
Formulario para que restaurantes nuevos soliciten acceso al sistema. Envía los datos del restaurante directamente al administrador por email.

### 🔐 Login
Autenticación con correo y contraseña. Redirige automáticamente según el rol del usuario (Admin o Mesero).

---

### 📊 Panel de Administración

El corazón de la aplicación para el rol Admin. Acceso desde sidebar lateral:

| Módulo | Qué hace |
|--------|----------|
| **Home** | KPIs del día: ventas, balance, ticket promedio y estado de mesas |
| **Mesas** | Grilla visual del estado de cada mesa con opciones de asignación |
| **Meseros** | CRUD de personal: crear, editar, activar y desactivar |
| **Finanzas / Resumen** | Balance del período con totales de ingresos y egresos |
| **Finanzas / Ingresos** | Historial y registro de ingresos del restaurante |
| **Finanzas / Egresos** | Historial y registro de egresos con categorías |
| **Finanzas / Reportes** | Movimientos detallados filtrados por fecha |
| **Finanzas / Cierre de caja** | Resumen del cierre diario |
| **Finanzas / Inventario** | Stock actual de productos del menú |
| **Finanzas / Nómina** | Movimientos de pago al personal |
| **Configuración** | Ajustes del restaurante |

---

### 🧑‍🍳 Panel del Mesero

Vista simplificada y operativa para el rol Mesero:

| Módulo | Qué hace |
|--------|----------|
| **Home** | Resumen rápido del turno |
| **Mesas** | Estado de las mesas asignadas, gestión de pedidos activos |
| **Meseros** | Directorio del equipo de trabajo |

---

## Tecnologías

| Tecnología | Para qué se usa |
|------------|-----------------|
| **React 19** | Construcción de toda la interfaz de usuario |
| **Vite 7** | Herramienta de construcción y servidor de desarrollo |
| **React Router 7** | Navegación entre páginas sin recarga |
| **React Icons** | Iconos SVG modernos en toda la interfaz |
| **SweetAlert2** | Modales de confirmación y alertas visuales |
| **TanStack Table** | Tablas con ordenamiento, filtros y paginación |
| **Google OAuth** | Autenticación con cuenta de Google (opcional) |

---

## Estructura de carpetas

```
Meseros-Fronted/
├── public/
│   └── Logo.png                         → Logo de la plataforma
│
└── src/
    ├── App.jsx                          → Definición de rutas por rol
    ├── main.jsx                         → Punto de entrada de la app
    │
    ├── api/
    │   ├── client.js                    → Métodos HTTP hacia la API del Backend
    │   └── bootstrap.js                 → Inicialización de datos al cargar la app
    │
    └── assets/components/
        ├── Inicio/                      → Sección pública
        │   ├── Inicio.jsx               → Landing page
        │   ├── NavbarInicio.jsx         → Barra de navegación pública
        │   ├── QuienesSomos/            → Página informativa
        │   ├── Sesion/Login.jsx         → Formulario de login
        │   └── Solicitar/Solicitar.jsx  → Formulario de solicitud de acceso
        │
        ├── Menu-Admin/                  → Panel del administrador
        │   ├── NavbarAdmin.jsx          → Sidebar de navegación admin
        │   ├── Home/Home.jsx            → Dashboard con KPIs
        │   ├── Mesas/Mesas.jsx          → Grilla de mesas
        │   ├── Meseros/Meseros.jsx      → Gestión de personal
        │   ├── Configuracion/           → Ajustes del restaurante
        │   └── Finanzas/               → Módulo financiero completo (10 vistas)
        │
        └── Menu-Mesero/                 → Panel del mesero
            ├── NavbarMesero.jsx         → Sidebar de navegación mesero
            ├── Home/Home.jsx            → Resumen del turno
            ├── Mesas/Mesas.jsx          → Mesas asignadas y pedidos
            └── Meseros/Meseros.jsx      → Directorio de compañeros
```

---

## Rutas de la aplicación

| Ruta | Pantalla | Acceso |
|------|----------|--------|
| `/` | Landing — página pública | Todos |
| `/quienes-somos` | Quiénes somos | Todos |
| `/solicitar` | Solicitar acceso | Todos |
| `/login` | Inicio de sesión | Todos |
| `/admin` | Dashboard del administrador | Solo admin |
| `/admin/mesas` | Gestión de mesas | Solo admin |
| `/admin/meseros` | Gestión de meseros | Solo admin |
| `/admin/finanzas/resumen` | Resumen financiero | Solo admin |
| `/admin/finanzas/ingresos` | Registro de ingresos | Solo admin |
| `/admin/finanzas/egresos` | Registro de egresos | Solo admin |
| `/admin/finanzas/reportes` | Reportes de movimientos | Solo admin |
| `/admin/finanzas/cierre` | Cierre de caja | Solo admin |
| `/admin/finanzas/inventario` | Inventario de productos | Solo admin |
| `/admin/finanzas/nominas` | Nómina del personal | Solo admin |
| `/admin/configuracion` | Configuración | Solo admin |
| `/mesero` | Dashboard del mesero | Solo mesero |
| `/mesero/mesas` | Mesas y pedidos del mesero | Solo mesero |
| `/mesero/meseros` | Directorio de compañeros | Solo mesero |

