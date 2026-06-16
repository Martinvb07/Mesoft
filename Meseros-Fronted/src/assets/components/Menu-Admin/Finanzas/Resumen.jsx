import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineCurrencyDollar, HiOutlineBanknotes, HiOutlineChartBar, HiOutlineReceiptPercent,
    HiOutlineArrowDownTray, HiArrowTrendingUp, HiArrowTrendingDown, HiOutlineCube,
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

function Chip({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-500',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function TrendPill({ pct }) {
    const up = Number(pct) >= 0;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {up ? <HiArrowTrendingUp className="h-3.5 w-3.5" /> : <HiArrowTrendingDown className="h-3.5 w-3.5" />}
            {up ? '+' : ''}{Number(pct).toFixed(1)}%
        </span>
    );
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

const Th = ({ children, right }) => (
    <th className={`px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 ${right ? 'text-right' : 'text-left'}`}>{children}</th>
);
const Td = ({ children, right, className = '' }) => (
    <td className={`px-3 py-2.5 text-sm text-slate-700 ${right ? 'text-right' : ''} ${className}`}>{children}</td>
);

// SVG-based sparkline line chart component
function SalesSparkline({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineChartBar className="h-5 w-5" /></span>
                <p className="m-0 text-sm text-slate-400">Sin datos de evolución.</p>
            </div>
        );
    }

    const W = 600;
    const H = 160;
    const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const values = data.map(d => Number(d.ventas || 0));
    const maxV = Math.max(...values, 1);
    const minV = Math.min(...values, 0);
    const rangeV = maxV - minV || 1;

    const xScale = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const yScale = (v) => PAD.top + innerH - ((v - minV) / rangeV) * innerH;

    const points = data.map((d, i) => [xScale(i), yScale(Number(d.ventas || 0))]);
    const polyline = points.map(([x, y]) => `${x},${y}`).join(' ');

    const areaPath = [
        `M ${points[0][0]},${PAD.top + innerH}`,
        ...points.map(([x, y]) => `L ${x},${y}`),
        `L ${points[points.length - 1][0]},${PAD.top + innerH}`,
        'Z',
    ].join(' ');

    const yTicks = [minV, minV + rangeV / 2, maxV];
    const xLabelIdxs = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i);

    const fmtMoney = (n) => {
        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
        return `$${n}`;
    };
    const fmtDate = (str) => {
        try {
            const [, m, d] = String(str).split('-');
            return `${d}/${m}`;
        } catch { return str; }
    };

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} aria-label="Evolución de ventas">
            <defs>
                <linearGradient id="resumenArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
            </defs>

            {yTicks.map((v, i) => {
                const y = yScale(v);
                return (
                    <g key={i}>
                        <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{fmtMoney(v)}</text>
                    </g>
                );
            })}

            <path d={areaPath} fill="url(#resumenArea)" />

            <polyline points={polyline} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

            {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#f97316" strokeWidth="2" />
            ))}

            {xLabelIdxs.map(i => (
                <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">{fmtDate(data[i]?.fecha)}</text>
            ))}
        </svg>
    );
}

const Resumen = () => {
    const [ventasHoy, setVentasHoy] = useState(0);
    const [ticketProm, setTicketProm] = useState(0);
    const [ventasHoyPedidos, setVentasHoyPedidos] = useState(0);
    const [variacion, setVariacion] = useState(0);
    const [meta, setMeta] = useState({ meta: 0, ventas: 0, progresoPct: 0 });
    const [top, setTop] = useState([]);
    const [evolucion, setEvolucion] = useState([]);
    const [evolucionCargando, setEvolucionCargando] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [v, t, vr, m, tp] = await Promise.all([
                    api.ventasHoy().catch(()=>({ ventas:0 })),
                    api.ticketPromedioHoy().catch(()=>({ ventas:0, pedidos:0, ticket_promedio:0 })),
                    api.variacionVentasDia().catch(()=>({ variacionPct:0 })),
                    api.metaHoy().catch(()=>({ meta:0, ventas:0, progresoPct:0 })),
                    api.topProductos({ limit: 5 }).catch(()=>[]),
                ]);
                if (!alive) return;
                setVentasHoy(Number(v?.ventas||0));
                setTicketProm(Number(t?.ticket_promedio||0));
                setVentasHoyPedidos(Number(t?.pedidos||0));
                setVariacion(Number(vr?.variacionPct||0));
                setMeta({ meta: Number(m?.meta||0), ventas: Number(m?.ventas||0), progresoPct: Number(m?.progresoPct||0) });
                setTop(Array.isArray(tp)?tp:[]);
            } catch {}
        })();

        // Cargar evolución ventas últimos 30 días
        (async () => {
            if (!alive) return;
            setEvolucionCargando(true);
            try {
                const today = new Date();
                const hasta = today.toISOString().slice(0, 10);
                const desde30 = new Date(today);
                desde30.setDate(desde30.getDate() - 29);
                const desde = desde30.toISOString().slice(0, 10);
                const data = await api.evolucionVentas({ desde, hasta });
                if (alive) setEvolucion(Array.isArray(data) ? data : []);
            } catch {
                if (alive) setEvolucion([]);
            } finally {
                if (alive) setEvolucionCargando(false);
            }
        })();

        return () => { alive = false; };
    }, []);

    const pct = (n) => `${Number(n||0).toFixed(0)}%`;

    const exportarResumenCSV = () => {
        const today = new Date().toISOString().slice(0,10);
        const header = ['Métrica','Valor'];
        const rows = [
            ['Ventas hoy', ventasHoy],
            ['Variación vs ayer (%)', Number(variacion).toFixed(1)],
            ['Ticket promedio', ticketProm],
            ['Pedidos hoy', ventasHoyPedidos],
            ['Meta diaria', meta.meta],
            ['Progreso meta (%)', Number(meta.progresoPct).toFixed(0)],
        ];
        const csvTop = top.map(p => [`Producto: ${p.nombre}`, `${p.unidades} uds / ${fmtCOP(p.ingresos)}`]);
        const csv = [header, ...rows, ...csvTop].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `resumen_${today}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const metaPct = Math.min(100, Math.max(0, meta.progresoPct));

    return (
        <div className="ms-resumen mx-auto max-w-7xl">
            <style>{`:where(.ms-resumen) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Finanzas</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Resumen</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Visión general de ingresos, ventas y resultados</p>
                </div>
                <button className={btnGhost} onClick={exportarResumenCSV}>
                    <HiOutlineArrowDownTray className="h-4 w-4" /> Exportar resumen
                </button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                <MetricCard icon={HiOutlineCurrencyDollar} value={fmtCOP(ventasHoy)} label="Ventas del día" chip={<TrendPill pct={variacion} />} />
                <MetricCard
                    icon={HiOutlineChartBar}
                    value={<span className={variacion >= 0 ? 'text-emerald-600' : 'text-red-600'}>{variacion >= 0 ? '▲' : '▼'} {pct(Math.abs(variacion))}</span>}
                    label="Variación vs ayer"
                />
                <MetricCard icon={HiOutlineBanknotes} value={fmtCOP(ticketProm)} label="Ticket promedio" chip={<Chip>{ventasHoyPedidos} pedidos</Chip>} />
                <MetricCard icon={HiOutlineReceiptPercent} value={pct(meta.progresoPct)} label="Meta del día" chip={<Chip tone="orange">{pct(meta.progresoPct)}</Chip>} />
            </motion.div>

            {/* Bento: gráfica + meta */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3"
            >
                {/* Evolución de ventas */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-2`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">Evolución de ventas</h3>
                        <Chip>Últimos 30 días</Chip>
                    </div>
                    {evolucionCargando ? (
                        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
                    ) : (
                        <SalesSparkline data={evolucion} />
                    )}
                </motion.div>

                {/* Meta del día */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-1`}>
                    <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Meta del día</h3>
                    <div className="flex items-end justify-between">
                        <p className="m-0 text-3xl font-extrabold text-slate-900">{pct(meta.progresoPct)}</p>
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
                        <div className="flex items-center justify-between"><span className="text-slate-500">Ventas hoy</span><strong className="font-extrabold text-slate-900">{fmtCOP(meta.ventas)}</strong></div>
                        <div className="flex items-center justify-between"><span className="text-slate-500">Meta</span><strong className="font-extrabold text-slate-900">{fmtCOP(meta.meta)}</strong></div>
                        <div className="flex items-center justify-between"><span className="text-slate-500">Restante</span><strong className="font-extrabold text-orange-600">{fmtCOP(Math.max(0, meta.meta - meta.ventas))}</strong></div>
                    </div>
                </motion.div>

                {/* Top productos */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-3`}>
                    <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Top productos</h3>
                    {top.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineCube className="h-5 w-5" /></span>
                            <p className="m-0 text-sm text-slate-400">Sin datos aún.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <Th>Producto</Th>
                                        <Th right>Unidades</Th>
                                        <Th right>Ingresos</Th>
                                        <Th right>Tendencia</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top.map((p, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                            <Td className="font-medium text-slate-900">{p.nombre}</Td>
                                            <Td right>{Number(p.unidades || 0)}</Td>
                                            <Td right className="font-semibold">{fmtCOP(p.ingresos)}</Td>
                                            <Td right><TrendPill pct={Number(p.tendenciaPct || 0)} /></Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Resumen;
