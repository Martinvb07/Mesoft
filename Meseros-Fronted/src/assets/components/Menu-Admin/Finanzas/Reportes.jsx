import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Reportes.css';
import { api } from '../../../../api/client';

const Reportes = () => {
    const [desde, setDesde] = useState(()=>{
        const d = new Date(); d.setDate(d.getDate()-7);
        return d.toISOString().slice(0,10);
    });
    const [hasta, setHasta] = useState(()=> new Date().toISOString().slice(0,10));
    const [cargando, setCargando] = useState(false);
    const [facturas, setFacturas] = useState([]);
    const [q, setQ] = useState('');
    const [view, setView] = useState(null); // factura seleccionada

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
        return facturas.filter(f => {
            const parts = [
                `#${f.pedido_id}`,
                String(f.pedido_id||'') ,
                String(f.mesa_id||'') ,
                String(f.mesero_nombre||'') ,
                String(f.mesero_id||'') ,
                (f.pagado_en ? new Date(f.pagado_en).toLocaleString('es-CO') : '')
            ].join(' ').toLowerCase();
            return parts.includes(term);
        });
    }, [facturas, q]);

    const totalVentas = useMemo(()=> filtered.reduce((s,f)=> s + Number(f.total||0), 0), [filtered]);
    const totalPropinas = useMemo(()=> filtered.reduce((s,f)=> s + Number(f.propina||0), 0), [filtered]);

    const exportCSV = () => {
        const header = ['pedido_id','fecha','mesa','mesero','total','propina'];
        const rows = filtered.map(f => [
            f.pedido_id,
            f.pagado_en ? new Date(f.pagado_en).toISOString() : '',
            f.mesa_id,
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

    return (
        <div className="fin-page">
            <div className="fin-header"><h1>Finanzas · Reportes</h1><p className="muted">Cortes, tendencias y exportaciones.</p></div>
            <div className="fin-card">
                <div style={{display:'flex', alignItems:'end', gap:'.5rem', justifyContent:'space-between'}}>
                    <h3 style={{margin:0}}>Facturas</h3>
                    <div className="toolbar">
                        <div className="search">
                            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar (pedido, mesa, mesero, fecha)..." />
                        </div>
                        <label style={{display:'flex', flexDirection:'column', fontWeight:700}}>
                            <span className="muted" style={{fontWeight:600}}>Desde</span>
                            <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} />
                        </label>
                        <label style={{display:'flex', flexDirection:'column', fontWeight:700}}>
                            <span className="muted" style={{fontWeight:600}}>Hasta</span>
                            <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} />
                        </label>
                        <button className="btn" onClick={exportCSV} title="Exportar CSV">Exportar CSV</button>
                    </div>
                </div>
                <div style={{display:'flex', gap:'1rem', marginTop:'.5rem'}}>
                    <div className="pill" style={{background:'#fff7e6', border:'1px solid #ffe0cc'}}>Ventas: <strong>${totalVentas.toLocaleString('es-CO')}</strong></div>
                    <div className="pill" style={{background:'#eef7ff', border:'1px solid #dbeafe'}}>Propinas: <strong>${totalPropinas.toLocaleString('es-CO')}</strong></div>
                    {cargando && <span className="muted">Cargando…</span>}
                </div>
                <div style={{overflowX:'auto', marginTop:'.75rem'}}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Fecha</th>
                                <th>Mesa</th>
                                <th>Mesero</th>
                                <th className="td-right">Total</th>
                                <th className="td-right">Propina</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((f)=> (
                                <tr key={f.pedido_id}>
                                    <td>#{f.pedido_id}</td>
                                    <td>{f.pagado_en ? new Date(f.pagado_en).toLocaleString('es-CO') : ''}</td>
                                    <td>{f.mesa_id}</td>
                                    <td>{f.mesero_nombre || f.mesero_id || '-'}</td>
                                    <td className="td-right">${Number(f.total||0).toLocaleString('es-CO')}</td>
                                    <td className="td-right">${Number(f.propina||0).toLocaleString('es-CO')}</td>
                                    <td className="td-right"><button className="btn" onClick={()=>setView(f)}>Ver</button></td>
                                </tr>
                            ))}
                            {!filtered.length && (
                                <tr><td colSpan={7} className="muted">Sin facturas en el rango.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {view && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card invoice">
                        <div className="modal-header">
                            <h3>Factura #{view.pedido_id}</h3>
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
