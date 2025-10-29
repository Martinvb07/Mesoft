import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Reportes.css';
import './ReportesToolbar.css';
import { api } from '../../../../api/client';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { HiArrowsUpDown, HiChevronLeft, HiChevronRight, HiCube, HiTag, HiHashtag, HiCurrencyDollar, HiMagnifyingGlass } from 'react-icons/hi2';

const Ingresos = () => {
    const [desde, setDesde] = useState(()=>{
        const d = new Date(); d.setDate(d.getDate()-7);
        return d.toISOString().slice(0,10);
    });
    const [hasta, setHasta] = useState(()=> new Date().toISOString().slice(0,10));
    const [q, setQ] = useState('');
    const [rows, setRows] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [sorting, setSorting] = useState([{ id: 'unidades', desc: true }]);

    useEffect(()=>{
        const load = async ()=>{
            setCargando(true);
            try {
                // Ventas por producto desde backend, sin límite
                const data = await api.ventasPorProducto({ desde, hasta });
                setRows(Array.isArray(data)? data : []);
            } catch { setRows([]); }
            finally { setCargando(false); }
        };
        load();
    }, [desde, hasta]);

    const money = (n)=> `$${Number(n||0).toLocaleString('es-CO')}`;

    const filtered = useMemo(()=>{
        const t = q.trim().toLowerCase();
        if(!t) return rows;
        return rows.filter(r => [r.nombre, r.unidades, r.ingresos]
            .join(' ').toLowerCase().includes(t));
    }, [rows, q]);

    const totalIngresos = useMemo(()=> filtered.reduce((s,r)=> s + Number(r.ingresos||0), 0), [filtered]);
    const totalUnidades = useMemo(()=> filtered.reduce((s,r)=> s + Number(r.unidades||0), 0), [filtered]);

    const exportCSV = ()=>{
        const header = ['producto','unidades','precio_unitario','ingresos','tendenciaPct'];
        const rowsCsv = filtered.map(r => [
            r.nombre,
            Number(r.unidades||0),
            r.unidades ? (Number(r.ingresos||0)/Number(r.unidades||1)) : 0,
            Number(r.ingresos||0),
            Number(r.tendenciaPct||0)
        ]);
        const csv = [header, ...rowsCsv].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `ingresos_productos_${desde}_${hasta}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const columns = useMemo(()=> [
        { accessorKey:'nombre', header: ()=> (<div style={{display:'flex',alignItems:'center',gap:'.35rem'}}><HiCube/> Producto</div>) },
        { accessorKey:'categoria', header: ()=> (<div style={{display:'flex',alignItems:'center',gap:'.35rem'}}><HiTag/> Categoría</div>) },
    { accessorKey:'unidades', header: ()=> <div style={{display:'flex',alignItems:'center',gap:'.35rem',justifyContent:'flex-end'}}><HiHashtag/> Cant.</div>,
          cell: info=> <div className="td-right">{Number(info.getValue()||0).toLocaleString('es-CO')}</div> },
        { accessorKey:'precio_unit', header: ()=> <div style={{display:'flex',alignItems:'center',gap:'.35rem',justifyContent:'flex-end'}}><HiCurrencyDollar/> Precio</div>,
          cell: info=> <div className="td-right">{money(info.getValue())}</div> },
    { accessorKey:'ingresos', header: ()=> <div style={{display:'flex',alignItems:'center',gap:'.35rem',justifyContent:'flex-end'}}><HiCurrencyDollar/> Total</div>,
          cell: info=> <div className="td-right">{money(info.getValue())}</div> },
                // precio_actual opcional
                // { accessorKey:'precio_actual', header: ()=> <div style={{textAlign:'right'}}>Precio actual</div>,
                //   cell: info=> <div className="td-right">{money(info.getValue())}</div> },
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
    <div className="fin-page finz-reportes">
        <div className="fin-header"><h1>Finanzas · Ingresos</h1><p className="muted">Ventas por producto en el rango seleccionado.</p></div>
        <div className="fin-card">
            <div className="rpt-toolbar">
                <h3 className="rpt-title">Ingresos</h3>
                <div className="rpt-items">
                    <div className="rpt-field">
                        <label>Desde</label>
                        <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} />
                    </div>
                    <div className="rpt-field">
                        <label>Hasta</label>
                        <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} />
                    </div>
                    <div className="rpt-search">
                        <HiMagnifyingGlass />
                        <input placeholder="Buscar producto…" value={q} onChange={e=>setQ(e.target.value)} />
                    </div>
                    <button className="rpt-btn primary" onClick={exportCSV}>Exportar CSV</button>
                </div>
            </div>
            <div className="kpis">
                <div className="kpi"><div className="kpi-label">Total Ingresos</div><div className="kpi-value">{money(totalIngresos)}</div></div>
                <div className="kpi"><div className="kpi-label">Unidades</div><div className="kpi-value">{totalUnidades.toLocaleString('es-CO')}</div></div>
            </div>
            {cargando ? (
                <div className="empty">Cargando…</div>
            ) : (
                <div style={{overflowX:'auto'}}>
                    <table className="table">
                        <thead>
                            {table.getHeaderGroups().map(hg => (
                                <tr key={hg.id}>
                                    {hg.headers.map(h => (
                                        <th key={h.id}
                                            onClick={h.column.getToggleSortingHandler?.()}
                                            style={{cursor: h.column.getCanSort?.() ? 'pointer' : 'default'}}>
                                            <div style={{display:'flex', alignItems:'center', gap:'.25rem'}}>
                                                {flexRender(h.column.columnDef.header, h.getContext())}
                                                {h.column.getCanSort?.() && <HiArrowsUpDown style={{opacity:.55}}/>}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                    ))}
                                </tr>
                            ))}
                            {!filtered.length && <tr><td colSpan={columns.length} className="muted">Sin ventas en el rango.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="pagination">
                <button className="btn" onClick={()=>table.previousPage()} disabled={!table.getCanPreviousPage()}><HiChevronLeft/> Anterior</button>
                <span className="muted">Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}</span>
                <button className="btn" onClick={()=>table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente <HiChevronRight/></button>
            </div>
        </div>
        </div>
    );
};

export default Ingresos;
