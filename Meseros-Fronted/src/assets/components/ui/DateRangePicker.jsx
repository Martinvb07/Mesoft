import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendarDays, HiChevronLeft, HiChevronRight, HiArrowLongRight, HiXMark } from 'react-icons/hi2';

/**
 * DateRangePicker — selector de rango de fechas.
 *
 * Dos presentaciones según el ancho real disponible:
 *  · Escritorio (≥ 640px): popover flotante con dos meses lado a lado.
 *  · Móvil: hoja inferior (bottom sheet) a pantalla completa con un mes,
 *    celdas grandes y botones de acción fijos — nunca se recorta ni depende
 *    del scroll del popover.
 *
 * El rango se confirma con "Aplicar" (o al elegir un atajo), así se puede
 * corregir el extremo antes de disparar la consulta. Cerrar sin aplicar
 * descarta los cambios.
 *
 * Props:
 * - value: { start, end }   (strings yyyy-mm-dd)
 * - onChange: (start, end) => void
 * - className, disabled, aria-label
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_ABR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/* Miércoles con "X" para no repetir la M (convención en calendarios en español) */
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS_FULL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

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
function displayLong(value) {
    const p = parse(value);
    return p ? `${p.d} ${MESES_ABR[p.m]} ${p.y}` : '';
}
const fromKey = (key) => { const p = parse(key); return p ? new Date(p.y, p.m, p.d) : new Date(); };
const fromDate = (dt) => toKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
const todayISO = () => fromDate(new Date());
const shiftISO = (key, n) => { const dt = fromKey(key); dt.setDate(dt.getDate() + n); return fromDate(dt); };
const addDaysISO = (n) => shiftISO(todayISO(), n);
const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000) + 1;
const ariaDay = (key) => {
    const p = parse(key);
    if (!p) return '';
    return `${WEEKDAYS_FULL[(new Date(p.y, p.m, p.d).getDay() + 6) % 7]} ${p.d} de ${MESES[p.m]} de ${p.y}`;
};

/* ── Rejilla de un mes ─────────────────────────────────────────────────── */
function MonthGrid({ y, m, start, end, hover, focusDay, fluid, onPick, onHover }) {
    const today = todayISO();
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7;              // lunes = 0
    /* Siempre 6 semanas: la altura del panel no salta al cambiar de mes. */
    const cells = Array.from({ length: 42 }, (_, i) => {
        const dt = new Date(y, m, 1 - lead + i);
        return { key: fromDate(dt), d: dt.getDate(), out: dt.getMonth() !== m };
    });

    // Extremos efectivos (con vista previa mientras se arrastra el mouse)
    let a = start, b = end;
    if (start && !end && hover) {
        a = start <= hover ? start : hover;
        b = start <= hover ? hover : start;
    }

    const cellH = fluid ? 'h-10' : 'h-9';
    const dayW = fluid ? 'h-10 w-10' : 'h-9 w-9';

    return (
        <div className={fluid ? 'w-full' : 'w-[252px] shrink-0'} aria-label={`${MESES[m]} ${y}`}>
            <div className="mb-1 grid grid-cols-7">
                {WEEKDAYS.map((w, i) => (
                    <abbr key={i} title={WEEKDAYS_FULL[i]} className="py-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 no-underline">{w}</abbr>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {cells.map(({ key, d, out }, i) => {
                    const isStart = a && key === a;
                    const isEnd = b && key === b;
                    const isEdge = isStart || isEnd;
                    const single = a && b && a === b;
                    const inRange = a && b && key > a && key < b;
                    const painted = inRange || (isEdge && !single && a && b);
                    const col = i % 7;

                    return (
                        <div
                            key={key}
                            className={[
                                'relative flex items-center justify-center', cellH,
                                painted ? 'bg-orange-50' : '',
                                painted && (isStart || col === 0) ? 'rounded-l-full' : '',
                                painted && (isEnd || col === 6) ? 'rounded-r-full' : '',
                            ].join(' ')}
                        >
                            <button
                                type="button"
                                data-day={key}
                                tabIndex={key === focusDay ? 0 : -1}
                                aria-label={ariaDay(key)}
                                aria-pressed={isEdge || inRange || undefined}
                                onClick={() => onPick(key)}
                                onMouseEnter={() => onHover(key)}
                                className={[
                                    'relative flex items-center justify-center rounded-full text-sm font-semibold outline-none transition-colors', dayW,
                                    'focus-visible:ring-2 focus-visible:ring-orange-400',
                                    isEdge
                                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40'
                                        : inRange
                                            ? 'text-orange-700 hover:bg-orange-100'
                                            : out
                                                ? 'text-slate-400 hover:bg-slate-100'
                                                : 'text-slate-700 hover:bg-slate-100',
                                ].join(' ')}
                            >
                                {d}
                                {key === today && (
                                    <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isEdge ? 'bg-white' : 'bg-orange-500'}`} />
                                )}
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
    const [sheet, setSheet] = useState(false);            // presentación móvil
    const [view, setView] = useState(() => { const p = parse(start) || parse(todayISO()); return { y: p.y, m: p.m }; });
    const [pickStart, setPickStart] = useState(start);
    const [pickEnd, setPickEnd] = useState(end);
    const [step, setStep] = useState('start');            // qué extremo se edita
    const [hover, setHover] = useState(null);
    const [focusDay, setFocusDay] = useState(start || todayISO());
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    /* Se recalcula en cada render (es barato) para que "Hoy" no se quede
       congelado si la pestaña sigue abierta al cambiar de día. */
    const PRESETS = (() => {
        const t = new Date();
        const som = (y, m) => toKey(y, m, 1);
        const eom = (y, m) => toKey(y, m, new Date(y, m + 1, 0).getDate());
        const pm = t.getMonth() === 0 ? { y: t.getFullYear() - 1, m: 11 } : { y: t.getFullYear(), m: t.getMonth() - 1 };
        return [
            { label: 'Hoy', range: [todayISO(), todayISO()] },
            { label: 'Ayer', range: [addDaysISO(-1), addDaysISO(-1)] },
            { label: '7 días', range: [addDaysISO(-6), todayISO()] },
            { label: '30 días', range: [addDaysISO(-29), todayISO()] },
            { label: 'Este mes', range: [som(t.getFullYear(), t.getMonth()), todayISO()] },
            { label: 'Mes pasado', range: [som(pm.y, pm.m), eom(pm.y, pm.m)] },
        ];
    })();

    /* ── Posicionamiento ─────────────────────────────────────────────── */
    const place = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (vw < 640) { setSheet(true); setCoords({ dual: false }); return; }
        setSheet(false);
        const r = el.getBoundingClientRect();
        /* 572 = 2 meses (252 c/u) + separación + padding, sin posibilidad de
           que se apilen; a partir de 640px de viewport siempre caben. */
        const dual = true;
        const width = Math.min(vw - 24, 572);
        const estH = 430;
        const spaceBelow = vh - r.bottom;
        const up = spaceBelow < estH && r.top > spaceBelow;
        setCoords({
            left: Math.max(12, Math.min(r.left, vw - width - 12)),
            width,
            top: up ? undefined : r.bottom + 8,
            bottom: up ? vh - r.top + 8 : undefined,
            maxH: Math.max(280, (up ? r.top : vh - r.bottom) - 20),
            dual,
            up,
        });
    }, []);

    /* ── Ciclo de vida del panel ─────────────────────────────────────── */
    useEffect(() => {
        if (!open) return;
        setPickStart(start); setPickEnd(end); setHover(null); setStep(start && !end ? 'end' : 'start');
        const p = parse(start) || parse(todayISO());
        setView({ y: p.y, m: p.m });
        setFocusDay(start || todayISO());
        place();
        const reflow = () => place();
        window.addEventListener('resize', reflow);
        window.addEventListener('scroll', reflow, true);
        const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        document.addEventListener('keydown', onKey);
        const onDown = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (panelRef.current?.contains(e.target)) return;
            close();
        };
        document.addEventListener('mousedown', onDown);
        return () => {
            window.removeEventListener('resize', reflow);
            window.removeEventListener('scroll', reflow, true);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, place]);

    /* Bloquea el scroll del fondo mientras la hoja móvil está abierta */
    useEffect(() => {
        if (!open || !sheet) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prevOverflow; };
    }, [open, sheet]);

    /* Mueve el foco real al día enfocado (navegación con teclado) */
    useEffect(() => {
        if (!open) return;
        const el = panelRef.current?.querySelector(`[data-day="${focusDay}"]`);
        el?.focus({ preventScroll: true });
    }, [open, focusDay, view, coords?.dual]);

    const close = () => { setOpen(false); triggerRef.current?.focus(); };

    const openAt = (which) => {
        if (disabled) return;
        setStep(which);
        setOpen(true);
    };

    const ensureVisible = (key) => {
        const p = parse(key);
        if (!p) return;
        const last = coords?.dual
            ? (view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 })
            : view;
        const before = p.y < view.y || (p.y === view.y && p.m < view.m);
        const after = p.y > last.y || (p.y === last.y && p.m > last.m);
        if (before) setView({ y: p.y, m: p.m });
        else if (after) setView(coords?.dual ? (p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 }) : { y: p.y, m: p.m });
    };

    const onGridKeyDown = (e) => {
        const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        let nextDay = null;
        if (map[e.key] !== undefined) nextDay = shiftISO(focusDay, map[e.key]);
        else if (e.key === 'Home') nextDay = shiftISO(focusDay, -((fromKey(focusDay).getDay() + 6) % 7));
        else if (e.key === 'End') nextDay = shiftISO(focusDay, 6 - ((fromKey(focusDay).getDay() + 6) % 7));
        else if (e.key === 'PageUp' || e.key === 'PageDown') {
            const p = parse(focusDay);
            const delta = e.key === 'PageUp' ? -1 : 1;
            const dt = new Date(p.y, p.m + delta, Math.min(p.d, new Date(p.y, p.m + delta + 1, 0).getDate()));
            nextDay = fromDate(dt);
        } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(focusDay); return; }
        else return;
        e.preventDefault();
        setFocusDay(nextDay);
        setHover(nextDay);
        ensureVisible(nextDay);
    };

    const pick = (key) => {
        setFocusDay(key);
        if (step === 'start' || !pickStart) {
            setPickStart(key);
            if (pickEnd && key > pickEnd) setPickEnd('');
            setStep('end');
            setHover(null);
        } else if (key < pickStart) {
            setPickStart(key);
            setStep('end');
        } else {
            setPickEnd(key);
            setStep('start');
        }
    };

    const apply = () => {
        if (!pickStart) return;
        onChange?.(pickStart, pickEnd || pickStart);
        close();
    };
    const applyPreset = ([s, e]) => { setPickStart(s); setPickEnd(e); onChange?.(s, e); close(); };
    const clear = () => { setPickStart(''); setPickEnd(''); setStep('start'); onChange?.('', ''); close(); };

    const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 });
    const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 });
    const nextView = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 };

    const activePreset = PRESETS.find(p => p.range[0] === pickStart && p.range[1] === pickEnd)?.label;
    const total = pickStart && pickEnd ? diffDays(pickStart, pickEnd) : 0;

    /* ── Disparador ──────────────────────────────────────────────────── */
    const segCls = (active) => [
        'group flex min-w-0 flex-1 flex-col items-start gap-0.5 appearance-none border-0 bg-transparent px-3.5 py-1.5 text-left',
        'cursor-pointer outline-none transition-colors sm:flex-none disabled:cursor-not-allowed disabled:opacity-60',
        active && open ? 'bg-slate-100' : 'hover:bg-slate-100',
    ].join(' ');

    const navBtn = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400';
    const chipCls = (active) => [
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400',
        active ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-600',
    ].join(' ');

    const header = (
        <div className="mb-2 flex items-center gap-1">
            <button type="button" onClick={prev} className={navBtn} aria-label="Mes anterior"><HiChevronLeft className="h-4 w-4" /></button>
            <div className="flex flex-1 items-center justify-around gap-2 px-1">
                <span className="truncate text-center text-sm font-extrabold capitalize text-slate-900">{MESES[view.m]} {view.y}</span>
                {coords?.dual && <span className="truncate text-center text-sm font-extrabold capitalize text-slate-900">{MESES[nextView.m]} {nextView.y}</span>}
            </div>
            <button type="button" onClick={next} className={navBtn} aria-label="Mes siguiente"><HiChevronRight className="h-4 w-4" /></button>
        </div>
    );

    const presets = (
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
            {PRESETS.map(p => (
                <button key={p.label} type="button" onClick={() => applyPreset(p.range)} className={chipCls(activePreset === p.label)}>
                    {p.label}
                </button>
            ))}
        </div>
    );

    const summary = (
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className={pickStart ? 'text-slate-800' : ''}>{displayLong(pickStart) || 'Inicio'}</span>
            <HiArrowLongRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className={pickEnd ? 'text-slate-800' : ''}>{displayLong(pickEnd) || 'Fin'}</span>
            {total > 0 && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{total} {total === 1 ? 'día' : 'días'}</span>}
        </span>
    );

    const footer = (
        <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            {summary}
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={clear} className="flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 sm:flex-none sm:py-2">
                    Limpiar
                </button>
                <button
                    type="button"
                    onClick={apply}
                    disabled={!pickStart}
                    className="flex-1 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/30 outline-none transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:flex-none sm:py-2"
                >
                    Aplicar
                </button>
            </div>
        </div>
    );

    const calendar = (
        <div onKeyDown={onGridKeyDown} onMouseLeave={() => setHover(null)}>
            {header}
            <div className={coords?.dual ? 'flex justify-center gap-5' : ''}>
                <MonthGrid y={view.y} m={view.m} start={pickStart} end={pickEnd} hover={hover} focusDay={focusDay} fluid={sheet} onPick={pick} onHover={setHover} />
                {coords?.dual && (
                    <MonthGrid y={nextView.y} m={nextView.m} start={pickStart} end={pickEnd} hover={hover} focusDay={focusDay} fluid={false} onPick={pick} onHover={setHover} />
                )}
            </div>
        </div>
    );

    /* Reset de los estilos globales de <button> (index.css no usa preflight) */
    const resetCss = `:where(.ms-rangepicker) button{-webkit-appearance:none;appearance:none;border:0;padding:0;background-color:transparent;cursor:pointer;font:inherit;line-height:inherit;color:inherit;}`;

    return (
        <>
            <div
                ref={triggerRef}
                aria-label={ariaLabel}
                className={`flex w-full items-stretch overflow-hidden rounded-xl bg-slate-50 ring-1 transition sm:inline-flex sm:w-auto ${open ? 'ring-2 ring-orange-400' : 'ring-slate-200 hover:ring-slate-300'} ${className}`}
            >
                <button type="button" disabled={disabled} onClick={() => openAt('start')} className={segCls(step === 'start')}>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Desde</span>
                    <span className={`truncate text-sm font-semibold ${start ? 'text-slate-800' : 'text-slate-400'}`}>{display(start) || 'dd/mm/aaaa'}</span>
                </button>
                <span className="flex items-center text-slate-400" aria-hidden="true"><HiArrowLongRight className="h-4 w-4" /></span>
                <button type="button" disabled={disabled} onClick={() => openAt('end')} className={segCls(step === 'end')}>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Hasta</span>
                    <span className={`truncate text-sm font-semibold ${end ? 'text-slate-800' : 'text-slate-400'}`}>{display(end) || 'dd/mm/aaaa'}</span>
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => openAt(start ? 'end' : 'start')}
                    className="flex shrink-0 items-center px-3 text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-orange-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"
                    aria-label="Abrir calendario"
                >
                    <HiOutlineCalendarDays className={`h-4 w-4 ${open ? 'text-orange-500' : ''}`} />
                </button>
            </div>

            {createPortal(
                <AnimatePresence>
                    {open && coords && (
                        sheet ? (
                            /* ── Móvil: hoja inferior ───────────────────────────── */
                            <motion.div
                                key="sheet"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px]"
                                onClick={(e) => { if (e.target === e.currentTarget) close(); }}
                            >
                                <style>{resetCss}</style>
                                <motion.div
                                    ref={panelRef}
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label="Seleccionar rango de fechas"
                                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                                    className="ms-rangepicker flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
                                >
                                    <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" />
                                    <div className="mb-3 flex shrink-0 items-center justify-between">
                                        <h3 className="text-sm font-extrabold text-slate-900">Rango de fechas</h3>
                                        <button type="button" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900" aria-label="Cerrar">
                                            <HiXMark className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                                        {presets}
                                        {calendar}
                                    </div>
                                    {footer}
                                </motion.div>
                            </motion.div>
                        ) : (
                            /* ── Escritorio: popover ────────────────────────────── */
                            <motion.div
                                key="popover"
                                ref={panelRef}
                                role="dialog"
                                aria-label="Seleccionar rango de fechas"
                                initial={{ opacity: 0, y: coords.up ? 6 : -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: coords.up ? 6 : -6, scale: 0.98 }}
                                transition={{ duration: 0.14, ease: 'easeOut' }}
                                style={{ position: 'fixed', left: coords.left, width: coords.width, top: coords.top, bottom: coords.bottom, zIndex: 9999 }}
                            >
                                <style>{resetCss}</style>
                                <div
                                    className="ms-rangepicker overflow-y-auto overscroll-contain rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-300/40 ring-1 ring-black/5"
                                    style={{ maxHeight: coords.maxH }}
                                >
                                    {presets}
                                    {calendar}
                                    {footer}
                                </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
