import { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import RouteFallback from '../assets/components/ui/RouteFallback';
import Sidebar from '../assets/components/Menu-Admin/Sidebar';
import Onboarding, { isOnboardingDone, markOnboardingDone } from '../assets/components/Onboarding/Onboarding';
import { api } from '../api/client';

/* Muestra el asistente inicial en el primer ingreso, cuando todavía no hay
   mesas creadas. */
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
            // Si la API no responde, no bloqueamos al usuario con el asistente
            setChecked(true);
        });
    }, []);

    if (!checked) return null;
    if (showOnboarding) return <Onboarding onDone={() => setShowOnboarding(false)} />;
    return children;
}

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem('admin_sidebar_collapsed') === '1'; } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem('admin_sidebar_collapsed', collapsed ? '1' : '0'); } catch { /* localStorage no disponible (modo privado / cookies bloqueadas) */ }
    }, [collapsed]);

    return (
        <>
            <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(v => !v)} />
            <div className={`admin-main ${collapsed ? 'admin-main-collapsed' : ''}`}>
                <OnboardingGate>
                    {/* Suspense aquí y no en App: así el sidebar no desaparece
                        mientras se descarga el chunk de la pantalla. */}
                    <Suspense fallback={<RouteFallback />}>
                        <Outlet />
                    </Suspense>
                </OnboardingGate>
            </div>
        </>
    );
}
