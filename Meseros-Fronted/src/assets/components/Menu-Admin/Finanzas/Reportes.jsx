import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ReportesToolbar from './ReportesToolbar';
import { api } from '../../../../api/client';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    HiOutlineBanknotes, HiOutlineCurrencyDollar, HiOutlineReceiptPercent,
    HiChevronLeft, HiChevronRight, HiOutlineArrowsUpDown, HiOutlineArrowDownTray,
    HiOutlineGift, HiOutlineCube, HiOutlineEye, HiOutlinePrinter, HiXMark,
} from 'react-icons/hi2';

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

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

const Reportes = () => {
    const [desde, setDesde] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
    });
    const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));
    const [cargando, setCargando] = useState(false);
    const [facturas, setFacturas] = useState([]);
    const [q, setQ] = useState('');
    const [filterKey, setFilterKey] = useState('todo'); // todo|pedido|mesa|mesero|fecha|hora
    const [view, setView] = useState(null); // factura seleccionada
    const [sorting, setSorting] = useState([{ id: 'pedido_id', desc: true }]);

    useEffect(() => {
        const load = async () => {
            setCargando(true);
            try {
                const rows = await api.facturas({ desde, hasta, limit: 200 });
                setFacturas(Array.isArray(rows) ? rows : []);
            } finally { setCargando(false); }
        };
        load();
    }, [desde, hasta]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return facturas;
        const toDateStr = (d) => {
            if (!d) return '';
            const dt = new Date(d);
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const yyyy = dt.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        };
        const toTimeStr = (d) => {
            if (!d) return '';
            const dt = new Date(d);
            const hh = String(dt.getHours()).padStart(2, '0');
            const mi = String(dt.getMinutes()).padStart(2, '0');
            return `${hh}:${mi}`;
        };
        const matchers = {
            pedido: (f) => {
                const visible = String(f.ticket ?? f.pedido_id ?? '').toLowerCase();
                return visible.includes(term) || (`#${visible}`).includes(term);
            },
            mesa: (f) => String(f.mesa_numero ?? f.mesa_id ?? '').toLowerCase().includes(term),
            mesero: (f) => String(f.mesero_nombre || f.mesero_id || '').toLowerCase().includes(term),
            fecha: (f) => toDateStr(f.pagado_en).toLowerCase().includes(term),
            hora: (f) => toTimeStr(f.pagado_en).toLowerCase().includes(term),
            todo: (f) => {
                const parts = [
                    `#${f.ticket ?? f.pedido_id ?? ''}`,
                    String((f.ticket ?? f.pedido_id) || ''),
                    String((f.mesa_numero ?? f.mesa_id) || ''),
                    String(f.mesero_nombre || ''),
                    String(f.mesero_id || ''),
                    toDateStr(f.pagado_en),
                    toTimeStr(f.pagado_en)
                ].join(' ').toLowerCase();
                return parts.includes(term);
            }
        };
        const fn = matchers[filterKey] || matchers.todo;
        return facturas.filter(fn);
    }, [facturas, q, filterKey]);

    const totalVentas = useMemo(() => filtered.reduce((s, f) => s + Number(f.total || 0), 0), [filtered]);
    const totalPropinas = useMemo(() => filtered.reduce((s, f) => s + Number(f.propina || 0), 0), [filtered]);

    const downloadCsv = (csvContent, filename) => {
        const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    };

    const escapeCsv = (val) => {
        const s = String(val == null ? '' : val);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
    };

    const exportCSV = () => {
        const header = ['Ticket', 'Fecha', 'Mesa', 'Mesero', 'Total', 'Propina'];
        const rows = filtered.map(f => [
            f.ticket || f.pedido_id,
            f.pagado_en ? new Date(f.pagado_en).toLocaleString('es-CO') : '',
            f.mesa_numero ?? f.mesa_id,
            f.mesero_nombre || f.mesero_id || '',
            Number(f.total || 0),
            Number(f.propina || 0)
        ]);
        const csv = [header, ...rows].map(r => r.map(escapeCsv).join(',')).join('\n');
        downloadCsv(csv, `ventas_${desde}_${hasta}.csv`);
    };

    const exportPropinasPorMesero = () => {
        const map = {};
        filtered.forEach(f => {
            const key = f.mesero_nombre || f.mesero_id || 'Desconocido';
            if (!map[key]) map[key] = { mesero: key, totalPropinas: 0, totalVentas: 0, facturas: 0 };
            map[key].totalPropinas += Number(f.propina || 0);
            map[key].totalVentas += Number(f.total || 0);
            map[key].facturas += 1;
        });
        const rows = Object.values(map).sort((a, b) => b.totalPropinas - a.totalPropinas);
        const header = ['Mesero', 'Facturas', 'Total ventas', 'Total propinas'];
        const csv = [header, ...rows.map(r => [r.mesero, r.facturas, r.totalVentas, r.totalPropinas])].map(r => r.map(escapeCsv).join(',')).join('\n');
        downloadCsv(csv, `propinas_por_mesero_${desde}_${hasta}.csv`);
    };

    const exportTopProductos = async () => {
        try {
            const tp = await api.topProductos({ desde, hasta, limit: 50 });
            const rows = Array.isArray(tp) ? tp : [];
            const header = ['Producto', 'Unidades', 'Ingresos', 'Tendencia(%)'];
            const csv = [header, ...rows.map(r => [r.nombre, Number(r.unidades || 0), Number(r.ingresos || 0), Number(r.tendenciaPct || 0)])].map(r => r.map(escapeCsv).join(',')).join('\n');
            downloadCsv(csv, `top_productos_${desde}_${hasta}.csv`);
        } catch (e) {
            alert('No se pudo exportar top productos: ' + (e?.message || e));
        }
    };

    // TanStack Table setup
    const columns = useMemo(() => [
        { accessorKey: 'ticket', header: () => '#', cell: info => <span className="font-semibold text-slate-900">#{info.getValue() || info.row.original.pedido_id}</span> },
        { accessorKey: 'pagado_en', header: () => 'Fecha', cell: info => info.getValue() ? new Date(info.getValue()).toLocaleString('es-CO') : '—' },
        { accessorKey: 'mesa_numero', header: () => 'Mesa' },
        { accessorKey: 'mesero_nombre', header: () => 'Mesero', cell: info => info.getValue() || info.row.original.mesero_id || '—' },
        { accessorKey: 'total', header: () => <div className="text-right">Total</div>, cell: info => <div className="text-right font-semibold text-slate-900">{fmtCOP(info.getValue())}</div> },
        { accessorKey: 'propina', header: () => <div className="text-right">Propina</div>, cell: info => <div className="text-right text-emerald-600">{fmtCOP(info.getValue())}</div> },
        {
            id: 'actions', header: () => '', enableSorting: false,
            cell: info => (
                <div className="text-right">
                    <button onClick={() => setView(info.row.original)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-orange-50 hover:text-orange-600 hover:ring-orange-200">
                        <HiOutlineEye className="h-3.5 w-3.5" /> Ver
                    </button>
                </div>
            ),
        },
    ], []);

    const table = useReactTable({
        data: filtered,
        columns,
        state: { sorting, globalFilter: q },
        onSortingChange: setSorting,
        onGlobalFilterChange: setQ,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    return (
        <div className="ms-reportes mx-auto max-w-7xl">
            <style>{`:where(.ms-reportes) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Finanzas</span>
                <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Reportes</h1>
                <p className="m-0 mt-1 text-sm text-slate-500">Facturas, cortes, tendencias y exportaciones</p>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineBanknotes} value={fmtCOP(totalVentas)} label="Ventas" />
                <MetricCard icon={HiOutlineCurrencyDollar} value={fmtCOP(totalPropinas)} label="Propinas" />
                <MetricCard icon={HiOutlineReceiptPercent} value={filtered.length} label="Facturas" />
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase}`}
            >
                <ReportesToolbar
                    q={q}
                    onQChange={setQ}
                    desde={desde}
                    hasta={hasta}
                    onDesde={setDesde}
                    onHasta={setHasta}
                    filterKey={filterKey}
                    onFilterKeyChange={setFilterKey}
                    onExportCSV={exportCSV}
                />
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button className={btnGhost} onClick={exportCSV}><HiOutlineArrowDownTray className="h-4 w-4" /> Ventas CSV</button>
                    <button className={btnGhost} onClick={exportPropinasPorMesero}><HiOutlineGift className="h-4 w-4" /> Propinas por mesero</button>
                    <button className={btnGhost} onClick={exportTopProductos}><HiOutlineCube className="h-4 w-4" /> Top productos</button>
                </div>
            </motion.div>

            {/* Tabla */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
                className={`mt-5 ${cardBase} overflow-hidden p-0`}
            >
                {cargando ? (
                    <div className="space-y-3 p-5">{[...Array(6)].map((_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />)}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id} className="border-b border-slate-100">
                                        {headerGroup.headers.map(header => (
                                            <th
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler?.()}
                                                className={`select-none px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 ${header.column.getCanSort?.() ? 'cursor-pointer hover:text-slate-600' : ''}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {header.column.getCanSort?.() && (
                                                        <HiOutlineArrowsUpDown className={`h-3 w-3 ${header.column.getIsSorted() ? 'text-orange-500' : 'opacity-40'}`} />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-4 py-3 text-sm text-slate-700">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                        ))}
                                    </tr>
                                ))}
                                {!filtered.length && (
                                    <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">Sin facturas en el rango.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                    <button className={btnGhost} onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><HiChevronLeft className="h-4 w-4" /> Anterior</button>
                    <span className="text-sm text-slate-400">Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}</span>
                    <button className={btnGhost} onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente <HiChevronRight className="h-4 w-4" /></button>
                </div>
            </motion.div>

            {/* Modal factura */}
            {view && (
                <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="ms-invoice flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
                    >
                        <style>{`:where(.ms-invoice) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">Factura #{view.ticket || view.pedido_id}</h3>
                            <button onClick={() => setView(null)} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                                <HiXMark className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto px-5 py-4" id="invoice-body">
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Fecha', value: view.pagado_en ? new Date(view.pagado_en).toLocaleString('es-CO') : '—' },
                                    { label: 'Mesero', value: view.mesero_nombre || view.mesero_id || '—' },
                                    { label: 'Mesa', value: view.mesa_numero ?? view.mesa_id ?? '—' },
                                ].map(k => (
                                    <div key={k.label} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                        <p className="m-0 text-xs text-slate-400">{k.label}</p>
                                        <p className="m-0 mt-1 text-sm font-bold text-slate-900">{k.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-100">
                                            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Producto</th>
                                            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-400">Cant.</th>
                                            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-400">Precio</th>
                                            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-400">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(view.items || []).map((it, idx) => (
                                            <tr key={idx} className="border-b border-slate-50 last:border-0">
                                                <td className="px-3 py-2.5 text-sm text-slate-700">{it.nombre}</td>
                                                <td className="px-3 py-2.5 text-right text-sm text-slate-700">{it.cantidad}</td>
                                                <td className="px-3 py-2.5 text-right text-sm text-slate-700">{fmtCOP(it.precio)}</td>
                                                <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900">{fmtCOP(it.subtotal)}</td>
                                            </tr>
                                        ))}
                                        {(!view.items || view.items.length === 0) && (
                                            <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-400">Sin detalle de productos.</td></tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50">
                                            <td colSpan={3} className="px-3 py-2 text-right text-sm font-bold text-slate-700">Total</td>
                                            <td className="px-3 py-2 text-right text-sm font-extrabold text-slate-900">{fmtCOP(view.total)}</td>
                                        </tr>
                                        <tr className="bg-slate-50">
                                            <td colSpan={3} className="px-3 py-2 text-right text-sm font-bold text-slate-700">Propina</td>
                                            <td className="px-3 py-2 text-right text-sm font-extrabold text-emerald-600">{fmtCOP(view.propina)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
                            <button
                                className={btnGhost}
                                onClick={() => {
                                    const el = document.getElementById('invoice-body');
                                    const w = window.open('', 'PRINT', 'width=800,height=900');
                                    if (!w || !el) return;
                                    w.document.write('<html><head><title>Factura</title>');
                                    w.document.write('<style>body{font-family:ui-sans-serif,system-ui;margin:24px;} table{width:100%;border-collapse:collapse;} th,td{font-size:12px;padding:6px;} th{text-align:left;background:#f3f4f6;} td,th{border-top:1px solid #e5e7eb;} h3{margin:0 0 12px 0;}</style>');
                                    w.document.write('</head><body>');
                                    w.document.write(`<h3>Factura #${view.ticket || view.pedido_id}</h3>`);
                                    w.document.write(el.innerHTML);
                                    w.document.write('</body></html>');
                                    w.document.close(); w.focus(); w.print(); w.close();
                                }}
                            >
                                <HiOutlinePrinter className="h-4 w-4" /> Imprimir
                            </button>
                            <button className={btnPrimary} onClick={() => setView(null)}>Cerrar</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Reportes;
