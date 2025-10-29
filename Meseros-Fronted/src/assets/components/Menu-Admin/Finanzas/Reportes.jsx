import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Reportes.css';
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
import { HiBanknotes, HiCurrencyDollar, HiMagnifyingGlass, HiChevronLeft, HiChevronRight, HiArrowsUpDown } from 'react-icons/hi2';

const Reportes = () => {
    const [desde, setDesde] = useState(()=>{
        const d = new Date(); d.setDate(d.getDate()-7);
        return d.toISOString().slice(0,10);
    });
    const [hasta, setHasta] = useState(()=> new Date().toISOString().slice(0,10));
    const [cargando, setCargando] = useState(false);
    const [facturas, setFacturas] = useState([]);
    const [q, setQ] = useState('');
    const [filterKey, setFilterKey] = useState('todo'); // todo|pedido|mesa|mesero|fecha|hora
    const [view, setView] = useState(null); // factura seleccionada
    const [sorting, setSorting] = useState([{ id: 'pedido_id', desc: true }]);

    useEffect(()=>{
        const load = async ()=>{
            setCargando(true);
            try {
                const rows = await api.facturas({ desde, hasta, limit: 200 });
                setFacturas(Array.isArray(rows)? rows : []);
            } finally { setCargando(false); }
        };
        load();
    }, [desde, hasta]);

    const filtered = useMemo(()=>{
        const term = q.trim().toLowerCase();
        if (!term) return facturas;
        const matchers = {
            pedido: (f) => String(f.pedido_id||'').toLowerCase().includes(term) || `#${f.pedido_id}`.includes(term),
            mesa:   (f) => String(f.mesa_id||'').toLowerCase().includes(term),
            mesero: (f) => String(f.mesero_nombre||f.mesero_id||'').toLowerCase().includes(term),
            fecha:  (f) => (f.pagado_en ? new Date(f.pagado_en).toLocaleDateString('es-CO') : '').toLowerCase().includes(term),
            hora:   (f) => (f.pagado_en ? new Date(f.pagado_en).toLocaleTimeString('es-CO') : '').toLowerCase().includes(term),
            todo:   (f) => {
                const parts = [
                    `#${f.pedido_id}`,
                    String(f.pedido_id||'') ,
                    String(f.mesa_id||'') ,
                    String(f.mesero_nombre||'') ,
                    String(f.mesero_id||'') ,
                    (f.pagado_en ? new Date(f.pagado_en).toLocaleString('es-CO') : '')
                ].join(' ').toLowerCase();
                return parts.includes(term);
            }
        };
        const fn = matchers[filterKey] || matchers.todo;
        return facturas.filter(fn);
    }, [facturas, q, filterKey]);

    const totalVentas = useMemo(()=> filtered.reduce((s,f)=> s + Number(f.total||0), 0), [filtered]);
    const totalPropinas = useMemo(()=> filtered.reduce((s,f)=> s + Number(f.propina||0), 0), [filtered]);

    const exportCSV = () => {
        const header = ['ticket','fecha','mesa','mesero','total','propina'];
        const rows = filtered.map(f => [
            f.ticket || f.pedido_id,
            f.pagado_en ? new Date(f.pagado_en).toISOString() : '',
            f.mesa_numero ?? f.mesa_id,
            f.mesero_nombre || f.mesero_id || '',
            Number(f.total||0),
            Number(f.propina||0)
        ]);
        const csv = [header, ...rows].map(r => r.map(val => {
            const s = String(val==null?'':val);
            return s.includes(',') || s.includes('"') || s.includes('\n') ? '"'+s.replace(/"/g,'""')+'"' : s;
        }).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `facturas_${desde}_${hasta}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // TanStack Table setup
    const columns = useMemo(() => [
        {
            accessorKey: 'ticket',
            header: () => '#',
            cell: info => `#${info.getValue() || info.row.original.pedido_id}`,
        },
        {
            accessorKey: 'pagado_en',
            header: () => 'Fecha',
            cell: info => info.getValue() ? new Date(info.getValue()).toLocaleString('es-CO') : '',
        },
        {
            accessorKey: 'mesa_numero',
            header: () => 'Mesa',
        },
        {
            accessorKey: 'mesero_nombre',
            header: () => 'Mesero',
            cell: info => info.getValue() || info.row.original.mesero_id || '-',
        },
        {
            accessorKey: 'total',
            header: () => <div style={{textAlign:'right'}}>Total</div>,
            cell: info => <div className="td-right">${Number(info.getValue()||0).toLocaleString('es-CO')}</div>,
        },
        {
            accessorKey: 'propina',
            header: () => <div style={{textAlign:'right'}}>Propina</div>,
            cell: info => <div className="td-right">${Number(info.getValue()||0).toLocaleString('es-CO')}</div>,
        },
        {
            id: 'actions',
            header: () => '',
            cell: info => <div className="td-right"><button className="btn" onClick={()=>setView(info.row.original)}>Ver</button></div>,
            enableSorting: false,
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
        <div className="fin-page finz-reportes">
            <div className="fin-header"><h1>Finanzas · Reportes</h1><p className="muted">Cortes, tendencias y exportaciones.</p></div>
                <div className="fin-card">
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

                <div className="fin-kpis">
                    <div className="kpi-card">
                        <div className="kpi-icon brand"><HiBanknotes /></div>
                        <div className="kpi-body">
                            <div className="kpi-label">Ventas</div>
                            <div className="kpi-value">${totalVentas.toLocaleString('es-CO')}</div>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon"><HiCurrencyDollar /></div>
                        <div className="kpi-body">
                            <div className="kpi-label">Propinas</div>
                            <div className="kpi-value">${totalPropinas.toLocaleString('es-CO')}</div>
                        </div>
                    </div>
                    {cargando && <div className="kpi-loading muted">Cargando…</div>}
                </div>

                <div style={{overflowX:'auto', marginTop:'.75rem'}}>
                    <table className="table">
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id}
                                            onClick={header.column.getToggleSortingHandler?.()}
                                            style={{cursor: header.column.getCanSort?.() ? 'pointer' : 'default'}}>
                                            <div style={{display:'flex', alignItems:'center', gap:'.25rem'}}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort?.() && <HiArrowsUpDown style={{opacity:.55}}/>}
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
                            {!filtered.length && (
                                <tr><td colSpan={columns.length} className="muted">Sin facturas en el rango.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button className="btn" onClick={()=>table.previousPage()} disabled={!table.getCanPreviousPage()}><HiChevronLeft/> Anterior</button>
                    <span className="muted">Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}</span>
                    <button className="btn" onClick={()=>table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente <HiChevronRight/></button>
                </div>
            </div>

            {view && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card invoice">
                        <div className="modal-header">
                            <h3>Factura #{view.ticket || view.pedido_id}</h3>
                            <button className="close-btn" onClick={()=>setView(null)} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'.5rem', gap:'1rem'}}>
                                <div>
                                    <div className="muted">Fecha</div>
                                    <div>{view.pagado_en ? new Date(view.pagado_en).toLocaleString('es-CO') : ''}</div>
                                </div>
                                <div style={{textAlign:'center'}}>
                                    <div className="muted">Mesero</div>
                                    <div>{view.mesero_nombre || view.mesero_id || '-'}</div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <div className="muted">Mesa</div>
                                    <div>{view.mesa_id}</div>
                                </div>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th className="td-right">Cant.</th>
                                        <th className="td-right">Precio</th>
                                        <th className="td-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(view.items||[]).map((it,idx)=> (
                                        <tr key={idx}>
                                            <td>{it.nombre}</td>
                                            <td className="td-right">{it.cantidad}</td>
                                            <td className="td-right">${Number(it.precio||0).toLocaleString('es-CO')}</td>
                                            <td className="td-right">${Number(it.subtotal||0).toLocaleString('es-CO')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="td-right">Total</td>
                                        <td className="td-right">${Number(view.total||0).toLocaleString('es-CO')}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="td-right">Propina</td>
                                        <td className="td-right">${Number(view.propina||0).toLocaleString('es-CO')}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={()=>{
                                const el = document.querySelector('.modal-card.invoice .modal-body');
                                const w = window.open('', 'PRINT', 'width=800,height=900');
                                if (!w || !el) return;
                                w.document.write('<html><head><title>Factura</title>');
                                w.document.write('<style>body{font-family:ui-sans-serif,system-ui;margin:24px;} table{width:100%;border-collapse:collapse;} th,td{font-size:12px;} th{text-align:left;background:#f3f4f6;} td,th{border-top:1px solid #e5e7eb;padding:6px;} tfoot td{border-top:none;} h3{margin:0 0 12px 0;}</style>');
                                w.document.write('</head><body>');
                                w.document.write(el.innerHTML);
                                w.document.write('</body></html>');
                                w.document.close(); w.focus(); w.print(); w.close();
                            }}>Imprimir</button>
                            <button className="btn primary" onClick={()=>setView(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reportes;
