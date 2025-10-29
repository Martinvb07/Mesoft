import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Reportes.css';
import './ReportesToolbar.css';
import { api } from '../../../../api/client';
import Swal from 'sweetalert2';
import { HiCalendarDays, HiTag, HiListBullet, HiCurrencyDollar, HiMagnifyingGlass } from 'react-icons/hi2';

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
        if (!form.concepto?.trim()) return Swal.fire({ icon:'error', title:'Concepto requerido', text:'Ingresa un concepto.' });
        if (!form.monto || Number(form.monto) <= 0) return Swal.fire({ icon:'error', title:'Monto inválido', text:'Ingresa un monto mayor a 0.' });
        if (!form.fecha) return Swal.fire({ icon:'error', title:'Fecha requerida' });
        if (!form.categoria) return Swal.fire({ icon:'warning', title:'Categoría requerida', text:'Selecciona una categoría.' });
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
        } catch(e){ Swal.fire({ icon:'error', title:'Error guardando egreso', text: e?.message || 'Intenta nuevamente.' }); }
    };

    return (
    <div className="fin-page finz-reportes">
        <div className="fin-header"><h1>Finanzas · Egresos</h1><p className="muted">Gastos por categoría en el rango seleccionado.</p></div>
        <div className="fin-card">
            <div className="rpt-toolbar">
                <h3 className="rpt-title">Egresos</h3>
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
                        <input placeholder="Buscar egresos…" value={q} onChange={e=>setQ(e.target.value)} />
                    </div>
                    <button className="rpt-btn primary" onClick={openModal}>+ Nuevo Egreso</button>
                </div>
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
                        <thead><tr>
                            <th><span style={{display:'inline-flex',alignItems:'center',gap:'.35rem'}}><HiCalendarDays/> Fecha</span></th>
                            <th><span style={{display:'inline-flex',alignItems:'center',gap:'.35rem'}}><HiTag/> Categoría</span></th>
                            <th>Descripción</th>
                            <th className="td-right"><span style={{display:'inline-flex',alignItems:'center',gap:'.35rem',justifyContent:'flex-end'}}><HiCurrencyDollar/> Monto</span></th>
                        </tr></thead>
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
                        <thead><tr>
                            <th><span style={{display:'inline-flex',alignItems:'center',gap:'.35rem'}}><HiTag/> Categoría</span></th>
                            <th className="td-center"><span style={{display:'inline-flex',alignItems:'center',gap:'.35rem',justifyContent:'center'}}><HiListBullet/> Movimientos</span></th>
                            <th className="td-right"><span style={{display:'inline-flex',alignItems:'center',gap:'.35rem',justifyContent:'flex-end'}}><HiCurrencyDollar/> Total</span></th>
                        </tr></thead>
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
            <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal-card">
                    <div className="modal-header">
                        <h3>Nuevo Egreso</h3>
                        <button className="close-btn" onClick={()=>setModalOpen(false)} aria-label="Cerrar">×</button>
                    </div>
                    <div className="modal-body">
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
                                    <option>Inventario</option>
                                    <option>Otros</option>
                                </select>
                            </label>
                        </div>
                        <label className="fld">Descripción
                            <textarea rows={4} value={form.descripcion} onChange={e=>setForm(f=>({...f, descripcion:e.target.value}))} placeholder="Detalles adicionales del egreso..."></textarea>
                        </label>
                    </div>
                    <div className="modal-footer">
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
