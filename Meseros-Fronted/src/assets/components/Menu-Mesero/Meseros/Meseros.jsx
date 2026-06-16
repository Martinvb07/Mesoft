import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineUserGroup, HiOutlineMagnifyingGlass, HiOutlineClock, HiOutlineUser,
    HiOutlineCheckCircle, HiOutlineArrowPath, HiOutlineEnvelope, HiOutlinePhone,
    HiOutlineClipboard, HiOutlineTableCells,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';

/* ─── helpers de presentación (alineados con Inicio / Mesas admin) ─── */
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';

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

const Meseros = () => {
    const copyToClipboard = (text) => {
        try {
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(String(text || ''));
            } else {
                const ta = document.createElement('textarea');
                ta.value = String(text || '');
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.focus(); ta.select();
                try { document.execCommand('copy'); } catch {}
                document.body.removeChild(ta);
            }
        } catch {}
    };

    const [meseros, setMeseros] = useState([]);

    const mapMeseros = (data) => (Array.isArray(data) ? data : []).map(x => ({
        id: x.id, nombre: x.nombre, apellido: '', rol: 'mesero',
        activo: (x.estado || 'activo') === 'activo', estado: x.estado || 'activo',
        correo: x.correo || '', telefono: '', updatedAt: Date.now(), usuario_id: x.usuario_id ?? null,
    }));

    useEffect(() => {
        const load = async () => {
            try { setMeseros(mapMeseros(await api.getMeseros())); } catch {}
        };
        load();
    }, []);

    const refresh = async () => {
        try { setMeseros(mapMeseros(await api.getMeseros())); } catch {}
    };

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const turnoById = useMemo(() => new Map(), []);

    const compas = useMemo(() => {
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

    const total = compas.length;
    const enTurno = 0;
    const activos = compas.filter(u => (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo')).length;
    const inactivos = total - activos;

    const pillFor = (u) => {
        const t = turnoById.get(Number(u.id));
        if (t?.enTurno) return { label: 'En turno', color: 'occ' };
        const isActivo = (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo');
        if (isActivo) return { label: 'Activo', color: 'res' };
        return { label: 'Inactivo', color: 'clean' };
    };

    const avatarOf = (u) => String(`${u.nombre || ''}`.trim().charAt(0) || '?').toUpperCase();

    const FILTROS = [
        { key: 'todos', label: 'Todos' },
        { key: 'en-turno', label: 'En turno' },
        { key: 'activos', label: 'Activos' },
        { key: 'inactivos', label: 'Inactivos' },
    ];

    return (
        <div className="ms-compas mx-auto max-w-7xl">
            <style>{`:where(.ms-compas) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Equipo</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Compañeros</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Consulta el equipo y su disponibilidad</p>
                </div>
                <button className={btnGhost} onClick={refresh}><HiOutlineArrowPath className="h-4 w-4" /> Recargar</button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                <MetricCard icon={HiOutlineUserGroup} value={total} label="Compañeros" />
                <MetricCard icon={HiOutlineClock} value={enTurno} label="En turno" />
                <MetricCard icon={HiOutlineCheckCircle} value={<>{activos}<span className="text-base font-bold text-slate-400"> / {total}</span></>} label="Activos" />
                <MetricCard icon={HiOutlineUser} value={inactivos} label="Inactivos" />
            </motion.div>

            {/* Toolbar: chips + búsqueda */}
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
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o correo…" className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400" />
                </div>
            </motion.div>

            {/* Grid de compañeros */}
            {compas.length === 0 ? (
                <div className={`mt-5 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineUserGroup className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">No hay compañeros que coincidan con tu búsqueda.</p>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    animate="visible"
                    className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {compas.map(u => {
                        const pill = pillFor(u);
                        const ui = pillUI(pill.color);
                        return (
                            <motion.div
                                key={u.id}
                                variants={itemUp}
                                className="group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200"
                            >
                                <span className={`absolute inset-x-0 top-0 h-1 ${ui.bar}`} />
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold ring-2 ${ui.avatar}`}>{avatarOf(u)}</span>
                                        <div className="min-w-0">
                                            <p className="m-0 truncate text-sm font-extrabold text-slate-900">{u.nombre} {u.apellido}</p>
                                            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${ui.pill}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} /> {pill.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <HiOutlinePhone className="h-4 w-4 shrink-0 text-slate-400" />
                                        <span className="flex-1 truncate">{u.telefono || '—'}</span>
                                        {u.telefono && (
                                            <button onClick={() => copyToClipboard(u.telefono)} title="Copiar teléfono" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 ring-1 ring-slate-200 transition-colors hover:bg-orange-50 hover:text-orange-500"><HiOutlineClipboard className="h-3.5 w-3.5" /></button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <HiOutlineEnvelope className="h-4 w-4 shrink-0 text-slate-400" />
                                        <span className="flex-1 truncate" title={u.correo || u.email || ''}>{u.correo || u.email || '—'}</span>
                                        {(u.correo || u.email) && (
                                            <button onClick={() => copyToClipboard(u.correo || u.email)} title="Copiar correo" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 ring-1 ring-slate-200 transition-colors hover:bg-orange-50 hover:text-orange-500"><HiOutlineClipboard className="h-3.5 w-3.5" /></button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <HiOutlineClock className="h-4 w-4 shrink-0" />
                                        <span>Sin datos de turno</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <HiOutlineTableCells className="h-4 w-4 shrink-0" />
                                        <span>Sin mesa asignada</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

export default Meseros;
