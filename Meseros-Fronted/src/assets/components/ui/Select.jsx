import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown, HiCheck } from 'react-icons/hi2';

/**
 * Select — dropdown profesional reutilizable (reemplazo directo de <select>).
 *
 * Drop-in: acepta los mismos <option> / <optgroup> como hijos y llama
 * onChange({ target: { value } }) igual que un <select> nativo, así el cambio
 * en cada vista es mínimo. A diferencia del nativo, la lista desplegable se
 * renderiza en un portal con posición fija (no se recorta dentro de modales) y
 * sigue la estética de la app (naranja + slate, animación, check de selección).
 *
 * Props:
 * - value, onChange, disabled, name, id, placeholder, className, aria-label
 * - variant: 'solid' (por defecto, con fondo+anillo) | 'bare' (sin fondo, para
 *   colocar dentro de contenedores que ya tienen borde, p.ej. ".filter")
 */

const FRAG = React.Fragment;

function textOf(node) {
    if (node == null || node === false) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join('');
    if (React.isValidElement(node)) return textOf(node.props.children);
    return '';
}

function collectOptions(children) {
    const out = [];
    const walk = (nodes) => {
        React.Children.forEach(nodes, (child) => {
            if (!child || typeof child !== 'object') return;
            if (child.type === FRAG) { walk(child.props.children); return; }
            if (child.type === 'optgroup') { walk(child.props.children); return; }
            if (child.type === 'option') {
                const label = textOf(child.props.children) || String(child.props.label ?? '');
                const value = child.props.value !== undefined ? child.props.value : label;
                out.push({ value, label, disabled: !!child.props.disabled });
            }
        });
    };
    walk(children);
    return out;
}

export default function Select({
    value,
    onChange,
    children,
    className = '',
    placeholder = 'Seleccionar…',
    disabled = false,
    name,
    id,
    variant = 'solid',
    'aria-label': ariaLabel,
}) {
    const options = collectOptions(children);
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState(null);
    const [activeIdx, setActiveIdx] = useState(-1);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    const selected = options.find((o) => String(o.value) === String(value));

    const place = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const spaceBelow = vh - r.bottom;
        const estH = Math.min(288, options.length * 40 + 12);
        const up = spaceBelow < estH && r.top > spaceBelow;
        setCoords({
            left: r.left,
            width: r.width,
            top: up ? undefined : r.bottom + 6,
            bottom: up ? vh - r.top + 6 : undefined,
            maxH: Math.max(140, (up ? r.top : spaceBelow) - 16),
            up,
        });
    }, [options.length]);

    useEffect(() => {
        if (!open) return;
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
    }, [open, place]);

    useEffect(() => {
        if (open) setActiveIdx(options.findIndex((o) => String(o.value) === String(value)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const choose = (opt) => {
        if (!opt || opt.disabled) return;
        onChange?.({ target: { value: opt.value, name }, currentTarget: { value: opt.value, name } });
        setOpen(false);
        triggerRef.current?.focus();
    };

    const onTriggerKey = (e) => {
        if (disabled) return;
        if (!open) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen(true); }
            return;
        }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(options.length - 1, i + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[activeIdx]); }
    };

    const triggerCls = variant === 'bare'
        ? `inline-flex items-center justify-between gap-1.5 appearance-none border-0 bg-transparent p-0 text-sm font-medium text-slate-700 outline-none cursor-pointer disabled:opacity-60 ${className}`
        : `inline-flex items-center justify-between gap-2 appearance-none border-0 cursor-pointer rounded-xl bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 outline-none transition ${open ? 'bg-white ring-2 ring-orange-400' : 'hover:bg-slate-100'} focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-60 ${className}`;

    return (
        <>
            <button
                type="button"
                ref={triggerRef}
                id={id}
                name={name}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => !disabled && setOpen((o) => !o)}
                onKeyDown={onTriggerKey}
                className={triggerCls}
            >
                <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>{selected ? selected.label : placeholder}</span>
                <HiChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-orange-500' : 'text-slate-400'}`} />
            </button>

            {createPortal(
                <AnimatePresence>
                    {open && coords && (
                        <motion.div
                            ref={panelRef}
                            role="listbox"
                            initial={{ opacity: 0, y: coords.up ? 6 : -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: coords.up ? 6 : -6, scale: 0.98 }}
                            transition={{ duration: 0.14, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                left: coords.left,
                                width: coords.width,
                                top: coords.top,
                                bottom: coords.bottom,
                                zIndex: 9999,
                            }}
                        >
                            <style>{`:where(.ms-select-list) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>
                            <div
                                className="ms-select-list overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-300/40 ring-1 ring-black/5"
                                style={{ maxHeight: coords.maxH }}
                            >
                                {options.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-slate-400">Sin opciones</div>
                                )}
                                {options.map((o, i) => {
                                    const isSel = String(o.value) === String(value);
                                    const isActive = i === activeIdx;
                                    return (
                                        <button
                                            key={`${o.value}-${i}`}
                                            type="button"
                                            role="option"
                                            aria-selected={isSel}
                                            disabled={o.disabled}
                                            onMouseEnter={() => setActiveIdx(i)}
                                            onClick={() => choose(o)}
                                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                o.disabled
                                                    ? 'cursor-not-allowed text-slate-300'
                                                    : isSel
                                                        ? 'bg-orange-50 font-semibold text-orange-600'
                                                        : isActive
                                                            ? 'bg-slate-100 text-slate-900'
                                                            : 'text-slate-600'
                                            }`}
                                        >
                                            <span className="truncate">{o.label}</span>
                                            {isSel && <HiCheck className="h-4 w-4 shrink-0 text-orange-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
