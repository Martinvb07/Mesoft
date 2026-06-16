import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineReceiptPercent, HiOutlineClock, HiOutlineCheckCircle, HiOutlineBanknotes,
    HiOutlineCurrencyDollar, HiXMark, HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash,
    HiOutlineDocumentArrowDown, HiOutlineArrowDownTray, HiOutlineCheck, HiOutlineArrowUturnLeft,
    HiOutlineArrowsUpDown, HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';
import Select from '../../ui/Select';
import DatePicker from '../../ui/DatePicker';
import DateRangePicker from '../../ui/DateRangePicker';

const nowIso = () => new Date().toISOString();
const toCurrency = (n) => (isNaN(n) ? '$0' : n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }));
const parseNum = (v) => { if (typeof v === 'number') return v; const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };
const clamp = (n, min = 0) => (isNaN(n) ? min : Math.max(min, n));

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function MetricCard({ icon: Icon, value, label }) {
    return (
        <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
            <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                    <Icon className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                </span>
            </div>
            <p className="mt-4 text-xl font-extrabold text-slate-900">{value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{label}</p>
        </motion.div>
    );
}

async function cargarMeserosAPI() {
    try {
        const data = await api.getMeseros();
        return (Array.isArray(data) ? data : []).map(u => ({ id: Number(u.id), nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim() || `Mesero ${u.id}` }));
    } catch (e) {
        return [];
    }
}

const Nominas = () => {
    const [nominas, setNominas] = useState([]);
    const [meseros, setMeseros] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [fEstado, setFEstado] = useState('todos'); // todos | pendiente | pagado
    const [fMes, setFMes] = useState(''); // YYYY-MM
    const [sort, setSort] = useState({ by: 'inicio', dir: 'desc' });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ empleadoId: '', inicio: '', fin: '', sueldoBase: '', extras: '', bonos: '', deducciones: '', estado: 'pendiente' });

    useEffect(() => {
        let cancel = false;
        async function load() {
            setCargando(true); setError('');
            try {
                const listaMeseros = await cargarMeserosAPI();
                if (!cancel) setMeseros(listaMeseros);
            } catch {}
            try {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const desde = `${y}-${m}-01`;
                const hasta = `${y}-${m}-31`;
                const data = await api.obtenerNomina('', desde, hasta);
                const rows = Array.isArray(data) ? data : [];
                const map = new Map(); // key: mesero|yyyy-mm-dd
                for (const r of rows) {
                    const dia = String(r.fecha).slice(0, 10);
                    const key = `${r.mesero_id}|${dia}`;
                    if (!map.has(key)) {
                        map.set(key, {
                            id: r.id,
                            empleadoId: r.mesero_id,
                            inicio: dia, fin: dia,
                            sueldoBase: 0, extras: 0, bonos: 0, deducciones: 0,
                            estado: 'pendiente',
                            createdAt: r.fecha, updatedAt: r.fecha,
                            movementIds: { sueldo: [], extra: [], bono: [], deduccion: [], descuento: [], pago: [] },
                        });
                    }
                    const g = map.get(key);
                    const monto = Number(r.monto || 0);
                    if (r.tipo === 'sueldo') { g.sueldoBase += monto; g.movementIds.sueldo.push(r.id); }
                    else if (r.tipo === 'extra') { g.extras += monto; g.movementIds.extra.push(r.id); }
                    else if (r.tipo === 'bono') { g.bonos += monto; g.movementIds.bono.push(r.id); }
                    else if (r.tipo === 'deduccion') { g.deducciones += monto; g.movementIds.deduccion.push(r.id); }
                    else if (r.tipo === 'descuento') { g.deducciones += monto; g.movementIds.descuento.push(r.id); }
                    else if (r.tipo === 'pago') { g.estado = 'pagado'; g.movementIds.pago.push(r.id); }
                    g.updatedAt = r.fecha;
                }
                const grouped = Array.from(map.values());
                if (!cancel) setNominas(grouped);
            } catch (e) {
                if (!cancel) setError('No se pudo cargar la nómina');
            } finally {
                if (!cancel) setCargando(false);
            }
        }
        load();
        return () => { cancel = true; };
    }, []);

    const nombreMesero = (id) => meseros.find(m => Number(m.id) === Number(id))?.nombre || `#${id}`;
    const totalDe = (n) => clamp(parseNum(n.sueldoBase)) + clamp(parseNum(n.extras)) + clamp(parseNum(n.bonos)) - clamp(parseNum(n.deducciones));

    const filtered = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        let arr = nominas.filter(n => {
            const nEmpleado = nombreMesero(n.empleadoId).toLowerCase();
            const inText = !q || nEmpleado.includes(q);
            const estOk = fEstado === 'todos' || n.estado === fEstado;
            const mesOk = !fMes || (String(n.inicio).startsWith(fMes) || String(n.fin).startsWith(fMes));
            return inText && estOk && mesOk;
        });
        const dir = sort.dir === 'asc' ? 1 : -1;
        const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0) * dir;
        arr.sort((a, b) => {
            const k = sort.by;
            if (k === 'total') return cmp(totalDe(a), totalDe(b));
            if (k === 'empleado') return cmp(nombreMesero(a.empleadoId), nombreMesero(b.empleadoId));
            return cmp(String(a[k] || ''), String(b[k] || ''));
        });
        return arr;
    }, [nominas, meseros, busqueda, fEstado, fMes, sort]);

    const metrics = useMemo(() => {
        const total = nominas.length;
        const pagadas = nominas.filter(n => n.estado === 'pagado').length;
        const pendientes = total - pagadas;
        const totalAPagar = nominas.reduce((s, n) => s + totalDe(n), 0);
        const pagado = nominas.filter(n => n.estado === 'pagado').reduce((s, n) => s + totalDe(n), 0);
        return { total, pagadas, pendientes, totalAPagar, pagado };
    }, [nominas]);

    const abrirNuevo = () => {
        setEditId(null);
        setForm({ empleadoId: meseros[0]?.id || '', inicio: new Date().toISOString().slice(0, 10), fin: new Date().toISOString().slice(0, 10), sueldoBase: '', extras: '', bonos: '', deducciones: '', estado: 'pendiente' });
        setShowModal(true);
    };
    const abrirEditar = (id) => {
        const n = nominas.find(x => x.id === id);
        if (!n) return;
        setEditId(id);
        setForm({ empleadoId: n.empleadoId, inicio: n.inicio, fin: n.fin, sueldoBase: String(n.sueldoBase), extras: String(n.extras), bonos: String(n.bonos), deducciones: String(n.deducciones), estado: n.estado });
        setShowModal(true);
    };
    const cerrarModal = () => setShowModal(false);

    const guardar = async () => {
        const empleadoId = Number(form.empleadoId);
        const inicio = String(form.inicio);
        const fin = String(form.fin);
        const sueldoBase = clamp(parseNum(form.sueldoBase));
        const extras = clamp(parseNum(form.extras));
        const bonos = clamp(parseNum(form.bonos));
        const deducciones = clamp(parseNum(form.deducciones));

        if (!empleadoId) return Swal.fire({ icon: 'error', title: 'Seleccione un empleado' });
        if (!inicio || !fin) return Swal.fire({ icon: 'error', title: 'Periodo requerido' });
        if (new Date(inicio) > new Date(fin)) return Swal.fire({ icon: 'error', title: 'El inicio no puede ser mayor que el fin' });

        try {
            const fecha = inicio;
            if (editId) {
                try {
                    const prev = await api.obtenerNomina(empleadoId, inicio, inicio);
                    const prevRows = Array.isArray(prev) ? prev : [];
                    const dels = prevRows
                        .filter(r => r.tipo !== 'pago')
                        .map(r => api.eliminarMovimientoNomina(r.id));
                    if (dels.length) await Promise.allSettled(dels);
                } catch {}
            }
            const ops = [];
            if (sueldoBase > 0) ops.push(api.crearMovimientoNomina({ mesero_id: empleadoId, tipo: 'sueldo', monto: sueldoBase, descripcion: 'Sueldo base', fecha }));
            if (extras > 0) ops.push(api.crearMovimientoNomina({ mesero_id: empleadoId, tipo: 'extra', monto: extras, descripcion: 'Horas extra', fecha }));
            if (bonos > 0) ops.push(api.crearMovimientoNomina({ mesero_id: empleadoId, tipo: 'bono', monto: bonos, descripcion: 'Bono', fecha }));
            if (deducciones > 0) ops.push(api.crearMovimientoNomina({ mesero_id: empleadoId, tipo: 'deduccion', monto: deducciones, descripcion: 'Deducción', fecha }));
            await Promise.all(ops);
            Swal.fire({ icon: 'success', title: 'Movimientos registrados', timer: 900, showConfirmButton: false });
            setShowModal(false);
            const y = String(inicio).slice(0, 4);
            const m = String(inicio).slice(5, 7);
            const desde = `${y}-${m}-01`;
            const hasta = `${y}-${m}-31`;
            const data = await api.obtenerNomina('', desde, hasta);
            const rows = Array.isArray(data) ? data : [];
            const map = new Map();
            for (const r of rows) {
                const dia = String(r.fecha).slice(0, 10);
                const key = `${r.mesero_id}|${dia}`;
                if (!map.has(key)) {
                    map.set(key, { id: r.id, empleadoId: r.mesero_id, inicio: dia, fin: dia, sueldoBase: 0, extras: 0, bonos: 0, deducciones: 0, estado: 'pendiente', createdAt: r.fecha, updatedAt: r.fecha, movementIds: { sueldo: [], extra: [], bono: [], deduccion: [], descuento: [], pago: [] } });
                }
                const g = map.get(key);
                const monto = Number(r.monto || 0);
                if (r.tipo === 'sueldo') { g.sueldoBase += monto; g.movementIds.sueldo.push(r.id); }
                else if (r.tipo === 'extra') { g.extras += monto; g.movementIds.extra.push(r.id); }
                else if (r.tipo === 'bono') { g.bonos += monto; g.movementIds.bono.push(r.id); }
                else if (r.tipo === 'deduccion') { g.deducciones += monto; g.movementIds.deduccion.push(r.id); }
                else if (r.tipo === 'descuento') { g.deducciones += monto; g.movementIds.descuento.push(r.id); }
                else if (r.tipo === 'pago') { g.estado = 'pagado'; g.movementIds.pago.push(r.id); }
            }
            setNominas(Array.from(map.values()));
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo guardar', 'error');
        }
    };

    const eliminar = async (id) => {
        const n = nominas.find(x => x.id === id);
        if (!n) return;
        const res = await Swal.fire({ title: `Eliminar nómina de ${nombreMesero(n.empleadoId)}`, text: `${n.inicio}. Se eliminarán los conceptos del día (sin afectar pagos).`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#ef4444' });
        if (!res.isConfirmed) return;
        try {
            const ids = [
                ...(n.movementIds?.sueldo || []),
                ...(n.movementIds?.extra || []),
                ...(n.movementIds?.bono || []),
                ...(n.movementIds?.deduccion || []),
                ...(n.movementIds?.descuento || []),
            ];
            if (ids.length === 0) return setNominas(prev => prev.filter(x => x.id !== id));
            await Promise.allSettled(ids.map(mid => api.eliminarMovimientoNomina(mid)));
            setNominas(prev => prev.filter(x => x.id !== id));
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 900, showConfirmButton: false });
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
        }
    };

    const marcarPago = async (id, pagar) => {
        const n = nominas.find(x => x.id === id);
        if (!n) return;
        try {
            if (pagar) {
                await api.marcarPagoNomina({ mesero_id: n.empleadoId, fecha: n.inicio, pagado: true, monto: totalDe(n), descripcion: `Pago nómina ${n.inicio} - ${n.fin}` });
                Swal.fire({ icon: 'success', title: 'Marcado como pagado', timer: 800, showConfirmButton: false });
                setNominas(prev => prev.map(x => x.id === id ? { ...x, estado: 'pagado' } : x));
            } else {
                await api.marcarPagoNomina({ mesero_id: n.empleadoId, fecha: n.inicio, pagado: false });
                Swal.fire({ icon: 'success', title: 'Marcado como pendiente', timer: 800, showConfirmButton: false });
                setNominas(prev => prev.map(x => x.id === id ? { ...x, estado: 'pendiente' } : x));
            }
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo cambiar el estado', 'error');
        }
    };

    const exportarPDFMesero = (n) => {
        const nombre = nombreMesero(n.empleadoId);
        const total = totalDe(n);
        const w = window.open('', 'PDF_NOMINA', 'width=700,height=900');
        if (!w) return;
        const rows = [
            ['Sueldo base', toCurrency(n.sueldoBase)],
            ['Extras', toCurrency(n.extras)],
            ['Bonos', toCurrency(n.bonos)],
            ['Deducciones', toCurrency(n.deducciones)],
            ['Total neto', toCurrency(total)],
            ['Estado', n.estado === 'pagado' ? 'Pagado' : 'Pendiente'],
        ];
        const rowsHtml = rows.map(([label, val]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${val}</td>
      </tr>`).join('');
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Nómina - ${nombre}</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,sans-serif;margin:40px;color:#111;background:#fff;}
        h1{font-size:1.4rem;margin:0 0 4px 0;}
        .sub{color:#6b7280;font-size:.9rem;margin-bottom:24px;}
        table{width:100%;border-collapse:collapse;margin-top:16px;}
        th{text-align:left;background:#f3f4f6;padding:8px 12px;font-size:.85rem;color:#374151;}
        th:last-child{text-align:right;}
        .footer{margin-top:32px;font-size:.8rem;color:#9ca3af;}
        .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:.8rem;font-weight:600;
               background:${n.estado === 'pagado' ? '#dcfce7' : '#fef3c7'};color:${n.estado === 'pagado' ? '#16a34a' : '#92400e'};}
      </style>
    </head><body>
      <h1>Comprobante de Nómina</h1>
      <div class="sub">Período: ${n.inicio} al ${n.fin}</div>
      <table>
        <thead><tr><th>Mesero</th><th style="text-align:right">${nombre}</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div style="margin-top:20px;">Estado: <span class="badge">${n.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</span></div>
      <div class="footer">Generado: ${new Date().toLocaleString('es-CO')}</div>
    </body></html>`);
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    const exportarCSV = () => {
        const headers = ['Empleado', 'Inicio', 'Fin', 'SueldoBase', 'Extras', 'Bonos', 'Deducciones', 'Total', 'Estado', 'Creado', 'Actualizado'];
        const rows = nominas.map(n => [nombreMesero(n.empleadoId), n.inicio, n.fin, n.sueldoBase, n.extras, n.bonos, n.deducciones, totalDe(n), n.estado, n.createdAt, n.updatedAt]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `nominas_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const toggleSort = (by) => setSort(prev => prev.by === by ? { by, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { by, dir: 'asc' });

    const SortTh = ({ by, children, right }) => (
        <th
            onClick={by ? () => toggleSort(by) : undefined}
            className={`select-none px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 ${by ? 'cursor-pointer hover:text-slate-600' : ''} ${right ? 'text-right' : 'text-left'}`}
        >
            <span className={`inline-flex items-center gap-1 ${right ? 'justify-end' : ''}`}>
                {children}
                {by && <HiOutlineArrowsUpDown className={`h-3 w-3 ${sort.by === by ? 'text-orange-500' : 'opacity-40'}`} />}
            </span>
        </th>
    );

    const totalEstimado = totalDe({ sueldoBase: parseNum(form.sueldoBase), extras: parseNum(form.extras), bonos: parseNum(form.bonos), deducciones: parseNum(form.deducciones) });

    return (
        <div className="ms-nominas mx-auto max-w-7xl">
            <style>{`:where(.ms-nominas) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Finanzas</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Nóminas</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Pagos, deducciones y periodos del equipo</p>
                </div>
                <button className={btnPrimary} onClick={abrirNuevo}><HiOutlinePlus className="h-4 w-4" /> Nueva nómina</button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
            >
                <MetricCard icon={HiOutlineReceiptPercent} value={metrics.total} label="Registros" />
                <MetricCard icon={HiOutlineClock} value={metrics.pendientes} label="Pendientes" />
                <MetricCard icon={HiOutlineCheckCircle} value={metrics.pagadas} label="Pagadas" />
                <MetricCard icon={HiOutlineCurrencyDollar} value={toCurrency(metrics.totalAPagar)} label="Total a pagar" />
                <MetricCard icon={HiOutlineBanknotes} value={toCurrency(metrics.pagado)} label="Pagado" />
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}
            >
                <div className="relative lg:max-w-xs lg:flex-1">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar por empleado…"
                        className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select className="min-w-[140px]" value={fEstado} onChange={e => setFEstado(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                    </Select>
                    <DatePicker mode="month" placeholder="Todos los meses" className="min-w-[150px]" value={fMes} onChange={e => setFMes(e.target.value)} />
                    <button className={btnGhost} onClick={exportarCSV}><HiOutlineArrowDownTray className="h-4 w-4" /> Exportar CSV</button>
                </div>
            </motion.div>

            {/* Tabla */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
                className={`mt-5 ${cardBase} overflow-hidden p-0`}
            >
                {cargando ? (
                    <div className="space-y-3 p-5">{[...Array(5)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500"><HiOutlineReceiptPercent className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-500">{error}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineReceiptPercent className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">No hay nóminas que coincidan con los filtros.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <SortTh by="empleado">Empleado</SortTh>
                                    <SortTh by="inicio">Inicio</SortTh>
                                    <SortTh>Fin</SortTh>
                                    <SortTh right>Sueldo</SortTh>
                                    <SortTh right>Extras</SortTh>
                                    <SortTh right>Bonos</SortTh>
                                    <SortTh right>Deduc.</SortTh>
                                    <SortTh by="total" right>Total</SortTh>
                                    <SortTh>Estado</SortTh>
                                    <SortTh right>Acciones</SortTh>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(n => (
                                    <tr key={n.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60">
                                        <td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{nombreMesero(n.empleadoId)}</td>
                                        <td className="px-3 py-2.5 text-sm text-slate-500">{n.inicio}</td>
                                        <td className="px-3 py-2.5 text-sm text-slate-500">{n.fin}</td>
                                        <td className="px-3 py-2.5 text-right text-sm text-slate-700">{toCurrency(n.sueldoBase)}</td>
                                        <td className="px-3 py-2.5 text-right text-sm text-slate-700">{toCurrency(n.extras)}</td>
                                        <td className="px-3 py-2.5 text-right text-sm text-slate-700">{toCurrency(n.bonos)}</td>
                                        <td className="px-3 py-2.5 text-right text-sm text-red-600">{toCurrency(n.deducciones)}</td>
                                        <td className="px-3 py-2.5 text-right"><span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-extrabold text-orange-600">{toCurrency(totalDe(n))}</span></td>
                                        <td className="px-3 py-2.5">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${n.estado === 'pagado' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${n.estado === 'pagado' ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {n.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => abrirEditar(n.id)} title="Editar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"><HiOutlinePencilSquare className="h-4 w-4" /></button>
                                                {n.estado === 'pagado' ? (
                                                    <button onClick={() => marcarPago(n.id, false)} title="Marcar pendiente" className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 ring-1 ring-amber-100 transition-colors hover:bg-amber-50"><HiOutlineArrowUturnLeft className="h-4 w-4" /></button>
                                                ) : (
                                                    <button onClick={() => marcarPago(n.id, true)} title="Marcar pagado" className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-50"><HiOutlineCheck className="h-4 w-4" /></button>
                                                )}
                                                <button onClick={() => exportarPDFMesero(n)} title="PDF" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"><HiOutlineDocumentArrowDown className="h-4 w-4" /></button>
                                                <button onClick={() => eliminar(n.id)} title="Eliminar" className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50"><HiOutlineTrash className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Modal crear/editar nómina */}
            {showModal && (
                <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="ms-nominas flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">{editId ? 'Editar nómina' : 'Nueva nómina'}</h3>
                            <button onClick={cerrarModal} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"><HiXMark className="h-5 w-5" /></button>
                        </div>
                        <div className="overflow-y-auto px-5 py-4">
                            <p className="m-0 mb-4 text-sm text-slate-500">Registra el periodo y los conceptos de pago.</p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Empleado</label>
                                    <Select className="w-full" placeholder="Selecciona un empleado" value={form.empleadoId} onChange={e => setForm(f => ({ ...f, empleadoId: Number(e.target.value) }))}>
                                        {meseros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </Select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Periodo (inicio → fin)</label>
                                    <DateRangePicker value={{ start: form.inicio, end: form.fin }} onChange={(s, e) => setForm(f => ({ ...f, inicio: s, fin: e }))} />
                                </div>
                                <div>
                                    <label className={labelCls}>Sueldo base</label>
                                    <input type="number" inputMode="decimal" min="0" className={inputCls} value={form.sueldoBase} onChange={e => setForm(f => ({ ...f, sueldoBase: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={labelCls}>Extras</label>
                                    <input type="number" inputMode="decimal" min="0" className={inputCls} value={form.extras} onChange={e => setForm(f => ({ ...f, extras: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={labelCls}>Bonos</label>
                                    <input type="number" inputMode="decimal" min="0" className={inputCls} value={form.bonos} onChange={e => setForm(f => ({ ...f, bonos: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={labelCls}>Deducciones</label>
                                    <input type="number" inputMode="decimal" min="0" className={inputCls} value={form.deducciones} onChange={e => setForm(f => ({ ...f, deducciones: e.target.value }))} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Estado</label>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, estado: f.estado === 'pagado' ? 'pendiente' : 'pagado' }))}
                                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold ring-1 transition-colors ${form.estado === 'pagado' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}
                                    >
                                        {form.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                                        <span className={`relative h-5 w-9 rounded-full transition-colors ${form.estado === 'pagado' ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${form.estado === 'pagado' ? 'left-[18px]' : 'left-0.5'}`} />
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                                <span className="text-sm font-semibold text-slate-600">Total estimado</span>
                                <span className="text-lg font-extrabold text-orange-600">{toCurrency(totalEstimado)}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
                            <button className={btnGhost} onClick={cerrarModal}>Cancelar</button>
                            <button className={btnPrimary} onClick={guardar}>{editId ? 'Guardar cambios' : 'Crear nómina'}</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Nominas;
