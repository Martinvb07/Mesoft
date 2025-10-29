import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/CierreCaja.css';
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
        const w = window.open('', '_blank', 'width=600,height=800');
        if (!w) return;
        w.document.write(`<!doctype html><html><head><title>Cierre de caja</title>
            <style>
                body{font-family:Arial;padding:24px;color:#111}
                .h{font-size:18px;margin:0 0 12px}
                .row{display:flex;justify-content:space-between;margin:6px 0;border-bottom:1px solid #eee;padding-bottom:6px}
                .muted{color:#666;font-size:12px;margin-top:12px}
            </style>
        </head><body>`);
        w.document.write(`<h2 class="h">Cierre de caja - ${new Date().toLocaleDateString('es-CO')}</h2>`);
        resumen.forEach(r=>{
            w.document.write(`<div class='row'><span>${r.label}</span><strong>${r.value}</strong></div>`);
        });
        w.document.write(`<div class='muted'>Generado el ${new Date().toLocaleString('es-CO')}</div>`);
        w.document.write('</body></html>');
        w.document.close();
        w.focus();
        setTimeout(()=>{ w.print(); w.close(); }, 300);
    };

    return (
        <div className="fin-page">
        <div className="fin-header"><h1>Finanzas · Cierre de caja</h1><p className="muted">Consolidación del día actual.</p></div>
        <div className="fin-card">
            {cargando ? <div className="empty">Cargando…</div> : (
            <>
            <div ref={printRef}>
                <div className="kpis">
                    <div className="kpi"><div className="kpi-label">Ventas hoy</div><div className="kpi-value">{money(ventas)}</div></div>
                    <div className="kpi"><div className="kpi-label">Balance</div><div className="kpi-value">{money(balance.balance)}</div></div>
                    <div className="kpi"><div className="kpi-label">Ticket promedio</div><div className="kpi-value">{money(ticket.ticket_promedio)}</div></div>
                    <div className="kpi"><div className="kpi-label">Progreso meta</div><div className="kpi-value">{meta.progresoPct.toFixed(0)}%</div></div>
                </div>
                <div className="grid-2">
                    <div className="stat"><div className="stat-label">Ingresos</div><div className="stat-value">{money(balance.ingresos)}</div></div>
                    <div className="stat"><div className="stat-label">Egresos</div><div className="stat-value">{money(balance.egresos)}</div></div>
                    <div className="stat"><div className="stat-label">Pedidos</div><div className="stat-value">{ticket.pedidos}</div></div>
                    <div className="stat"><div className="stat-label">Meta</div><div className="stat-value">{money(meta.meta)}</div></div>
                </div>
            </div>
            <div className="actions"><button className="btn" onClick={handlePrint}>Imprimir cierre</button></div>
            </>
            )}
        </div>
        </div>
    );
};

export default CierreCaja;
