import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
    HiOutlineArrowsUpDown, HiChevronLeft, HiChevronRight,
    HiOutlineCube, HiOutlineTag, HiOutlineHashtag, HiOutlineCurrencyDollar,
    HiOutlineMagnifyingGlass, HiOutlineBanknotes, HiOutlineArrowDownTray,
} from 'react-icons/hi2';
import DateRangePicker from '../../ui/DateRangePicker';

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40';
const dateCls = 'rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';

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

const Ingresos = () => {
    const [desde, setDesde] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
    });
    const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));
    const [q, setQ] = useState('');
    const [rows, setRows] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [sorting, setSorting] = useState([{ id: 'unidades', desc: true }]);

    useEffect(() => {
        const load = async () => {
            setCargando(true);
            try {
                const data = await api.ventasPorProducto({ desde, hasta });
                setRows(Array.isArray(data) ? data : []);
            } catch { setRows([]); }
            finally { setCargando(false); }
        };
        load();
    }, [desde, hasta]);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return rows;
        return rows.filter(r => [r.nombre, r.unidades, r.ingresos].join(' ').toLowerCase().includes(t));
    }, [rows, q]);

    const totalIngresos = useMemo(() => filtered.reduce((s, r) => s + Number(r.ingresos || 0), 0), [filtered]);
    const totalUnidades = useMemo(() => filtered.reduce((s, r) => s + Number(r.unidades || 0), 0), [filtered]);

    const exportCSV = () => {
        const header = ['producto', 'unidades', 'precio_unitario', 'ingresos', 'tendenciaPct'];
        const rowsCsv = filtered.map(r => [
            r.nombre,
            Number(r.unidades || 0),
            r.unidades ? (Number(r.ingresos || 0) / Number(r.unidades || 1)) : 0,
            Number(r.ingresos || 0),
            Number(r.tendenciaPct || 0)
        ]);
        const csv = [header, ...rowsCsv].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `ingresos_productos_${desde}_${hasta}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const HeadCell = ({ icon: Icon, children, right }) => (
        <div className={`flex items-center gap-1.5 ${right ? 'justify-end' : ''}`}>
            {Icon && <Icon className="h-3.5 w-3.5" />} {children}
        </div>
    );

    const columns = useMemo(() => [
        { accessorKey: 'nombre', header: () => <HeadCell icon={HiOutlineCube}>Producto</HeadCell>, cell: info => <span className="font-medium text-slate-900">{info.getValue()}</span> },
        { accessorKey: 'categoria', header: () => <HeadCell icon={HiOutlineTag}>Categoría</HeadCell>, cell: info => <span className="text-slate-500">{info.getValue() || '—'}</span> },
        { accessorKey: 'unidades', header: () => <HeadCell icon={HiOutlineHashtag} right>Cant.</HeadCell>, cell: info => <div className="text-right">{Number(info.getValue() || 0).toLocaleString('es-CO')}</div> },
        { accessorKey: 'precio_unit', header: () => <HeadCell icon={HiOutlineCurrencyDollar} right>Precio</HeadCell>, cell: info => <div className="text-right">{fmtCOP(info.getValue())}</div> },
        { accessorKey: 'ingresos', header: () => <HeadCell icon={HiOutlineCurrencyDollar} right>Total</HeadCell>, cell: info => <div className="text-right font-semibold text-slate-900">{fmtCOP(info.getValue())}</div> },
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
        <div className="ms-ingresos mx-auto max-w-7xl">
            <style>{`:where(.ms-ingresos) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Finanzas</span>
                <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Ingresos</h1>
                <p className="m-0 mt-1 text-sm text-slate-500">Ventas por producto en el rango seleccionado</p>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineBanknotes} value={fmtCOP(totalIngresos)} label="Total ingresos" />
                <MetricCard icon={HiOutlineHashtag} value={totalUnidades.toLocaleString('es-CO')} label="Unidades vendidas" />
                <MetricCard icon={HiOutlineCube} value={filtered.length} label="Productos distintos" />
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`}
            >
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Rango de fechas</label>
                    <DateRangePicker value={{ start: desde, end: hasta }} onChange={(s, e) => { setDesde(s); setHasta(e); }} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Buscar producto…"
                            className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400 sm:w-56"
                        />
                    </div>
                    <button className={btnPrimary} onClick={exportCSV}>
                        <HiOutlineArrowDownTray className="h-4 w-4" /> Exportar CSV
                    </button>
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
                    <div className="space-y-3 p-5">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />)}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                                {table.getHeaderGroups().map(hg => (
                                    <tr key={hg.id} className="border-b border-slate-100">
                                        {hg.headers.map(h => (
                                            <th
                                                key={h.id}
                                                onClick={h.column.getToggleSortingHandler?.()}
                                                className={`select-none px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 ${h.column.getCanSort?.() ? 'cursor-pointer hover:text-slate-600' : ''}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {flexRender(h.column.columnDef.header, h.getContext())}
                                                    {h.column.getCanSort?.() && (
                                                        <HiOutlineArrowsUpDown className={`h-3 w-3 ${h.column.getIsSorted() ? 'text-orange-500' : 'opacity-40'}`} />
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
                                    <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">Sin ventas en el rango.</td></tr>
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
        </div>
    );
};

export default Ingresos;
