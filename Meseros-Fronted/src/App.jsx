import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
// Navbars
import NavbarInicio from './assets/components/Inicio/NavbarInicio';
import NavbarAdmin from './assets/components/Menu-Admin/NavbarAdmin';
import NavbarMesero from './assets/components/Menu-Mesero/NavbarMesero';
// Páginas públicas
import Inicio from './assets/components/Inicio/Inicio';
import QuienesSomos from './assets/components/Inicio/QuienesSomos/QuienesSomos';
import Solicitar from './assets/components/Inicio/Solicitar/Solicitar';
import Login from './assets/components/Inicio/Sesion/Login';
import MenuPublico from './assets/components/Public/MenuPublico';
// Páginas por rol Admin
import HomeAdmin from './assets/components/Menu-Admin/Home/Home';
import MesasAdmin from './assets/components/Menu-Admin/Mesas/Mesas';
import MeserosAdmin from './assets/components/Menu-Admin/Meseros/Meseros';
import FinanzasAdmin from  './assets/components/Menu-Admin/Finanzas/FinanzasAdmin';
import FinResumen from './assets/components/Menu-Admin/Finanzas/Resumen';
import FinIngresos from './assets/components/Menu-Admin/Finanzas/Ingresos';
import FinEgresos from './assets/components/Menu-Admin/Finanzas/Egresos';
import FinReportes from './assets/components/Menu-Admin/Finanzas/Reportes';
import FinCierreCaja from './assets/components/Menu-Admin/Finanzas/CierreCaja';
import Configuracion from './assets/components/Menu-Admin/Configuracion/Configuracion';
import Cocina from './assets/components/Cocina/Cocina';
import AuditLog from './assets/components/Menu-Admin/Audit/AuditLog';
import Combos from './assets/components/Menu-Admin/Combos/Combos';
import Clientes from './assets/components/Menu-Admin/Clientes/Clientes';
import Onboarding, { isOnboardingDone, markOnboardingDone } from './assets/components/Onboarding/Onboarding';
import Proveedores from './assets/components/Menu-Admin/Proveedores/Proveedores';
import Horarios from './assets/components/Menu-Admin/Horarios/Horarios';
// Páginas por rol Mesero
import HomeMesero from './assets/components/Menu-Mesero/Home/Home';
import MesasMesero from './assets/components/Menu-Mesero/Mesas/Mesas';
import MeserosMesero from './assets/components/Menu-Mesero/Meseros/Meseros';
import FinInventario from './assets/components/Menu-Admin/Finanzas/Inventario';
import FinNominas from './assets/components/Menu-Admin/Finanzas/Nominas';
import { api } from './api/client';
import './App.css';

// Helper: read user role from localStorage
function getUserRol() {
    const keys = ['currentUser', 'usuario', 'user', 'auth_user'];
    for (const k of keys) {
        try {
            const raw = localStorage.getItem(k);
            if (raw) { const u = JSON.parse(raw); const rol = u?.rol || u?.role || u?.usuario?.rol || ''; if (rol) return rol; }
        } catch {}
    }
    return '';
}

// Route guard: redirect cocinero → /admin/cocina, cajero → /admin/finanzas
function AdminGuard({ children }) {
    const rol = getUserRol();
    if (rol === 'cocinero') return <Navigate to="/admin/cocina" replace />;
    if (rol === 'cajero') return <Navigate to="/admin/finanzas" replace />;
    return children;
}

// Onboarding gate: show wizard on first login if no mesas exist
function OnboardingGate({ children }) {
    const [checked, setChecked] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (isOnboardingDone()) { setChecked(true); return; }
        api.getMesas().then(mesas => {
            const count = Array.isArray(mesas) ? mesas.length : 0;
            if (count === 0) setShowOnboarding(true);
            else { markOnboardingDone(); }
            setChecked(true);
        }).catch(() => {
            // Can't reach API — skip onboarding to not block the user
            setChecked(true);
        });
    }, []);

    if (!checked) return null;
    if (showOnboarding) return <Onboarding onDone={() => setShowOnboarding(false)} />;
    return children;
}

function App() {
    const AdminLayout = () => (
        <>
            <NavbarAdmin />
            <div className="main-content">
                <OnboardingGate>
                    <Outlet />
                </OnboardingGate>
            </div>
        </>
    );

    const MeseroLayout = () => (
        <>
            <NavbarMesero />
            <div className="main-content">
                <Outlet />
            </div>
        </>
    );

    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta pública menú QR — sin navbar ni auth */}
                <Route path="/menu/:restaurantId" element={<MenuPublico />} />

                {/* Rutas públicas con NavbarInicio */}
                <Route path="/" element={
                    <>
                        <NavbarInicio />
                        <div className="main-content">
                            <Inicio />
                        </div>
                    </>
                } />
                <Route path="/quienes-somos" element={
                    <>
                        <NavbarInicio />
                        <div className="main-content">
                            <QuienesSomos />
                        </div>
                    </>
                } />
                <Route path="/solicitar" element={
                    <>
                        <NavbarInicio />
                        <div className="main-content">
                            <Solicitar />
                        </div>
                    </>
                } />
                <Route path="/login" element={
                    <>
                        <NavbarInicio />
                        <div className="main-content">
                            <Login />
                        </div>
                    </>
                } />

                {/* Rutas para admin con NavbarAdmin */}
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
                    <Route path="combos" element={<AdminGuard><Combos /></AdminGuard>} />
                    <Route path="clientes" element={<AdminGuard><Clientes /></AdminGuard>} />
                    <Route path="proveedores" element={<AdminGuard><Proveedores /></AdminGuard>} />
                    <Route path="horarios" element={<AdminGuard><Horarios /></AdminGuard>} />
                </Route>

                {/* Rutas para mesero con NavbarMesero */}
                <Route path="/mesero" element={<MeseroLayout />}>
                    <Route index element={<HomeMesero />} />
                    <Route path="home" element={<HomeMesero />} />
                    <Route path="mesas" element={<MesasMesero />} />
                    <Route path="meseros" element={<MeserosMesero />} />
                </Route>

                {/* Otras rutas generales */}
                {/* <Route path="/" element={<LandingPage />} /> */}
            </Routes>
        </BrowserRouter>
    );
}

export default App
