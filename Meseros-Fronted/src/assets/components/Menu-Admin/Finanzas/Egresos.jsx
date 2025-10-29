import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Egresos.css';
import { api } from '../../../../api/client';

const Egresos = () => {
    const [rows, setRows] = useState([]); // categorias agregadas
    const [detalles, setDetalles] = useState([]); // egresos detalle
    const [q, setQ] = useState('');
    const [cargando, setCargando] = useState(false);
    const [desde, setDesde] = useState(()=>{
        const d=new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10);
    });
    const [hasta, setHasta] = useState(()=> new Date().toISOString().slice(0,10));
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ concepto:'', monto:'', fecha: new Date().toISOString().slice(0,10), categoria:'', descripcion:'' });

    useEffect(()=>{
        const load = async ()=>{
            setCargando(true);
            try {
                const [cats, det] = await Promise.all([
                    api.egresosCategorias({ desde, hasta }),
                    api.egresos({ desde, hasta }),
                ]);
                setRows(cats || []);
                setDetalles(det || []);
            }
            catch { setRows([]); setDetalles([]); }
            finally { setCargando(false); }
        };
        load();
    }, [desde, hasta]);

    const filtered = useMemo(()=>{
        const t = q.trim().toLowerCase();
        if (!t) return detalles;
        return detalles.filter(r => (`${r.categoria||''} ${r.descripcion||''} ${r.monto||''} ${r.fecha||''}`).toLowerCase().includes(t));
    }, [detalles, q]);

    const money = (n)=> `$${Number(n||0).toLocaleString('es-CO')}`;
    const total = useMemo(()=> filtered.reduce((s,r)=> s + Number(r.monto||0), 0), [filtered]);
    const movs = useMemo(()=> filtered.length, [filtered]);

    const totalCats = useMemo(()=> rows.reduce((s,r)=> s + Number(r.total||0), 0), [rows]);

    const openModal = ()=>{ setForm({ concepto:'', monto:'', fecha: new Date().toISOString().slice(0,10), categoria:'', descripcion:'' }); setModalOpen(true); };
    const submitModal = async ()=>{
        if (!form.monto) return alert('El monto es obligatorio');
        try{
            await api.crearEgreso({
                categoria: form.categoria || null,
                monto: Number(form.monto),
                descripcion: `${form.concepto || ''}${form.descripcion ? ' — ' + form.descripcion : ''}` || null,
                fecha: form.fecha,
            });
            setModalOpen(false);
            // refrescar
            const [cats, det] = await Promise.all([
                api.egresosCategorias({ desde, hasta }),
                api.egresos({ desde, hasta }),
            ]);
            setRows(cats || []); setDetalles(det || []); setQ('');
        } catch(e){ alert('Error guardando egreso'); }
    };

    return (
        <div className="fin-page fin-egresos">
        <div className="fin-header"><h1>Finanzas · Egresos</h1><p className="muted">Gastos por categoría en el rango seleccionado.</p></div>
        <div className="fin-card">
            <div className="toolbar">
                <div className="left">
                    <label>Desde <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} /></label>
                    <label>Hasta <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} /></label>
                </div>
                <input className="input" placeholder="Buscar egresos..." value={q} onChange={e=>setQ(e.target.value)} />
                <button className="btn primary" onClick={openModal}>+ Nuevo Egreso</button>
            </div>
            <div className="kpis">
                <div className="kpi"><div className="kpi-label">Total Egresos</div><div className="kpi-value">{money(total)}</div></div>
                <div className="kpi"><div className="kpi-label">Registros</div><div className="kpi-value">{movs}</div></div>
            </div>
            {cargando ? <div className="empty">Cargando…</div> : (
                <>
                <div className="card-subtitle">Listado</div>
                <div style={{overflowX:'auto'}}>
                    <table className="table">
                        <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th className="td-right">Monto</th></tr></thead>
                        <tbody>
                            {filtered.map((r,idx)=> (
                                <tr key={idx}><td>{r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : ''}</td><td>{r.categoria || '-'}</td><td>{r.descripcion || '-'}</td><td className="td-right">{money(r.monto)}</td></tr>
                            ))}
                            {!filtered.length && <tr><td colSpan={4} className="muted">Sin egresos en el rango.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="card-subtitle" style={{marginTop:'1rem'}}>Por categoría</div>
                <div style={{overflowX:'auto'}}>
                    <table className="table">
                        <thead><tr><th>Categoría</th><th className="td-center">Movimientos</th><th className="td-right">Total</th></tr></thead>
                        <tbody>
                            {rows.map((r,idx)=> (
                                <tr key={idx}><td>{r.categoria}</td><td className="td-center">{r.movimientos}</td><td className="td-right">{money(r.total)}</td></tr>
                            ))}
                            {!rows.length && <tr><td colSpan={3} className="muted">Sin datos para el rango.</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr><td colSpan={2} className="td-right">Total</td><td className="td-right">{money(totalCats)}</td></tr>
                        </tfoot>
                    </table>
                </div>
                </>
            )}
        </div>

        {modalOpen && (
            <div className="egz-modal" role="dialog" aria-modal="true">
                <div className="egz-card">
                    <div className="egz-header">
                        <h3>Nuevo Egreso</h3>
                        <button className="close" onClick={()=>setModalOpen(false)} aria-label="Cerrar">×</button>
                    </div>
                    <div className="egz-body">
                        <div className="grid-2">
                            <label className="fld">Concepto *<input type="text" value={form.concepto} onChange={e=>setForm(f=>({...f, concepto:e.target.value}))} placeholder="Ej: Pago de servicios" /></label>
                            <label className="fld">Monto *<input type="number" step="0.01" value={form.monto} onChange={e=>setForm(f=>({...f, monto:e.target.value}))} /></label>
                            <label className="fld">Fecha *<input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f, fecha:e.target.value}))} /></label>
                            <label className="fld">Categoría *
                                <select value={form.categoria} onChange={e=>setForm(f=>({...f, categoria:e.target.value}))}>
                                    <option value="">Seleccione…</option>
                                    <option>Gastos Operativos</option>
                                    <option>Servicios</option>
                                    <option>Arriendo</option>
                                    <option>Insumos</option>
                                    <option>Otros</option>
                                </select>
                            </label>
                        </div>
                        <label className="fld">Descripción
                            <textarea rows={4} value={form.descripcion} onChange={e=>setForm(f=>({...f, descripcion:e.target.value}))} placeholder="Detalles adicionales del egreso..."></textarea>
                        </label>
                    </div>
                    <div className="egz-footer">
                        <button className="btn" onClick={()=>setModalOpen(false)}>Cancelar</button>
                        <button className="btn primary" onClick={submitModal}>Guardar</button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
};

export default Egresos;
