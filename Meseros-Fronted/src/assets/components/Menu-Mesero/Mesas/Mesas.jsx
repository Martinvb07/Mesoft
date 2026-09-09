import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineTableCells, HiOutlineUsers, HiOutlineCheckCircle, HiOutlineSparkles,
    HiOutlineMagnifyingGlass, HiOutlineUser, HiOutlineArrowPath, HiXMark,
    HiMinus, HiPlus, HiOutlinePaperAirplane, HiChevronLeft,
    HiOutlineSquares2X2, HiOutlineMap,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';
import { useSocket } from '../../../../hooks/useSocket';
import Select from '../../ui/Select';
import StepWizard from '../../ui/StepWizard';
import { imagenTransformada } from '../../../../utils/imagen';

const HEX_COLOR = {
    orange: '#f97316', sky: '#0ea5e9', emerald: '#10b981', violet: '#8b5cf6',
    amber: '#f59e0b', rose: '#f43f5e', teal: '#14b8a6', indigo: '#6366f1',
    lime: '#84cc16', pink: '#ec4899', cyan: '#06b6d4', blue: '#3b82f6',
    fuchsia: '#d946ef', green: '#22c55e', yellow: '#eab308', slate: '#94a3b8',
};
const hexDeColor = (c) => HEX_COLOR[c] || HEX_COLOR.slate;

/* Blanco o casi negro según qué tan claro sea el color, para que el nombre de
   la categoría se lea igual sobre naranja que sobre amarillo. */
const textoSobre = (hex) => {
    const v = String(hex || '').replace('#', '');
    if (v.length !== 6) return '#ffffff';
    const [r, g, b] = [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16) / 255);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.6 ? '#0f172a' : '#ffffff';
};

/* ─── helpers de presentación (alineados con Inicio / Mesas admin) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 sm:p-5';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
// Acciones de tarjeta de mesa — estilo unificado, ancho igual
const actPrimary = 'min-w-[4.75rem] flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-2.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-md';
const actSecondary = 'min-w-[4.75rem] flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200';

/* Variantes tactiles de los botones de accion: en el modal movil ocupan todo
   el ancho y tienen mas area para el dedo. */
const actPrimaryLg = 'w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-3 py-3 text-sm font-bold text-white shadow-sm shadow-orange-500/30 transition-transform active:scale-[.98]';
const actSecondaryLg = 'w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-3 text-sm font-bold text-slate-600 transition-transform active:scale-[.98]';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const ESTADO_UI = {
    libre: { label: 'Libre', bar: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-400', icon: 'bg-emerald-50 text-emerald-600' },
    ocupada: { label: 'Ocupada', bar: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500', icon: 'bg-orange-50 text-orange-600' },
    reservada: { label: 'Reservada', bar: 'bg-sky-400', pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-400', icon: 'bg-sky-50 text-sky-600' },
    limpieza: { label: 'Limpieza', bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400', icon: 'bg-amber-50 text-amber-600' },
};
const estadoUI = (e) => ESTADO_UI[e] || { label: e || '—', bar: 'bg-slate-300', pill: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-300', icon: 'bg-slate-100 text-slate-500' };

function MetricCard({ icon: Icon, value, label }) {
    return (
        <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
            <div className="flex items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500 sm:h-11 sm:w-11 sm:rounded-xl">
                    <Icon className="h-4 w-4 text-orange-500 transition-colors duration-300 group-hover:text-white sm:h-5 sm:w-5" />
                </span>
            </div>
            <p className="mt-2.5 text-lg font-extrabold text-slate-900 sm:mt-4 sm:text-2xl">{value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-400 sm:text-sm">{label}</p>
        </motion.div>
    );
}

function Modal({ title, onClose, children, footer, maxW = 'max-w-lg', cerrarFuera = false }) {
    /* Con el modal abierto el fondo no debe scrollear: en movil se sentia como
       si la pantalla se moviera bajo el dialogo. */
    const cerrarRef = useRef(onClose);
    cerrarRef.current = onClose;
    useEffect(() => {
        const previo = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') cerrarRef.current(); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previo;
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={cerrarFuera ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className={`ms-mesas-mesero flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
            >
                <style>{`:where(.ms-mesas-mesero) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">{title}</h3>
                    <button onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"><HiXMark className="h-5 w-5" /></button>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
            </motion.div>
        </div>
    );
}

const Th = ({ children, right }) => (
    <th className={`px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 ${right ? 'text-right' : 'text-left'}`}>{children}</th>
);

const PASOS_PEDIDO = [
    { title: 'Categoría', hint: 'Elige el grupo del menú' },
    { title: 'Producto', hint: 'Ajusta cantidad y notas, y agrega' },
    { title: 'Resumen', hint: 'Revisa el pedido y envíalo a caja' },
];

/* Consumos del pedido. En móvil va como lista (una tabla de 5 columnas obliga
   a deslizar); de tablet en adelante, la tabla de siempre. */
function TablaConsumos({ items, editable, total, onQuitar }) {
    return (
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-100">
            {/* Móvil */}
            <ul className="m-0 list-none divide-y divide-slate-100 p-0 sm:hidden">
                {items.map((it, idx) => (
                    <li key={idx} className="flex list-none items-start gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                            <p className="m-0 text-sm font-semibold leading-tight text-slate-900">{it.nombre}</p>
                            {it.nota && <p className="m-0 mt-0.5 text-xs italic text-slate-400">{it.nota}</p>}
                            <p className="m-0 mt-1 text-xs text-slate-500">{it.cantidad} × {fmtCOP(it.precio)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-sm font-extrabold text-slate-900">{fmtCOP(it.cantidad * it.precio)}</span>
                            {editable && (
                                <button onClick={() => onQuitar(idx)} className="text-xs font-semibold text-red-500">Quitar</button>
                            )}
                        </div>
                    </li>
                ))}
                {items.length === 0 && (
                    <li className="list-none px-3 py-6 text-center text-sm text-slate-400">Sin productos.</li>
                )}
                <li className="flex list-none items-center justify-between bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-extrabold text-slate-900">Total</span>
                    <span className="text-base font-extrabold text-orange-600">{fmtCOP(total)}</span>
                </li>
            </ul>

            {/* Tablet y escritorio */}
            <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-50">
                        <tr className="border-b border-slate-100">
                            <Th>Producto</Th>
                            <Th right>Cant.</Th>
                            <Th right>Precio</Th>
                            <Th right>Subtotal</Th>
                            {editable && <Th right></Th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, idx) => (
                            <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                <td className="px-3 py-2.5 text-sm">
                                    <span className="font-medium text-slate-900">{it.nombre}</span>
                                    {it.nota && <span className="block text-xs italic text-slate-400">{it.nota}</span>}
                                </td>
                                <td className="px-3 py-2.5 text-right text-sm text-slate-700">{it.cantidad}</td>
                                <td className="px-3 py-2.5 text-right text-sm text-slate-700">{fmtCOP(it.precio)}</td>
                                <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900">{fmtCOP(it.cantidad * it.precio)}</td>
                                {editable && (
                                    <td className="px-3 py-2.5 text-right">
                                        <button onClick={() => onQuitar(idx)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50">Quitar</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={editable ? 5 : 4} className="px-3 py-6 text-center text-sm text-slate-400">Sin productos.</td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50">
                            <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-extrabold text-slate-900">Total</td>
                            <td className="px-3 py-2.5 text-right text-sm font-extrabold text-orange-600" colSpan={editable ? 2 : 1}>{fmtCOP(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}


/* ─── Vista "Plano del salón" ───────────────────────────────────────────
   Cada mesa se dibuja en planta: el tablero al centro y las sillas repartidas
   por los cuatro lados según la capacidad. El color viene del estado, igual
   que los pills de la vista de tarjetas. */
const PLANO_UI = {
    libre: { mesa: '#10b981', silla: '#a7f3d0', sombra: 'rgba(16,185,129,.35)' },
    ocupada: { mesa: '#f97316', silla: '#fed7aa', sombra: 'rgba(249,115,22,.35)' },
    reservada: { mesa: '#0ea5e9', silla: '#bae6fd', sombra: 'rgba(14,165,233,.35)' },
    limpieza: { mesa: '#f59e0b', silla: '#fde68a', sombra: 'rgba(245,158,11,.35)' },
};
const planoUI = (e) => PLANO_UI[e] || { mesa: '#cbd5e1', silla: '#e2e8f0', sombra: 'rgba(148,163,184,.35)' };

/* Reparte n sillas por los lados en orden arriba/abajo/izquierda/derecha y las
   separa de forma pareja a lo largo de cada lado. */
const sillasDeCapacidad = (cap) => {
    const n = Math.max(1, Math.min(Number(cap) || 4, 10));
    const lados = ['top', 'bottom', 'left', 'right'];
    const conteo = { top: 0, bottom: 0, left: 0, right: 0 };
    for (let i = 0; i < n; i++) conteo[lados[i % 4]] += 1;
    const out = [];
    for (const lado of lados) {
        for (let i = 0; i < conteo[lado]; i++) out.push({ lado, p: ((i + 1) / (conteo[lado] + 1)) * 100 });
    }
    return out;
};

const estiloSilla = ({ lado, p }) => {
    const base = { position: 'absolute', borderRadius: '999px', transition: 'background-color .25s' };
    const largo = '26%', grosor = '10%';
    if (lado === 'top') return { ...base, width: largo, height: grosor, left: `${p}%`, top: '2%', transform: 'translateX(-50%)' };
    if (lado === 'bottom') return { ...base, width: largo, height: grosor, left: `${p}%`, bottom: '2%', transform: 'translateX(-50%)' };
    if (lado === 'left') return { ...base, width: grosor, height: largo, top: `${p}%`, left: '2%', transform: 'translateY(-50%)' };
    return { ...base, width: grosor, height: largo, top: `${p}%`, right: '2%', transform: 'translateY(-50%)' };
};

function MesaPlano({ mesa, seleccionada, esMia, onClick }) {
    const c = planoUI(mesa.estado);
    const colorMesa = seleccionada ? '#0f172a' : c.mesa;
    const colorSilla = seleccionada ? c.mesa : c.silla;
    return (
        <motion.button
            variants={itemUp}
            type="button"
            onClick={onClick}
            aria-pressed={seleccionada}
            title={`Mesa ${mesa.numero} · ${estadoUI(mesa.estado).label} · ${mesa.capacidad} personas`}
            className="group relative aspect-square w-full rounded-2xl outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-orange-400"
        >
            <span
                className="absolute inset-0 rounded-2xl transition-all duration-200 group-hover:bg-slate-50"
                style={seleccionada ? { backgroundColor: 'rgba(249,115,22,.10)', boxShadow: '0 0 0 2px #f97316' } : undefined}
            />
            {sillasDeCapacidad(mesa.capacidad).map((s, i) => (
                <span key={i} style={{ ...estiloSilla(s), backgroundColor: colorSilla }} />
            ))}
            <span
                className="absolute inset-[19%] flex items-center justify-center rounded-[28%] text-sm font-extrabold transition-all duration-200 sm:text-base"
                style={{ backgroundColor: colorMesa, color: textoSobre(colorMesa), boxShadow: `0 6px 16px ${c.sombra}` }}
            >
                {mesa.numero}
            </span>
            {esMia && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-slate-900 ring-2 ring-white" />}
            {mesa.pedidoEstado === 'por_cobrar' && (
                <span className="absolute left-1 top-1 rounded-full bg-sky-500 px-1.5 py-px text-[9px] font-bold leading-4 text-white">Caja</span>
            )}
        </motion.button>
    );
}

function LeyendaPlano() {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {['libre', 'ocupada', 'reservada', 'limpieza'].map(e => (
                <span key={e} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-[4px]" style={{ backgroundColor: planoUI(e).mesa }} />
                    {estadoUI(e).label}
                </span>
            ))}
        </div>
    );
}

/* En pantallas chicas el detalle de la mesa se muestra como modal centrado en
   vez del panel bajo el plano, que quedaba fuera de vista al tocar la mesa. */
const useEsMovil = (consulta = '(max-width: 639px)') => {
    const [esMovil, setEsMovil] = useState(() => (
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(consulta).matches
            : false
    ));
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
        const mq = window.matchMedia(consulta);
        const onChange = (e) => setEsMovil(e.matches);
        setEsMovil(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [consulta]);
    return esMovil;
};

/* Cabecera y acciones del detalle: las comparten el panel de escritorio y el
   modal movil para que no haya dos listas de botones que mantener. */
function ResumenMesa({ mesa, grande }) {
    const ui = estadoUI(mesa.estado);
    return (
        <div className="flex items-center gap-3">
            <span className={`flex shrink-0 items-center justify-center rounded-xl ${ui.icon} ${grande ? 'h-12 w-12' : 'h-11 w-11'}`}>
                <HiOutlineTableCells className={grande ? 'h-6 w-6' : 'h-5 w-5'} />
            </span>
            <div className="min-w-0">
                <p className={`m-0 font-extrabold tracking-tight text-slate-900 ${grande ? 'text-lg' : 'text-base'}`}>Mesa {mesa.numero}</p>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${ui.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} /> {ui.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">Capacidad {mesa.capacidad}</span>
                    {mesa.meseroNombre && (
                        <span className="truncate text-[11px] font-semibold text-slate-400">· {mesa.meseroNombre}</span>
                    )}
                    {mesa.pedidoEstado === 'por_cobrar' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200">
                            Cuenta en caja
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}

function AccionesMesa({ mesa, permisos, apilado, onAsignar, onPedido, onLiberar, onLimpieza, onFinalizar }) {
    const primario = apilado ? actPrimaryLg : actPrimary;
    const secundario = apilado ? actSecondaryLg : actSecondary;
    return (
        <div className={apilado ? 'grid gap-2' : 'flex flex-wrap items-stretch gap-2'}>
            {permisos.asignar && <button className={primario} onClick={() => onAsignar(mesa)}>Asignar</button>}
            <button className={permisos.pedido ? primario : secundario} onClick={() => onPedido(mesa)}>Pedido</button>
            {permisos.liberar && <button className={secundario} onClick={() => onLiberar(mesa)}>Liberar</button>}
            {permisos.limpieza && <button className={secundario} onClick={() => onLimpieza(mesa)}>Limpieza</button>}
            {permisos.finalizar && <button className={primario} onClick={() => onFinalizar(mesa)}>Finalizar</button>}
        </div>
    );
}

const Mesas = () => {
    const [mesas, setMesas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [miNombre, setMiNombre] = useState('Mesero');
    const [miId, setMiId] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroCapacidad, setFiltroCapacidad] = useState('todas');
    const [modalMesa, setModalMesa] = useState(null);
    const [modalAccion, setModalAccion] = useState('');
    const [pedidoModal, setPedidoModal] = useState({ mesa: null, editable: false });
    const [pedidoItems, setPedidoItems] = useState([]);
    const [nuevoItem, setNuevoItem] = useState({ nombre: '', cantidad: 1, precio: 0 });
    const [notaItem, setNotaItem] = useState('');
    const [toasts, setToasts] = useState([]);
    const [vista, setVista] = useState(() => {
        try { return localStorage.getItem('ms_mesas_vista') === 'plano' ? 'plano' : 'tarjetas'; } catch { return 'tarjetas'; }
    });
    const [mesaPlanoSel, setMesaPlanoSel] = useState(null);
    const esMovil = useEsMovil();
    useEffect(() => { try { localStorage.setItem('ms_mesas_vista', vista); } catch { /* sin localStorage */ } }, [vista]);

    const restaurantId = (() => { try { return localStorage.getItem('restaurant_id') || null; } catch { return null; } })();

    const normalizarMesas = (data) => (Array.isArray(data) ? data : []).map(m => ({
        id: m.id, numero: m.numero, capacidad: m.capacidad ?? 2,
        estado: m.estado || 'libre', meseroId: m.mesero_id ?? null, meseroNombre: m.mesero_nombre || '',
        pedidoEstado: m.pedido_estado || null,
    })).sort((a, b) => a.numero - b.numero);

    const refrescar = useCallback(async () => {
        try { const data = await api.getMesas(); setMesas(normalizarMesas(data)); } catch {}
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [me, ms, prods] = await Promise.all([
                    api.getMiMesero().catch(() => null),
                    api.getMesas(),
                    api.getProductosTodos(),
                ]);
                if (me && (me.id || me.mesero_id)) { setMiId(me.id ?? me.mesero_id); setMiNombre(me.nombre || 'Mesero'); }
                setMesas(normalizarMesas(ms));
                setProductos(prods);
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'No se pudieron cargar las mesas', text: e?.message || 'Error' });
            }
        };
        load();
    }, []);

    // Toasts (notificaciones de cocina)
    const addToast = useCallback((msg) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev.slice(-4), { id, msg }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
    }, []);

    // Refs para usar el último estado dentro del handler del socket sin re-suscribir
    const mesasRef = useRef(mesas); mesasRef.current = mesas;
    const miIdRef = useRef(miId); miIdRef.current = miId;

    useSocket(restaurantId, useCallback((event) => {
        // El toast de "listo" se muestra de forma global desde MeseroLayout
        // (App.jsx) para que salga en cualquier pantalla del mesero.
        if (event === 'item_listo' || event === 'mesa_update' || event === 'pedido_cerrado') {
            refrescar();
        }
    }, [refrescar]));

    const handleAsignar = (mesa) => { setModalMesa(mesa); setModalAccion('asignar'); };
    const handleLiberar = (mesa) => { setModalMesa(mesa); setModalAccion('liberar'); };
    const handleLimpieza = (mesa) => { setModalMesa(mesa); setModalAccion('limpieza'); };
    const handleLimpiezaDone = (mesa) => { setModalMesa(mesa); setModalAccion('limpieza-done'); };

    const confirmarAccion = async () => {
        if (!modalMesa) return;
        try {
            const id = modalMesa.id;
            if (modalAccion === 'asignar') await api.asignarMesa(id, { mesero_id: miId || undefined });
            else if (modalAccion === 'liberar') await api.liberarMesa(id);
            else if (modalAccion === 'limpieza') await api.limpiezaMesa(id);
            else if (modalAccion === 'limpieza-done') await api.finLimpiezaMesa(id);
            await refrescar();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo aplicar la acción', text: e?.message || 'Error' });
        } finally {
            setModalMesa(null); setModalAccion('');
        }
    };

    const [paso, setPaso] = useState(0);
    const [dirPaso, setDirPaso] = useState(1);
    const [flash, setFlash] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [catSel, setCatSel] = useState(null);
    const [buscaProd, setBuscaProd] = useState('');
    const [pedidoActual, setPedidoActual] = useState(null);
    const mapItems = (rows) => (Array.isArray(rows) ? rows.map(r => ({
        id: r.id, nombre: r.nombre, cantidad: Number(r.cantidad || 0), precio: Number(r.precio || 0), subtotal: Number(r.subtotal || 0), nota: r.nota || '',
    })) : []);

    const abrirPedido = async (mesa) => {
        if (!mesa) return;
        try {
            const pedido = await api.getPedidoAbiertoDeMesa(mesa.id);
            setPedidoActual(pedido);
            let items = [];
            if (pedido?.id) items = mapItems(await api.getPedidoItems(pedido.id));
            setPedidoItems(items);
            const enCaja = pedido?.estado === 'por_cobrar';
            setPedidoModal({ mesa, editable: mesa.estado === 'ocupada' && !enCaja, enCaja });
            setCatSel(null);
            setBuscaProd('');
            setProductoSel('');
            setFlash('');
            setDirPaso(1);
            setPaso(items.length ? 2 : 0);
            api.getCategorias(true).then(r => setCategorias(Array.isArray(r) ? r : [])).catch(() => setCategorias([]));
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo abrir el pedido', text: e?.message || 'Error' });
        }
    };
    const irAPaso = (n) => { setDirPaso(n > paso ? 1 : -1); setPaso(n); setFlash(''); };

    const cerrarPedido = () => {
        setPedidoModal({ mesa: null, editable: false });
        setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
        setNotaItem('');
    };
    const [productoSel, setProductoSel] = useState('');
    const productoElegido = useMemo(
        () => productos.find(p => String(p.id) === String(productoSel)) || null,
        [productos, productoSel],
    );

    /* Agrupa los productos según el catálogo de categorías del admin y en su
       mismo orden; lo que no encaje en ninguna cae en "Otros". */
    const categoriasConProductos = useMemo(() => {
        const porNombre = new Map();
        for (const c of categorias) {
            porNombre.set(String(c.nombre || '').trim().toLowerCase(), { nombre: c.nombre, color: c.color, imagen: c.imagen, productos: [] });
        }
        const otros = { nombre: 'Otros', color: 'slate', imagen: null, productos: [] };
        for (const p of productos) {
            const k = String(p.categoria || '').trim().toLowerCase();
            const grupo = (k && porNombre.get(k)) || otros;
            grupo.productos.push(p);
        }
        const lista = [...porNombre.values()].filter(g => g.productos.length);
        if (otros.productos.length) lista.push(otros);
        return lista;
    }, [categorias, productos]);

    const productosVisibles = useMemo(() => {
        const q = buscaProd.trim().toLowerCase();
        const grupo = catSel ? categoriasConProductos.find(g => g.nombre === catSel) : null;
        const base = catSel ? (grupo ? grupo.productos : []) : productos;
        if (!q) return base;
        return base.filter(p => String(p.nombre || '').toLowerCase().includes(q));
    }, [productos, categoriasConProductos, catSel, buscaProd]);
    const agregarItem = async () => {
        if (!pedidoModal.editable) return;
        if (!pedidoActual?.id) return Swal.fire({ icon: 'error', title: 'No hay pedido abierto' });
        const pid = pedidoActual.id;
        const cantidad = Number(nuevoItem.cantidad || 1);
        const producto_id = Number(productoSel || 0);
        if (!producto_id) return Swal.fire({ icon: 'error', title: 'Selecciona un producto' });
        if (cantidad <= 0) return Swal.fire({ icon: 'error', title: 'Cantidad inválida' });
        try {
            const body = { producto_id, cantidad };
            if (notaItem.trim()) body.nota = notaItem.trim();
            const resp = await api.addPedidoItem(pid, body);
            setPedidoItems(mapItems(await api.getPedidoItems(pid)));
            const agregado = productos.find(p => String(p.id) === String(producto_id));
            setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
            setProductoSel('');
            setBuscaProd('');
            setNotaItem('');
            setFlash(`${cantidad} x ${agregado?.nombre || 'Producto'} agregado al pedido`);
            if (resp?.warnings?.lowStock) {
                const w = resp.warnings;
                Swal.fire({ icon: 'info', title: 'Stock bajo', text: `${w.nombre || 'Producto'}: quedan ${w.restante} (mínimo ${w.min_stock})`, timer: 2000, showConfirmButton: false });
            }
        } catch (e) {
            if (e?.status === 409 && (e?.payload?.code === 'STOCK_INSUFICIENTE' || /Stock insuficiente/i.test(e?.message || ''))) {
                const disponible = e?.payload?.disponible;
                const text = typeof disponible === 'number' ? `Disponible: ${disponible}` : 'No hay inventario suficiente para la cantidad solicitada.';
                Swal.fire({ icon: 'warning', title: 'Stock insuficiente', text });
            } else {
                Swal.fire({ icon: 'error', title: 'No se pudo agregar', text: e?.message || 'Error' });
            }
            try {
                const prods = await api.getProductosTodos();
                setProductos(prods);
            } catch {}
        }
    };
    const quitarItem = async (idx) => {
        if (!pedidoModal.editable) return;
        if (!pedidoActual?.id) return;
        const item = pedidoItems[idx];
        if (!item?.id) return;
        try {
            await api.deletePedidoItem(pedidoActual.id, item.id);
            setPedidoItems(mapItems(await api.getPedidoItems(pedidoActual.id)));
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo quitar', text: e?.message || 'Error' });
        }
    };
    // El mesero envía la cuenta a caja (el cajero cobra)
    const enviarACaja = async () => {
        if (!pedidoActual?.id) return Swal.fire({ icon: 'error', title: 'No hay pedido abierto' });
        if (!pedidoItems.length) return Swal.fire({ icon: 'warning', title: 'El pedido está vacío', text: 'Agrega productos antes de enviar a caja.' });
        const res = await Swal.fire({ title: 'Enviar a caja', text: `Total ${fmtCOP(pagoSubtotal)} — el cajero registrará el pago.`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, enviar', cancelButtonText: 'Cancelar', confirmButtonColor: '#FF6633' });
        if (!res.isConfirmed) return;
        try {
            await api.enviarPedidoACaja(pedidoActual.id);
            Swal.fire({ icon: 'success', title: 'Cuenta enviada a caja', timer: 1200, showConfirmButton: false });
            cerrarPedido();
            refrescar();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo enviar a caja', text: e?.message || 'Error' });
        }
    };

    const mesasFiltradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return mesas
            .filter(m => (filtroEstado === 'todos' ? true : m.estado === filtroEstado))
            .filter(m => (filtroCapacidad === 'todas' ? true : m.capacidad === Number(filtroCapacidad)))
            .filter(m => !q || String(m.numero).includes(q))
            .sort((a, b) => a.numero - b.numero);
    }, [mesas, busqueda, filtroEstado, filtroCapacidad]);

    /* Qué puede hacer el mesero con una mesa; lo usan la tarjeta y el panel del plano. */
    const permisosMesa = useCallback((m) => {
        const esMiMesa = !!m && m.meseroId === miId;
        return {
            esMiMesa,
            asignar: !!m && m.estado === 'libre',
            pedido: esMiMesa && m.estado === 'ocupada',
            liberar: esMiMesa && m.estado === 'ocupada',
            limpieza: !!m && (m.estado === 'libre' || (esMiMesa && m.estado === 'ocupada')),
            finalizar: !!m && m.estado === 'limpieza',
        };
    }, [miId]);

    const mesaSelPlano = useMemo(
        () => mesasFiltradas.find(m => m.id === mesaPlanoSel) || null,
        [mesasFiltradas, mesaPlanoSel],
    );

    const total = mesas.length;
    const libres = mesas.filter(m => m.estado === 'libre').length;
    const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
    const limpieza = mesas.filter(m => m.estado === 'limpieza').length;
    const pagoSubtotal = pedidoItems.reduce((s, it) => s + (it.subtotal ?? it.cantidad * it.precio), 0);

    const accionTitulo = { asignar: 'Asignar mesa', liberar: 'Liberar mesa', limpieza: 'Marcar limpieza', 'limpieza-done': 'Finalizar limpieza' }[modalAccion] || '';
    const accionTexto = { asignar: '¿Quieres asignarte esta mesa?', liberar: '¿Seguro que quieres liberar esta mesa?', limpieza: '¿Marcar esta mesa como limpieza?', 'limpieza-done': '¿Marcar la limpieza como terminada y dejar la mesa libre?' }[modalAccion] || '';

    return (
        <div className="ms-mesas-mesero mx-auto max-w-7xl">
            <style>{`:where(.ms-mesas-mesero) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Operación en sala</span>
                    <h1 className="m-0 mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Mesas</h1>
                    <p className="m-0 mt-1 text-[13px] text-slate-500 sm:text-sm">Visualiza y gestiona tus mesas asignadas</p>
                </div>
                <button className={btnGhost} onClick={refrescar} title="Refrescar desde servidor"><HiOutlineArrowPath className="h-4 w-4" /> Refrescar</button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-5 grid grid-cols-3 gap-2.5 sm:mt-6 sm:gap-4"
            >
                <MetricCard icon={HiOutlineTableCells} value={<>{libres}<span className="text-xs font-bold text-slate-400 sm:text-base"> / {total}</span></>} label="Mesas libres" />
                <MetricCard icon={HiOutlineCheckCircle} value={ocupadas} label="Ocupadas" />
                <MetricCard icon={HiOutlineSparkles} value={limpieza} label="En limpieza" />
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
            >
                <div className="relative sm:max-w-xs sm:flex-1">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por número…" className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Cambiar vista">
                        {[
                            { id: 'tarjetas', label: 'Tarjetas', icon: HiOutlineSquares2X2 },
                            { id: 'plano', label: 'Plano', icon: HiOutlineMap },
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => setVista(v.id)}
                                aria-pressed={vista === v.id}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${vista === v.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <v.icon className="h-4 w-4" /> {v.label}
                            </button>
                        ))}
                    </div>
                    <Select className="min-w-[150px]" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} aria-label="Filtrar por estado">
                        <option value="todos">Todos los estados</option>
                        <option value="libre">Libres</option>
                        <option value="ocupada">Ocupadas</option>
                        <option value="limpieza">Limpieza</option>
                    </Select>
                    <Select className="min-w-[150px]" value={filtroCapacidad} onChange={e => setFiltroCapacidad(e.target.value)} aria-label="Filtrar por capacidad">
                        <option value="todas">Cualquier capacidad</option>
                        <option value="2">2 personas</option>
                        <option value="4">4 personas</option>
                        <option value="6">6 personas</option>
                    </Select>
                </div>
            </motion.div>

            {/* Mesas: vista plano o vista tarjetas */}
            {mesasFiltradas.length === 0 ? (
                <div className={`mt-5 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineTableCells className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">No hay mesas disponibles.</p>
                    </div>
                </div>
            ) : vista === 'plano' ? (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className={`mt-4 ${cardBase} sm:mt-5`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Plano del salón</p>
                            <LeyendaPlano />
                        </div>
                        <motion.div
                            variants={gridStagger}
                            initial="hidden"
                            animate="visible"
                            className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6"
                        >
                            {mesasFiltradas.map(m => (
                                <MesaPlano
                                    key={m.id}
                                    mesa={m}
                                    esMia={m.meseroId === miId}
                                    seleccionada={m.id === mesaPlanoSel}
                                    onClick={() => setMesaPlanoSel(prev => (prev === m.id ? null : m.id))}
                                />
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Detalle de la mesa: panel bajo el plano en escritorio, modal en movil */}
                    {mesaSelPlano && !esMovil && (
                        <motion.div
                            key={mesaSelPlano.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className={`mt-3 ${cardBase} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
                        >
                            <ResumenMesa mesa={mesaSelPlano} />
                            <AccionesMesa
                                mesa={mesaSelPlano}
                                permisos={permisosMesa(mesaSelPlano)}
                                onAsignar={handleAsignar}
                                onPedido={abrirPedido}
                                onLiberar={handleLiberar}
                                onLimpieza={handleLimpieza}
                                onFinalizar={handleLimpiezaDone}
                            />
                        </motion.div>
                    )}
                </>
            ) : (
                <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    animate="visible"
                    className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {mesasFiltradas.map(m => {
                        const ui = estadoUI(m.estado);
                        const esMiMesa = m.meseroId === miId;
                        const puedeAsignar = m.estado === 'libre';
                        const puedeLiberar = m.estado === 'ocupada' && esMiMesa;
                        const puedeLimpieza = (m.estado === 'libre') || (m.estado === 'ocupada' && esMiMesa);
                        const puedeTerminarLimpieza = (m.estado === 'limpieza');
                        return (
                            <motion.div
                                key={m.id}
                                variants={itemUp}
                                onClick={() => abrirPedido(m)}
                                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200"
                            >
                                <span className={`absolute inset-x-0 top-0 h-1 ${ui.bar}`} />
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ui.icon}`}><HiOutlineTableCells className="h-5 w-5" /></span>
                                        <div>
                                            <p className="m-0 text-base font-extrabold tracking-tight text-slate-900">Mesa {m.numero}</p>
                                            <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${ui.pill}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} /> {ui.label}
                                                </span>
                                                {m.pedidoEstado === 'por_cobrar' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200">
                                                        Cuenta en caja
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-500"><HiOutlineUsers className="h-4 w-4 text-slate-400" /> Capacidad {m.capacidad}</div>
                                    {m.meseroNombre && <div className="flex items-center gap-2 text-sm text-slate-500"><HiOutlineUser className="h-4 w-4 text-slate-400" /> <span className="truncate">{m.meseroNombre}</span></div>}
                                </div>

                                {(puedeAsignar || puedeLiberar || puedeLimpieza || puedeTerminarLimpieza || (esMiMesa && m.estado === 'ocupada')) && (
                                <div className="mt-3 flex flex-wrap items-stretch gap-2 border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                                    {puedeAsignar && <button className={actPrimary} onClick={() => handleAsignar(m)}>Asignar</button>}
                                    {esMiMesa && m.estado === 'ocupada' && <button className={actPrimary} onClick={() => abrirPedido(m)}>Pedido</button>}
                                    {puedeLiberar && <button className={actSecondary} onClick={() => handleLiberar(m)}>Liberar</button>}
                                    {puedeLimpieza && <button className={actSecondary} onClick={() => handleLimpieza(m)}>Limpieza</button>}
                                    {puedeTerminarLimpieza && <button className={actPrimary} onClick={() => handleLimpiezaDone(m)}>Finalizar</button>}
                                </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Detalle de mesa en movil: modal centrado con las acciones */}
            {esMovil && vista === 'plano' && mesaSelPlano && !modalMesa && !pedidoModal.mesa && (
                <Modal
                    title={`Mesa ${mesaSelPlano.numero}`}
                    onClose={() => setMesaPlanoSel(null)}
                    maxW="max-w-sm"
                    cerrarFuera
                >
                    <ResumenMesa mesa={mesaSelPlano} grande />
                    <div className="mt-4 border-t border-slate-100 pt-4">
                        <AccionesMesa
                            mesa={mesaSelPlano}
                            permisos={permisosMesa(mesaSelPlano)}
                            apilado
                            onAsignar={handleAsignar}
                            onPedido={abrirPedido}
                            onLiberar={handleLiberar}
                            onLimpieza={handleLimpieza}
                            onFinalizar={handleLimpiezaDone}
                        />
                    </div>
                </Modal>
            )}

            {/* Modal acción de mesa */}
            {modalMesa && (
                <Modal
                    title={accionTitulo}
                    onClose={() => { setModalMesa(null); setModalAccion(''); }}
                    maxW="max-w-md"
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => { setModalMesa(null); setModalAccion(''); }}>Cancelar</button>
                            <button className={btnPrimary} onClick={confirmarAccion}>Confirmar</button>
                        </>
                    }
                >
                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="m-0 text-sm font-bold text-slate-900">Mesa {modalMesa.numero}</p>
                        <p className="m-0 text-xs text-slate-400">Capacidad {modalMesa.capacidad}</p>
                    </div>
                    <p className="m-0 mt-4 text-sm text-slate-600">{accionTexto}</p>
                </Modal>
            )}

            {/* Modal pedido */}
            {pedidoModal.mesa && (
                <Modal
                    title={`Pedido Mesa ${pedidoModal.mesa.numero}`}
                    onClose={cerrarPedido}
                    maxW="max-w-2xl"
                    footer={
                        <>
                            <button className={btnGhost} onClick={cerrarPedido}>Cerrar</button>
                            {pedidoModal.editable && paso < 2 && (
                                <button className={btnPrimary} onClick={() => irAPaso(2)} disabled={!pedidoItems.length}>
                                    Finalizar pedido{pedidoItems.length ? ` (${pedidoItems.length})` : ''}
                                </button>
                            )}
                            {pedidoModal.editable && paso === 2 && (
                                <>
                                    <button className={btnGhost} onClick={() => irAPaso(0)}><HiChevronLeft className="h-4 w-4" /> Modificar</button>
                                    <button className={btnPrimary} onClick={enviarACaja}><HiOutlinePaperAirplane className="h-4 w-4" /> Enviar a caja</button>
                                </>
                            )}
                        </>
                    }
                >
                    {!pedidoModal.editable && (
                        <div className="mb-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-700 ring-1 ring-amber-100">
                            {pedidoModal.enCaja
                                ? 'La cuenta ya está en caja: el cajero la va a cobrar. Aquí solo puedes revisarla.'
                                : 'Solo lectura: esta mesa no está asignada a ti.'}
                        </div>
                    )}

                    {pedidoModal.editable ? (
                        <StepWizard steps={PASOS_PEDIDO} step={paso} dir={dirPaso} onGoTo={irAPaso}>

                            {/* ── Paso 1: categoría ─────────────────────────── */}
                            {paso === 0 && (
                                <>
                                    <div className="relative">
                                        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={buscaProd}
                                            onChange={e => { setBuscaProd(e.target.value); if (e.target.value.trim()) { setCatSel(null); irAPaso(1); } }}
                                            placeholder="O busca el producto directamente…"
                                            className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                                        />
                                    </div>

                                    {categoriasConProductos.length === 0 ? (
                                        <p className="m-0 py-6 text-center text-sm text-slate-400">No hay productos cargados.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                            {categoriasConProductos.map(c => (
                                                <button key={c.nombre} onClick={() => { setCatSel(c.nombre); irAPaso(1); }} className="w-full text-left">
                                                    <span className="flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:ring-orange-300">
                                                        {c.imagen ? (
                                                            /* c_fit y object-contain: la ilustración entra completa, sin que el
                                                               recorte le coma la hamburguesa por los lados. */
                                                            <img
                                                                src={imagenTransformada(c.imagen, { w: 320, h: 240, modo: 'fit', recortarBorde: true })}
                                                                alt=""
                                                                loading="lazy"
                                                                style={{ backgroundColor: '#ffffff' }}
                                                                className="h-20 w-full object-contain p-1.5 sm:h-24"
                                                            />
                                                        ) : (
                                                            <span style={{ backgroundColor: '#f1f5f9' }} className="block h-20 w-full sm:h-24" />
                                                        )}
                                                        <span
                                                            style={{ backgroundColor: hexDeColor(c.color), color: textoSobre(hexDeColor(c.color)) }}
                                                            className="flex flex-col items-start gap-0 px-2.5 py-2"
                                                        >
                                                            <span className="text-sm font-extrabold uppercase leading-tight tracking-wide">{c.nombre}</span>
                                                            <span className="text-[11px] opacity-80">{c.productos.length} producto{c.productos.length === 1 ? '' : 's'}</span>
                                                        </span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── Paso 2: producto, cantidad y nota ─────────── */}
                            {paso === 1 && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setCatSel(null); setBuscaProd(''); setProductoSel(''); irAPaso(0); }} className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
                                            <HiChevronLeft className="h-4 w-4" /> Categorías
                                        </button>
                                        <div className="relative min-w-0 flex-1">
                                            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={buscaProd}
                                                onChange={e => setBuscaProd(e.target.value)}
                                                placeholder={catSel ? 'Buscar en esta categoría…' : 'Buscar producto…'}
                                                className="w-full rounded-lg border-0 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                                            />
                                        </div>
                                    </div>

                                    {flash && (
                                        <p className="m-0 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                                            <HiOutlineCheckCircle className="h-4 w-4" /> {flash}
                                        </p>
                                    )}

                                    {productoElegido ? (
                                        <div className="space-y-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="m-0 truncate text-sm font-extrabold text-slate-900">{productoElegido.nombre}</p>
                                                    <p className="m-0 text-xs font-bold text-orange-600">{fmtCOP(productoElegido.precio)}</p>
                                                </div>
                                                <button onClick={() => setProductoSel('')} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-white hover:text-slate-800">
                                                    Cambiar
                                                </button>
                                            </div>

                                            <div className="flex items-end gap-3">
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Cantidad</label>
                                                    <div className="inline-flex items-center rounded-xl bg-white ring-1 ring-slate-200">
                                                        <button type="button" onClick={() => setNuevoItem(prev => ({ ...prev, cantidad: Math.max(1, Number(prev.cantidad || 1) - 1) }))} className="flex h-10 w-10 items-center justify-center rounded-l-xl text-slate-500 hover:bg-slate-100"><HiMinus className="h-4 w-4" /></button>
                                                        <input type="number" min="1" value={nuevoItem.cantidad} onChange={e => setNuevoItem(prev => ({ ...prev, cantidad: Math.max(1, Number(e.target.value || 1)) }))} className="w-12 border-0 bg-transparent text-center text-sm font-bold text-slate-900 outline-none" />
                                                        <button type="button" onClick={() => setNuevoItem(prev => ({ ...prev, cantidad: Number(prev.cantidad || 1) + 1 }))} className="flex h-10 w-10 items-center justify-center rounded-r-xl text-slate-500 hover:bg-slate-100"><HiPlus className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Nota / modificador</label>
                                                    <input type="text" value={notaItem} onChange={e => setNotaItem(e.target.value)} placeholder="Ej: sin cebolla…" className="w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-orange-400" />
                                                </div>
                                            </div>

                                            <button className={`${btnPrimary} w-full`} onClick={agregarItem}><HiPlus className="h-4 w-4" /> Agregar al pedido</button>
                                        </div>
                                    ) : (
                                        productosVisibles.length === 0 ? (
                                            <p className="m-0 py-6 text-center text-sm text-slate-400">Sin productos que coincidan.</p>
                                        ) : (
                                            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-0.5">
                                                {productosVisibles.map(p => (
                                                    <button key={p.id} onClick={() => { setProductoSel(String(p.id)); setBuscaProd(''); setFlash(''); }} className="w-full text-left">
                                                        <span className="flex w-full items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-slate-200 transition-colors hover:ring-orange-300">
                                                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{p.nombre}</span>
                                                            {!catSel && p.categoria && <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 sm:block">{p.categoria}</span>}
                                                            <span className="shrink-0 text-sm font-extrabold text-orange-600">{fmtCOP(p.precio)}</span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </>
                            )}

                            {/* ── Paso 3: resumen ───────────────────────────── */}
                            {paso === 2 && (
                                <TablaConsumos items={pedidoItems} editable total={pagoSubtotal} onQuitar={quitarItem} />
                            )}
                        </StepWizard>
                    ) : (
                        <TablaConsumos items={pedidoItems} editable={false} total={pagoSubtotal} />
                    )}
                </Modal>
            )}

            {/* Toasts: notificaciones de cocina (pedido listo) */}
            {toasts.length > 0 && (
                <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="pointer-events-auto flex items-center gap-2.5 rounded-xl border-l-4 border-emerald-500 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-xl ring-1 ring-slate-100"
                        >
                            <HiOutlineCheckCircle className="h-5 w-5 text-emerald-500" />
                            {t.msg}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Mesas;
