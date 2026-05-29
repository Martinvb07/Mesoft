import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api, request } from '../../../api/client';
import { useSocket } from '../../../hooks/useSocket';
import './Cocina.css';

const POLL_INTERVAL = 30_000; // 30 seconds

function colorClass(pedido) {
    const items = Array.isArray(pedido.items) ? pedido.items : [];
    if (!items.length) return 'kds-nuevo';
    const listos = items.filter((it) => it.listo || it.estado === 'listo').length;
    if (listos === 0) return 'kds-nuevo';
    if (listos === items.length) return 'kds-listo';
    return 'kds-parcial';
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

    return (
        <div className="kds-page">
            <div className="kds-header">
                <h1 className="kds-title">Cocina — Pedidos en Curso</h1>
                <div className="kds-header-right">
                    {pedidos.length > 0 && (
                        <span className="kds-count">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}</span>
                    )}
                    <button className="kds-refresh-btn" onClick={() => { setLoading(true); cargar(); }} title="Refrescar">
                        Refrescar
                    </button>
                </div>
            </div>

            {loading && <div className="kds-loading">Cargando pedidos...</div>}
            {!loading && error && <div className="kds-error">{error}</div>}
            {!loading && !error && pedidos.length === 0 && (
                <div className="kds-empty">No hay pedidos en curso. La cocina está al día.</div>
            )}

            {!loading && pedidos.length > 0 && (
                <div className="kds-grid">
                    {pedidos.map((p) => {
                        const cls = colorClass(p);
                        const items = Array.isArray(p.items) ? p.items : [];
                        const listos = items.filter((it) => it.listo || it.estado === 'listo').length;
                        const elapsed = tiempoTranscurrido(p.fecha_hora || p.created_at);
                        return (
                            <div key={p.id} className={`kds-card ${cls}`}>
                                <div className="kds-card-header">
                                    <div className="kds-card-title">
                                        <span className="kds-mesa">Mesa {p.mesa_id ?? p.mesa_numero ?? '?'}</span>
                                        {p.mesero_nombre && (
                                            <span className="kds-mesero">{p.mesero_nombre}</span>
                                        )}
                                    </div>
                                    <div className="kds-card-meta">
                                        <span className="kds-pedido-id">#{p.id}</span>
                                        {elapsed && <span className="kds-elapsed">{elapsed}</span>}
                                        <span className={`kds-badge ${cls}`}>
                                            {cls === 'kds-nuevo' && 'Nuevo'}
                                            {cls === 'kds-parcial' && `${listos}/${items.length}`}
                                            {cls === 'kds-listo' && 'Listo'}
                                        </span>
                                    </div>
                                </div>
                                <ul className="kds-items">
                                    {items.map((it) => {
                                        const estaListo = it.listo || it.estado === 'listo';
                                        return (
                                            <li key={it.id} className={`kds-item ${estaListo ? 'done' : ''}`}>
                                                <span className="kds-item-qty">{it.cantidad}×</span>
                                                <span className="kds-item-name">{it.nombre || it.producto_nombre || `Item #${it.id}`}</span>
                                                {!estaListo ? (
                                                    <button
                                                        className="kds-btn-listo"
                                                        onClick={() => marcarListo(p.id, it.id)}
                                                        title="Marcar como listo"
                                                    >
                                                        Listo
                                                    </button>
                                                ) : (
                                                    <span className="kds-item-done-mark">Listo</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <li className="kds-item-empty">Sin items cargados</li>
                                    )}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Cocina;
