import React, { useEffect, useState } from 'react';
import { HiCurrencyDollar, HiBanknotes, HiChartBar, HiReceiptPercent } from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Finanzas/Resumen.css';
import { api } from '../../../../api/client';

const Resumen = () => {
    const [ventasHoy, setVentasHoy] = useState(0);
    const [ticketProm, setTicketProm] = useState(0);
    const [ventasHoyPedidos, setVentasHoyPedidos] = useState(0);
    const [variacion, setVariacion] = useState(0);
    const [meta, setMeta] = useState({ meta: 0, ventas: 0, progresoPct: 0 });
    const [top, setTop] = useState([]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [v, t, vr, m, tp] = await Promise.all([
                    api.ventasHoy().catch(()=>({ ventas:0 })),
                    api.ticketPromedioHoy().catch(()=>({ ventas:0, pedidos:0, ticket_promedio:0 })),
                    api.variacionVentasDia().catch(()=>({ variacionPct:0 })),
                    api.metaHoy().catch(()=>({ meta:0, ventas:0, progresoPct:0 })),
                    api.topProductos({ limit: 5 }).catch(()=>[]),
                ]);
                if (!alive) return;
                setVentasHoy(Number(v?.ventas||0));
                setTicketProm(Number(t?.ticket_promedio||0));
                setVentasHoyPedidos(Number(t?.pedidos||0));
                setVariacion(Number(vr?.variacionPct||0));
                setMeta({ meta: Number(m?.meta||0), ventas: Number(m?.ventas||0), progresoPct: Number(m?.progresoPct||0) });
                setTop(Array.isArray(tp)?tp:[]);
            } catch {}
        })();
        return () => { alive = false; };
    }, []);

    const money = (n) => `$${Number(n||0).toLocaleString('es-CO')}`;
    const pct = (n) => `${Number(n||0).toFixed(0)}%`;

    return (
        <div className="fin-page">
        <div className="fin-header">
            <h1>Finanzas · Resumen</h1>
            <p className="muted">Visión general de ingresos, egresos y resultados.</p>
        </div>
        <div className="fin-metrics">
            <div className="metric-card">
            <div className="metric-icon"><HiCurrencyDollar /></div>
            <div className="metric-info"><div className="metric-value">{money(ventasHoy)}</div><div className="metric-label">Ventas del día</div></div>
            </div>
            <div className="metric-card">
            <div className="metric-icon"><HiChartBar /></div>
            <div className="metric-info"><div className="metric-value">{pct(variacion)}</div><div className="metric-label">Variación vs ayer</div></div>
            </div>
            <div className="metric-card">
            <div className="metric-icon"><HiBanknotes /></div>
            <div className="metric-info"><div className="metric-value">{money(ticketProm)}</div><div className="metric-label">Ticket promedio ({ventasHoyPedidos} pedidos)</div></div>
            </div>
            <div className="metric-card">
            <div className="metric-icon"><HiReceiptPercent /></div>
            <div className="metric-info"><div className="metric-value">{pct(meta.progresoPct)}</div><div className="metric-label">Meta del día ({money(meta.ventas)}/{money(meta.meta)})</div></div>
            </div>
        </div>
        <div className="fin-card">
            <h3>Top productos</h3>
            {top.length === 0 ? (
                <div className="empty">Sin datos aún.</div>
            ) : (
                <div style={{overflowX:'auto'}}>
                    <table className="table">
                        <thead><tr><th>Producto</th><th className="td-right">Unidades</th><th className="td-right">Ingresos</th><th className="td-right">Tendencia</th></tr></thead>
                        <tbody>
                            {top.map((p,idx)=> (
                                <tr key={idx}><td>{p.nombre}</td><td className="td-right">{p.unidades}</td><td className="td-right">{money(p.ingresos)}</td><td className="td-right">{pct(p.tendenciaPct)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </div>
    );
};

export default Resumen;
