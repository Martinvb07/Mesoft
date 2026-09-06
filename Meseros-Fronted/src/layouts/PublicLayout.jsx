import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import RouteFallback from '../assets/components/ui/RouteFallback';
import NavbarInicio from '../assets/components/Inicio/NavbarInicio';
import FooterInicio from '../assets/components/Inicio/FooterInicio';

/* Envoltura de las páginas públicas (landing, funciones, quiénes somos,
   solicitar, login). Antes cada ruta repetía navbar + footer a mano. */
export default function PublicLayout() {
    return (
        <>
            <NavbarInicio />
            <div className="main-content">
                <Suspense fallback={<RouteFallback />}>
                    <Outlet />
                </Suspense>
            </div>
            <FooterInicio />
        </>
    );
}
