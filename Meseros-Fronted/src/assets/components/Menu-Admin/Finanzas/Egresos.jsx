import React from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/Egresos.css';

const Egresos = () => {
    return (
        <div className="fin-page">
        <div className="fin-header"><h1>Finanzas · Egresos</h1><p className="muted">Registro y seguimiento de egresos.</p></div>
        <div className="fin-card">
            <h3>Listado</h3>
            <div className="empty">Sin egresos registrados.</div>
        </div>
        </div>
    );
};

export default Egresos;
