import React, { useCallback, useEffect, useState, useMemo } from "react";
import { motion } from 'framer-motion';
import {
    HiOutlineTableCells, HiOutlineUserGroup, HiOutlineClipboardDocumentList,
    HiOutlineBanknotes, HiArrowTrendingUp, HiArrowTrendingDown,
    HiOutlineArrowPath, HiXMark, HiOutlineCube, HiOutlineExclamationTriangle,
    HiOutlineGift, HiOutlineReceiptPercent, HiOutlineSparkles,
} from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Home/Home.css';
import { api } from '../../../../api/client';
import { useSocket } from '../../../../hooks/useSocket';

/* ─── helpers de presentación ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function CardTitle({ children, right }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">{children}</h3>
            {right}
        </div>
    );
}

function Skel({ className = '' }) {
    return <span className={`inline-block animate-pulse rounded-md bg-slate-200 align-middle ${className}`} />;
}

function Chip({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-500',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function TrendPill({ pct }) {
    const up = Number(pct) >= 0;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {up ? <HiArrowTrendingUp className="h-3.5 w-3.5" /> : <HiArrowTrendingDown className="h-3.5 w-3.5" />}
            {up ? '+' : ''}{Number(pct).toFixed(1)}%
        </span>
    );
}

function EmptyState({ icon: Icon, children }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icon className="h-5 w-5" />
            </span>
            <p className="m-0 text-sm text-slate-400">{children}</p>
        </div>
    );
}

function Goal({ label, meta, val, pct, barClass }) {
    const p = Math.min(100, Math.max(0, pct));
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-600">{label}</span>
                <span className="text-slate-400">{fmtCOP(val)} / {fmtCOP(meta)} · {Math.round(pct)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${p}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`block h-full rounded-full ${barClass}`}
                />
            </div>
        </div>
    );
}

const Th = ({ children, right }) => (
    <th className={`px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 ${right ? 'text-right' : 'text-left'}`}>{children}</th>
);
const Td = ({ children, right, className = '' }) => (
    <td className={`px-3 py-2.5 text-sm text-slate-700 ${right ? 'text-right' : ''} ${className}`}>{children}</td>
);

function Home() {
    const [meserosLista, setMeserosLista] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [ventasHoy, setVentasHoy] = useState(0);
    const [balanceHoy, setBalanceHoy] = useState({ balance: 0, ingresos: 0, egresos: 0 });
    const [ticketPromedio, setTicketPromedio] = useState(0);
    const [variacionPct, setVariacionPct] = useState(0);
    const [metaHoy, setMetaHoy] = useState({ meta: 0, ventas: 0, progresoPct: 0 });
    const [egresosHoyCategorias, setEgresosHoyCategorias] = useState([]);
    const [topProductos, setTopProductos] = useState([]);
    const [mesas, setMesas] = useState([]);
    const [pedidosEnCurso, setPedidosEnCurso] = useState(0);
    const [pedidosDetalle, setPedidosDetalle] = useState([]); // [{id, mesa_id, mesero_id, total, fecha_hora, items: []}]
    const [pedidosCargando, setPedidosCargando] = useState(false);
    const [showPedidosModal, setShowPedidosModal] = useState(false);
    const [meserosActivosCount, setMeserosActivosCount] = useState(0);
    const [stockAlertas, setStockAlertas] = useState([]); // productos con stock bajo
    const [toasts, setToasts] = useState([]); // { id, msg }
    const [metaSemanal, setMetaSemanal] = useState(0);
    const [metaMensual, setMetaMensual] = useState(0);
    const [ventasSemana, setVentasSemana] = useState(0);
    const [ventasMes, setVentasMes] = useState(0);
    const [topPropinas, setTopPropinas] = useState([]); // [{ nombre, total }]

    const restaurantId = (() => { try { return localStorage.getItem('restaurant_id') || null; } catch { return null; } })();

    const addToast = useCallback((msg) => {
        const id = Date.now();
        setToasts((prev) => [...prev.slice(-4), { id, msg }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    }, []);

    // WebSocket: show toast on nuevo_pedido
    useSocket(restaurantId, useCallback((event, data) => {
        if (event === 'nuevo_pedido') {
            const mesa = data?.mesa_id ?? data?.mesa ?? '';
            addToast(`Nuevo pedido${mesa ? ` — Mesa ${mesa}` : ''}`);
        }
    }, [addToast]));

    // Refresca conteo y detalle de pedidos en curso (reutilizado por las dos vistas)
    const refreshPedidos = useCallback(async () => {
        setPedidosCargando(true);
        try {
            const pk = await api.pedidosEnCurso();
            setPedidosEnCurso(Number(pk?.count || 0));
            const arr = Array.isArray(pk?.pedidos) ? pk.pedidos : [];
            const det = await Promise.all(arr.map(async (p) => {
                try {
                    const items = await api.getPedidoItems(p.id);
                    return { ...p, items: Array.isArray(items) ? items : [] };
                } catch {
                    return { ...p, items: [] };
                }
            }));
            setPedidosDetalle(det);
        } finally {
            setPedidosCargando(false);
        }
    }, []);

    useEffect(() => {
        let cancel = false;
        async function load() {
            try {
                setCargando(true);
                // Meseros activos (lista y conteo)
                try {
                    const lista = await api.getMeseros();
                    const esMesero = (u) => `${u.rol || 'mesero'}`.toLowerCase() === 'mesero';
                    const activos = (Array.isArray(lista) ? lista : []).filter(u => esMesero(u) && (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo'));
                    if (!cancel) {
                        setMeserosLista(activos);
                        setMeserosActivosCount(activos.length);
                    }
                } catch (e) {
                    if (!cancel) setError('No se pudieron cargar los meseros.');
                }
                // Finanzas: ventas hoy y balance hoy
                try {
                    const v = await api.ventasHoy();
                    if (!cancel) setVentasHoy(Number(v?.ventas || 0));
                } catch {}
                try {
                    const b = await api.balanceHoy();
                    if (!cancel) setBalanceHoy({
                        balance: Number(b?.balance || 0),
                        ingresos: Number(b?.ingresos || 0),
                        egresos: Number(b?.egresos || 0),
                    });
                } catch {}
                // Ticket promedio y variación
                try {
                    const t = await api.ticketPromedioHoy();
                    if (!cancel) setTicketPromedio(Number(t?.ticket_promedio || 0));
                } catch {}
                try {
                    const vv = await api.variacionVentasDia();
                    if (!cancel) setVariacionPct(Number(vv?.variacionPct || 0));
                } catch {}
                // Meta diaria progreso
                try {
                    const mh = await api.metaHoy();
                    if (!cancel) setMetaHoy({
                        meta: Number(mh?.meta || 0),
                        ventas: Number(mh?.ventas || 0),
                        progresoPct: Number(mh?.progresoPct || 0)
                    });
                } catch {}
                // Mesas para métricas de ocupación
                try {
                    const ms = await api.getMesas();
                    if (!cancel) setMesas(Array.isArray(ms) ? ms : []);
                } catch {}
                // Pedidos en curso (conteo y detalle)
                try {
                    setPedidosCargando(true);
                    const pk = await api.pedidosEnCurso();
                    if (!cancel) setPedidosEnCurso(Number(pk?.count || 0));
                    const arr = Array.isArray(pk?.pedidos) ? pk.pedidos : [];
                    const det = await Promise.all(arr.map(async (p) => {
                        try {
                            const items = await api.getPedidoItems(p.id);
                            return { ...p, items: Array.isArray(items) ? items : [] };
                        } catch {
                            return { ...p, items: [] };
                        }
                    }));
                    if (!cancel) setPedidosDetalle(det);
                } catch {
                    if (!cancel) {
                        setPedidosDetalle([]);
                        setPedidosEnCurso(0);
                    }
                } finally {
                    if (!cancel) setPedidosCargando(false);
                }
                // Costos e Insumos (egresos por categoría hoy)
                try {
                    const eg = await api.egresosCategoriasHoy();
                    if (!cancel) setEgresosHoyCategorias(Array.isArray(eg) ? eg : []);
                } catch {}
                // Top productos últimos 7 días
                try {
                    const tp = await api.topProductos({ limit: 4 });
                    if (!cancel) setTopProductos(Array.isArray(tp) ? tp : []);
                } catch {}
                // Alertas de stock bajo (productos con stock <= min_stock)
                try {
                    const prods = await api.getProductos();
                    const arr = Array.isArray(prods?.items) ? prods.items : (Array.isArray(prods) ? prods : []);
                    const alertas = arr.filter(p => {
                        const stock = Number(p.stock ?? p.cantidad ?? -1);
                        const minStock = Number(p.min_stock ?? p.minStock ?? p.stock_minimo ?? 5);
                        return stock >= 0 && stock <= minStock;
                    }).slice(0, 5);
                    if (!cancel) setStockAlertas(alertas);
                } catch {}

                // Metas semanales / mensuales (Feature 6)
                try {
                    const settings = JSON.parse(localStorage.getItem('app_settings_v1') || '{}');
                    if (!cancel) {
                        setMetaSemanal(Number(settings.metaSemanal || 0));
                        setMetaMensual(Number(settings.metaMensual || 0));
                    }
                    // Compute week range
                    const now = new Date();
                    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6);
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    const fmt = (d) => d.toISOString().slice(0,10);
                    const [factSemana, factMes] = await Promise.allSettled([
                        api.facturas({ desde: fmt(weekStart), hasta: fmt(now) }),
                        api.facturas({ desde: fmt(monthStart), hasta: fmt(now) }),
                    ]);
                    const sumVentas = (rows) => (Array.isArray(rows) ? rows : []).reduce((s, f) => s + Number(f.total||0), 0);
                    if (!cancel) {
                        setVentasSemana(sumVentas(factSemana.status === 'fulfilled' ? factSemana.value : []));
                        setVentasMes(sumVentas(factMes.status === 'fulfilled' ? factMes.value : []));
                    }

                    // Top propinas esta semana (Feature 7) — client-side aggregation
                    const factRows = factSemana.status === 'fulfilled' ? (Array.isArray(factSemana.value) ? factSemana.value : []) : [];
                    const propinaMap = {};
                    factRows.forEach(f => {
                        const key = f.mesero_nombre || String(f.mesero_id || 'Desconocido');
                        if (!propinaMap[key]) propinaMap[key] = 0;
                        propinaMap[key] += Number(f.propina || 0);
                    });
                    const ranking = Object.entries(propinaMap)
                        .map(([nombre, total]) => ({ nombre, total }))
                        .sort((a, b) => b.total - a.total)
                        .slice(0, 3);
                    if (!cancel) setTopPropinas(ranking);
                } catch {}
            } finally {
                if (!cancel) setCargando(false);
            }
        }
        load();
        return () => { cancel = true; };
    }, []);

    const meserosActivos = useMemo(() => {
        const fullName = (u = {}) => {
            const n = `${u.nombre || u.name || ''}`.trim();
            return n || u.usuario || u.username || u.correo || `Mesero #${u.id || ''}`;
        };
        const lista = (meserosLista || []).map(u => ({ id: u.id, nombre: fullName(u) }));
        return { total: lista.length, lista: lista.slice(0, 8) };
    }, [meserosLista]);

    // Métricas calculadas desde API (con fallback si no hay datos)
    const mesasTotales = mesas.length;
    const libres = mesas.filter(m => m.estado === 'libre').length;
    const reservadas = mesas.filter(m => m.estado === 'reservada').length;
    const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
    const occPct = mesasTotales > 0 ? Math.round((ocupadas / mesasTotales) * 100) : 0;

    // Nombre del restaurante desde storage (flexible con varios posibles campos)
    const restaurantName = useMemo(() => {
        const pickName = (u) => {
            if (!u || typeof u !== 'object') return '';
            return (
                u.restaurante || u.nombreRestaurante || u.nombre_restaurante ||
                u.empresa || u.company || u.organization || u.organizacion || ''
            );
        };
        const keys = ['usuario', 'user', 'auth_user', 'currentUser'];
        for (const k of keys) {
            try {
                const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
                if (!raw) continue;
                const obj = JSON.parse(raw);
                const name = pickName(obj.usuario || obj.user || obj) || '';
                if (name) return String(name);
            } catch {}
        }
        return 'Mi Restaurante';
    }, []);

    const fechaHoy = useMemo(() => {
        const s = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    }, []);

    return (
        <div className="ms-home mx-auto max-w-7xl">
            <style>{`:where(.ms-home) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Panel de control</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{restaurantName}</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Resumen de hoy · {fechaHoy}</p>
                </div>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                {/* Mesas disponibles */}
                <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
                    <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                            <HiOutlineTableCells className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                        </span>
                        <Chip>{occPct}% ocup.</Chip>
                    </div>
                    <p className="mt-4 text-2xl font-extrabold text-slate-900">
                        {cargando ? <Skel className="h-7 w-16" /> : <>{libres}<span className="text-base font-bold text-slate-400"> / {mesasTotales}</span></>}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-400">Mesas disponibles</p>
                </motion.div>

                {/* Meseros activos */}
                <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
                    <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                            <HiOutlineUserGroup className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                        </span>
                        <Chip tone="emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En turno</Chip>
                    </div>
                    <p className="mt-4 text-2xl font-extrabold text-slate-900">
                        {cargando ? <Skel className="h-7 w-10" /> : (meserosActivosCount || meserosActivos.total)}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-400">Meseros activos</p>
                </motion.div>

                {/* Pedidos en curso (clickable) */}
                <motion.div
                    variants={itemUp}
                    onClick={() => setShowPedidosModal(true)}
                    title="Ver pedidos en curso"
                    className={`group ${cardBase} cursor-pointer transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}
                >
                    <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                            <HiOutlineClipboardDocumentList className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                        </span>
                        <Chip tone="orange">Ver detalle</Chip>
                    </div>
                    <p className="mt-4 text-2xl font-extrabold text-slate-900">
                        {cargando ? <Skel className="h-7 w-10" /> : pedidosEnCurso}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-400">Pedidos en curso</p>
                </motion.div>

                {/* Ventas de hoy */}
                <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
                    <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                            <HiOutlineBanknotes className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                        </span>
                        {!cargando && <TrendPill pct={variacionPct} />}
                    </div>
                    <p className="mt-4 text-2xl font-extrabold text-slate-900">
                        {cargando ? <Skel className="h-7 w-24" /> : fmtCOP(ventasHoy)}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-400">Ventas de hoy</p>
                </motion.div>
            </motion.div>

            {/* Bento grid */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3"
            >
                {/* Producción y Ventas (sin gráficas) */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-2`}>
                    <CardTitle>Producción y Ventas</CardTitle>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[
                            { label: 'Ventas hoy', value: fmtCOP(ventasHoy) },
                            { label: 'Ingresos hoy', value: fmtCOP(balanceHoy.ingresos) },
                            { label: 'Egresos hoy', value: fmtCOP(balanceHoy.egresos) },
                            { label: 'Ticket promedio', value: fmtCOP(ticketPromedio) },
                        ].map((k) => (
                            <div key={k.label} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                <p className="m-0 text-xs text-slate-400">{k.label}</p>
                                <p className="m-0 mt-1 text-lg font-extrabold text-slate-900">
                                    {cargando ? <Skel className="h-5 w-20" /> : k.value}
                                </p>
                            </div>
                        ))}
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                            <p className="m-0 text-xs text-slate-400">Variación vs ayer</p>
                            <p className="m-0 mt-1.5">
                                {cargando ? <Skel className="h-5 w-16" /> : <TrendPill pct={variacionPct} />}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                        <Goal label="Meta diaria" meta={metaHoy.meta} val={metaHoy.ventas} pct={metaHoy.progresoPct} barClass="bg-gradient-to-r from-orange-500 to-orange-600" />
                        {metaSemanal > 0 && (
                            <Goal label="Meta semanal" meta={metaSemanal} val={ventasSemana} pct={(ventasSemana / metaSemanal) * 100} barClass="bg-gradient-to-r from-sky-500 to-sky-600" />
                        )}
                        {metaMensual > 0 && (
                            <Goal label="Meta mensual" meta={metaMensual} val={ventasMes} pct={(ventasMes / metaMensual) * 100} barClass="bg-gradient-to-r from-amber-400 to-amber-500" />
                        )}
                    </div>
                </motion.div>

                {/* Resumen de Ocupación */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-1`}>
                    <CardTitle right={<Chip tone="orange">{occPct}%</Chip>}>Resumen de Ocupación</CardTitle>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full bg-emerald-400" style={{ width: `${mesasTotales > 0 ? (ocupadas / mesasTotales) * 100 : 0}%` }} />
                        <span className="block h-full bg-sky-400" style={{ width: `${mesasTotales > 0 ? (reservadas / mesasTotales) * 100 : 0}%` }} />
                        <span className="block h-full bg-slate-200" style={{ width: `${mesasTotales > 0 ? (libres / mesasTotales) * 100 : 0}%` }} />
                    </div>
                    <div className="mt-4 space-y-2.5">
                        {[
                            { dot: 'bg-emerald-400', label: 'Ocupadas', val: ocupadas },
                            { dot: 'bg-sky-400', label: 'Reservadas', val: reservadas },
                            { dot: 'bg-slate-300', label: 'Libres', val: libres },
                        ].map((r) => (
                            <div key={r.label} className="flex items-center gap-2.5 text-sm">
                                <span className={`h-2.5 w-2.5 rounded-sm ${r.dot}`} />
                                <span className="text-slate-500">{r.label}</span>
                                <strong className="ml-auto font-extrabold text-slate-900">{r.val}</strong>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Meseros activos */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-1`}>
                    <CardTitle>Meseros activos {!cargando && `(${meserosActivos.total})`}</CardTitle>
                    {error && <p className="m-0 mb-2 text-sm text-red-500">{error}</p>}
                    {cargando ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skel className="h-9 w-9 rounded-full" />
                                    <Skel className="h-4 w-28" />
                                </div>
                            ))}
                        </div>
                    ) : meserosActivos.lista.length === 0 ? (
                        <EmptyState icon={HiOutlineUserGroup}>No hay meseros activos.</EmptyState>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {meserosActivos.lista.map(m => (
                                <div key={m.id} className="flex items-center gap-3 py-2.5">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-extrabold text-orange-600 ring-2 ring-orange-100">
                                        {(m.nombre || '?').charAt(0).toUpperCase()}
                                    </span>
                                    <span className="truncate text-sm font-medium text-slate-700">{m.nombre}</span>
                                    <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Top propinas */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-1`}>
                    <CardTitle>Top propinas <span className="font-medium text-slate-400">(esta semana)</span></CardTitle>
                    {topPropinas.length === 0 ? (
                        <EmptyState icon={HiOutlineGift}>Sin propinas registradas esta semana.</EmptyState>
                    ) : (
                        <div className="space-y-2.5">
                            {topPropinas.map((m, idx) => (
                                <div key={idx} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ${idx === 0 ? 'bg-orange-50 ring-orange-100' : 'bg-slate-50 ring-slate-100'}`}>
                                    <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                                    <span className="flex-1 truncate text-sm font-semibold text-slate-700">{m.nombre}</span>
                                    <span className="text-sm font-extrabold text-emerald-600">{fmtCOP(m.total)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Costos e Insumos (hoy) */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-1`}>
                    <CardTitle>Costos e Insumos <span className="font-medium text-slate-400">(hoy)</span></CardTitle>
                    {egresosHoyCategorias.length === 0 ? (
                        <EmptyState icon={HiOutlineReceiptPercent}>Sin egresos registrados hoy.</EmptyState>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <Th>Categoría</Th>
                                        <Th right>Mov.</Th>
                                        <Th right>Total</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {egresosHoyCategorias.map((r, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                            <Td>{r.categoria}</Td>
                                            <Td right>{r.movimientos}</Td>
                                            <Td right className="font-semibold">{fmtCOP(r.total)}</Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <span className="block h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600" style={{ width: `${Math.min(100, (balanceHoy.ingresos > 0 ? (balanceHoy.egresos / Math.max(1, balanceHoy.ingresos)) : 0) * 100)}%` }} />
                        </div>
                        <div className="mt-1.5 flex justify-between text-xs text-slate-400">
                            <span>Egresos / Ingresos hoy</span>
                            <span>{balanceHoy.ingresos > 0 ? ((balanceHoy.egresos / Math.max(1, balanceHoy.ingresos)) * 100).toFixed(0) : 0}%</span>
                        </div>
                    </div>
                </motion.div>

                {/* Pedidos en curso (tabla) */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-3`}>
                    <CardTitle right={
                        <button
                            onClick={refreshPedidos}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
                        >
                            <HiOutlineArrowPath className={`h-3.5 w-3.5 ${pedidosCargando ? 'animate-spin' : ''}`} /> Refrescar
                        </button>
                    }>
                        Pedidos en curso {!pedidosCargando && `(${pedidosEnCurso})`}
                    </CardTitle>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <Th>Pedido</Th>
                                    <Th>Mesa</Th>
                                    <Th>Mesero</Th>
                                    <Th>Items</Th>
                                    <Th right>Total</Th>
                                    <Th>Hora</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedidosCargando && !pedidosDetalle.length ? (
                                    [0, 1, 2].map(i => (
                                        <tr key={i} className="border-b border-slate-50">
                                            {[...Array(6)].map((_, j) => <Td key={j}><Skel className="h-4 w-16" /></Td>)}
                                        </tr>
                                    ))
                                ) : pedidosDetalle.length ? (
                                    pedidosDetalle.map((p) => {
                                        const resumen = (p.items || []).map(it => `${it.nombre} x${it.cantidad}`).join(', ');
                                        const hora = p.fecha_hora ? new Date(p.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
                                        return (
                                            <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                                <Td className="font-semibold text-slate-900">#{p.id}</Td>
                                                <Td>{p.mesa_id}</Td>
                                                <Td>{p.mesero_id ?? '—'}</Td>
                                                <Td><span className="block max-w-[360px] truncate text-slate-500" title={resumen}>{resumen || '—'}</span></Td>
                                                <Td right className="font-semibold">{fmtCOP(p.total)}</Td>
                                                <Td>{hora}</Td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan={6}><EmptyState icon={HiOutlineClipboardDocumentList}>No hay pedidos abiertos.</EmptyState></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Top Productos (tabla) */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-3`}>
                    <CardTitle>Top Productos <span className="font-medium text-slate-400">(últimos 7 días)</span></CardTitle>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <Th>Producto</Th>
                                    <Th right>Unidades</Th>
                                    <Th right>Ingresos</Th>
                                    <Th right>Tendencia</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProductos.length ? topProductos.map((p) => (
                                    <tr key={p.producto_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                        <Td className="font-medium text-slate-900">{p.nombre}</Td>
                                        <Td right>{Number(p.unidades || 0)}</Td>
                                        <Td right className="font-semibold">{fmtCOP(p.ingresos)}</Td>
                                        <Td right><TrendPill pct={Number(p.tendenciaPct || 0)} /></Td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4}><EmptyState icon={HiOutlineCube}>No hay datos de productos aún.</EmptyState></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Alertas de stock */}
                {stockAlertas.length > 0 && (
                    <motion.div variants={itemUp} className={`${cardBase} lg:col-span-3`}>
                        <CardTitle right={<Chip tone="orange">{stockAlertas.length}</Chip>}>
                            <span className="inline-flex items-center gap-2"><HiOutlineExclamationTriangle className="h-5 w-5 text-orange-500" /> Alertas de stock</span>
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                            {stockAlertas.map((p, idx) => {
                                const stock = Number(p.stock ?? p.cantidad ?? 0);
                                const isEmpty = stock === 0;
                                return (
                                    <span
                                        key={idx}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
                                            isEmpty ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-orange-50 text-orange-700 ring-orange-200'
                                        }`}
                                    >
                                        {isEmpty ? '⛔' : '⚠️'} {p.nombre} — stock: {stock}
                                    </span>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Modal pedidos en curso */}
            {showPedidosModal && (
                <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="ms-home flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">
                                Pedidos en curso {!pedidosCargando && `(${pedidosEnCurso})`}
                            </h3>
                            <button
                                onClick={() => setShowPedidosModal(false)}
                                aria-label="Cerrar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            >
                                <HiXMark className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto px-5 py-4">
                            <div className="mb-2 flex justify-end">
                                <button
                                    onClick={refreshPedidos}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                >
                                    <HiOutlineArrowPath className={`h-3.5 w-3.5 ${pedidosCargando ? 'animate-spin' : ''}`} /> Refrescar
                                </button>
                            </div>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <Th>Pedido</Th>
                                        <Th>Mesa</Th>
                                        <Th>Mesero</Th>
                                        <Th>Items</Th>
                                        <Th right>Total</Th>
                                        <Th>Hora</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidosDetalle.length ? pedidosDetalle.map((p) => {
                                        const resumen = (p.items || []).map(it => `${it.nombre} x${it.cantidad}`).join(', ');
                                        const hora = p.fecha_hora ? new Date(p.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
                                        return (
                                            <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                                <Td className="font-semibold text-slate-900">#{p.id}</Td>
                                                <Td>{p.mesa_id}</Td>
                                                <Td>{p.mesero_id ?? '—'}</Td>
                                                <Td><span className="block max-w-[360px] truncate text-slate-500" title={resumen}>{resumen || '—'}</span></Td>
                                                <Td right className="font-semibold">{fmtCOP(p.total)}</Td>
                                                <Td>{hora}</Td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan={6}><EmptyState icon={HiOutlineClipboardDocumentList}>No hay pedidos abiertos.</EmptyState></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end border-t border-slate-100 px-5 py-3">
                            <button
                                onClick={() => setShowPedidosModal(false)}
                                className="inline-flex items-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                Cerrar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Toasts (WebSocket) */}
            {toasts.length > 0 && (
                <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="pointer-events-auto flex items-center gap-2.5 rounded-xl border-l-4 border-orange-500 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-xl ring-1 ring-slate-100"
                        >
                            <HiOutlineSparkles className="h-4 w-4 text-orange-500" />
                            {t.msg}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Home;
