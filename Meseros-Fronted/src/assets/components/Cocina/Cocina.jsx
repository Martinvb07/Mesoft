import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineFire,
    HiOutlineArrowPath,
    HiOutlineClock,
    HiOutlineCheck,
    HiCheck,
    HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';
import { api, request } from '../../../api/client';
import { useSocket } from '../../../hooks/useSocket';

const POLL_INTERVAL = 30_000; // 30 seconds

const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const STATE_UI = {
    'kds-nuevo': { label: 'Nuevo', bar: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 ring-orange-200', icon: 'bg-orange-50 text-orange-600', progress: 'bg-orange-500', hover: 'hover:ring-orange-200' },
    'kds-parcial': { label: 'En proceso', bar: 'bg-sky-400', badge: 'bg-sky-50 text-sky-700 ring-sky-200', icon: 'bg-sky-50 text-sky-600', progress: 'bg-sky-400', hover: 'hover:ring-sky-200' },
    'kds-listo': { label: 'Listo', bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: 'bg-emerald-50 text-emerald-600', progress: 'bg-emerald-400', hover: 'hover:ring-emerald-200' },
};

function colorClass(pedido) {
    const items = Array.isArray(pedido.items) ? pedido.items : [];
    if (!items.length) return 'kds-nuevo';
    const listos = items.filter((it) => it.listo || it.estado === 'listo').length;
    if (listos === 0) return 'kds-nuevo';
    if (listos === items.length) return 'kds-listo';
    return 'kds-parcial';
}

function minutesSince(fechaHora) {
    if (!fechaHora) return 0;
    return Math.floor((Date.now() - new Date(fechaHora).getTime()) / 60000);
}

function tiempoTranscurrido(fechaHora) {
    if (!fechaHora) return '';
    const diff = Date.now() - new Date(fechaHora).getTime();
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function Cocina() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tick, setTick] = useState(0);
    const timerRef = useRef(null);

    const restaurantId = (() => {
        try { return localStorage.getItem('restaurant_id') || null; } catch { return null; }
    })();

    const cargar = useCallback(async () => {
        try {
            const data = await api.pedidosEnCurso();
            const arr = Array.isArray(data?.pedidos) ? data.pedidos : (Array.isArray(data) ? data : []);
            // Enrich with items if not already present
            const enriched = await Promise.all(
                arr.map(async (p) => {
                    if (Array.isArray(p.items) && p.items.length > 0) return p;
                    try {
                        const items = await api.getPedidoItems(p.id);
                        return { ...p, items: Array.isArray(items) ? items : [] };
                    } catch {
                        return { ...p, items: [] };
                    }
                })
            );
            setPedidos(enriched);
            setError('');
        } catch (e) {
            setError(e.message || 'Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load + polling every 30s
    useEffect(() => {
        cargar();
        timerRef.current = setInterval(cargar, POLL_INTERVAL);
        return () => clearInterval(timerRef.current);
    }, [cargar]);

    // Tick for live elapsed timers
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 10000);
        return () => clearInterval(t);
    }, []);

    // WebSocket: refresh on nuevo_pedido or pedido_cerrado
    useSocket(restaurantId, useCallback((event) => {
        if (event === 'nuevo_pedido' || event === 'pedido_cerrado') {
            cargar();
        }
    }, [cargar]));

    const marcarListo = async (pedidoId, itemId) => {
        try {
            await request(`/pedidos/${pedidoId}/items/${itemId}/listo`, { method: 'PATCH' });
            // Optimistic update
            setPedidos((prev) =>
                prev.map((p) => {
                    if (p.id !== pedidoId) return p;
                    return {
                        ...p,
                        items: (p.items || []).map((it) =>
                            it.id === itemId ? { ...it, listo: true, estado: 'listo' } : it
                        ),
                    };
                })
            );
        } catch (e) {
            alert(`Error al marcar como listo: ${e.message}`);
        }
    };

    const totalPedidos = pedidos.length;
    const totalItems = pedidos.reduce((s, p) => s + (Array.isArray(p.items) ? p.items.length : 0), 0);
    const itemsPendientes = pedidos.reduce((s, p) => s + (Array.isArray(p.items) ? p.items.filter(it => !(it.listo || it.estado === 'listo')).length : 0), 0);

    return (
        <div className="ms-kds mx-auto max-w-7xl">
            <style>{`:where(.ms-kds) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Cocina · KDS</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Pedidos en curso</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">
                        {totalPedidos > 0
                            ? `${totalPedidos} pedido${totalPedidos !== 1 ? 's' : ''} · ${itemsPendientes} ítem${itemsPendientes !== 1 ? 's' : ''} pendiente${itemsPendientes !== 1 ? 's' : ''}`
                            : 'Actualización en tiempo real'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {totalPedidos > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-600">
                            <HiOutlineClipboardDocumentList className="h-4 w-4" /> {totalItems} ítems
                        </span>
                    )}
                    <button className={btnGhost} onClick={() => { setLoading(true); cargar(); }} title="Refrescar">
                        <HiOutlineArrowPath className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
                    </button>
                </div>
            </motion.div>

            {/* Estados */}
            {loading ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`${cardBase} animate-pulse`}>
                            <div className="h-5 w-28 rounded bg-slate-200" />
                            <div className="mt-4 space-y-2">
                                <div className="h-8 w-full rounded bg-slate-100" />
                                <div className="h-8 w-full rounded bg-slate-100" />
                                <div className="h-8 w-2/3 rounded bg-slate-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className={`mt-6 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500"><HiOutlineFire className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-500">{error}</p>
                    </div>
                </div>
            ) : pedidos.length === 0 ? (
                <div className={`mt-6 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500"><HiCheck className="h-7 w-7" /></span>
                        <p className="m-0 text-base font-extrabold text-slate-900">La cocina está al día</p>
                        <p className="m-0 text-sm text-slate-400">No hay pedidos en curso.</p>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    animate="visible"
                    className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {pedidos.map((p) => {
                        const cls = colorClass(p);
                        const ui = STATE_UI[cls];
                        const items = Array.isArray(p.items) ? p.items : [];
                        const listos = items.filter((it) => it.listo || it.estado === 'listo').length;
                        const pct = items.length ? Math.round((listos / items.length) * 100) : 0;
                        const elapsed = tiempoTranscurrido(p.fecha_hora || p.created_at);
                        const mins = minutesSince(p.fecha_hora || p.created_at);
                        const urgente = cls !== 'kds-listo' && mins >= 15;
                        const aviso = cls !== 'kds-listo' && mins >= 8 && mins < 15;
                        return (
                            <motion.div
                                key={p.id}
                                variants={itemUp}
                                className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${ui.hover}`}
                            >
                                <span className={`absolute inset-x-0 top-0 h-1 ${ui.bar}`} />

                                {/* Header de la card */}
                                <div className="flex items-start justify-between gap-2 px-5 pb-3 pt-5">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ui.icon}`}>
                                            <HiOutlineFire className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="m-0 text-base font-extrabold tracking-tight text-slate-900">Mesa {p.mesa_id ?? p.mesa_numero ?? '?'}</p>
                                            <p className="m-0 truncate text-xs text-slate-400">#{p.id}{p.mesero_nombre ? ` · ${p.mesero_nombre}` : ''}</p>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ui.badge}`}>
                                        {cls === 'kds-nuevo' && 'Nuevo'}
                                        {cls === 'kds-parcial' && `${listos}/${items.length}`}
                                        {cls === 'kds-listo' && 'Listo'}
                                    </span>
                                </div>

                                {/* Tiempo + progreso */}
                                <div className="px-5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`inline-flex items-center gap-1 font-bold ${urgente ? 'text-red-600' : aviso ? 'text-amber-600' : 'text-slate-400'}`}>
                                            <HiOutlineClock className="h-3.5 w-3.5" /> {elapsed}
                                            {urgente && <span className="ml-1 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
                                        </span>
                                        <span className="font-semibold text-slate-400">{pct}%</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                        <span className={`block h-full rounded-full ${ui.progress}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>

                                {/* Items */}
                                <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-5 pt-2">
                                    {items.map((it) => {
                                        const estaListo = it.listo || it.estado === 'listo';
                                        return (
                                            <li
                                                key={it.id}
                                                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ring-1 transition-colors ${estaListo ? 'bg-emerald-50/60 ring-emerald-100' : 'bg-slate-50 ring-slate-100'}`}
                                            >
                                                <span className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-xs font-extrabold ${estaListo ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {it.cantidad}×
                                                </span>
                                                <span className={`flex-1 truncate text-sm font-semibold ${estaListo ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                    {it.nombre || it.producto_nombre || `Item #${it.id}`}
                                                </span>
                                                {!estaListo ? (
                                                    <button
                                                        onClick={() => marcarListo(p.id, it.id)}
                                                        title="Marcar como listo"
                                                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-md"
                                                    >
                                                        <HiOutlineCheck className="h-3.5 w-3.5" /> Listo
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                        <HiCheck className="h-3.5 w-3.5" /> Listo
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <li className="rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-slate-400 ring-1 ring-slate-100">Sin ítems cargados</li>
                                    )}
                                </ul>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}

export default Cocina;
