import React from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Reportes.css';

const Reportes = () => {
    return (
        <div className="fin-page">
        <div className="fin-header"><h1>Finanzas · Reportes</h1><p className="muted">Cortes, tendencias y exportaciones.</p></div>
        <div className="fin-card">
            <h3>Reportes disponibles</h3>
            <div className="empty">Aún sin reportes generados.</div>
        </div>
        </div>
    );
};

export default Reportes;
