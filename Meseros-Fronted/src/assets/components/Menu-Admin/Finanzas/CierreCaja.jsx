import React from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/CierreCaja.css';

const CierreCaja = () => {
    return (
        <div className="fin-page">
        <div className="fin-header"><h1>Finanzas · Cierre de caja</h1><p className="muted">Consolidación del turno y arqueo.</p></div>
        <div className="fin-card">
            <h3>Estado</h3>
            <div className="empty">No hay cierres aún.</div>
        </div>
        </div>
    );
};

export default CierreCaja;
