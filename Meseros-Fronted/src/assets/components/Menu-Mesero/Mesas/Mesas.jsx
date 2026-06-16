import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineTableCells, HiOutlineUsers, HiOutlineCheckCircle, HiOutlineSparkles,
    HiOutlineMagnifyingGlass, HiOutlineUser, HiOutlineArrowPath, HiXMark,
    HiMinus, HiPlus, HiOutlinePaperAirplane,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';
import { getCombosFromStorage } from '../../Menu-Admin/Combos/Combos';
import { useSocket } from '../../../../hooks/useSocket';
import Select from '../../ui/Select';

/* ─── helpers de presentación (alineados con Inicio / Mesas admin) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
// Acciones de tarjeta de mesa — estilo unificado, ancho igual
const actPrimary = 'flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-2.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-md';
const actSecondary = 'flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200';

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
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                    <Icon className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold text-slate-900">{value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{label}</p>
        </motion.div>
    );
}

function Modal({ title, onClose, children, footer, maxW = 'max-w-lg' }) {
    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`ms-mesas-mesero flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
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

    const restaurantId = (() => { try { return localStorage.getItem('restaurant_id') || null; } catch { return null; } })();

    const normalizarMesas = (data) => (Array.isArray(data) ? data : []).map(m => ({
        id: m.id, numero: m.numero, capacidad: m.capacidad ?? 2,
        estado: m.estado || 'libre', meseroId: m.mesero_id ?? null, meseroNombre: m.mesero_nombre || '',
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
                    api.getProductos().then(r => Array.isArray(r?.items) ? r.items : (Array.isArray(r) ? r : [])),
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

    useSocket(restaurantId, useCallback((event, data) => {
        if (event === 'item_listo') {
            const myId = miIdRef.current;
            // Notificar solo si el pedido es de este mesero (o no se sabe)
            if (data?.mesero_id != null && Number(data.mesero_id) !== Number(myId)) return;
            const mesaNum = mesasRef.current.find(m => m.id === data?.mesa_id)?.numero ?? data?.mesa_id ?? '';
            const prod = `${data?.cantidad ? `${data.cantidad}× ` : ''}${data?.nombre || 'Pedido'}`;
            addToast(`${prod} listo${mesaNum ? ` — Mesa ${mesaNum}` : ''}`);
        } else if (event === 'mesa_update' || event === 'pedido_cerrado') {
            refrescar();
        }
    }, [addToast, refrescar]));

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

    const [pedidoTab, setPedidoTab] = useState('productos');
    const [combos, setCombos] = useState([]);
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
            setPedidoModal({ mesa, editable: mesa.estado === 'ocupada' });
            setPedidoTab('productos');
            setCombos(getCombosFromStorage());
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo abrir el pedido', text: e?.message || 'Error' });
        }
    };
    const cerrarPedido = () => {
        setPedidoModal({ mesa: null, editable: false });
        setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
        setNotaItem('');
    };
    const [productoSel, setProductoSel] = useState('');
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
            setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
            setProductoSel('');
            setNotaItem('');
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
                const prods = await api.getProductos().then(r => Array.isArray(r?.items) ? r.items : (Array.isArray(r) ? r : []));
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
    const agregarCombo = async (combo) => {
        if (!pedidoActual?.id) return Swal.fire({ icon: 'error', title: 'No hay pedido abierto' });
        const prodIds = combo.productos_ids || [];
        if (!prodIds.length) return;
        for (const pid of prodIds) {
            try { await api.addPedidoItem(pedidoActual.id, { producto_id: Number(pid), cantidad: 1 }); } catch {}
        }
        setPedidoItems(mapItems(await api.getPedidoItems(pedidoActual.id).catch(() => [])));
        Swal.fire({ icon: 'success', title: `Combo "${combo.nombre}" agregado`, timer: 800, showConfirmButton: false });
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
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Operación en sala</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Mesas</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Visualiza y gestiona tus mesas asignadas</p>
                </div>
                <button className={btnGhost} onClick={refrescar} title="Refrescar desde servidor"><HiOutlineArrowPath className="h-4 w-4" /> Refrescar</button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineTableCells} value={<>{libres}<span className="text-base font-bold text-slate-400"> / {total}</span></>} label="Mesas libres" />
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

            {/* Grid de mesas */}
            {mesasFiltradas.length === 0 ? (
                <div className={`mt-5 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineTableCells className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">No hay mesas disponibles.</p>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    animate="visible"
                    className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                                            <span className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${ui.pill}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} /> {ui.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-500"><HiOutlineUsers className="h-4 w-4 text-slate-400" /> Capacidad {m.capacidad}</div>
                                    {m.meseroNombre && <div className="flex items-center gap-2 text-sm text-slate-500"><HiOutlineUser className="h-4 w-4 text-slate-400" /> <span className="truncate">{m.meseroNombre}</span></div>}
                                </div>

                                <div className="mt-3 flex items-stretch gap-2 border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                                    {puedeAsignar && <button className={actPrimary} onClick={() => handleAsignar(m)}>Asignar</button>}
                                    {esMiMesa && m.estado === 'ocupada' && <button className={actPrimary} onClick={() => abrirPedido(m)}>Pedido</button>}
                                    {puedeLiberar && <button className={actSecondary} onClick={() => handleLiberar(m)}>Liberar</button>}
                                    {puedeLimpieza && <button className={actSecondary} onClick={() => handleLimpieza(m)}>Limpieza</button>}
                                    {puedeTerminarLimpieza && <button className={actPrimary} onClick={() => handleLimpiezaDone(m)}>Finalizar</button>}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
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
                            {pedidoModal.editable && <button className={btnPrimary} onClick={enviarACaja}><HiOutlinePaperAirplane className="h-4 w-4" /> Enviar a caja</button>}
                        </>
                    }
                >
                    {!pedidoModal.editable && (
                        <div className="mb-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-700 ring-1 ring-amber-100">Solo lectura: esta mesa no está asignada a ti.</div>
                    )}

                    {/* Tabs */}
                    <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1">
                        <button onClick={() => setPedidoTab('productos')} className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${pedidoTab === 'productos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Productos</button>
                        <button onClick={() => { setPedidoTab('combos'); setCombos(getCombosFromStorage()); }} className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${pedidoTab === 'combos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Combos ({combos.length})</button>
                    </div>

                    {/* Combos tab */}
                    {pedidoTab === 'combos' && (
                        combos.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 px-3.5 py-6 text-center text-sm text-slate-400 ring-1 ring-slate-100">No hay combos creados. Ve a Admin → Combos.</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {combos.map(combo => (
                                    <div key={combo.id} className="flex flex-col gap-1.5 rounded-xl bg-orange-50/60 p-3 ring-1 ring-orange-100">
                                        <p className="m-0 text-sm font-extrabold text-slate-900">{combo.nombre}</p>
                                        {combo.descripcion && <p className="m-0 text-xs text-slate-500">{combo.descripcion}</p>}
                                        <p className="m-0 text-base font-extrabold text-orange-600">{fmtCOP(combo.precio_combo)}</p>
                                        {pedidoModal.editable && <button className={`${btnPrimary} mt-1 py-1.5 text-xs`} onClick={() => agregarCombo(combo)}>Agregar combo</button>}
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* Productos tab */}
                    {pedidoTab === 'productos' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Producto</label>
                                    <Select className="w-full" placeholder="Selecciona un producto" value={productoSel} onChange={e => setProductoSel(e.target.value)} disabled={!pedidoModal.editable}>
                                        <option value="">Selecciona un producto</option>
                                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} · {fmtCOP(p.precio)}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Cantidad</label>
                                    <div className="inline-flex items-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
                                        <button type="button" disabled={!pedidoModal.editable} onClick={() => setNuevoItem(prev => ({ ...prev, cantidad: Math.max(1, Number(prev.cantidad || 1) - 1) }))} className="flex h-10 w-10 items-center justify-center rounded-l-xl text-slate-500 hover:bg-slate-100 disabled:opacity-40"><HiMinus className="h-4 w-4" /></button>
                                        <input type="number" min="1" value={nuevoItem.cantidad} disabled={!pedidoModal.editable} onChange={e => setNuevoItem(prev => ({ ...prev, cantidad: Math.max(1, Number(e.target.value || 1)) }))} className="w-12 border-0 bg-transparent text-center text-sm font-bold text-slate-900 outline-none" />
                                        <button type="button" disabled={!pedidoModal.editable} onClick={() => setNuevoItem(prev => ({ ...prev, cantidad: Number(prev.cantidad || 1) + 1 }))} className="flex h-10 w-10 items-center justify-center rounded-r-xl text-slate-500 hover:bg-slate-100 disabled:opacity-40"><HiPlus className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <button className={btnPrimary} onClick={agregarItem} disabled={!pedidoModal.editable}><HiPlus className="h-4 w-4" /> Agregar</button>
                            </div>
                            {pedidoModal.editable && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Nota / modificador (opcional)</label>
                                    <input type="text" value={notaItem} onChange={e => setNotaItem(e.target.value)} placeholder="Ej: sin cebolla, término medio…" className={inputCls} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tabla de consumos */}
                    <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-100">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <Th>Producto</Th>
                                    <Th right>Cant.</Th>
                                    <Th right>Precio</Th>
                                    <Th right>Subtotal</Th>
                                    {pedidoModal.editable && <Th right></Th>}
                                </tr>
                            </thead>
                            <tbody>
                                {pedidoItems.map((it, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                        <td className="px-3 py-2.5 text-sm">
                                            <span className="font-medium text-slate-900">{it.nombre}</span>
                                            {it.nota && <span className="block text-xs italic text-slate-400">{it.nota}</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-sm text-slate-700">{it.cantidad}</td>
                                        <td className="px-3 py-2.5 text-right text-sm text-slate-700">{fmtCOP(it.precio)}</td>
                                        <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900">{fmtCOP(it.cantidad * it.precio)}</td>
                                        {pedidoModal.editable && (
                                            <td className="px-3 py-2.5 text-right">
                                                <button onClick={() => quitarItem(idx)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50">Quitar</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {pedidoItems.length === 0 && (
                                    <tr><td colSpan={pedidoModal.editable ? 5 : 4} className="px-3 py-6 text-center text-sm text-slate-400">Sin productos.</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50">
                                    <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-extrabold text-slate-900">Total</td>
                                    <td className="px-3 py-2.5 text-right text-sm font-extrabold text-orange-600" colSpan={pedidoModal.editable ? 2 : 1}>{fmtCOP(pagoSubtotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
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
