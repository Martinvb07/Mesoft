import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../../api/client';
import { useSocket } from '../../../../hooks/useSocket';
import { logAudit } from '../../../../utils/audit';
import { upsertCliente } from '../Clientes/Clientes';
import Select from '../../ui/Select';
import DatePicker from '../../ui/DatePicker';
import {
    HiOutlineTableCells,
    HiOutlineUserGroup,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineMagnifyingGlass,
    HiOutlineUser,
    HiOutlineUsers,
    HiOutlineArrowPath,
    HiOutlinePlus,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlineQrCode,
    HiOutlineArrowDownTray,
    HiXMark,
} from 'react-icons/hi2';

/* ─── helpers de presentación (alineados con el dashboard de Inicio) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';

const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* Estilos por estado de mesa */
const ESTADO_UI = {
    libre: { label: 'Libre', bar: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-400', icon: 'bg-emerald-50 text-emerald-600' },
    ocupada: { label: 'Ocupada', bar: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500', icon: 'bg-orange-50 text-orange-600' },
    reservada: { label: 'Reservada', bar: 'bg-sky-400', pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-400', icon: 'bg-sky-50 text-sky-600' },
    limpieza: { label: 'Limpieza', bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400', icon: 'bg-amber-50 text-amber-600' },
};
const estadoUI = (estado) => ESTADO_UI[estado] || { label: estado || '—', bar: 'bg-slate-300', pill: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-300', icon: 'bg-slate-100 text-slate-500' };

const CATEGORIAS_MESA = ['Salón', 'Terraza', 'Barra', 'VIP'];

function formatDuration(ms) {
    if (!ms || ms < 0) return '—';
    const sec = Math.floor(ms / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

const normalizar = (row) => ({
    id: row.id,
    numero: row.numero,
    capacidad: row.capacidad,
    estado: row.estado,
    meseroId: row.mesero_id ?? null,
    meseroNombre: row.mesero_nombre ?? '',
    reservaAt: row.reserva_at ?? null,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    categoria: row.categoria ?? '',
});

/* ─── piezas reutilizables ─── */
function Chip({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-500',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        sky: 'bg-sky-50 text-sky-600',
    };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function MetricCard({ icon: Icon, value, label, chip, onClick }) {
    return (
        <motion.div
            variants={itemUp}
            onClick={onClick}
            title={onClick ? 'Ver detalle' : undefined}
            className={`group ${cardBase} ${onClick ? 'cursor-pointer' : ''} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}
        >
            <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                    <Icon className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                </span>
                {chip}
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
                className={`ms-mesas flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">{title}</h3>
                    <button onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                        <HiXMark className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
            </motion.div>
        </div>
    );
}

function EmptyState({ icon: Icon = HiOutlineTableCells, children }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icon className="h-6 w-6" />
            </span>
            <p className="m-0 text-sm text-slate-400">{children}</p>
        </div>
    );
}

const Th = ({ children, right }) => (
    <th className={`px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 ${right ? 'text-right' : 'text-left'}`}>{children}</th>
);
const Td = ({ children, right, className = '' }) => (
    <td className={`px-3 py-2.5 text-sm text-slate-700 ${right ? 'text-right' : ''} ${className}`}>{children}</td>
);

function Mesas() {
    // Helpers de fecha/hora en zona de Colombia
    const fmtDateCO = (date) => new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    const fmtTimeCO = (date) => new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }).format(date);
    const [mesas, setMesas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroCapacidad, setFiltroCapacidad] = useState('todas');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');

    const [meserosActivosCount, setMeserosActivosCount] = useState(0);
    const [showMeserosModal, setShowMeserosModal] = useState(false);
    const [meserosEnTurno, setMeserosEnTurno] = useState([]);
    const [showReservadasModal, setShowReservadasModal] = useState(false);
    const [reservasLista, setReservasLista] = useState([]);
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [detalleMesa, setDetalleMesa] = useState(null);
    const [detalleTab, setDetalleTab] = useState('consumos'); // 'consumos' | 'historial'
    const [historialMesa, setHistorialMesa] = useState([]);
    const [historialCargando, setHistorialCargando] = useState(false);
    // QR modal
    const [qrModal, setQrModal] = useState({ open: false, mesaNumero: null, url: '' });
    const restaurantId = (() => { try { return localStorage.getItem('restaurant_id') || ''; } catch { return ''; } })();

    const abrirQR = (e, mesa) => {
        e.stopPropagation(); // don't open detalle modal
        const url = `https://mesoft.store/menu/${restaurantId}/mesa/${mesa.numero}`;
        setQrModal({ open: true, mesaNumero: mesa.numero, url });
    };
    const cerrarQR = () => setQrModal({ open: false, mesaNumero: null, url: '' });

    // Modal de reserva
    const [reservaOpen, setReservaOpen] = useState(false);
    const [reservaForm, setReservaForm] = useState({ fecha: '', hora: '', nombre: '', telefono: '' });
    const [reservaMsg, setReservaMsg] = useState('');
    // Modal propio crear/editar
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [formMesaId, setFormMesaId] = useState(null);
    const [formData, setFormData] = useState({ numero: '', capacidad: 4, estado: 'libre', categoria: '' });
    const [formMsg, setFormMsg] = useState('');

    const cargarMesas = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getMesas();
            const list = Array.isArray(data) ? data.map(normalizar) : [];
            setMesas(list);
        } catch (e) {
            setError(e.message || 'No se pudo cargar mesas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarMesas();
    }, [cargarMesas]);

    // WebSocket: auto-refresh when a mesa changes state
    useSocket(restaurantId, useCallback((event) => {
        if (event === 'mesa_update') {
            cargarMesas();
        }
    }, [cargarMesas]));

    useEffect(() => {
        try {
            const rawTurnos = localStorage.getItem('turnos');
            if (rawTurnos) {
                const turnos = JSON.parse(rawTurnos);
                const enTurno = Array.isArray(turnos)
                    ? turnos.filter(t => {
                        const estado = `${t.estado || t.state || ''}`.toLowerCase();
                        const flag = t.enTurno ?? t.inShift ?? t.onShift;
                        return estado === 'en-turno' || estado === 'activo' || flag === true || flag === 1;
                    })
                    : [];
                setMeserosActivosCount(enTurno.length);
                return;
            }
            const keys = ['usuarios', 'users', 'app:usuarios'];
            let data = null;
            for (const k of keys) {
                const raw = localStorage.getItem(k);
                if (raw) { data = JSON.parse(raw); break; }
            }
            const arr = Array.isArray(data) ? data : [];
            const isMesero = (u = {}) => `${u.rol || u.role || ''}`.toLowerCase().includes('mesero');
            const isActivo = (u = {}) => {
                const a = u.activo;
                const estado = `${u.estado || u.status || ''}`.toLowerCase();
                if (a === 1 || a === true) return true;
                if (estado === 'activo' || estado === 'active') return true;
                if (a === 0 || a === false || estado === 'inactivo' || estado === 'inactive') return false;
                return true;
            };
            const count = arr.filter(isMesero).filter(isActivo).length;
            setMeserosActivosCount(count);
        } catch {
            setMeserosActivosCount(0);
        }
    }, []);

    // Crear / Editar / Eliminar mesas (modal propio)
    const abrirCrearModal = () => {
        setFormMode('create');
        setFormMesaId(null);
        setFormData({ numero: '', capacidad: 4, estado: 'libre', categoria: '' });
        setFormMsg('');
        setFormOpen(true);
    };
    const abrirEditarModal = (mesa) => {
        setFormMode('edit');
        setFormMesaId(mesa.id);
        setFormData({ numero: mesa.numero, capacidad: mesa.capacidad, estado: mesa.estado, categoria: mesa.categoria || '' });
        setFormMsg('');
        setFormOpen(true);
    };
    const cerrarFormModal = () => setFormOpen(false);
    const guardarForm = async () => {
        const num = Number(formData.numero);
        const cap = Number(formData.capacidad);
        if (!num || num < 1) { setFormMsg('Número inválido'); return; }
        if (!cap || cap < 1) { setFormMsg('Capacidad inválida'); return; }
        try {
            const categoria = formData.categoria || undefined;
            if (formMode === 'create') {
                await api.createMesa({ numero: num, capacidad: cap, estado: formData.estado, categoria });
            } else {
                await api.updateMesa(formMesaId, { numero: num, capacidad: cap, estado: formData.estado, categoria });
            }
            await cargarMesas();
            cerrarFormModal();
        } catch (e) {
            setFormMsg(String(e.message || e));
        }
    };
    const eliminarMesa = async (mesa) => {
        const ok = window.confirm(`Eliminar mesa ${mesa.numero}?`);
        if (!ok) return;
        try {
            await api.deleteMesa(mesa.id);
            await cargarMesas();
        } catch (e) {
            alert(`Error al eliminar: ${String(e.message || e)}`);
        }
    };

    const cargarMeserosEnTurno = () => {
        try {
            const rawTurnos = localStorage.getItem('turnos');
            const turnos = rawTurnos ? JSON.parse(rawTurnos) : [];
            const enTurno = Array.isArray(turnos)
                ? turnos.filter(t => {
                    const estado = `${t.estado || t.state || ''}`.toLowerCase();
                    const flag = t.enTurno ?? t.inShift ?? t.onShift;
                    return estado === 'en-turno' || estado === 'activo' || flag === true || flag === 1;
                })
                : [];
            const lista = enTurno.map(t => {
                const id = t.meseroId ?? t.id ?? t.userId ?? t.uid;
                const nombre = t.nombre || t.name || t.fullName || `Mesero ${id ?? ''}`;
                const mesaId = t.mesaId ?? t.mesa ?? null;
                let mesa = null;
                if (mesaId) {
                    mesa = mesas.find(m => m.id === mesaId) || null;
                } else if (id != null) {
                    mesa = mesas.find(m => m.meseroId === id) || null;
                }
                return {
                    id,
                    nombre,
                    mesaNumero: mesa ? mesa.numero : null,
                    mesaEstado: mesa ? mesa.estado : null,
                    inicioAt: t.inicioAt || t.startedAt || null,
                };
            });
            setMeserosEnTurno(lista);
        } catch {
            setMeserosEnTurno([]);
        }
    };
    const abrirMeserosModal = () => { cargarMeserosEnTurno(); setShowMeserosModal(true); };
    const cerrarMeserosModal = () => setShowMeserosModal(false);

    const cargarReservas = () => {
        const lista = mesas
            .filter(m => m.estado === 'reservada')
            .map(m => ({ id: m.id, numero: m.numero, capacidad: m.capacidad, reservaAt: m.reservaAt }))
            .sort((a, b) => (a.reservaAt || 0) - (b.reservaAt || 0));
        setReservasLista(lista);
    };
    const abrirReservadasModal = () => { cargarReservas(); setShowReservadasModal(true); };
    const cerrarReservadasModal = () => setShowReservadasModal(false);

    const abrirDetalleMesa = async (mesa) => {
        // Priorizar el mismo nombre que mostramos en la tarjeta para evitar inconsistencias
        let meseroNombre = mesa.meseroNombre || '—';
        let asignadaAt = null;
        try {
            // Solo usar storages locales si no vino desde backend
            if ((meseroNombre === '—' || !meseroNombre)) {
                const rawTurnos = localStorage.getItem('turnos');
                if (rawTurnos) {
                    const turnos = JSON.parse(rawTurnos) || [];
                    const t = turnos.find(tu => {
                        const mesaMatch = (tu.mesaId ?? tu.mesa ?? tu.tableId ?? tu.mesaNumero ?? tu.tableNumber) === mesa.id || (tu.mesaNumero ?? tu.tableNumber) === mesa.numero;
                        const meseroMatch = (tu.meseroId ?? tu.id ?? tu.userId ?? tu.uid) === mesa.meseroId;
                        return mesaMatch || meseroMatch;
                    });
                    if (t) {
                        meseroNombre = t.nombre || t.name || t.fullName || t.usuario || t.username || t.correo || meseroNombre;
                        asignadaAt = t.asignadaAt || t.assignedAt || t.inicioMesaAt || t.startedTableAt || t.inicioAt || t.startedAt || null;
                    }
                }
                if ((meseroNombre === '—' || !meseroNombre) && mesa.meseroId != null) {
                    const keys = ['usuarios', 'users', 'app:usuarios'];
                    for (const k of keys) {
                        const raw = localStorage.getItem(k);
                        if (!raw) continue;
                        const arr = JSON.parse(raw) || [];
                        const u = arr.find(x => (x.id ?? x.userId ?? x.uid) === mesa.meseroId);
                        if (u) { meseroNombre = `${u.nombre || u.name || ''} ${u.apellido || ''}`.trim() || meseroNombre; break; }
                    }
                }
            }
        } catch {}

        // Intentar obtener consumos desde el backend (pedido abierto)
        let consumos = [];
        let total = 0;
        try {
            const pedido = await api.getPedidoAbiertoDeMesa(mesa.id).catch(() => null);
            if (pedido?.id) {
                const rows = await api.getPedidoItems(pedido.id).catch(() => []);
                consumos = Array.isArray(rows)
                    ? rows.map(r => ({
                        nombre: r.nombre,
                        cantidad: Number(r.cantidad || 0),
                        precio: Number(r.precio || 0),
                        subtotal: Number(r.subtotal || (Number(r.cantidad||0)*Number(r.precio||0)))
                    }))
                    : [];
                // Preferir total del pedido si existe, si no sumar subtotales
                total = Number(pedido.total || 0);
                if (!total) total = consumos.reduce((s, it) => s + Number(it.subtotal || 0), 0);
                // Si el backend del pedido trae mesero_nombre, úsalo como fuente de verdad
                if (pedido.mesero_nombre) {
                    meseroNombre = pedido.mesero_nombre;
                }
            }
        } catch {}
        // Fallback a storages locales si backend no devolvió items
        if (!consumos.length) {
            try {
                const keys = ['pedidos', 'ordenes', 'orders', 'consumos'];
                const dynamicKeys = [
                    `pedidos:mesa:${mesa.id}`,
                    `pedidos:mesa:${mesa.numero}`,
                    `mesa:${mesa.id}:pedidos`,
                    `mesa:${mesa.numero}:pedidos`,
                    `orders:table:${mesa.id}`,
                    `orders:table:${mesa.numero}`,
                ];
                const allKeys = [...keys, ...dynamicKeys];
                for (const k of allKeys) {
                    const raw = localStorage.getItem(k);
                    if (!raw) continue;
                    const data = JSON.parse(raw);
                    const arr = Array.isArray(data) ? data : (Array.isArray(data?.pedidos) ? data.pedidos : Array.isArray(data?.ordenes) ? data.ordenes : Array.isArray(data?.orders) ? data.orders : []);
                    const matches = arr.filter(p => {
                        const mid = (p.mesaId ?? p.mesa ?? p.tableId ?? p.mesaNumero ?? p.tableNumber);
                        return mid === mesa.id || mid === mesa.numero;
                    });
                    const items = matches.flatMap(p => {
                        const it = Array.isArray(p.items) ? p.items : (Array.isArray(p.detalles) ? p.detalles : Array.isArray(p.productos) ? p.productos : Array.isArray(p.lines) ? p.lines : Array.isArray(p.cart) ? p.cart : []);
                        return it;
                    });
                    for (const it of items) {
                        const nombre = it.nombre || it.producto || it.name || it.title || 'Producto';
                        const cant = Number(it.cantidad ?? it.qty ?? it.quantity ?? 1) || 1;
                        const precio = Number(it.precio ?? it.price ?? it.unitPrice ?? it.valor ?? 0) || 0;
                        const subtotal = Number(it.subtotal ?? it.total ?? cant * precio) || cant * precio;
                        total += subtotal;
                        consumos.push({ nombre, cantidad: cant, precio, subtotal });
                    }
                    if (consumos.length) break;
                }
            } catch {}
        }

        setDetalleMesa({ ...mesa, meseroNombre, consumos, total, asignadaAt });
        setDetalleTab('consumos');
        setHistorialMesa([]);
        setShowDetalleModal(true);
    };
    const cerrarDetalleMesa = () => { setShowDetalleModal(false); setDetalleMesa(null); setHistorialMesa([]); };

    const cargarHistorialMesa = async (mesaId) => {
        setHistorialCargando(true);
        try {
            const today = new Date();
            const hasta = today.toISOString().slice(0, 10);
            const desde30 = new Date(today);
            desde30.setDate(desde30.getDate() - 29);
            const desde = desde30.toISOString().slice(0, 10);
            const data = await api.facturas({ desde, hasta });
            const arr = Array.isArray(data) ? data : (Array.isArray(data?.facturas) ? data.facturas : []);
            const filtradas = arr
                .filter(f => Number(f.mesa_id) === Number(mesaId))
                .sort((a, b) => new Date(b.fecha_hora || b.created_at || 0) - new Date(a.fecha_hora || a.created_at || 0))
                .slice(0, 5);
            setHistorialMesa(filtradas);
        } catch {
            setHistorialMesa([]);
        } finally {
            setHistorialCargando(false);
        }
    };

    const abrirReservarModal = (mesa) => {
        const target = mesa || detalleMesa;
        if (!target) return;
        // precargar: hoy + 1h
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setReservaForm({
            fecha: `${y}-${m}-${d}`,
            hora: `${hh}:${mm}`,
            nombre: target.reservadoPor || '',
            telefono: target.telefono || '',
        });
        setReservaMsg('');
        setReservaOpen(true);
    };

    const cerrarReservarModal = () => setReservaOpen(false);

    const confirmarReserva = async () => {
        if (!detalleMesa) return;
        const { fecha, hora, nombre, telefono } = reservaForm;
        if (!fecha || !hora) { setReservaMsg('Elige fecha y hora'); return; }
        const reserva_at = `${fecha} ${hora}:00`;
        try {
            await api.reservarMesa(detalleMesa.id, { reserva_at, reservado_por: nombre || null, telefono: telefono || null });
            // Auto-save cliente if nombre provided
            if (nombre && nombre.trim()) {
                upsertCliente({ nombre: nombre.trim(), telefono: telefono || '' });
            }
            logAudit(null, 'reservar_mesa', `Mesa ${detalleMesa.numero} — ${nombre || 'Sin nombre'} ${fecha} ${hora}`);
            await cargarMesas();
            setReservaOpen(false);
            // refrescar detalle
            const updated = (await api.getMesas()).find(m => m.id === detalleMesa.id);
            if (updated) abrirDetalleMesa(updated);
        } catch (e) {
            setReservaMsg(String(e.message || e));
        }
    };

    const cancelarReserva = async (mesa) => {
        const target = mesa || detalleMesa;
        if (!target) return;
        const ok = window.confirm('¿Cancelar la reserva de esta mesa?');
        if (!ok) return;
        try {
            await api.cancelarReservaMesa(target.id);
            await cargarMesas();
            if (detalleMesa && target.id === detalleMesa.id) abrirDetalleMesa(target);
        } catch (e) {
            alert(String(e.message || e));
        }
    };

    const mesasFiltradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return mesas
            .filter(m => (filtroEstado === 'todos' ? true : m.estado === filtroEstado))
            .filter(m => (filtroCapacidad === 'todas' ? true : m.capacidad === Number(filtroCapacidad)))
            .filter(m => (filtroCategoria === 'todas' ? true : (m.categoria || '') === filtroCategoria))
            .filter(m => !q || String(m.numero).includes(q))
            .sort((a, b) => a.numero - b.numero);
    }, [mesas, busqueda, filtroEstado, filtroCapacidad, filtroCategoria]);

    const total = mesas.length;
    const libres = mesas.filter(m => m.estado === 'libre').length;
    const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
    const reservadas = mesas.filter(m => m.estado === 'reservada').length;
    const occPct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

    return (
        <div className="ms-mesas mx-auto max-w-7xl">
            <style>{`:where(.ms-mesas) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Operación en sala</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Gestión de Mesas</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Disponibilidad y estados en tiempo real</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className={btnGhost} onClick={cargarMesas} title="Actualizar listado">
                        <HiOutlineArrowPath className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                    </button>
                    <button className={btnPrimary} onClick={abrirCrearModal}>
                        <HiOutlinePlus className="h-4 w-4" /> Nueva mesa
                    </button>
                </div>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                <MetricCard
                    icon={HiOutlineTableCells}
                    value={<>{libres}<span className="text-base font-bold text-slate-400"> / {total}</span></>}
                    label="Mesas disponibles"
                    chip={<Chip>{occPct}% ocup.</Chip>}
                />
                <MetricCard
                    icon={HiOutlineUserGroup}
                    value={meserosActivosCount}
                    label="Meseros activos"
                    chip={<Chip tone="emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En turno</Chip>}
                    onClick={abrirMeserosModal}
                />
                <MetricCard
                    icon={HiOutlineCheckCircle}
                    value={ocupadas}
                    label="Ocupadas"
                    chip={<Chip tone="orange">{occPct}%</Chip>}
                />
                <MetricCard
                    icon={HiOutlineClock}
                    value={reservadas}
                    label="Reservadas"
                    chip={<Chip tone="sky">Ver detalle</Chip>}
                    onClick={abrirReservadasModal}
                />
            </motion.div>

            {/* Toolbar: búsqueda + filtros */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between`}
            >
                {/* Chips de categoría */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFiltroCategoria('todas')}
                        className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${filtroCategoria === 'todas' ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        Todas
                    </button>
                    {CATEGORIAS_MESA.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setFiltroCategoria(cat)}
                            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${filtroCategoria === cat ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Búsqueda + selects */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar por número…"
                            className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400 sm:w-48"
                        />
                    </div>
                    <Select
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value)}
                        aria-label="Filtrar por estado"
                        className="w-full sm:w-44"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="libre">Libres</option>
                        <option value="ocupada">Ocupadas</option>
                        <option value="reservada">Reservadas</option>
                        <option value="limpieza">Limpieza</option>
                    </Select>
                    <Select
                        value={filtroCapacidad}
                        onChange={e => setFiltroCapacidad(e.target.value)}
                        aria-label="Filtrar por capacidad"
                        className="w-full sm:w-44"
                    >
                        <option value="todas">Cualquier capacidad</option>
                        <option value="2">2 personas</option>
                        <option value="4">4 personas</option>
                        <option value="6">6 personas</option>
                    </Select>
                </div>
            </motion.div>

            {/* Grid de mesas */}
            {loading ? (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`${cardBase} animate-pulse`}>
                            <div className="h-5 w-24 rounded bg-slate-200" />
                            <div className="mt-4 h-4 w-32 rounded bg-slate-100" />
                            <div className="mt-2 h-4 w-20 rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className={`mt-5 ${cardBase}`}>
                    <EmptyState icon={HiOutlineTableCells}>Error: {error}</EmptyState>
                </div>
            ) : mesasFiltradas.length === 0 ? (
                <div className={`mt-5 ${cardBase}`}>
                    <EmptyState icon={HiOutlineTableCells}>No se encontraron mesas con los filtros aplicados.</EmptyState>
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
                        return (
                            <motion.div
                                key={m.id}
                                variants={itemUp}
                                onClick={() => abrirDetalleMesa(m)}
                                onDoubleClick={() => abrirEditarModal(m)}
                                title="Clic: detalle · Doble clic: editar"
                                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200"
                            >
                                <span className={`absolute inset-x-0 top-0 h-1 ${ui.bar}`} />

                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ui.icon}`}>
                                            <HiOutlineTableCells className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="m-0 text-base font-extrabold tracking-tight text-slate-900">Mesa {m.numero}</p>
                                            <span className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${ui.pill}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} /> {ui.label}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => abrirQR(e, m)}
                                        title={`Ver QR de Mesa ${m.numero}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 ring-1 ring-slate-200 transition-colors hover:bg-orange-50 hover:text-orange-500 hover:ring-orange-200"
                                    >
                                        <HiOutlineQrCode className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <HiOutlineUsers className="h-4 w-4 text-slate-400" />
                                        <span>Capacidad {m.capacidad}</span>
                                        {m.categoria && (
                                            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{m.categoria}</span>
                                        )}
                                    </div>
                                    {m.meseroNombre && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <HiOutlineUser className="h-4 w-4 text-slate-400" />
                                            <span className="truncate">{m.meseroNombre}</span>
                                        </div>
                                    )}
                                    {m.estado === 'reservada' && m.reservaAt && (
                                        <div className="flex items-center gap-2 text-sm text-sky-600">
                                            <HiOutlineClock className="h-4 w-4" />
                                            <span>{fmtDateCO(new Date(m.reservaAt))} · {fmtTimeCO(new Date(m.reservaAt))}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Modal Detalle de mesa */}
            {showDetalleModal && detalleMesa && (
                <Modal
                    title={`Detalle Mesa ${detalleMesa.numero}`}
                    onClose={cerrarDetalleMesa}
                    maxW="max-w-2xl"
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => abrirDetalleMesa(mesas.find(mm => mm.id === detalleMesa.id) || detalleMesa)}>
                                <HiOutlineArrowPath className="h-4 w-4" /> Recargar
                            </button>
                            {detalleMesa.estado !== 'reservada' ? (
                                <button className={btnPrimary} onClick={() => abrirReservarModal(detalleMesa)}>Reservar</button>
                            ) : (
                                <button className={btnGhost} onClick={() => cancelarReserva(detalleMesa)}>Cancelar reserva</button>
                            )}
                        </>
                    }
                >
                    {/* Resumen superior */}
                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                            <p className="m-0 text-xs text-slate-400">Mesero asignado</p>
                            <p className="m-0 mt-1 text-sm font-bold text-slate-900">{detalleMesa.meseroNombre || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                            <p className="m-0 text-xs text-slate-400">Tiempo en mesa</p>
                            <p className="m-0 mt-1 text-sm font-bold text-slate-900">
                                {detalleMesa.asignadaAt ? formatDuration(Date.now() - Number(detalleMesa.asignadaAt)) : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1">
                        <button
                            onClick={() => setDetalleTab('consumos')}
                            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${detalleTab === 'consumos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Consumos actuales
                        </button>
                        <button
                            onClick={() => {
                                setDetalleTab('historial');
                                if (historialMesa.length === 0 && !historialCargando) {
                                    cargarHistorialMesa(detalleMesa.id);
                                }
                            }}
                            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${detalleTab === 'historial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Historial (30 días)
                        </button>
                    </div>

                    {/* Tab: consumos */}
                    {detalleTab === 'consumos' && (
                        (!detalleMesa.consumos || detalleMesa.consumos.length === 0) ? (
                            <EmptyState icon={HiOutlineTableCells}>Sin consumos registrados.</EmptyState>
                        ) : (
                            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-100">
                                            <Th>Producto</Th>
                                            <Th right>Cant.</Th>
                                            <Th right>Precio</Th>
                                            <Th right>Subtotal</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalleMesa.consumos.map((c, idx) => (
                                            <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                                <Td className="font-medium text-slate-900">{c.nombre}</Td>
                                                <Td right>{c.cantidad}</Td>
                                                <Td right>{fmtCOP(c.precio)}</Td>
                                                <Td right className="font-semibold">{fmtCOP(c.subtotal)}</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50">
                                            <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-extrabold text-slate-900">Total</td>
                                            <td className="px-3 py-2.5 text-right text-sm font-extrabold text-orange-600">{fmtCOP(detalleMesa.total || 0)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )
                    )}

                    {/* Tab: historial */}
                    {detalleTab === 'historial' && (
                        historialCargando ? (
                            <EmptyState icon={HiOutlineClock}>Cargando historial…</EmptyState>
                        ) : historialMesa.length === 0 ? (
                            <EmptyState icon={HiOutlineClock}>No hay pedidos pagados en los últimos 30 días.</EmptyState>
                        ) : (
                            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-100">
                                            <Th>#</Th>
                                            <Th>Fecha</Th>
                                            <Th>Mesero</Th>
                                            <Th right>Total</Th>
                                            <Th>Método</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historialMesa.map((f, idx) => {
                                            const fecha = f.fecha_hora || f.created_at || f.fecha;
                                            const fmtFecha = fecha
                                                ? new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }).format(new Date(fecha))
                                                : '—';
                                            return (
                                                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                                    <Td className="font-semibold text-slate-900">#{f.id}</Td>
                                                    <Td className="text-xs">{fmtFecha}</Td>
                                                    <Td>{f.mesero_nombre || f.mesero_id || '—'}</Td>
                                                    <Td right className="font-semibold">{fmtCOP(f.total)}</Td>
                                                    <Td className="text-xs capitalize">{f.metodo_pago || f.metodo || '—'}</Td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </Modal>
            )}

            {/* Modal Meseros en turno */}
            {showMeserosModal && (
                <Modal
                    title="Meseros en turno"
                    onClose={cerrarMeserosModal}
                    footer={<button className={btnGhost} onClick={cerrarMeserosModal}>Cerrar</button>}
                >
                    {meserosEnTurno.length === 0 ? (
                        <EmptyState icon={HiOutlineUserGroup}>No hay meseros en turno.</EmptyState>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {meserosEnTurno.map((s) => {
                                const ui = estadoUI(s.mesaEstado);
                                return (
                                    <div key={s.id} className="flex items-center gap-3 py-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-extrabold text-orange-600 ring-2 ring-orange-100">
                                            {String(s.nombre || '?').charAt(0).toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="m-0 truncate text-sm font-semibold text-slate-800">{s.nombre}</p>
                                            <p className="m-0 text-xs text-slate-400">
                                                {s.inicioAt ? `Inicio de turno: ${new Date(s.inicioAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'En turno'}
                                            </p>
                                        </div>
                                        {s.mesaNumero ? (
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ui.pill}`}>Mesa {s.mesaNumero}</span>
                                        ) : (
                                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Sin mesa</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Modal>
            )}

            {/* Modal Mesas reservadas */}
            {showReservadasModal && (
                <Modal
                    title="Mesas reservadas"
                    onClose={cerrarReservadasModal}
                    footer={<button className={btnGhost} onClick={cerrarReservadasModal}>Cerrar</button>}
                >
                    {reservasLista.length === 0 ? (
                        <EmptyState icon={HiOutlineClock}>No hay mesas reservadas.</EmptyState>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {reservasLista.map(r => (
                                <div key={r.id} className="flex items-center gap-3 py-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-extrabold text-sky-600 ring-2 ring-sky-100">
                                        {String(r.numero).charAt(0)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="m-0 text-sm font-semibold text-slate-800">Mesa {r.numero}</p>
                                        <p className="m-0 text-xs text-slate-400">Capacidad {r.capacidad}</p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
                                        {r.reservaAt ? `${fmtDateCO(new Date(r.reservaAt))} ${fmtTimeCO(new Date(r.reservaAt))}` : 'Programada'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal>
            )}

            {/* Modal Crear/Editar mesa */}
            {formOpen && (
                <Modal
                    title={formMode === 'create' ? 'Nueva mesa' : `Editar mesa ${formData.numero}`}
                    onClose={cerrarFormModal}
                    footer={
                        <>
                            <button className={btnGhost} onClick={cerrarFormModal}>Cancelar</button>
                            <button className={btnPrimary} onClick={guardarForm}>{formMode === 'create' ? 'Crear mesa' : 'Guardar cambios'}</button>
                        </>
                    }
                >
                    {formMsg && (
                        <div className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 ring-1 ring-red-100">{formMsg}</div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Número</label>
                            <input type="number" min={1} className={inputCls} value={formData.numero}
                                onChange={e => setFormData({ ...formData, numero: e.target.value })} placeholder="Número de mesa" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Capacidad</label>
                            <input type="number" min={1} className={inputCls} value={formData.capacidad}
                                onChange={e => setFormData({ ...formData, capacidad: e.target.value })} placeholder="Capacidad" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Estado</label>
                            <Select className="w-full" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })}>
                                <option value="libre">Libre</option>
                                <option value="ocupada">Ocupada</option>
                                <option value="reservada">Reservada</option>
                                <option value="limpieza">Limpieza</option>
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Categoría</label>
                            <Select className="w-full" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} placeholder="Sin categoría">
                                <option value="">Sin categoría</option>
                                {CATEGORIAS_MESA.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </Select>
                        </div>
                    </div>
                    {formMode === 'edit' && (
                        <button
                            onClick={() => { const mesa = mesas.find(mm => mm.id === formMesaId); if (mesa) { cerrarFormModal(); eliminarMesa(mesa); } }}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                        >
                            <HiOutlineTrash className="h-4 w-4" /> Eliminar esta mesa
                        </button>
                    )}
                </Modal>
            )}

            {/* Modal Reservar mesa */}
            {reservaOpen && detalleMesa && (
                <Modal
                    title={`Reservar mesa ${detalleMesa.numero}`}
                    onClose={cerrarReservarModal}
                    footer={
                        <>
                            <button className={btnGhost} onClick={cerrarReservarModal}>Cancelar</button>
                            <button className={btnPrimary} onClick={confirmarReserva}>Confirmar reserva</button>
                        </>
                    }
                >
                    {reservaMsg && (
                        <div className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 ring-1 ring-red-100">{reservaMsg}</div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Fecha</label>
                            <DatePicker className="w-full" value={reservaForm.fecha} onChange={e => setReservaForm({ ...reservaForm, fecha: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Hora</label>
                            <input type="time" className={inputCls} value={reservaForm.hora} onChange={e => setReservaForm({ ...reservaForm, hora: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Nombre</label>
                            <input type="text" className={inputCls} value={reservaForm.nombre} onChange={e => setReservaForm({ ...reservaForm, nombre: e.target.value })} placeholder="Nombre del cliente" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Teléfono</label>
                            <input type="tel" className={inputCls} value={reservaForm.telefono} onChange={e => setReservaForm({ ...reservaForm, telefono: e.target.value })} placeholder="Teléfono de contacto" />
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal QR de mesa */}
            {qrModal.open && (
                <Modal
                    title={`QR — Mesa ${qrModal.mesaNumero}`}
                    onClose={cerrarQR}
                    maxW="max-w-sm"
                    footer={<button className={btnGhost} onClick={cerrarQR}>Cerrar</button>}
                >
                    <div className="flex flex-col items-center gap-4">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrModal.url)}`}
                            alt={`QR Mesa ${qrModal.mesaNumero}`}
                            width={220}
                            height={220}
                            className="rounded-2xl ring-1 ring-slate-100"
                        />
                        <p className="m-0 break-all text-center text-xs text-slate-400">{qrModal.url}</p>
                        <a
                            href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrModal.url)}&format=png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${btnPrimary} no-underline`}
                        >
                            <HiOutlineArrowDownTray className="h-4 w-4" /> Descargar QR
                        </a>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Mesas;
