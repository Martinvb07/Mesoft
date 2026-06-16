import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendarDays, HiChevronLeft, HiChevronRight, HiArrowLongRight } from 'react-icons/hi2';

/**
 * DateRangePicker — selector de rango de fechas tipo Airbnb.
 *
 * Muestra un calendario de 2 meses donde se elige inicio → fin con el rango
 * resaltado. Trabaja con valores ISO (yyyy-mm-dd) y notifica via
 * onChange(start, end). Reemplaza el par de inputs "Desde / Hasta".
 *
 * Props:
 * - value: { start, end }   (strings yyyy-mm-dd)
 * - onChange: (start, end) => void
 * - className, disabled, aria-label
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const pad = (n) => String(n).padStart(2, '0');

const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
function parse(value) {
    if (!value) return null;
    const [y, m, d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return null;
    return { y, m: m - 1, d };
}
function display(value) {
    const p = parse(value);
    return p ? `${pad(p.d)}/${pad(p.m + 1)}/${p.y}` : '';
}
const todayISO = () => { const t = new Date(); return toKey(t.getFullYear(), t.getMonth(), t.getDate()); };
const addDaysISO = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return toKey(t.getFullYear(), t.getMonth(), t.getDate()); };

function MonthGrid({ y, m, start, end, hover, onPick, onHover }) {
    const today = todayISO();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // Límites efectivos (con preview de hover mientras se elige el fin)
    let a = start, b = end;
    if (start && !end && hover) {
        a = start <= hover ? start : hover;
        b = start <= hover ? hover : start;
    }

    return (
        <div className="w-[252px]">
            <div className="mb-1.5 text-center text-sm font-extrabold capitalize text-slate-900">{MESES[m]} {y}</div>
            <div className="mb-1 grid grid-cols-7">
                {WEEKDAYS.map((w, i) => <span key={i} className="py-1 text-center text-[11px] font-bold uppercase text-slate-400">{w}</span>)}
            </div>
            <div className="grid grid-cols-7">
                {cells.map((d, i) => {
                    if (d === null) return <span key={i} className="h-9" />;
                    const key = toKey(y, m, d);
                    const isStart = a && key === a;
                    const isEnd = b && key === b;
                    const isEndpoint = isStart || isEnd;
                    const inRange = a && b && key > a && key < b;
                    const isToday = key === today;
                    return (
                        <div key={i} className={`flex h-9 items-center justify-center ${inRange ? 'bg-orange-50' : ''} ${isStart && b && b !== a ? 'rounded-l-full bg-orange-50' : ''} ${isEnd && a && b !== a ? 'rounded-r-full bg-orange-50' : ''}`}>
                            <button
                                type="button"
                                onClick={() => onPick(key)}
                                onMouseEnter={() => onHover(key)}
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                                    isEndpoint
                                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                                        : inRange
                                            ? 'text-orange-700 hover:bg-orange-100'
                                            : isToday
                                                ? 'text-orange-600 ring-1 ring-orange-200 hover:bg-orange-50'
                                                : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {d}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function DateRangePicker({ value = {}, onChange, className = '', disabled = false, 'aria-label': ariaLabel }) {
    const { start = '', end = '' } = value || {};
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState(null);
    const [view, setView] = useState(() => { const p = parse(start) || parse(todayISO()); return { y: p.y, m: p.m }; });
    const [pickStart, setPickStart] = useState(start);
    const [pickEnd, setPickEnd] = useState(end);
    const [hover, setHover] = useState(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    const place = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const width = Math.min(vw - 16, 552);
        const estH = 360;
        const spaceBelow = vh - r.bottom;
        const up = spaceBelow < estH && r.top > spaceBelow;
        setCoords({
            left: Math.max(8, Math.min(r.left, vw - width - 8)),
            width,
            top: up ? undefined : r.bottom + 6,
            bottom: up ? vh - r.top + 6 : undefined,
            up,
        });
    }, []);

    useEffect(() => {
        if (!open) return;
        setPickStart(start); setPickEnd(end); setHover(null);
        const p = parse(start) || parse(todayISO());
        setView({ y: p.y, m: p.m });
        place();
        const reflow = () => place();
        window.addEventListener('scroll', reflow, true);
        window.addEventListener('resize', reflow);
        const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
        document.addEventListener('keydown', onKey);
        const onDown = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (panelRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => {
            window.removeEventListener('scroll', reflow, true);
            window.removeEventListener('resize', reflow);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, place]);

    const commit = (s, e) => { onChange?.(s, e); setOpen(false); triggerRef.current?.focus(); };

    const pick = (key) => {
        if (!pickStart || (pickStart && pickEnd)) {
            // Iniciar nuevo rango
            setPickStart(key); setPickEnd(''); setHover(null);
        } else {
            // Ya hay inicio, falta fin
            if (key < pickStart) { setPickStart(key); setPickEnd(''); }
            else { setPickEnd(key); commit(pickStart, key); }
        }
    };

    const applyPreset = (s, e) => { setPickStart(s); setPickEnd(e); commit(s, e); };

    const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 });
    const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 });
    const nextView = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 };

    const segCls = 'flex flex-col items-start gap-0.5 appearance-none border-0 bg-transparent px-3.5 py-1.5 text-left cursor-pointer transition-colors hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60';

    const PRESETS = [
        { label: 'Hoy', get: () => [todayISO(), todayISO()] },
        { label: 'Últimos 7 días', get: () => [addDaysISO(-6), todayISO()] },
        { label: 'Últimos 30 días', get: () => [addDaysISO(-29), todayISO()] },
        { label: 'Este mes', get: () => { const t = new Date(); return [toKey(t.getFullYear(), t.getMonth(), 1), todayISO()]; } },
    ];

    return (
        <>
            <div
                ref={triggerRef}
                aria-label={ariaLabel}
                className={`inline-flex items-stretch overflow-hidden rounded-xl bg-slate-50 ring-1 transition ${open ? 'ring-2 ring-orange-400' : 'ring-slate-200'} ${className}`}
            >
                <button type="button" disabled={disabled} onClick={() => setOpen(true)} className={segCls}>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Desde</span>
                    <span className={`text-sm font-semibold ${start ? 'text-slate-800' : 'text-slate-400'}`}>{display(start) || 'dd/mm/aaaa'}</span>
                </button>
                <span className="flex items-center text-slate-300"><HiArrowLongRight className="h-4 w-4" /></span>
                <button type="button" disabled={disabled} onClick={() => setOpen(true)} className={segCls}>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Hasta</span>
                    <span className={`text-sm font-semibold ${end ? 'text-slate-800' : 'text-slate-400'}`}>{display(end) || 'dd/mm/aaaa'}</span>
                </button>
                <button type="button" disabled={disabled} onClick={() => setOpen(true)} className="flex items-center px-3 text-slate-400 transition-colors hover:text-orange-500" aria-label="Abrir calendario">
                    <HiOutlineCalendarDays className={`h-4 w-4 ${open ? 'text-orange-500' : ''}`} />
                </button>
            </div>

            {createPortal(
                <AnimatePresence>
                    {open && coords && (
                        <motion.div
                            ref={panelRef}
                            role="dialog"
                            initial={{ opacity: 0, y: coords.up ? 6 : -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: coords.up ? 6 : -6, scale: 0.98 }}
                            transition={{ duration: 0.14, ease: 'easeOut' }}
                            style={{ position: 'fixed', left: coords.left, width: coords.width, top: coords.top, bottom: coords.bottom, zIndex: 9999 }}
                        >
                            <style>{`:where(.ms-rangepicker) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>
                            <div className="ms-rangepicker rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-300/40 ring-1 ring-black/5">
                                {/* Navegación */}
                                <div className="mb-1 flex items-center justify-between">
                                    <button type="button" onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                                        <HiChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={next} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                                        <HiChevronRight className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Meses */}
                                <div className="flex flex-wrap justify-center gap-5" onMouseLeave={() => setHover(null)}>
                                    <MonthGrid y={view.y} m={view.m} start={pickStart} end={pickEnd} hover={hover} onPick={pick} onHover={setHover} />
                                    <MonthGrid y={nextView.y} m={nextView.m} start={pickStart} end={pickEnd} hover={hover} onPick={pick} onHover={setHover} />
                                </div>

                                {/* Presets */}
                                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
                                    {PRESETS.map(p => (
                                        <button
                                            key={p.label}
                                            type="button"
                                            onClick={() => { const [s, e] = p.get(); applyPreset(s, e); }}
                                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                    <span className="ml-auto px-1 text-xs font-semibold text-slate-400">
                                        {pickStart ? display(pickStart) : '—'} <HiArrowLongRight className="inline h-3.5 w-3.5" /> {pickEnd ? display(pickEnd) : '…'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
