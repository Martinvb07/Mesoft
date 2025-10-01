import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
// Navbars
import NavbarInicio from './assets/components/Inicio/NavbarInicio';
import NavbarAdmin from './assets/components/Menu-Admin/NavbarAdmin';
import NavbarMesero from './assets/components/Menu-Mesero/NavbarMesero';
// Páginas públicas
import Inicio from './assets/components/Inicio/Inicio';
import QuienesSomos from './assets/components/Inicio/QuienesSomos/QuienesSomos';
import Solicitar from './assets/components/Inicio/Solicitar/Solicitar';
import Login from './assets/components/Inicio/Sesion/Login';
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
// Páginas por rol Mesero
import HomeMesero from './assets/components/Menu-Mesero/Home/Home';
import MesasMesero from './assets/components/Menu-Mesero/Mesas/Mesas';
import MeserosMesero from './assets/components/Menu-Mesero/Meseros/Meseros';
import FinInventario from './assets/components/Menu-Admin/Finanzas/Inventario';
import FinNominas from './assets/components/Menu-Admin/Finanzas/Nominas';
import './App.css';

function App() {
    const AdminLayout = () => (
        <>
            <NavbarAdmin />
            <div className="main-content">
                <Outlet />
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
                    <Route index element={<HomeAdmin />} />
                    <Route path="home" element={<HomeAdmin />} />
                    <Route path="mesas" element={<MesasAdmin />} />
                    <Route path="meseros" element={<MeserosAdmin />} />
                    <Route path="finanzas" element={<FinanzasAdmin />} />
                    <Route path="finanzas/resumen" element={<FinResumen />} />
                    <Route path="finanzas/ingresos" element={<FinIngresos />} />
                    <Route path="finanzas/egresos" element={<FinEgresos />} />
                    <Route path="finanzas/reportes" element={<FinReportes />} />
                    <Route path="finanzas/cierre" element={<FinCierreCaja />} />
                    <Route path="finanzas/inventario" element={<FinInventario />} />
                    <Route path="finanzas/nominas" element={<FinNominas />} />
                    <Route path="configuracion" element={<Configuracion />} />
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
