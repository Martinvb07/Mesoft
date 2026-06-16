import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineCalendarDays,
    HiOutlineUserGroup,
    HiOutlineClock,
    HiOutlineChartBar,
    HiOutlinePrinter,
    HiOutlineCheck,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';

const LS_KEY = 'mesoft_horarios_v1';
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const PRESETS = ['08:00-16:00', '14:00-22:00', '18:00-02:00'];

const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function loadHorarios() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch { return {}; }
}

function saveHorarios(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

function Chip({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-500',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
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

// horarios: { [meseroId__dia]: { turno: '8:00-16:00' | 'Libre' } }

const Horarios = () => {
    const [meseros, setMeseros] = useState([]);
    const [horarios, setHorarios] = useState({});
    const [editCell, setEditCell] = useState(null); // { meseroId, dia }
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        api.getMeseros().catch(() => []).then(res => setMeseros(Array.isArray(res) ? res : []));
        setHorarios(loadHorarios());
    }, []);

    const key = (meseroId, dia) => `${meseroId}__${dia}`;

    const getTurno = (meseroId, dia) => horarios[key(meseroId, dia)]?.turno || '';

    const setTurno = (meseroId, dia, turno) => {
        setHorarios(prev => {
            const next = { ...prev, [key(meseroId, dia)]: { turno } };
            saveHorarios(next);
            return next;
        });
    };

    const openEdit = (meseroId, dia) => {
        setEditCell({ meseroId, dia });
        setEditValue(getTurno(meseroId, dia) || '');
    };

    const applyEdit = () => {
        if (!editCell) return;
        setTurno(editCell.meseroId, editCell.dia, editValue);
        setEditCell(null);
    };

    const printHorario = () => {
        const w = window.open('', 'PRINT', 'width=900,height=700');
        if (!w) return;
        let html = `<!doctype html><html><head><title>Horarios</title>
<style>body{font-family:sans-serif;margin:24px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;text-align:center;font-size:12px;} th{background:#f3f4f6;} .working{background:#dcfce7;color:#166534;font-weight:600;} .libre{background:#f3f4f6;color:#9ca3af;}</style>
</head><body><h2>Horario Semanal</h2><table>
<thead><tr><th>Mesero</th>${DIAS.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;
        for (const m of meseros) {
            html += `<tr><td style="text-align:left;font-weight:600">${m.nombre}</td>`;
            for (const dia of DIAS) {
                const turno = getTurno(m.id, dia);
                if (!turno || turno === 'Libre') {
                    html += `<td class="libre">Libre</td>`;
                } else {
                    html += `<td class="working">${turno}</td>`;
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table></body></html>';
        w.document.write(html);
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    const avatarOf = (m) => String(`${m.nombre || ''}`.trim().charAt(0) || '?').toUpperCase();

    // Métricas
    const { asignados, cobertura } = useMemo(() => {
        const totalCeldas = meseros.length * DIAS.length;
        let count = 0;
        for (const m of meseros) {
            for (const dia of DIAS) {
                const t = getTurno(m.id, dia);
                if (t && t !== 'Libre') count += 1;
            }
        }
        return { asignados: count, cobertura: totalCeldas ? Math.round((count / totalCeldas) * 100) : 0 };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meseros, horarios]);

    return (
        <div className="ms-horarios mx-auto max-w-7xl">
            <style>{`:where(.ms-horarios) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Planificación</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Horarios semanales</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Asigna turnos a tu equipo · guardado automático</p>
                </div>
                <button className={btnGhost} onClick={printHorario}>
                    <HiOutlinePrinter className="h-4 w-4" /> Imprimir / exportar
                </button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineUserGroup} value={meseros.length} label="Meseros" chip={<Chip>Equipo</Chip>} />
                <MetricCard icon={HiOutlineClock} value={asignados} label="Turnos asignados" chip={<Chip tone="emerald">Activos</Chip>} />
                <MetricCard icon={HiOutlineChartBar} value={`${cobertura}%`} label="Cobertura semanal" chip={<Chip tone="orange">{cobertura}%</Chip>} />
            </motion.div>

            {/* Tabla de horarios */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} p-0`}
            >
                {meseros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineCalendarDays className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">No hay meseros registrados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto p-2">
                        <table className="w-full min-w-[760px] border-separate border-spacing-1">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-10 rounded-lg bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Mesero</th>
                                    {DIAS.map(dia => (
                                        <th key={dia} className="rounded-lg bg-slate-50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">{dia.slice(0, 3)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {meseros.map(m => (
                                    <tr key={m.id}>
                                        <td className="sticky left-0 z-10 rounded-lg bg-white px-3 py-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-extrabold text-orange-600 ring-2 ring-orange-100">{avatarOf(m)}</span>
                                                <span className="truncate text-sm font-bold text-slate-800">{m.nombre}</span>
                                            </div>
                                        </td>
                                        {DIAS.map(dia => {
                                            const turno = getTurno(m.id, dia);
                                            const isEditing = editCell?.meseroId === m.id && editCell?.dia === dia;
                                            const isLibre = !turno || turno === 'Libre';
                                            return (
                                                <td key={dia} className="p-0 align-top">
                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-1.5 rounded-lg bg-slate-50 p-2 ring-1 ring-orange-200">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={editValue}
                                                                onChange={e => setEditValue(e.target.value)}
                                                                placeholder="8:00-16:00"
                                                                className="w-full rounded-md border-0 bg-white px-2 py-1.5 text-center text-xs font-semibold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-orange-400"
                                                                onKeyDown={e => { if (e.key === 'Enter') applyEdit(); if (e.key === 'Escape') setEditCell(null); }}
                                                            />
                                                            <div className="flex flex-wrap gap-1">
                                                                {PRESETS.map(p => (
                                                                    <button key={p} type="button" onClick={() => setEditValue(p)} className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-orange-50 hover:text-orange-600">{p.slice(0, 5)}</button>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button type="button" onClick={applyEdit} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-gradient-to-b from-orange-500 to-orange-600 px-2 py-1 text-xs font-bold text-white shadow-sm shadow-orange-500/30">
                                                                    <HiOutlineCheck className="h-3 w-3" /> OK
                                                                </button>
                                                                <button type="button" onClick={() => { setTurno(m.id, dia, 'Libre'); setEditCell(null); }} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-100">Libre</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(m.id, dia)}
                                                            title="Clic para editar turno"
                                                            className={`flex min-h-[40px] w-full items-center justify-center rounded-lg px-2 py-2 text-xs font-bold ring-1 transition-colors ${isLibre ? 'bg-slate-50 text-slate-400 ring-slate-100 hover:bg-slate-100 hover:text-slate-500' : 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'}`}
                                                        >
                                                            {isLibre ? 'Libre' : turno}
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                    Clic en cualquier celda para asignar o modificar el turno. Escribe el horario (ej: <strong className="text-slate-500">8:00-16:00</strong>) o márcalo como <strong className="text-slate-500">Libre</strong>.
                </div>
            </motion.div>
        </div>
    );
};

export default Horarios;
