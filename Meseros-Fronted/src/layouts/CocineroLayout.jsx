import { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import RouteFallback from '../assets/components/ui/RouteFallback';
import SidebarCocina from '../assets/components/Menu-Cocina/SidebarCocina';

export default function CocineroLayout() {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem('cocina_sidebar_collapsed') === '1'; } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem('cocina_sidebar_collapsed', collapsed ? '1' : '0'); } catch { /* localStorage no disponible (modo privado / cookies bloqueadas) */ }
    }, [collapsed]);

    return (
        <>
            <SidebarCocina collapsed={collapsed} onToggleCollapse={() => setCollapsed(v => !v)} />
            <div className={`admin-main ${collapsed ? 'admin-main-collapsed' : ''}`}>
                <Suspense fallback={<RouteFallback />}>
                    <Outlet />
                </Suspense>
            </div>
        </>
    );
}
