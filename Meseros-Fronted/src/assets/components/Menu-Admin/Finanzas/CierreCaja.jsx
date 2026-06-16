import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineCurrencyDollar, HiOutlineScale, HiOutlineReceiptPercent, HiOutlineChartBar,
    HiOutlineBanknotes, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown,
    HiOutlineClipboardDocumentList, HiOutlinePrinter,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function MetricCard({ icon: Icon, value, label, valueClass = 'text-slate-900' }) {
    return (
        <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
            <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                    <Icon className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                </span>
            </div>
            <p className={`mt-4 text-2xl font-extrabold ${valueClass}`}>{value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{label}</p>
        </motion.div>
    );
}

const CierreCaja = () => {
    const [ventas, setVentas] = useState(0);
    const [balance, setBalance] = useState({ balance: 0, ingresos: 0, egresos: 0 });
    const [ticket, setTicket] = useState({ ticket_promedio: 0, ventas: 0, pedidos: 0 });
    const [meta, setMeta] = useState({ meta: 0, ventas: 0, progresoPct: 0 });
    const [cargando, setCargando] = useState(false);
    const printRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            setCargando(true);
            try {
                const [v, b, t, m] = await Promise.all([
                    api.ventasHoy(),
                    api.balanceHoy(),
                    api.ticketPromedioHoy(),
                    api.metaHoy(),
                ]);
                setVentas(Number(v?.ventas || 0));
                setBalance({
                    balance: Number(b?.balance || 0),
                    ingresos: Number(b?.ingresos || 0),
                    egresos: Number(b?.egresos || 0),
                });
                setTicket({
                    ticket_promedio: Number(t?.ticket_promedio || 0),
                    ventas: Number(t?.ventas || 0),
                    pedidos: Number(t?.pedidos || 0),
                });
                setMeta({
                    meta: Number(m?.meta || 0),
                    ventas: Number(m?.ventas || 0),
                    progresoPct: Number(m?.progresoPct || 0),
                });
            } finally { setCargando(false); }
        };
        load();
    }, []);

    const resumen = useMemo(() => ([
        { label: 'Ingresos (ventas)', value: fmtCOP(balance.ingresos) },
        { label: 'Egresos', value: fmtCOP(balance.egresos) },
        { label: 'Balance del día', value: fmtCOP(balance.balance) },
        { label: 'Pedidos cerrados', value: String(ticket.pedidos) },
        { label: 'Ticket promedio', value: fmtCOP(ticket.ticket_promedio) },
        { label: 'Meta diaria', value: fmtCOP(meta.meta) },
        { label: 'Progreso meta', value: `${meta.progresoPct.toFixed(0)}%` },
    ]), [balance, ticket, meta]);

    const handlePrint = () => {
        const w = window.open('', '_blank', 'width=800,height=900');
        if (!w) return;
        w.document.write(`<!doctype html><html><head><title>Cierre de caja</title>
            <style>
                body{font-family:ui-sans-serif,system-ui;padding:24px;color:#111;background:#fff}
                h2{margin:0 0 12px;font-size:20px}
                table{width:100%;border-collapse:collapse}
                th,td{border-top:1px solid #e5e7eb;padding:8px;font-size:13px}
                thead th{background:#f3f4f6;text-align:left;color:#374151}
                .muted{color:#6b7280;font-size:12px;margin-top:12px}
            </style>
        </head><body>`);
        w.document.write(`<h2>Cierre de caja - ${new Date().toLocaleDateString('es-CO')}</h2>`);
        w.document.write('<table><thead><tr><th>Concepto</th><th>Valor</th></tr></thead><tbody>');
        resumen.forEach(r => {
            w.document.write(`<tr><td>${r.label}</td><td style="text-align:right"><strong>${r.value}</strong></td></tr>`);
        });
        w.document.write('</tbody></table>');
        w.document.write(`<div class='muted'>Generado el ${new Date().toLocaleString('es-CO')}</div>`);
        w.document.write('</body></html>');
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    const fechaHoy = useMemo(() => {
        const s = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    }, []);

    const balancePos = balance.balance >= 0;
    const metaPct = Math.min(100, Math.max(0, meta.progresoPct));

    return (
        <div className="ms-cierre mx-auto max-w-7xl">
            <style>{`:where(.ms-cierre) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Finanzas</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Cierre de caja</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Consolidación del día · {fechaHoy}</p>
                </div>
                <button className={btnGhost} onClick={handlePrint} disabled={cargando}>
                    <HiOutlinePrinter className="h-4 w-4" /> Imprimir cierre
                </button>
            </motion.div>

            {cargando ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`${cardBase} animate-pulse`}>
                            <div className="h-11 w-11 rounded-xl bg-slate-200" />
                            <div className="mt-4 h-7 w-24 rounded bg-slate-200" />
                            <div className="mt-2 h-4 w-20 rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
            ) : (
                <div ref={printRef}>
                    {/* Métricas */}
                    <motion.div
                        variants={gridStagger}
                        initial="hidden"
                        animate="visible"
                        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        <MetricCard icon={HiOutlineCurrencyDollar} value={fmtCOP(ventas)} label="Ventas hoy" />
                        <MetricCard icon={HiOutlineScale} value={fmtCOP(balance.balance)} label="Balance" valueClass={balancePos ? 'text-emerald-600' : 'text-red-600'} />
                        <MetricCard icon={HiOutlineBanknotes} value={fmtCOP(ticket.ticket_promedio)} label="Ticket promedio" />
                        <MetricCard icon={HiOutlineChartBar} value={`${meta.progresoPct.toFixed(0)}%`} label="Progreso meta" />
                    </motion.div>

                    {/* Consolidación */}
                    <motion.div
                        variants={gridStagger}
                        initial="hidden"
                        animate="visible"
                        className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3"
                    >
                        {/* Tabla resumen */}
                        <motion.div variants={itemUp} className={`${cardBase} lg:col-span-2`}>
                            <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Resumen del día</h3>
                            <div className="overflow-hidden rounded-xl ring-1 ring-slate-100">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {[
                                            { label: 'Ingresos (ventas)', value: fmtCOP(balance.ingresos), icon: HiOutlineArrowTrendingUp, tone: 'text-emerald-600' },
                                            { label: 'Egresos', value: fmtCOP(balance.egresos), icon: HiOutlineArrowTrendingDown, tone: 'text-red-600' },
                                            { label: 'Balance del día', value: fmtCOP(balance.balance), strong: true, tone: balancePos ? 'text-emerald-600' : 'text-red-600' },
                                            { label: 'Pedidos cerrados', value: String(ticket.pedidos) },
                                            { label: 'Ticket promedio', value: fmtCOP(ticket.ticket_promedio) },
                                            { label: 'Meta diaria', value: fmtCOP(meta.meta) },
                                        ].map((r) => (
                                            <tr key={r.label} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    <span className="inline-flex items-center gap-2">
                                                        {r.icon && <r.icon className={`h-4 w-4 ${r.tone || 'text-slate-400'}`} />}
                                                        {r.label}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right text-sm ${r.strong ? 'font-extrabold' : 'font-semibold'} ${r.tone || 'text-slate-900'}`}>{r.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                        {/* Meta del día */}
                        <motion.div variants={itemUp} className={`${cardBase} lg:col-span-1`}>
                            <div className="mb-4 flex items-center gap-2">
                                <HiOutlineReceiptPercent className="h-5 w-5 text-orange-500" />
                                <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">Meta del día</h3>
                            </div>
                            <div className="flex items-end justify-between">
                                <p className="m-0 text-3xl font-extrabold text-slate-900">{meta.progresoPct.toFixed(0)}%</p>
                                <p className="m-0 text-sm text-slate-400">{fmtCOP(meta.ventas)} / {fmtCOP(meta.meta)}</p>
                            </div>
                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <motion.span
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metaPct}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className="block h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
                                />
                            </div>
                            <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                                <div className="flex items-center justify-between"><span className="text-slate-500">Vendido</span><strong className="font-extrabold text-slate-900">{fmtCOP(meta.ventas)}</strong></div>
                                <div className="flex items-center justify-between"><span className="text-slate-500">Meta</span><strong className="font-extrabold text-slate-900">{fmtCOP(meta.meta)}</strong></div>
                                <div className="flex items-center justify-between"><span className="text-slate-500">Restante</span><strong className="font-extrabold text-orange-600">{fmtCOP(Math.max(0, meta.meta - meta.ventas))}</strong></div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default CierreCaja;
