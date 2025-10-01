import React from 'react';
import { HiCurrencyDollar, HiBanknotes, HiChartBar, HiReceiptPercent } from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Finanzas/Resumen.css';

const Resumen = () => {
    return (
        <div className="fin-page">
        <div className="fin-header">
            <h1>Finanzas · Resumen</h1>
            <p className="muted">Visión general de ingresos, egresos y resultados.</p>
        </div>
        <div className="fin-metrics">
            <div className="metric-card">
            <div className="metric-icon"><HiCurrencyDollar /></div>
            <div className="metric-info"><div className="metric-value">$0</div><div className="metric-label">Ventas del día</div></div>
            </div>
            <div className="metric-card">
            <div className="metric-icon"><HiChartBar /></div>
            <div className="metric-info"><div className="metric-value">$0</div><div className="metric-label">Semana</div></div>
            </div>
            <div className="metric-card">
            <div className="metric-icon"><HiBanknotes /></div>
            <div className="metric-info"><div className="metric-value">$0</div><div className="metric-label">Mes</div></div>
            </div>
            <div className="metric-card">
            <div className="metric-icon"><HiReceiptPercent /></div>
            <div className="metric-info"><div className="metric-value">$0</div><div className="metric-label">Ticket promedio</div></div>
            </div>
        </div>
        <div className="fin-card">
            <h3>Actividad reciente</h3>
            <div className="empty">Sin datos aún.</div>
        </div>
        </div>
    );
};

export default Resumen;
