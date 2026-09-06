import { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import RouteFallback from '../assets/components/ui/RouteFallback';
import SidebarCajero from '../assets/components/Menu-Cajero/SidebarCajero';

export default function CajeroLayout() {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem('cajero_sidebar_collapsed') === '1'; } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem('cajero_sidebar_collapsed', collapsed ? '1' : '0'); } catch { /* localStorage no disponible (modo privado / cookies bloqueadas) */ }
    }, [collapsed]);

    return (
        <>
            <SidebarCajero collapsed={collapsed} onToggleCollapse={() => setCollapsed(v => !v)} />
            <div className={`admin-main ${collapsed ? 'admin-main-collapsed' : ''}`}>
                <Suspense fallback={<RouteFallback />}>
                    <Outlet />
                </Suspense>
            </div>
        </>
    );
}
