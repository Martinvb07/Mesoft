import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineClipboardDocumentList, HiOutlineArrowPath, HiOutlineTrash, HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';

// Keys: the original AuditLog key AND the new utils/audit.js key
const AUDIT_KEY = 'mesoft_audit_logs_v1';
const AUDIT_KEY_V2 = 'mesoft_audit_v1';
const MAX_LOGS = 200;

// Client-side audit logger (exported for other modules to use)
export function logAuditEvent(action, detail = '') {
    try {
        let user = 'Desconocido';
        const keys = ['currentUser', 'usuario', 'user', 'auth_user'];
        for (const k of keys) {
            const raw = localStorage.getItem(k);
            if (raw) { const u = JSON.parse(raw); user = u?.nombre || u?.usuario || u?.correo || user; break; }
        }
        const logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
        const entry = { id: Date.now(), timestamp: new Date().toISOString(), user, action, detail };
        const updated = [entry, ...logs].slice(0, MAX_LOGS);
        localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
    } catch {}
}

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60';
const btnDanger = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50';

const actionTone = (a = '') => {
    const s = String(a).toLowerCase();
    if (s.includes('elimin') || s.includes('delete') || s.includes('borrar')) return 'bg-red-50 text-red-700 ring-red-200';
    if (s.includes('crear') || s.includes('create') || s.includes('nuevo')) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (s.includes('editar') || s.includes('actualiz') || s.includes('update')) return 'bg-sky-50 text-sky-700 ring-sky-200';
    if (s.includes('login') || s.includes('logout') || s.includes('sesi')) return 'bg-slate-100 text-slate-600 ring-slate-200';
    return 'bg-orange-50 text-orange-700 ring-orange-200';
};

const initialOf = (name) => String(name || '?').trim().charAt(0).toUpperCase() || '?';

function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        let backendLogs = [];
        try {
            const resp = await api.getAuditLogs();
            backendLogs = Array.isArray(resp) ? resp : (Array.isArray(resp?.logs) ? resp.logs : []);
        } catch {
            // expected while endpoint doesn't exist
        }

        const localLogs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
        const localLogsV2 = JSON.parse(localStorage.getItem(AUDIT_KEY_V2) || '[]');

        const all = [...backendLogs, ...localLogs, ...localLogsV2];
        const seen = new Set();
        const merged = all
            .filter(l => { const k = l.id || l.timestamp; if (seen.has(k)) return false; seen.add(k); return true; })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 50);
        setLogs(merged);
        setLoading(false);
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const limpiar = () => {
        if (!window.confirm('¿Limpiar logs locales?')) return;
        localStorage.removeItem(AUDIT_KEY);
        localStorage.removeItem(AUDIT_KEY_V2);
        cargar();
    };

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return logs;
        return logs.filter(l => `${l.user || l.usuario || ''} ${l.action || l.accion || ''} ${l.detail || l.detalle || ''}`.toLowerCase().includes(t));
    }, [logs, q]);

    return (
        <div className="ms-audit mx-auto max-w-5xl">
            <style>{`:where(.ms-audit) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Sistema</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Auditoría</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Últimas 50 acciones del sistema</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className={btnGhost} onClick={cargar} disabled={loading}><HiOutlineArrowPath className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar</button>
                    <button className={btnDanger} onClick={limpiar}><HiOutlineTrash className="h-4 w-4" /> Limpiar locales</button>
                </div>
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-6 ${cardBase}`}
            >
                <div className="relative sm:max-w-md">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Buscar por usuario, acción o detalle…"
                        className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            </motion.div>

            {/* Tabla */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
                className={`mt-5 ${cardBase} overflow-hidden p-0`}
            >
                {loading ? (
                    <div className="space-y-3 p-5">{[...Array(6)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineClipboardDocumentList className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">{q ? 'Sin resultados para la búsqueda.' : 'No hay registros de auditoría aún.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Usuario</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Acción</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((log, idx) => {
                                    const fecha = log.timestamp
                                        ? new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(log.timestamp))
                                        : '—';
                                    const user = log.user || log.usuario || '—';
                                    const action = log.action || log.accion || '—';
                                    const detail = log.detail || log.detalle || '—';
                                    return (
                                        <tr key={log.id || idx} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60">
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">{fecha}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-extrabold text-orange-600 ring-2 ring-orange-100">{initialOf(user)}</span>
                                                    <span className="text-sm font-semibold text-slate-900">{user}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${actionTone(action)}`}>{action}</span>
                                            </td>
                                            <td className="max-w-[320px] px-4 py-3 text-sm text-slate-500">
                                                <span className="block truncate" title={detail}>{detail}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default AuditLog;
