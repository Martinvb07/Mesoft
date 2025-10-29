import React, { useEffect, useMemo, useRef, useState } from 'react';
// Unificamos estilos al de Reportes
import '../../../css/Navbar/Menu-Admin/Finanzas/Reportes.css';
import { HiListBullet, HiCurrencyDollar } from 'react-icons/hi2';
import { api } from '../../../../api/client';

const CierreCaja = () => {
    const [ventas, setVentas] = useState(0);
    const [balance, setBalance] = useState({ balance: 0, ingresos: 0, egresos: 0 });
    const [ticket, setTicket] = useState({ ticket_promedio: 0, ventas: 0, pedidos: 0 });
    const [meta, setMeta] = useState({ meta: 0, ventas: 0, progresoPct: 0 });
    const [cargando, setCargando] = useState(false);
    const printRef = useRef(null);

    useEffect(()=>{
        const load = async ()=>{
            setCargando(true);
            try {
                const [v, b, t, m] = await Promise.all([
                    api.ventasHoy(),
                    api.balanceHoy(),
                    api.ticketPromedioHoy(),
                    api.metaHoy(),
                ]);
                setVentas(Number(v?.ventas||0));
                setBalance({
                    balance: Number(b?.balance||0),
                    ingresos: Number(b?.ingresos||0),
                    egresos: Number(b?.egresos||0),
                });
                setTicket({
                    ticket_promedio: Number(t?.ticket_promedio||0),
                    ventas: Number(t?.ventas||0),
                    pedidos: Number(t?.pedidos||0),
                });
                setMeta({
                    meta: Number(m?.meta||0),
                    ventas: Number(m?.ventas||0),
                    progresoPct: Number(m?.progresoPct||0),
                });
            } finally { setCargando(false); }
        };
        load();
    }, []);

    const money = (n)=> `$${Number(n||0).toLocaleString('es-CO')}`;
    const resumen = useMemo(()=> ([
        { label: 'Ingresos (ventas)', value: money(balance.ingresos) },
        { label: 'Egresos', value: money(balance.egresos) },
        { label: 'Balance del día', value: money(balance.balance) },
        { label: 'Pedidos cerrados', value: String(ticket.pedidos) },
        { label: 'Ticket promedio', value: money(ticket.ticket_promedio) },
        { label: 'Meta diaria', value: money(meta.meta) },
        { label: 'Progreso meta', value: `${meta.progresoPct.toFixed(0)}%` },
    ]), [balance, ticket, meta]);

    const handlePrint = ()=> {
        if (!printRef.current) return;
        const html = printRef.current.innerHTML;
        const w = window.open('', '_blank', 'width=800,height=900');
        if (!w) return;
        w.document.write(`<!doctype html><html><head><title>Cierre de caja</title>
            <style>
                body{font-family:ui-sans-serif,system-ui;padding:24px;color:#111;background:#fff}
                h2{margin:0 0 12px;font-size:20px}
                table{width:100%;border-collapse:collapse}
                th,td{border-top:1px solid #e5e7eb;padding:8px;font-size:13px}
                thead th{background:#f3f4f6;text-align:left;color:#374151}
                .muted{color:#6b7280;font-size:12px;margin-top:12px}
            </style>
        </head><body>`);
        w.document.write(`<h2>Cierre de caja - ${new Date().toLocaleDateString('es-CO')}</h2>`);
        w.document.write('<table><thead><tr><th>Concepto</th><th>Valor</th></tr></thead><tbody>');
        resumen.forEach(r=>{
            w.document.write(`<tr><td>${r.label}</td><td style="text-align:right"><strong>${r.value}</strong></td></tr>`);
        });
        w.document.write('</tbody></table>');
        w.document.write(`<div class='muted'>Generado el ${new Date().toLocaleString('es-CO')}</div>`);
        w.document.write('</body></html>');
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    return (
        <div className="fin-page finz-reportes">
            <div className="fin-header">
                <h1>Finanzas · Cierre de caja</h1>
                <p className="muted">Consolidación del día actual.</p>
            </div>

            <div className="fin-card">
                {cargando ? (
                    <div className="empty">Cargando…</div>
                ) : (
                    <>
                        <div ref={printRef}>
                            <div className="fin-kpis">
                                <div className="kpi-card">
                                    <div className="kpi-icon brand">$</div>
                                    <div className="kpi-body">
                                        <div className="kpi-label">Ventas hoy</div>
                                        <div className="kpi-value">{money(ventas)}</div>
                                    </div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-icon">≡</div>
                                    <div className="kpi-body">
                                        <div className="kpi-label">Balance</div>
                                        <div className="kpi-value">{money(balance.balance)}</div>
                                    </div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-icon">🎟</div>
                                    <div className="kpi-body">
                                        <div className="kpi-label">Ticket promedio</div>
                                        <div className="kpi-value">{money(ticket.ticket_promedio)}</div>
                                    </div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-icon">% </div>
                                    <div className="kpi-body">
                                        <div className="kpi-label">Progreso meta</div>
                                        <div className="kpi-value">{meta.progresoPct.toFixed(0)}%</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{marginTop:'.75rem'}}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th><span style={{display:'inline-flex',alignItems:'center',gap:'.35rem'}}><HiListBullet/> Concepto</span></th>
                                            <th className="td-right"><span style={{display:'inline-flex',alignItems:'center',gap:'.35rem',justifyContent:'flex-end'}}><HiCurrencyDollar/> Valor</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Ingresos</td><td className="td-right">{money(balance.ingresos)}</td></tr>
                                        <tr><td>Egresos</td><td className="td-right">{money(balance.egresos)}</td></tr>
                                        <tr><td>Balance del día</td><td className="td-right">{money(balance.balance)}</td></tr>
                                        <tr><td>Pedidos cerrados</td><td className="td-right">{ticket.pedidos}</td></tr>
                                        <tr><td>Meta diaria</td><td className="td-right">{money(meta.meta)}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div style={{display:'flex', justifyContent:'flex-end', marginTop:'.75rem'}}>
                            <button className="btn" onClick={handlePrint}>Imprimir cierre</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CierreCaja;
