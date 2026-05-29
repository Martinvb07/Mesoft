import React, { useEffect, useState } from 'react';
import { HiCurrencyDollar, HiBanknotes, HiChartBar, HiReceiptPercent } from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Finanzas/Resumen.css';
import { api } from '../../../../api/client';

// SVG-based sparkline line chart component
function SalesSparkline({ data }) {
    if (!data || data.length === 0) {
        return <div className="empty" style={{margin:0}}>Sin datos de evolución.</div>;
    }

    const W = 600;
    const H = 120;
    const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const values = data.map(d => Number(d.ventas || 0));
    const maxV = Math.max(...values, 1);
    const minV = Math.min(...values, 0);
    const rangeV = maxV - minV || 1;

    const xScale = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const yScale = (v) => PAD.top + innerH - ((v - minV) / rangeV) * innerH;

    const points = data.map((d, i) => [xScale(i), yScale(Number(d.ventas || 0))]);
    const polyline = points.map(([x, y]) => `${x},${y}`).join(' ');

    // Area fill path
    const areaPath = [
        `M ${points[0][0]},${PAD.top + innerH}`,
        ...points.map(([x, y]) => `L ${x},${y}`),
        `L ${points[points.length - 1][0]},${PAD.top + innerH}`,
        'Z',
    ].join(' ');

    // Y-axis ticks (3 labels)
    const yTicks = [minV, minV + rangeV / 2, maxV];

    // X-axis: show first, middle and last date labels
    const xLabelIdxs = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i);

    const fmtMoney = (n) => {
        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
        return `$${n}`;
    };
    const fmtDate = (str) => {
        try {
            const [, m, d] = String(str).split('-');
            return `${d}/${m}`;
        } catch { return str; }
    };

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            aria-label="Evolución de ventas"
        >
            {/* Grid lines */}
            {yTicks.map((v, i) => {
                const y = yScale(v);
                return (
                    <g key={i}>
                        <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                        <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{fmtMoney(v)}</text>
                    </g>
                );
            })}

            {/* Area fill */}
            <path d={areaPath} fill="var(--brand, #6366f1)" opacity="0.08" />

            {/* Line */}
            <polyline
                points={polyline}
                fill="none"
                stroke="var(--brand, #6366f1)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Dots */}
            {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="var(--brand, #6366f1)" />
            ))}

            {/* X-axis labels */}
            {xLabelIdxs.map(i => (
                <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#9ca3af">
                    {fmtDate(data[i]?.fecha)}
                </text>
            ))}
        </svg>
    );
}

const Resumen = () => {
    const [ventasHoy, setVentasHoy] = useState(0);
    const [ticketProm, setTicketProm] = useState(0);
    const [ventasHoyPedidos, setVentasHoyPedidos] = useState(0);
    const [variacion, setVariacion] = useState(0);
    const [meta, setMeta] = useState({ meta: 0, ventas: 0, progresoPct: 0 });
    const [top, setTop] = useState([]);
    const [evolucion, setEvolucion] = useState([]);
    const [evolucionCargando, setEvolucionCargando] = useState(false);

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

        // Cargar evolución ventas últimos 30 días
        (async () => {
            if (!alive) return;
            setEvolucionCargando(true);
            try {
                const today = new Date();
                const hasta = today.toISOString().slice(0, 10);
                const desde30 = new Date(today);
                desde30.setDate(desde30.getDate() - 29);
                const desde = desde30.toISOString().slice(0, 10);
                const data = await api.evolucionVentas({ desde, hasta });
                if (alive) setEvolucion(Array.isArray(data) ? data : []);
            } catch {
                if (alive) setEvolucion([]);
            } finally {
                if (alive) setEvolucionCargando(false);
            }
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
            <div className="metric-info">
                <div className="metric-value" style={{color: variacion >= 0 ? '#16a34a' : '#dc2626'}}>
                    {variacion >= 0 ? '▲' : '▼'} {pct(Math.abs(variacion))}
                </div>
                <div className="metric-label">Variación vs ayer</div>
            </div>
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

        {/* Evolución de ventas — últimos 30 días */}
        <div className="fin-card">
            <h3>Evolución de ventas — últimos 30 días</h3>
            {evolucionCargando ? (
                <div className="empty">Cargando...</div>
            ) : (
                <SalesSparkline data={evolucion} />
            )}
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
