import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import RouteFallback from './assets/components/ui/RouteFallback';
import { syncThemeForRoute } from './lib/theme';
import './App.css';

/* ── Carga diferida por ruta ──────────────────────────────────────────────
   Todo va con React.lazy: quien entra a la landing ya no se descarga el
   panel admin, el POS del mesero ni la caja. Cada pantalla pide su trozo de
   JS (y su CSS) la primera vez que se visita, y queda cacheado después.
   Solo el enrutador y el fallback viajan en el bundle inicial. */

// Layouts
const PublicLayout = lazy(() => import('./layouts/PublicLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const CocineroLayout = lazy(() => import('./layouts/CocineroLayout'));
const CajeroLayout = lazy(() => import('./layouts/CajeroLayout'));
const MeseroLayout = lazy(() => import('./layouts/MeseroLayout'));

// Páginas públicas
const Inicio = lazy(() => import('./assets/components/Inicio/Inicio'));
const Funciones = lazy(() => import('./assets/components/Inicio/Funciones/Funciones'));
const QuienesSomos = lazy(() => import('./assets/components/Inicio/QuienesSomos/QuienesSomos'));
const Solicitar = lazy(() => import('./assets/components/Inicio/Solicitar/Solicitar'));
const Login = lazy(() => import('./assets/components/Inicio/Sesion/Login'));
const MenuPublico = lazy(() => import('./assets/components/Public/MenuPublico'));

// Admin
const HomeAdmin = lazy(() => import('./assets/components/Menu-Admin/Home/Home'));
const MesasAdmin = lazy(() => import('./assets/components/Menu-Admin/Mesas/Mesas'));
const MeserosAdmin = lazy(() => import('./assets/components/Menu-Admin/Meseros/Meseros'));
const FinanzasAdmin = lazy(() => import('./assets/components/Menu-Admin/Finanzas/FinanzasAdmin'));
const FinResumen = lazy(() => import('./assets/components/Menu-Admin/Finanzas/Resumen'));
const FinIngresos = lazy(() => import('./assets/components/Menu-Admin/Finanzas/Ingresos'));
const FinEgresos = lazy(() => import('./assets/components/Menu-Admin/Finanzas/Egresos'));
const FinReportes = lazy(() => import('./assets/components/Menu-Admin/Finanzas/Reportes'));
const FinCierreCaja = lazy(() => import('./assets/components/Menu-Admin/Finanzas/CierreCaja'));
const FinInventario = lazy(() => import('./assets/components/Menu-Admin/Finanzas/Inventario'));
const FinNominas = lazy(() => import('./assets/components/Menu-Admin/Finanzas/Nominas'));
const Configuracion = lazy(() => import('./assets/components/Menu-Admin/Configuracion/Configuracion'));
const AuditLog = lazy(() => import('./assets/components/Menu-Admin/Audit/AuditLog'));
const Categorias = lazy(() => import('./assets/components/Menu-Admin/Categorias/Categorias'));
const Clientes = lazy(() => import('./assets/components/Menu-Admin/Clientes/Clientes'));
const Proveedores = lazy(() => import('./assets/components/Menu-Admin/Proveedores/Proveedores'));
const Horarios = lazy(() => import('./assets/components/Menu-Admin/Horarios/Horarios'));

// Cocina y caja
const Cocina = lazy(() => import('./assets/components/Cocina/Cocina'));
const Caja = lazy(() => import('./assets/components/Menu-Cajero/Caja'));

// Mesero
const HomeMesero = lazy(() => import('./assets/components/Menu-Mesero/Home/Home'));
const MesasMesero = lazy(() => import('./assets/components/Menu-Mesero/Mesas/Mesas'));
const MeserosMesero = lazy(() => import('./assets/components/Menu-Mesero/Meseros/Meseros'));

// Al cambiar de ruta, sube al inicio de la página (salvo cuando hay un ancla #seccion)
function ScrollToTop() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (!hash) window.scrollTo(0, 0);
    }, [pathname, hash]);
    // Aplica el modo oscuro solo dentro de /admin; en el resto de rutas lo quita.
    useEffect(() => {
        syncThemeForRoute();
    }, [pathname]);
    return null;
}

// Helper: read user role from localStorage
function getUserRol() {
    const keys = ['currentUser', 'usuario', 'user', 'auth_user'];
    for (const k of keys) {
        try {
            const raw = localStorage.getItem(k);
            if (raw) { const u = JSON.parse(raw); const rol = u?.rol || u?.role || u?.usuario?.rol || ''; if (rol) return rol; }
        } catch { /* JSON inválido en localStorage: se ignora esa clave */ }
    }
    return '';
}

// Route guard: redirect cocinero → /admin/cocina, cajero → /admin/finanzas
function AdminGuard({ children }) {
    const rol = getUserRol();
    if (rol === 'cocinero') return <Navigate to="/cocinero/cocina" replace />;
    if (rol === 'cajero') return <Navigate to="/cajero/caja" replace />;
    return children;
}

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    {/* Ruta pública menú QR — sin navbar ni auth */}
                    <Route path="/menu/:restaurantId" element={<MenuPublico />} />

                    {/* Rutas públicas con NavbarInicio */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Inicio />} />
                        <Route path="/funciones" element={<Funciones />} />
                        <Route path="/quienes-somos" element={<QuienesSomos />} />
                        <Route path="/solicitar" element={<Solicitar />} />
                        <Route path="/login" element={<Login />} />
                    </Route>

                    {/* Rutas para admin con Sidebar */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminGuard><HomeAdmin /></AdminGuard>} />
                        <Route path="home" element={<AdminGuard><HomeAdmin /></AdminGuard>} />
                        <Route path="mesas" element={<AdminGuard><MesasAdmin /></AdminGuard>} />
                        <Route path="meseros" element={<AdminGuard><MeserosAdmin /></AdminGuard>} />
                        <Route path="finanzas" element={<AdminGuard><FinanzasAdmin /></AdminGuard>} />
                        <Route path="finanzas/resumen" element={<AdminGuard><FinResumen /></AdminGuard>} />
                        <Route path="finanzas/ingresos" element={<AdminGuard><FinIngresos /></AdminGuard>} />
                        <Route path="finanzas/egresos" element={<AdminGuard><FinEgresos /></AdminGuard>} />
                        <Route path="finanzas/reportes" element={<AdminGuard><FinReportes /></AdminGuard>} />
                        <Route path="finanzas/cierre" element={<AdminGuard><FinCierreCaja /></AdminGuard>} />
                        <Route path="finanzas/inventario" element={<AdminGuard><FinInventario /></AdminGuard>} />
                        <Route path="finanzas/nominas" element={<AdminGuard><FinNominas /></AdminGuard>} />
                        <Route path="configuracion" element={<AdminGuard><Configuracion /></AdminGuard>} />
                        <Route path="cocina" element={<Cocina />} />
                        <Route path="auditoria" element={<AdminGuard><AuditLog /></AdminGuard>} />
                        <Route path="categorias" element={<AdminGuard><Categorias /></AdminGuard>} />
                        <Route path="clientes" element={<AdminGuard><Clientes /></AdminGuard>} />
                        <Route path="proveedores" element={<AdminGuard><Proveedores /></AdminGuard>} />
                        <Route path="horarios" element={<AdminGuard><Horarios /></AdminGuard>} />
                    </Route>

                    {/* Rutas para cocina con su propio Sidebar */}
                    <Route path="/cocinero" element={<CocineroLayout />}>
                        <Route index element={<Cocina />} />
                        <Route path="cocina" element={<Cocina />} />
                    </Route>

                    {/* Rutas para cajero con su propio Sidebar */}
                    <Route path="/cajero" element={<CajeroLayout />}>
                        <Route index element={<Caja />} />
                        <Route path="caja" element={<Caja />} />
                    </Route>

                    {/* Rutas para mesero con NavbarMesero */}
                    <Route path="/mesero" element={<MeseroLayout />}>
                        <Route index element={<HomeMesero />} />
                        <Route path="home" element={<HomeMesero />} />
                        <Route path="mesas" element={<MesasMesero />} />
                        <Route path="meseros" element={<MeserosMesero />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App
