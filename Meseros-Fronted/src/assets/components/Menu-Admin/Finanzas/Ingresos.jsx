import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Ingresos.css';
import { api } from '../../../../api/client';

const Ingresos = () => {
    const [desde, setDesde] = useState(()=> new Date().toISOString().slice(0,10));
    const [hasta, setHasta] = useState(()=> new Date().toISOString().slice(0,10));
    const [q, setQ] = useState('');
    const [rows, setRows] = useState([]);
    const [cargando, setCargando] = useState(false);

    useEffect(()=>{
        const load = async ()=>{
            setCargando(true);
            try { setRows(await api.facturas({ desde, hasta, limit: 500 })); }
            catch { setRows([]); }
            finally { setCargando(false); }
        };
        load();
    }, [desde, hasta]);

    const filtered = useMemo(()=>{
        const t = q.trim().toLowerCase();
        if(!t) return rows;
        return rows.filter(f=>[
            `#${f.ticket ?? f.pedido_id ?? ''}`,
            String(f.mesa_numero ?? f.mesa_id ?? ''),
            String(f.mesero_nombre ?? ''),
            f.pagado_en ? new Date(f.pagado_en).toLocaleString('es-CO') : ''
        ].join(' ').toLowerCase().includes(t));
    }, [rows, q]);

    const money = (n)=> `$${Number(n||0).toLocaleString('es-CO')}`;
    const total = useMemo(()=> filtered.reduce((s,f)=> s + Number(f.total||0), 0), [filtered]);
    const prop = useMemo(()=> filtered.reduce((s,f)=> s + Number(f.propina||0), 0), [filtered]);

    return (
        <div className="fin-page">
        <div className="fin-header"><h1>Finanzas · Ingresos</h1><p className="muted">Registro y seguimiento de ingresos.</p></div>
        <div className="fin-card">
            <div className="toolbar">
                <div className="left">
                    <label>Desde <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} /></label>
                    <label>Hasta <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} /></label>
                </div>
                <div className="right">
                    <input className="input" placeholder="Buscar ticket, mesa, mesero, fecha" value={q} onChange={e=>setQ(e.target.value)} />
                    <div className="kpis-inline">Total: <strong>{money(total)}</strong> · Propinas: <strong>{money(prop)}</strong></div>
                </div>
            </div>
            {cargando ? (
                <div className="empty">Cargando…</div>
            ) : (
                <div style={{overflowX:'auto'}}>
                    <table className="table">
                        <thead><tr><th>#</th><th>Fecha</th><th>Mesa</th><th>Mesero</th><th className="td-right">Total</th><th className="td-right">Propina</th></tr></thead>
                        <tbody>
                            {filtered.map((f,idx)=> (
                                <tr key={idx}><td>#{f.ticket ?? f.pedido_id}</td><td>{f.pagado_en ? new Date(f.pagado_en).toLocaleString('es-CO') : ''}</td><td>{f.mesa_numero ?? f.mesa_id}</td><td>{f.mesero_nombre || '-'}</td><td className="td-right">{money(f.total)}</td><td className="td-right">{money(f.propina)}</td></tr>
                            ))}
                            {!filtered.length && <tr><td colSpan={6} className="muted">Sin ingresos en el rango.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </div>
    );
};

export default Ingresos;
