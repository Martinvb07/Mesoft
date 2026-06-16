import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendarDays, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

/**
 * DatePicker — selector de fecha profesional (reemplazo de <input type="date">).
 *
 * Muestra la fecha en formato dd/mm/aaaa (o mm/aaaa en mode="month") pero
 * internamente trabaja con el valor ISO (yyyy-mm-dd / yyyy-mm), y llama
 * onChange({ target: { value } }) igual que un input nativo, así el cambio en
 * cada vista es mínimo. El calendario se renderiza en un portal con posición
 * fija (no se recorta dentro de modales) y sigue la estética de la app.
 *
 * Props: value, onChange, mode ('date' | 'month'), placeholder, className,
 *        disabled, name, id, aria-label
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_ABR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const pad = (n) => String(n).padStart(2, '0');

function parseISO(value, mode) {
    if (!value) return null;
    const parts = String(value).split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = mode === 'month' ? 1 : Number(parts[2]);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
    return { y, m, d };
}

function toISO(y, m, d, mode) {
    return mode === 'month' ? `${y}-${pad(m + 1)}` : `${y}-${pad(m + 1)}-${pad(d)}`;
}

function display(value, mode) {
    const p = parseISO(value, mode);
    if (!p) return '';
    return mode === 'month' ? `${pad(p.m + 1)}/${p.y}` : `${pad(p.d)}/${pad(p.m + 1)}/${p.y}`;
}

export default function DatePicker({
    value,
    onChange,
    mode = 'date',
    placeholder,
    className = '',
    disabled = false,
    name,
    id,
    'aria-label': ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    const today = new Date();
    const sel = parseISO(value, mode);
    const [view, setView] = useState(() => ({ y: sel?.y ?? today.getFullYear(), m: sel?.m ?? today.getMonth() }));

    const ph = placeholder || (mode === 'month' ? 'mm/aaaa' : 'dd/mm/aaaa');
    const shown = display(value, mode);

    const place = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const estH = 320;
        const width = Math.max(r.width, 288);
        const spaceBelow = vh - r.bottom;
        const up = spaceBelow < estH && r.top > spaceBelow;
        setCoords({
            left: Math.min(r.left, window.innerWidth - width - 8),
            width,
            top: up ? undefined : r.bottom + 6,
            bottom: up ? vh - r.top + 6 : undefined,
            up,
        });
    }, []);

    useEffect(() => {
        if (!open) return;
        // Reposicionar la vista al valor seleccionado al abrir
        const p = parseISO(value, mode);
        setView({ y: p?.y ?? today.getFullYear(), m: p?.m ?? today.getMonth() });
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

    const emit = (iso) => {
        onChange?.({ target: { value: iso, name }, currentTarget: { value: iso, name } });
        setOpen(false);
        triggerRef.current?.focus();
    };

    const prev = () => setView(v => mode === 'month' ? { ...v, y: v.y - 1 } : (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }));
    const next = () => setView(v => mode === 'month' ? { ...v, y: v.y + 1 } : (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }));

    const triggerCls = `inline-flex items-center justify-between gap-2 appearance-none border-0 cursor-pointer rounded-xl bg-slate-50 px-3.5 py-2 text-sm font-medium ring-1 ring-slate-200 outline-none transition ${open ? 'bg-white ring-2 ring-orange-400' : 'hover:bg-slate-100'} focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-60 ${className}`;

    // Construcción del grid de días
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Lunes = 0
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isToday = (d) => today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;
    const isSel = (d) => sel && sel.y === view.y && sel.m === view.m && sel.d === d;

    return (
        <>
            <button
                type="button"
                ref={triggerRef}
                id={id}
                name={name}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => !disabled && setOpen(o => !o)}
                className={triggerCls}
            >
                <span className={shown ? 'text-slate-700' : 'text-slate-400'}>{shown || ph}</span>
                <HiOutlineCalendarDays className={`h-4 w-4 shrink-0 ${open ? 'text-orange-500' : 'text-slate-400'}`} />
            </button>

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
                            <style>{`:where(.ms-datepicker) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>
                            <div className="ms-datepicker rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-300/40 ring-1 ring-black/5">
                                {/* Cabecera de navegación */}
                                <div className="mb-2 flex items-center justify-between">
                                    <button type="button" onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                                        <HiChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-sm font-extrabold capitalize text-slate-900">
                                        {mode === 'month' ? view.y : `${MESES[view.m]} ${view.y}`}
                                    </span>
                                    <button type="button" onClick={next} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                                        <HiChevronRight className="h-4 w-4" />
                                    </button>
                                </div>

                                {mode === 'month' ? (
                                    /* Grid de meses */
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {MESES_ABR.map((mes, i) => {
                                            const selected = sel && sel.y === view.y && sel.m === i;
                                            const cur = today.getFullYear() === view.y && today.getMonth() === i;
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => emit(toISO(view.y, i, 1, 'month'))}
                                                    className={`rounded-lg py-2 text-sm font-semibold capitalize transition-colors ${selected ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : cur ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-100'}`}
                                                >
                                                    {mes}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <>
                                        {/* Días de la semana */}
                                        <div className="mb-1 grid grid-cols-7">
                                            {WEEKDAYS.map((w, i) => (
                                                <span key={i} className="py-1 text-center text-[11px] font-bold uppercase text-slate-400">{w}</span>
                                            ))}
                                        </div>
                                        {/* Grid de días */}
                                        <div className="grid grid-cols-7 gap-0.5">
                                            {cells.map((d, i) => d === null ? (
                                                <span key={i} />
                                            ) : (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => emit(toISO(view.y, view.m, d, 'date'))}
                                                    className={`flex h-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                                                        isSel(d)
                                                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                                                            : isToday(d)
                                                                ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200'
                                                                : 'text-slate-700 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Pie: acción rápida */}
                                <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => emit(mode === 'month' ? toISO(today.getFullYear(), today.getMonth(), 1, 'month') : toISO(today.getFullYear(), today.getMonth(), today.getDate(), 'date'))}
                                        className="rounded-lg px-2.5 py-1 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-50"
                                    >
                                        {mode === 'month' ? 'Este mes' : 'Hoy'}
                                    </button>
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
