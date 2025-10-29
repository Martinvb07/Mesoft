import React from 'react';
import './ReportesToolbar.css';
import { HiMagnifyingGlass, HiBanknotes, HiCurrencyDollar } from 'react-icons/hi2';

const ReportesToolbar = ({ q, onQChange, desde, hasta, onDesde, onHasta, filterKey, onFilterKeyChange, onExportCSV }) => {
  const placeholder = filterKey === 'pedido' ? 'Buscar por # ticket…'
    : filterKey === 'mesa' ? 'Buscar por mesa…'
    : filterKey === 'mesero' ? 'Buscar por mesero…'
    : filterKey === 'fecha' ? 'Buscar por fecha (dd/mm/aaaa)…'
    : filterKey === 'hora' ? 'Buscar por hora (hh:mm)…'
    : 'Buscar (ticket, mesa, mesero, fecha)';

  return (
    <div className="rpt-toolbar">
      <h3 className="rpt-title">Facturas</h3>
      <div className="rpt-items">
        <div className="rpt-field">
          <label>Filtro</label>
          <select value={filterKey} onChange={(e)=>onFilterKeyChange(e.target.value)}>
            <option value="todo">General</option>
            <option value="pedido"># Pedido</option>
            <option value="mesa">Mesa</option>
            <option value="mesero">Mesero</option>
            <option value="fecha">Fecha</option>
            <option value="hora">Hora</option>
          </select>
        </div>
        <div className="rpt-search">
          <HiMagnifyingGlass />
          <input value={q} onChange={e=>onQChange(e.target.value)} placeholder={placeholder} />
        </div>
        <div className="rpt-field">
          <label>Desde</label>
          <input type="date" value={desde} onChange={e=>onDesde(e.target.value)} />
        </div>
        <div className="rpt-field">
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={e=>onHasta(e.target.value)} />
        </div>
        <button className="rpt-btn primary" onClick={onExportCSV}>Exportar CSV</button>
      </div>
    </div>
  );
};

export default ReportesToolbar;
