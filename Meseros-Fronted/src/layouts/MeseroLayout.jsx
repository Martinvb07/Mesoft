import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import RouteFallback from '../assets/components/ui/RouteFallback';
import NavbarMesero from '../assets/components/Menu-Mesero/NavbarMesero';
import BandejaListos from '../assets/components/Menu-Mesero/BandejaListos';
import ToastStack from '../assets/components/ui/ToastStack';
import { useSocket } from '../hooks/useSocket';
import { api } from '../api/client';

export default function MeseroLayout() {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem('mesero_sidebar_collapsed') === '1'; } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem('mesero_sidebar_collapsed', collapsed ? '1' : '0'); } catch { /* localStorage no disponible (modo privado / cookies bloqueadas) */ }
    }, [collapsed]);

    // Notificaciones en tiempo real (cocina marca "listo") en CUALQUIER
    // pantalla del mesero, no solo en Mesas.
    const [toasts, setToasts] = useState([]);
    const miIdRef = useRef(null);
    const restaurantId = (() => { try { return localStorage.getItem('restaurant_id'); } catch { return null; } })();

    useEffect(() => {
        let alive = true;
        api.getMiMesero().then(me => { if (alive) miIdRef.current = me?.id ?? null; }).catch(() => {});
        return () => { alive = false; };
    }, []);

    const [senalBandeja, setSenalBandeja] = useState(0);

    const pushToast = useCallback((toast) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev.slice(-3), { id, ...toast }]);
        // 20 s en vez de 6: el mesero rara vez está mirando la pantalla.
        // Aunque se le pase, el plato queda en la bandeja de pendientes.
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 20000);
    }, []);

    /* Un pitido corto con Web Audio (sin archivos que cargar) y vibración:
       el celular suele ir en el bolsillo. */
    const avisar = useCallback(() => {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) {
                const ctx = new Ctx();
                const osc = ctx.createOscillator();
                const vol = ctx.createGain();
                osc.connect(vol); vol.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
                vol.gain.setValueAtTime(0.001, ctx.currentTime);
                vol.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
                vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.start(); osc.stop(ctx.currentTime + 0.36);
                setTimeout(() => ctx.close().catch(() => {}), 600);
            }
        } catch { /* el navegador puede bloquear el audio hasta el primer toque */ }
        try { navigator.vibrate?.([180, 90, 180]); } catch { /* iOS no vibra */ }
    }, []);

    useSocket(restaurantId, useCallback((event, data) => {
        if (event !== 'item_listo') return;
        const myId = miIdRef.current;
        // Solo notificar si el pedido es de este mesero (o no se sabe)
        if (data?.mesero_id != null && myId != null && Number(data.mesero_id) !== Number(myId)) return;
        const prod = `${data?.cantidad ? `${data.cantidad}× ` : ''}${data?.nombre || 'Pedido'}`;
        const mesa = data?.mesa_numero ?? '';
        pushToast({ tone: 'listo', title: '¡Pedido listo!', msg: `${prod}${mesa ? ` · Mesa ${mesa}` : ''}` });
        avisar();
        setSenalBandeja(n => n + 1);
    }, [pushToast, avisar]));

    return (
        <>
            <NavbarMesero collapsed={collapsed} onToggleCollapse={() => setCollapsed(v => !v)} />
            <div className={`admin-main ${collapsed ? 'admin-main-collapsed' : ''}`}>
                <Suspense fallback={<RouteFallback />}>
                    <Outlet />
                </Suspense>
            </div>
            {/* Toasts globales del mesero (cocina → listo) */}
            <ToastStack toasts={toasts} />
            {/* Y lo que no alcanzó a ver, queda aquí hasta que lo recoja */}
            <BandejaListos recargarSenal={senalBandeja} />
        </>
    );
}
