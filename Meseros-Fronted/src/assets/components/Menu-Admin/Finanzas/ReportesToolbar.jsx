import React from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineArrowDownTray } from 'react-icons/hi2';
import Select from '../../ui/Select';
import DateRangePicker from '../../ui/DateRangePicker';

const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg';

const ReportesToolbar = ({ q, onQChange, desde, hasta, onDesde, onHasta, filterKey, onFilterKeyChange, onExportCSV }) => {
    const placeholder = filterKey === 'pedido' ? 'Buscar por # ticket…'
        : filterKey === 'mesa' ? 'Buscar por mesa…'
            : filterKey === 'mesero' ? 'Buscar por mesero…'
                : filterKey === 'fecha' ? 'Buscar por fecha (dd/mm/aaaa)…'
                    : filterKey === 'hora' ? 'Buscar por hora (hh:mm)…'
                        : 'Buscar (ticket, mesa, mesero, fecha)';

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-3">
                <div>
                    <label className={labelCls}>Filtro</label>
                    <Select className="min-w-[150px]" value={filterKey} onChange={(e) => onFilterKeyChange(e.target.value)}>
                        <option value="todo">General</option>
                        <option value="pedido"># Pedido</option>
                        <option value="mesa">Mesa</option>
                        <option value="mesero">Mesero</option>
                        <option value="fecha">Fecha</option>
                        <option value="hora">Hora</option>
                    </Select>
                </div>
                <div>
                    <label className={labelCls}>Rango de fechas</label>
                    <DateRangePicker value={{ start: desde, end: hasta }} onChange={(s, e) => { onDesde(s); onHasta(e); }} />
                </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q}
                        onChange={e => onQChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400 sm:w-64"
                    />
                </div>
                <button className={btnPrimary} onClick={onExportCSV}>
                    <HiOutlineArrowDownTray className="h-4 w-4" /> Exportar CSV
                </button>
            </div>
        </div>
    );
};

export default ReportesToolbar;
