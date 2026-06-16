import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineUsers,
    HiOutlineStar,
    HiOutlineArrowTrendingUp,
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlinePhone,
    HiOutlineEnvelope,
    HiXMark,
} from 'react-icons/hi2';
import { logAudit } from '../../../../utils/audit';

const CLIENTES_KEY = 'mesoft_clientes_v1';

export function loadClientes() {
    try { return JSON.parse(localStorage.getItem(CLIENTES_KEY) || '[]'); } catch { return []; }
}

export function saveClientes(list) {
    try { localStorage.setItem(CLIENTES_KEY, JSON.stringify(list)); } catch {}
}

/**
 * Upsert a cliente by telefono (or nombre if no phone).
 * Returns the updated client.
 */
export function upsertCliente({ nombre, telefono = '', email = '' }) {
    try {
        const list = loadClientes();
        const existing = list.find(c =>
            (telefono.trim() && c.telefono === telefono.trim()) ||
            (!telefono.trim() && c.nombre.toLowerCase() === nombre.trim().toLowerCase())
        );
        const now = new Date().toISOString();
        if (existing) {
            const updated = list.map(c =>
                c.id === existing.id
                    ? { ...c, nombre: nombre || c.nombre, telefono: telefono || c.telefono, email: email || c.email, visitas: (c.visitas || 1) + 1, ultima_visita: now }
                    : c
            );
            saveClientes(updated);
            return updated.find(c => c.id === existing.id);
        } else {
            const nuevo = {
                id: Date.now(),
                nombre: nombre.trim(),
                telefono: telefono.trim(),
                email: email.trim(),
                visitas: 1,
                ultima_visita: now,
                created_at: now,
            };
            saveClientes([...list, nuevo]);
            return nuevo;
        }
    } catch { return null; }
}

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function Chip({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-500',
        orange: 'bg-orange-50 text-orange-600',
        emerald: 'bg-emerald-50 text-emerald-600',
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

function Modal({ title, onClose, children, footer, maxW = 'max-w-lg' }) {
    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`ms-clientes flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
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

const Th = ({ children, center }) => (
    <th className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 ${center ? 'text-center' : 'text-left'}`}>{children}</th>
);

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ nombre: '', telefono: '', email: '' });
    const [formMsg, setFormMsg] = useState('');

    const recargar = () => setClientes(loadClientes());

    useEffect(() => { recargar(); }, []);

    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = [...clientes].sort((a, b) => (b.visitas || 0) - (a.visitas || 0));
        if (!q) return list;
        return list.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            (c.telefono || '').includes(q) ||
            (c.email || '').toLowerCase().includes(q)
        );
    }, [clientes, search]);

    const abrirCrear = () => {
        setForm({ nombre: '', telefono: '', email: '' });
        setFormMode('create');
        setEditId(null);
        setFormMsg('');
        setFormOpen(true);
    };

    const abrirEditar = (c) => {
        setForm({ nombre: c.nombre, telefono: c.telefono || '', email: c.email || '' });
        setFormMode('edit');
        setEditId(c.id);
        setFormMsg('');
        setFormOpen(true);
    };

    const cerrar = () => setFormOpen(false);

    const guardar = () => {
        if (!form.nombre.trim()) { setFormMsg('El nombre es obligatorio.'); return; }
        const list = loadClientes();
        const now = new Date().toISOString();
        if (formMode === 'create') {
            const nuevo = {
                id: Date.now(),
                nombre: form.nombre.trim(),
                telefono: form.telefono.trim(),
                email: form.email.trim(),
                visitas: 1,
                ultima_visita: now,
                created_at: now,
            };
            saveClientes([...list, nuevo]);
            logAudit(null, 'crear_cliente', nuevo.nombre);
        } else {
            const updated = list.map(c => c.id === editId
                ? { ...c, nombre: form.nombre.trim(), telefono: form.telefono.trim(), email: form.email.trim() }
                : c
            );
            saveClientes(updated);
            logAudit(null, 'editar_cliente', form.nombre.trim());
        }
        recargar();
        cerrar();
    };

    const eliminar = (c) => {
        if (!window.confirm(`Eliminar cliente "${c.nombre}"?`)) return;
        const updated = loadClientes().filter(x => x.id !== c.id);
        saveClientes(updated);
        logAudit(null, 'eliminar_cliente', c.nombre);
        recargar();
    };

    const fmtFecha = (iso) => {
        if (!iso) return '—';
        try {
            return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' }).format(new Date(iso));
        } catch { return iso; }
    };

    // Métricas
    const frecuentes = clientes.filter(c => (c.visitas || 1) >= 5).length;
    const visitasTotales = clientes.reduce((s, c) => s + (c.visitas || 1), 0);

    return (
        <div className="ms-clientes mx-auto max-w-7xl">
            <style>{`:where(.ms-clientes) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Fidelización</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Historial de Clientes</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Se agregan automáticamente al registrar reservas</p>
                </div>
                <button className={btnPrimary} onClick={abrirCrear}>
                    <HiOutlinePlus className="h-4 w-4" /> Nuevo cliente
                </button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineUsers} value={clientes.length} label="Clientes registrados" chip={<Chip>Base</Chip>} />
                <MetricCard icon={HiOutlineStar} value={frecuentes} label="Clientes frecuentes" chip={<Chip tone="emerald">VIP · 5+</Chip>} />
                <MetricCard icon={HiOutlineArrowTrendingUp} value={visitasTotales} label="Visitas totales" chip={<Chip tone="orange">Acum.</Chip>} />
            </motion.div>

            {/* Toolbar: búsqueda */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase}`}
            >
                <div className="relative sm:max-w-md">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, teléfono o email…"
                        className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            </motion.div>

            {/* Tabla de clientes */}
            {filtrados.length === 0 ? (
                <div className={`mt-5 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineUsers className="h-6 w-6" /></span>
                        <p className="m-0 max-w-sm text-sm text-slate-400">{clientes.length === 0 ? 'No hay clientes registrados aún. Se agregan automáticamente al hacer reservas.' : 'Sin resultados para la búsqueda.'}</p>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
                    className={`mt-5 ${cardBase} overflow-hidden p-0`}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <Th>Cliente</Th>
                                    <Th>Teléfono</Th>
                                    <Th>Email</Th>
                                    <Th center>Visitas</Th>
                                    <Th>Última visita</Th>
                                    <Th center>Acciones</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((c) => {
                                    const vip = (c.visitas || 1) >= 5;
                                    return (
                                        <tr key={c.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-2 ${vip ? 'bg-orange-50 text-orange-600 ring-orange-100' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                                                        {(c.nombre || '?').charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                                                        {c.nombre}
                                                        {vip && <HiOutlineStar className="h-4 w-4 text-orange-400" title="Cliente frecuente" />}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{c.telefono || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{c.email || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-extrabold ${vip ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {c.visitas || 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-400">{fmtFecha(c.ultima_visita)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => abrirEditar(c)} title="Editar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900">
                                                        <HiOutlinePencilSquare className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => eliminar(c)} title="Eliminar" className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50">
                                                        <HiOutlineTrash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Modal crear/editar */}
            {formOpen && (
                <Modal
                    title={formMode === 'create' ? 'Nuevo cliente' : 'Editar cliente'}
                    onClose={cerrar}
                    footer={
                        <>
                            <button className={btnGhost} onClick={cerrar}>Cancelar</button>
                            <button className={btnPrimary} onClick={guardar}>{formMode === 'create' ? 'Crear cliente' : 'Guardar cambios'}</button>
                        </>
                    }
                >
                    {formMsg && (
                        <div className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 ring-1 ring-red-100">{formMsg}</div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Nombre *</label>
                            <input className={inputCls} value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del cliente" />
                        </div>
                        <div>
                            <label className={labelCls}>Teléfono</label>
                            <div className="relative">
                                <HiOutlinePhone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input type="tel" className={`${inputCls} pl-9`} value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+57 300 000 0000" />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Email (opcional)</label>
                            <div className="relative">
                                <HiOutlineEnvelope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input type="email" className={`${inputCls} pl-9`} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="correo@ejemplo.com" />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Clientes;
