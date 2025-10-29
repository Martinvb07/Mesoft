import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Egresos.css';
import { api } from '../../../../api/client';

const Egresos = () => {
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(()=>{
        const load = async ()=>{
            setCargando(true);
            try { setRows(await api.egresosCategoriasHoy()); }
            catch { setRows([]); }
            finally { setCargando(false); }
        };
        load();
    }, []);

    const filtered = useMemo(()=>{
        const t = q.trim().toLowerCase();
        if (!t) return rows;
        return rows.filter(r => (`${r.categoria} ${r.movimientos} ${r.total}`).toLowerCase().includes(t));
    }, [rows, q]);

    const money = (n)=> `$${Number(n||0).toLocaleString('es-CO')}`;
    const total = useMemo(()=> filtered.reduce((s,r)=> s + Number(r.total||0), 0), [filtered]);
    const movs = useMemo(()=> filtered.reduce((s,r)=> s + Number(r.movimientos||0), 0), [filtered]);

    return (
        <div className="fin-page">
        <div className="fin-header"><h1>Finanzas · Egresos</h1><p className="muted">Gastos del día por categoría.</p></div>
        <div className="fin-card">
            <div className="toolbar">
                <input className="input" placeholder="Buscar categoría" value={q} onChange={e=>setQ(e.target.value)} />
                <div className="kpis-inline">Movimientos: <strong>{movs}</strong> · Total: <strong>{money(total)}</strong></div>
            </div>
            {cargando ? (
                <div className="empty">Cargando…</div>
            ) : (
                <div style={{overflowX:'auto'}}>
                    <table className="table">
                        <thead><tr><th>Categoría</th><th className="td-center">Movimientos</th><th className="td-right">Total</th></tr></thead>
                        <tbody>
                            {filtered.map((r,idx)=> (
                                <tr key={idx}><td>{r.categoria}</td><td className="td-center">{r.movimientos}</td><td className="td-right">{money(r.total)}</td></tr>
                            ))}
                            {!filtered.length && <tr><td colSpan={3} className="muted">Sin egresos hoy.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="muted" style={{marginTop:8}}>Nota: actualmente se muestran solo los egresos del día de hoy.</div>
        </div>
        </div>
    );
};

export default Egresos;
