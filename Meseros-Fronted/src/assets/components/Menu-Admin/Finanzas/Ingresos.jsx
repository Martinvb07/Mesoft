import React from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Ingresos.css';

const Ingresos = () => {
    return (
        <div className="fin-page">
        <div className="fin-header"><h1>Finanzas · Ingresos</h1><p className="muted">Registro y seguimiento de ingresos.</p></div>
        <div className="fin-card">
            <h3>Listado</h3>
            <div className="empty">Sin ingresos registrados.</div>
        </div>
        </div>
    );
};

export default Ingresos;
