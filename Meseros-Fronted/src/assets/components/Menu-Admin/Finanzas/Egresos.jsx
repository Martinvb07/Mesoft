import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../../api/client';
import EgresoModal from './EgresoModal';
import {
    HiOutlineCalendarDays, HiOutlineTag, HiOutlineListBullet, HiOutlineCurrencyDollar,
    HiOutlineMagnifyingGlass, HiOutlineBanknotes, HiOutlineReceiptPercent, HiOutlinePlus,
} from 'react-icons/hi2';
import DateRangePicker from '../../ui/DateRangePicker';

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function MetricCard({ icon: Icon, value, label }) {
    return (
        <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
            <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                    <Icon className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold text-slate-900">{value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{label}</p>
        </motion.div>
    );
}

const Th = ({ children, right, center }) => (
    <th className={`px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 ${right ? 'text-right' : center ? 'text-center' : 'text-left'}`}>{children}</th>
);
const Td = ({ children, right, center, className = '' }) => (
    <td className={`px-3 py-2.5 text-sm text-slate-700 ${right ? 'text-right' : center ? 'text-center' : ''} ${className}`}>{children}</td>
);
const HeadCell = ({ icon: Icon, children, right, center }) => (
    <span className={`inline-flex items-center gap-1.5 ${right ? 'justify-end' : center ? 'justify-center' : ''}`}>{Icon && <Icon className="h-3.5 w-3.5" />} {children}</span>
);

const Egresos = () => {
    const [rows, setRows] = useState([]); // categorias agregadas
    const [detalles, setDetalles] = useState([]); // egresos detalle
    const [q, setQ] = useState('');
    const [cargando, setCargando] = useState(false);
    const [desde, setDesde] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
    });
    const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            setCargando(true);
            try {
                const [cats, det] = await Promise.all([
                    api.egresosCategorias({ desde, hasta }),
                    api.egresos({ desde, hasta }),
                ]);
                setRows(cats || []);
                setDetalles(det || []);
            }
            catch { setRows([]); setDetalles([]); }
            finally { setCargando(false); }
        };
        load();
    }, [desde, hasta]);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return detalles;
        return detalles.filter(r => (`${r.categoria || ''} ${r.descripcion || ''} ${r.monto || ''} ${r.fecha || ''}`).toLowerCase().includes(t));
    }, [detalles, q]);

    const total = useMemo(() => filtered.reduce((s, r) => s + Number(r.monto || 0), 0), [filtered]);
    const movs = useMemo(() => filtered.length, [filtered]);
    const totalCats = useMemo(() => rows.reduce((s, r) => s + Number(r.total || 0), 0), [rows]);

    const openModal = () => { setModalOpen(true); };
    const handleCreateEgreso = async (payload) => {
        await api.crearEgreso({
            categoria: payload.categoria || null,
            monto: Number(payload.monto),
            descripcion: `${payload.concepto || ''}${payload.descripcion ? ' — ' + payload.descripcion : ''}` || null,
            fecha: payload.fecha,
        });
        const [cats, det] = await Promise.all([
            api.egresosCategorias({ desde, hasta }),
            api.egresos({ desde, hasta }),
        ]);
        setRows(cats || []); setDetalles(det || []); setQ('');
    };

    return (
        <div className="ms-egresos mx-auto max-w-7xl">
            <style>{`:where(.ms-egresos) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Finanzas</span>
                <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Egresos</h1>
                <p className="m-0 mt-1 text-sm text-slate-500">Gastos por categoría en el rango seleccionado</p>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineBanknotes} value={fmtCOP(total)} label="Total egresos" />
                <MetricCard icon={HiOutlineListBullet} value={movs} label="Registros" />
                <MetricCard icon={HiOutlineReceiptPercent} value={rows.length} label="Categorías" />
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`}
            >
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Rango de fechas</label>
                    <DateRangePicker value={{ start: desde, end: hasta }} onChange={(s, e) => { setDesde(s); setHasta(e); }} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Buscar egresos…"
                            className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400 sm:w-56"
                        />
                    </div>
                    <button className={btnPrimary} onClick={openModal}>
                        <HiOutlinePlus className="h-4 w-4" /> Nuevo egreso
                    </button>
                </div>
            </motion.div>

            {/* Tablas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3"
            >
                {/* Listado */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-2`}>
                    <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Listado de egresos</h3>
                    {cargando ? (
                        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />)}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <Th><HeadCell icon={HiOutlineCalendarDays}>Fecha</HeadCell></Th>
                                        <Th><HeadCell icon={HiOutlineTag}>Categoría</HeadCell></Th>
                                        <Th>Descripción</Th>
                                        <Th right><HeadCell icon={HiOutlineCurrencyDollar} right>Monto</HeadCell></Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                            <Td>{r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '—'}</Td>
                                            <Td>{r.categoria || '—'}</Td>
                                            <Td className="text-slate-500">{r.descripcion || '—'}</Td>
                                            <Td right className="font-semibold text-slate-900">{fmtCOP(r.monto)}</Td>
                                        </tr>
                                    ))}
                                    {!filtered.length && <tr><td colSpan={4} className="px-3 py-10 text-center text-sm text-slate-400">Sin egresos en el rango.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                {/* Por categoría */}
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-1`}>
                    <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Por categoría</h3>
                    {cargando ? (
                        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />)}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <Th><HeadCell icon={HiOutlineTag}>Categoría</HeadCell></Th>
                                        <Th center><HeadCell icon={HiOutlineListBullet} center>Mov.</HeadCell></Th>
                                        <Th right><HeadCell icon={HiOutlineCurrencyDollar} right>Total</HeadCell></Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                            <Td className="font-medium text-slate-900">{r.categoria}</Td>
                                            <Td center>{r.movimientos}</Td>
                                            <Td right className="font-semibold">{fmtCOP(r.total)}</Td>
                                        </tr>
                                    ))}
                                    {!rows.length && <tr><td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-400">Sin datos para el rango.</td></tr>}
                                </tbody>
                                {rows.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t border-slate-100 bg-slate-50">
                                            <td colSpan={2} className="px-3 py-2.5 text-right text-sm font-extrabold text-slate-900">Total</td>
                                            <td className="px-3 py-2.5 text-right text-sm font-extrabold text-orange-600">{fmtCOP(totalCats)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            <EgresoModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreateEgreso} defaultDate={new Date().toISOString().slice(0, 10)} />
        </div>
    );
};

export default Egresos;
