import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineUserGroup,
    HiOutlineMagnifyingGlass,
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineUser,
    HiOutlinePlus,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlineEnvelope,
    HiOutlineExclamationTriangle,
    HiOutlineTableCells,
    HiXMark,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';
import Select from '../../ui/Select';

/* ─── helpers de presentación (alineados con Inicio y Mesas) ─── */
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';
const btnDanger = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const PILL = {
    occ: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-400', avatar: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
    res: { pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500', bar: 'bg-sky-400', avatar: 'bg-sky-50 text-sky-600 ring-sky-100' },
    clean: { pill: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-400', avatar: 'bg-amber-50 text-amber-600 ring-amber-100' },
};
const pillUI = (color) => PILL[color] || { pill: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400', bar: 'bg-slate-300', avatar: 'bg-slate-100 text-slate-500 ring-slate-200' };

const ROL_LABEL = { mesero: 'Mesero', cajero: 'Cajero', cocinero: 'Cocina', admin: 'Admin' };
const ROL_TONE = {
    mesero: 'bg-slate-100 text-slate-600',
    cajero: 'bg-sky-50 text-sky-700',
    cocinero: 'bg-orange-50 text-orange-700',
    admin: 'bg-violet-50 text-violet-700',
};
const rolKey = (u) => `${u?.rol || 'mesero'}`.toLowerCase();

function Chip({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-500',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        sky: 'bg-sky-50 text-sky-600',
    };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function MetricCard({ icon: Icon, value, label, chip }) {
    return (
        <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
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

function Modal({ title, onClose, children, footer, maxW = 'max-w-2xl', danger = false }) {
    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`ms-meseros flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
            >
                <div className={`flex items-center justify-between border-b px-5 py-4 ${danger ? 'border-red-100 bg-red-50/50' : 'border-slate-100'}`}>
                    <h3 className={`m-0 text-base font-extrabold tracking-tight ${danger ? 'text-red-600' : 'text-slate-900'}`}>{title}</h3>
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

function EmptyState({ icon: Icon = HiOutlineUserGroup, children }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icon className="h-6 w-6" />
            </span>
            <p className="m-0 text-sm text-slate-400">{children}</p>
        </div>
    );
}

function Meseros() {
    // Fuente remota (backend)
    const [meseros, setMeseros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const cargar = async () => {
        setLoading(true); setError('');
        try {
            const data = await api.getMeseros();
            const arr = Array.isArray(data) ? data : [];
            setMeseros(arr);
            // Sync turnos from API response (esta_en_turno / turno_inicio fields)
            const apiTurnos = arr
                .filter((u) => u.esta_en_turno != null)
                .map((u) => ({
                    meseroId: u.id,
                    enTurno: !!u.esta_en_turno,
                    inicioAt: u.turno_inicio || null,
                    mesaId: null,
                }));
            if (apiTurnos.length > 0) {
                setTurnos(apiTurnos);
            }
        } catch (e) {
            setError(e.message || 'Error al cargar meseros');
        } finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    const [turnos, setTurnos] = useState(() => {
        try {
            const raw = localStorage.getItem('turnos');
            return raw ? (JSON.parse(raw) || []) : [];
        } catch {
            return [];
        }
    });

    // Nota: Turnos aún no está soportado por API, se mantiene en memoria (sin persistir localStorage)

    // Filtros y búsqueda
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos'); // todos | en-turno | activos | inactivos

    // Mapeo de turno por mesero
    const turnoById = useMemo(() => {
        const map = new Map();
        for (const t of Array.isArray(turnos) ? turnos : []) {
            const id = t.meseroId ?? t.userId ?? t.id ?? t.uid;
            if (id == null) continue;
            const en = (() => {
                const estado = `${t.estado || t.state || ''}`.toLowerCase();
                const flag = t.enTurno ?? t.inShift ?? t.onShift;
                return estado === 'en-turno' || estado === 'activo' || flag === true || flag === 1;
            })();
            map.set(Number(id), {
                enTurno: en,
                inicioAt: t.inicioAt || t.startedAt || null,
                mesaId: t.mesaId ?? t.mesa ?? null,
            });
        }
        return map;
    }, [turnos]);

    // Métricas
    const total = meseros.length;
    const activos = meseros.filter(u => (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo')).length;
    const inactivos = total - activos;
    const enTurno = meseros.filter(u => turnoById.get(Number(u.id))?.enTurno).length;
    const activosPct = total > 0 ? Math.round((activos / total) * 100) : 0;

    // Filtrado y búsqueda
    const meserosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return meseros
            .filter(u => {
                if (filtroEstado === 'todos') return true;
                if (filtroEstado === 'en-turno') return !!turnoById.get(Number(u.id))?.enTurno;
                const isActivo = (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo');
                if (filtroEstado === 'activos') return isActivo;
                if (filtroEstado === 'inactivos') return !isActivo;
                return true;
            })
            .filter(u => {
                if (!q) return true;
                const full = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
                const mail = `${u.correo || u.email || ''}`.toLowerCase();
                return full.includes(q) || mail.includes(q);
            })
            .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
    }, [meseros, busqueda, filtroEstado, turnoById]);

    // Helpers UI
    const pillFor = (u) => {
        // API fields take precedence over localStorage turnos
        const apiEnTurno = u.esta_en_turno != null ? !!u.esta_en_turno : null;
        const t = turnoById.get(Number(u.id));
        const isEnTurno = apiEnTurno !== null ? apiEnTurno : !!t?.enTurno;
        if (isEnTurno) return { label: 'En turno', color: 'occ' }; // verde
        const isActivo = (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo');
        if (isActivo) return { label: 'Activo', color: 'res' }; // azul
        return { label: 'Inactivo', color: 'clean' }; // naranja
    };

    const refresh = () => { cargar(); };

    // Admin: crear/editar/eliminar (no controla turnos)
    const [showNuevo, setShowNuevo] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoApellido, setNuevoApellido] = useState('');
    const [nuevoCorreo, setNuevoCorreo] = useState('');
    const [nuevoTelefono, setNuevoTelefono] = useState('');
    const [nuevoPassword, setNuevoPassword] = useState('');
    const [nuevoActivo, setNuevoActivo] = useState(true);

    const [showEditar, setShowEditar] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editNombre, setEditNombre] = useState('');
    const [editApellido, setEditApellido] = useState('');
    const [editCorreo, setEditCorreo] = useState('');
    const [editTelefono, setEditTelefono] = useState('');
    const [editActivo, setEditActivo] = useState(true);
    const [editPassword, setEditPassword] = useState('');
    const [editCorreoConfirm, setEditCorreoConfirm] = useState('');
    const [editRol, setEditRol] = useState('mesero');

    const [showEliminar, setShowEliminar] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const abrirNuevo = () => {
        setNuevoNombre(''); setNuevoApellido(''); setNuevoCorreo(''); setNuevoTelefono(''); setNuevoPassword(''); setNuevoActivo(true); setShowNuevo(true);
    };
    const confirmarNuevo = async () => {
        const nombre = nuevoNombre.trim();
        if (!nombre) return Swal.fire({ icon: 'error', title: 'Nombre requerido' });
        const correo = nuevoCorreo.trim();
        if (!correo) return Swal.fire({ icon: 'error', title: 'Correo requerido' });
        const emailOk = /.+@.+\..+/.test(correo);
        if (!emailOk) return Swal.fire({ icon: 'error', title: 'Correo inválido' });
        // Requerir contraseña mínima siempre para permitir login
        if (!nuevoPassword || nuevoPassword.length < 6) {
            return Swal.fire({ icon: 'error', title: 'Contraseña requerida', text: 'Mínimo 6 caracteres.' });
        }
        try {
            await api.crearMesero({ nombre, estado: nuevoActivo ? 'activo' : 'inactivo', correo, contrasena: nuevoPassword });
            setShowNuevo(false);
            await Swal.fire({ icon: 'success', title: 'Mesero creado', timer: 900, showConfirmButton: false });
            cargar();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo crear', 'error');
        }
    };

    const onChangeEditarSeleccion = (idStr) => {
        const id = Number(idStr);
        setEditId(id);
        const u = meseros.find(x => Number(x.id) === id);
        if (!u) return;
        setEditNombre(u.nombre || ''); setEditApellido(u.apellido || ''); setEditCorreo(u.correo || u.email || ''); setEditTelefono(u.telefono || ''); setEditActivo(u.activo === true || u.activo === 1 || `${u.estado||''}`.toLowerCase() === 'activo'); setEditPassword(''); setEditCorreoConfirm(''); setEditRol(u.rol || u.role || 'mesero');
    };
    const abrirEditarMesero = (u) => {
        if (!u) return;
        onChangeEditarSeleccion(u.id);
        setShowEditar(true);
    };
    const confirmarEditar = async () => {
        if (!editId) return setShowEditar(false);
        const nombre = editNombre.trim();
        if (!nombre) return Swal.fire({ icon: 'error', title: 'Nombre requerido' });
        const correo = String(editCorreo || '').trim();
        if (!correo) return Swal.fire({ icon: 'error', title: 'Correo requerido' });
        const emailOk = /.+@.+\..+/.test(correo);
        if (!emailOk) return Swal.fire({ icon: 'error', title: 'Correo inválido' });
        const original = meseros.find(x => Number(x.id) === Number(editId));
        const originalCorreo = original?.correo || original?.email || '';
        const wantsUserChange = (editPassword && editPassword.length > 0) || (correo.toLowerCase() !== String(originalCorreo).toLowerCase());
        if (wantsUserChange) {
            if (!editCorreoConfirm || editCorreoConfirm.trim().toLowerCase() !== correo.toLowerCase()) {
                return Swal.fire({ icon: 'error', title: 'Confirma tu correo', text: 'Para cambiar el correo o la contraseña debes confirmar el correo.'});
            }
            if (editPassword && editPassword.length > 0 && editPassword.length < 6) {
                return Swal.fire({ icon: 'error', title: 'Contraseña inválida', text: 'La nueva contraseña debe tener al menos 6 caracteres.'});
            }
        }
        try {
            const orig = meseros.find(x => Number(x.id) === Number(editId));
            const rolCambio = orig && (orig.rol || orig.role || 'mesero') !== editRol;
            await api.actualizarMesero(editId, {
                nombre,
                estado: editActivo ? 'activo' : 'inactivo',
                correo,
                contrasena: editPassword || undefined,
                confirm_correo: editCorreoConfirm || undefined,
                rol: rolCambio ? editRol : undefined,
            });
            setShowEditar(false);
            await Swal.fire({ icon: 'success', title: 'Cambios guardados', timer: 900, showConfirmButton: false });
            cargar();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo actualizar', 'error');
        }
    };

    const abrirEliminarMesero = (u) => {
        if (!u) return;
        setDeleteId(u.id); setShowEliminar(true);
    };
    const confirmarEliminar = async () => {
        if (!deleteId) return setShowEliminar(false);
        const u = meseros.find(x => Number(x.id) === Number(deleteId));
        if (!u) return setShowEliminar(false);
        // Bloquea eliminación si está en turno
        if (turnoById.get(Number(u.id))?.enTurno) {
            await Swal.fire({ icon: 'error', title: 'No permitido', text: 'No puedes eliminar un mesero mientras está en turno.' });
            return;
        }
        const res = await Swal.fire({ title: `Eliminar ${u.nombre} ${u.apellido || ''}`.trim(), text: 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, cancelButtonText: 'Cancelar', confirmButtonText: 'Eliminar', confirmButtonColor: '#ef4444' });
        if (!res.isConfirmed) return;
        try {
            await api.eliminarMesero(deleteId);
            setShowEliminar(false);
            await Swal.fire({ icon: 'success', title: 'Mesero eliminado', timer: 900, showConfirmButton: false });
            cargar();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
        }
    };

    const avatarOf = (u) => String(`${u.nombre || ''}`.trim().charAt(0) || '?').toUpperCase();

    const FILTROS = [
        { key: 'todos', label: 'Todos' },
        { key: 'en-turno', label: 'En turno' },
        { key: 'activos', label: 'Activos' },
        { key: 'inactivos', label: 'Inactivos' },
    ];

    const nuevoValido = (() => {
        const nombreOk = String(nuevoNombre || '').trim().length > 0;
        const correoOk = /.+@.+\..+/.test(String(nuevoCorreo || '').trim());
        const passOk = String(nuevoPassword || '').length >= 6;
        return nombreOk && correoOk && passOk;
    })();

    const meseroEdit = meseros.find(x => Number(x.id) === Number(editId));
    const meseroDelete = meseros.find(x => Number(x.id) === Number(deleteId));

    return (
        <div className="ms-meseros mx-auto max-w-7xl">
            <style>{`:where(.ms-meseros) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Equipo de trabajo</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Gestión de Personal</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Meseros, cajeros y cocina · roles, disponibilidad y estados</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className={btnGhost} onClick={refresh} title="Recargar listado">
                        <HiOutlineArrowPath className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Cargando…' : 'Recargar'}
                    </button>
                    <button className={btnPrimary} onClick={abrirNuevo}>
                        <HiOutlinePlus className="h-4 w-4" /> Nuevo empleado
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
                <MetricCard icon={HiOutlineUserGroup} value={total} label="Empleados" chip={<Chip>Equipo</Chip>} />
                <MetricCard icon={HiOutlineClock} value={enTurno} label="En turno" chip={<Chip tone="emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En vivo</Chip>} />
                <MetricCard
                    icon={HiOutlineCheckCircle}
                    value={<>{activos}<span className="text-base font-bold text-slate-400"> / {total}</span></>}
                    label="Activos"
                    chip={<Chip tone="emerald">{activosPct}%</Chip>}
                />
                <MetricCard icon={HiOutlineUser} value={inactivos} label="Inactivos" chip={<Chip tone="orange">Off</Chip>} />
            </motion.div>

            {/* Toolbar: chips de estado + búsqueda */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between`}
            >
                <div className="flex flex-wrap items-center gap-2">
                    {FILTROS.map(f => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFiltroEstado(f.key)}
                            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${filtroEstado === f.key ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="relative sm:w-72">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre o correo…"
                        className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            </motion.div>

            {/* Grid de meseros */}
            {loading ? (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`${cardBase} animate-pulse`}>
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-slate-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-24 rounded bg-slate-200" />
                                    <div className="h-3 w-16 rounded bg-slate-100" />
                                </div>
                            </div>
                            <div className="mt-4 h-3 w-full rounded bg-slate-100" />
                            <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className={`mt-5 ${cardBase}`}><EmptyState icon={HiOutlineUserGroup}>Error: {error}</EmptyState></div>
            ) : meserosFiltrados.length === 0 ? (
                <div className={`mt-5 ${cardBase}`}><EmptyState icon={HiOutlineUserGroup}>No hay meseros que coincidan con tu búsqueda.</EmptyState></div>
            ) : (
                <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    animate="visible"
                    className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {meserosFiltrados.map(u => {
                        const pill = pillFor(u);
                        const ui = pillUI(pill.color);
                        const t = turnoById.get(Number(u.id));
                        const apiEnTurno = u.esta_en_turno != null ? !!u.esta_en_turno : t?.enTurno;
                        const apiInicioAt = u.turno_inicio || t?.inicioAt || null;
                        let duracion = '';
                        if (apiEnTurno && apiInicioAt) {
                            const diff = Date.now() - new Date(apiInicioAt).getTime();
                            const mm = Math.floor(diff / 60000);
                            const hh = Math.floor(mm / 60);
                            duracion = hh > 0 ? `${hh}h ${mm % 60}m` : `${mm}m`;
                        }
                        const checkinFmt = apiInicioAt
                            ? new Date(apiInicioAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                            : '';
                        return (
                            <motion.div
                                key={u.id}
                                variants={itemUp}
                                className="group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200"
                            >
                                <span className={`absolute inset-x-0 top-0 h-1 ${ui.bar}`} />

                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold ring-2 ${ui.avatar}`}>
                                            {avatarOf(u)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="m-0 truncate text-sm font-extrabold text-slate-900">{u.nombre} {u.apellido}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${ui.pill}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} /> {pill.label}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ROL_TONE[rolKey(u)] || ROL_TONE.mesero}`}>{ROL_LABEL[rolKey(u)] || 'Mesero'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <HiOutlineEnvelope className="h-4 w-4 shrink-0 text-slate-400" />
                                        <span className="truncate" title={u.correo || u.email || ''}>{u.correo || u.email || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500" title={apiEnTurno && checkinFmt ? `Check-in: ${checkinFmt}` : 'Fuera de turno'}>
                                        <HiOutlineClock className={`h-4 w-4 shrink-0 ${apiEnTurno ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        {apiEnTurno ? (
                                            <span className={apiEnTurno ? 'font-medium text-emerald-600' : ''}>
                                                En turno{duracion ? ` · ${duracion}` : ''}
                                            </span>
                                        ) : (
                                            <span>Fuera de turno</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <HiOutlineTableCells className="h-4 w-4 shrink-0 text-slate-400" />
                                        <span>{t?.mesaId ? `Atendiendo mesa ${t.mesaId}` : 'Sin mesa asignada'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                                    <button
                                        onClick={() => abrirEditarMesero(u)}
                                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <HiOutlinePencilSquare className="h-4 w-4" /> Editar
                                    </button>
                                    <button
                                        onClick={() => abrirEliminarMesero(u)}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50"
                                    >
                                        <HiOutlineTrash className="h-4 w-4" /> Eliminar
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Modal Nuevo mesero */}
            {showNuevo && (
                <Modal
                    title="Nuevo empleado"
                    onClose={() => setShowNuevo(false)}
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => setShowNuevo(false)}>Cancelar</button>
                            <button className={btnPrimary} onClick={confirmarNuevo} disabled={!nuevoValido} title={!nuevoValido ? 'Completa nombre, correo válido y contraseña (≥6)' : undefined}>Crear empleado</button>
                        </>
                    }
                >
                    <p className="m-0 mb-4 text-sm text-slate-500">Crea un nuevo empleado. Luego puedes asignarle el rol (mesero, cajero o cocina). Los campos con <span className="font-bold text-orange-500">*</span> son obligatorios.</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Nombre *</label>
                            <input className={inputCls} value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre" />
                        </div>
                        <div>
                            <label className={labelCls}>Apellido</label>
                            <input className={inputCls} value={nuevoApellido} onChange={e => setNuevoApellido(e.target.value)} placeholder="Apellido" />
                        </div>
                        <div>
                            <label className={labelCls}>Correo *</label>
                            <input type="email" className={inputCls} value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} autoComplete="email" inputMode="email" placeholder="correo@ejemplo.com" />
                        </div>
                        <div>
                            <label className={labelCls}>Contraseña *</label>
                            <input type="password" className={inputCls} value={nuevoPassword} onChange={e => setNuevoPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} autoComplete="new-password" />
                        </div>
                        <div>
                            <label className={labelCls}>Teléfono</label>
                            <input className={inputCls} value={nuevoTelefono} onChange={e => setNuevoTelefono(e.target.value)} placeholder="Teléfono" />
                        </div>
                        <div>
                            <label className={labelCls}>Estado</label>
                            <Select className="w-full" value={nuevoActivo ? '1' : '0'} onChange={e => setNuevoActivo(e.target.value === '1')}>
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </Select>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal Editar mesero */}
            {showEditar && (
                <Modal
                    title="Editar empleado"
                    onClose={() => setShowEditar(false)}
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => setShowEditar(false)}>Cancelar</button>
                            <button className={btnPrimary} onClick={confirmarEditar}>Guardar cambios</button>
                        </>
                    }
                >
                    <p className="m-0 mb-4 text-sm text-slate-500">Actualiza los datos del empleado.</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={labelCls}>Seleccione empleado</label>
                            <Select className="w-full" value={editId ?? ''} onChange={e => onChangeEditarSeleccion(e.target.value)}>
                                {[...meseros].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre))).map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                                ))}
                            </Select>
                        </div>
                        {meseroEdit && (() => {
                            const pill = pillFor(meseroEdit);
                            const ui = pillUI(pill.color);
                            return (
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 sm:col-span-2">
                                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ring-2 ${ui.avatar}`}>{avatarOf(meseroEdit)}</span>
                                    <span className="flex-1 truncate text-sm font-bold text-slate-900">{meseroEdit.nombre} {meseroEdit.apellido}</span>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ui.pill}`}>{pill.label}</span>
                                </div>
                            );
                        })()}
                        <div>
                            <label className={labelCls}>Nombre</label>
                            <input className={inputCls} value={editNombre} onChange={e => setEditNombre(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Apellido</label>
                            <input className={inputCls} value={editApellido} onChange={e => setEditApellido(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Correo</label>
                            <input type="email" className={inputCls} value={editCorreo} onChange={e => setEditCorreo(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Nueva contraseña</label>
                            <input type="password" className={inputCls} value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Dejar vacío para no cambiar" />
                        </div>
                        <div>
                            <label className={labelCls}>Confirmar correo</label>
                            <input type="email" className={inputCls} value={editCorreoConfirm} onChange={e => setEditCorreoConfirm(e.target.value)} placeholder="Repite el correo para confirmar" />
                        </div>
                        <div>
                            <label className={labelCls}>Teléfono</label>
                            <input className={inputCls} value={editTelefono} onChange={e => setEditTelefono(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Estado</label>
                            <Select className="w-full" value={editActivo ? '1' : '0'} onChange={e => setEditActivo(e.target.value === '1')}>
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </Select>
                        </div>
                        <div>
                            <label className={labelCls}>Rol del usuario</label>
                            <Select className="w-full" value={editRol} onChange={e => setEditRol(e.target.value)}>
                                <option value="mesero">Mesero (mesas y pedidos)</option>
                                <option value="cocinero">Cocinero (solo ve Cocina)</option>
                                <option value="cajero">Cajero (solo ve Caja)</option>
                                <option value="admin">Admin (acceso total)</option>
                            </Select>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal Eliminar mesero */}
            {showEliminar && (
                <Modal
                    title="Eliminar empleado"
                    onClose={() => setShowEliminar(false)}
                    danger
                    maxW="max-w-lg"
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => setShowEliminar(false)}>Cancelar</button>
                            <button className={btnDanger} onClick={confirmarEliminar}><HiOutlineTrash className="h-4 w-4" /> Eliminar</button>
                        </>
                    }
                >
                    <div className="mb-4">
                        <label className={labelCls}>Seleccione mesero</label>
                        <Select className="w-full" value={deleteId ?? ''} onChange={e => setDeleteId(Number(e.target.value))}>
                            {[...meseros].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre))).map(m => (
                                <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                            ))}
                        </Select>
                    </div>
                    {meseroDelete && (() => {
                        const pill = pillFor(meseroDelete);
                        const ui = pillUI(pill.color);
                        return (
                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ring-2 ${ui.avatar}`}>{avatarOf(meseroDelete)}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="m-0 truncate text-sm font-bold text-slate-900">{meseroDelete.nombre} {meseroDelete.apellido}</p>
                                    <p className="m-0 truncate text-xs text-slate-400">{meseroDelete.correo || meseroDelete.email || 'sin correo'}</p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ui.pill}`}>{pill.label}</span>
                            </div>
                        );
                    })()}
                    <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 ring-1 ring-red-100">
                        <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <p className="m-0 text-sm text-red-600"><strong>Cuidado:</strong> No puedes deshacer esta eliminación.</p>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Meseros;
