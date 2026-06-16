import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    HiOutlineTableCells, HiOutlineUserGroup, HiOutlineBanknotes, HiOutlineCreditCard,
    HiOutlineClock, HiOutlineEnvelope, HiOutlinePhone, HiOutlineIdentification,
    HiOutlineArrowRight, HiXMark, HiOutlineBackspace,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';

/* Helpers de fecha en zona Colombia */
const toBogotaDateParts = (date = new Date()) => {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = fmt.formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
    return { year: parts.year, month: parts.month, day: parts.day };
};
const todayKey = () => { const { year, month, day } = toBogotaDateParts(); return `${year}-${month}-${day}`; };

/* ─── helpers de presentación (alineados con Inicio / Mesas admin) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const ESTADO_DOT = { libre: 'bg-emerald-500', ocupada: 'bg-orange-500', limpieza: 'bg-amber-500', reservada: 'bg-sky-500' };
const ESTADO_LABEL = { libre: 'Libre', ocupada: 'Ocupada', limpieza: 'En limpieza', reservada: 'Reservada' };

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

const Home = () => {
    const [perfil, setPerfil] = useState({ nombre: 'Mesero', apellido: '', telefono: '', correo: '', documento: '', usuario: '', rol: 'mesero', userId: null });
    const nombre = perfil.nombre; const apellido = perfil.apellido; const telefono = perfil.telefono; const correo = perfil.correo; const documento = perfil.documento; const usuario = perfil.usuario; const rol = perfil.rol; const userId = perfil.userId;
    const iniciales = ((nombre?.[0] || '') + (apellido?.[0] || '')).toUpperCase();

    const [mesas, setMesas] = useState([]);
    const [meseroInfo, setMeseroInfo] = useState(null);
    const [ventasHoy, setVentasHoy] = useState(0);
    const [propinasHoy, setPropinasHoy] = useState(0);
    const [mesasHoy, setMesasHoy] = useState(0);

    const [bonosMes, setBonosMes] = useState(0);
    const [adelantosMes, setAdelantosMes] = useState(0);
    const [descuentosMes, setDescuentosMes] = useState(0);
    const [pagosNominaMes, setPagosNominaMes] = useState(0);
    const [sueldoBase, setSueldoBase] = useState(0);
    const [propinasMes, setPropinasMes] = useState(0);

    const [enTurno, setEnTurno] = useState(false);
    const [turnoInicio, setTurnoInicio] = useState(null);
    const [turnoLoading, setTurnoLoading] = useState(false);
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    const [pedidoPorMesa, setPedidoPorMesa] = useState({});
    const [pedidoModal, setPedidoModal] = useState({ mesa: null });

    useEffect(() => {
        const loadMesas = async () => {
            try { const data = await api.getMesas(); setMesas(Array.isArray(data) ? data : []); }
            catch (e) { setMesas([]); }
        };
        loadMesas();
    }, []);

    useEffect(() => {
        const loadTurno = async () => {
            try {
                const me = await api.getMiMesero();
                if (me) { setEnTurno(!!me.esta_en_turno); setTurnoInicio(me.turno_inicio || null); }
            } catch {}
        };
        loadTurno();
    }, []);

    useEffect(() => {
        const loadPerfil = async () => {
            try {
                const me = await api.getMiMesero();
                setPerfil(prev => ({ ...prev, nombre: me?.nombre || 'Mesero', correo: me?.correo || '', rol: 'mesero', userId: me?.usuario_id ?? null }));
                setMeseroInfo({ id: me?.id, nombre: me?.nombre, sueldo_base: Number(me?.sueldo_base || 0) });
                setSueldoBase(Number(me?.sueldo_base || 0));
            } catch {
                setPerfil(prev => ({ ...prev, userId: null }));
                setMeseroInfo(null);
            }
        };
        loadPerfil();
    }, []);

    useEffect(() => {
        if (!userId) return;
        const loadMesero = async () => {
            try {
                const list = await api.getMeseros();
                const me = (Array.isArray(list) ? list : []).find(m => Number(m.usuario_id) === Number(userId));
                if (me) { setMeseroInfo({ id: me.id, nombre: me.nombre, sueldo_base: Number(me.sueldo_base || 0) }); setSueldoBase(Number(me.sueldo_base || 0)); }
                else { setMeseroInfo(null); }
            } catch { setMeseroInfo(null); }
        };
        loadMesero();
    }, [userId]);

    useEffect(() => {
        const loadVentasHoy = async () => {
            try { const r = await api.ventasHoy(); setVentasHoy(Number(r?.ventas || 0)); }
            catch { setVentasHoy(0); }
        };
        loadVentasHoy();
    }, []);

    useEffect(() => {
        const loadPropinasYMesasHoy = async () => {
            if (!meseroInfo?.id) return;
            const hoy = todayKey();
            try {
                const p = await api.propinas(meseroInfo.id, hoy, hoy).catch(() => ({ propinas: 0 }));
                setPropinasHoy(Number(p?.propinas || 0));
                const enCursoMi = await api.pedidosEnCursoMi().catch(() => ({ count: 0 }));
                setMesasHoy(Number(enCursoMi?.count || 0));
            } catch { setPropinasHoy(0); setMesasHoy(0); }
        };
        loadPropinasYMesasHoy();
    }, [meseroInfo?.id]);

    useEffect(() => {
        const loadNomina = async () => {
            if (!meseroInfo?.id) return;
            try {
                const r = await api.nominaResumen(meseroInfo.id);
                setSueldoBase(Number(r?.sueldo_base || 0));
                setBonosMes(Number(r?.bonos || 0));
                setAdelantosMes(Number(r?.adelantos || 0));
                setDescuentosMes(Number(r?.descuentos || 0));
                setPagosNominaMes(Number(r?.pagado || 0));
                setPropinasMes(Number(r?.propinas_mes || 0));
            } catch { setBonosMes(0); setAdelantosMes(0); setDescuentosMes(0); setPagosNominaMes(0); setPropinasMes(0); }
        };
        loadNomina();
    }, [meseroInfo?.id]);

    const [misMesasBase, setMisMesasBase] = useState([]);
    useEffect(() => {
        const loadMis = async () => {
            try { const mm = await api.getMisMesas(); setMisMesasBase(Array.isArray(mm) ? mm.sort((a, b) => a.numero - b.numero) : []); }
            catch { setMisMesasBase([]); }
        };
        loadMis();
    }, [meseroInfo?.id]);

    useEffect(() => {
        const loadTotales = async () => {
            if (!misMesasBase.length) { setPedidoPorMesa({}); return; }
            const acc = {};
            for (const m of misMesasBase) {
                try {
                    const ped = await api.getPedidoAbiertoDeMesa(m.id);
                    if (!ped || !ped.id) { acc[m.id] = { total: 0, items: [] }; continue; }
                    const items = await api.getPedidoItems(ped.id).catch(() => []);
                    const total = (Array.isArray(items) ? items : []).reduce((s, it) => s + Number(it.subtotal || (it.cantidad || 0) * (it.precio || 0)), 0);
                    acc[m.id] = { total, items };
                } catch { acc[m.id] = { total: 0, items: [] }; }
            }
            setPedidoPorMesa(acc);
        };
        loadTotales();
    }, [misMesasBase.length]);

    const formatTurnoDuration = (isoStart) => {
        if (!isoStart) return '';
        const diff = Date.now() - new Date(isoStart).getTime();
        const m = Math.floor(diff / 60000);
        const h = Math.floor(m / 60);
        const rm = m % 60;
        if (h > 0) return `${h}h ${rm}m`;
        return `${m}m`;
    };

    const doCheckin = async () => {
        setTurnoLoading(true);
        try {
            const res = await api.meseroCheckin();
            setEnTurno(true);
            setTurnoInicio(res?.turno_inicio || new Date().toISOString());
        } catch (e) { alert(`Error al iniciar turno: ${e.message}`); }
        finally { setTurnoLoading(false); }
    };

    const handleCheckin = () => {
        try {
            const settings = JSON.parse(localStorage.getItem('app_settings_v1') || '{}');
            const pin = settings.pinApertura || '';
            if (pin) { setPinInput(''); setPinError(''); setPinModalOpen(true); return; }
        } catch {}
        doCheckin();
    };

    const confirmarPIN = () => {
        try {
            const settings = JSON.parse(localStorage.getItem('app_settings_v1') || '{}');
            const pin = settings.pinApertura || '';
            if (pinInput === pin) { setPinModalOpen(false); setPinInput(''); setPinError(''); doCheckin(); }
            else { setPinError('PIN incorrecto. Intenta de nuevo.'); }
        } catch { setPinError('Error al verificar el PIN.'); }
    };

    const handleCheckout = async () => {
        setTurnoLoading(true);
        try { await api.meseroCheckout(); setEnTurno(false); setTurnoInicio(null); }
        catch (e) { alert(`Error al finalizar turno: ${e.message}`); }
        finally { setTurnoLoading(false); }
    };

    const abrirPedido = (mesa) => { if (!mesa) return; setPedidoModal({ mesa }); };
    const cerrarPedido = () => setPedidoModal({ mesa: null });

    const sueldoNetoMes = sueldoBase + bonosMes - adelantosMes - descuentosMes;
    const saldoPorPagarMes = Math.max(0, sueldoNetoMes - pagosNominaMes);

    const misMesas = misMesasBase.map(m => {
        const info = pedidoPorMesa[m.id] || { total: 0 };
        return { ...m, totalPedido: info.total, pendiente: info.total };
    });

    const nominaRows = [
        { label: 'Sueldo base', value: sueldoBase },
        { label: 'Bonos del mes', value: bonosMes },
        { label: 'Adelantos del mes', value: -adelantosMes, neg: true },
        { label: 'Descuentos del mes', value: -descuentosMes, neg: true },
        { label: 'Pagado este mes', value: pagosNominaMes },
        { label: 'Saldo por pagar', value: saldoPorPagarMes, strong: true },
        { label: 'Propinas del mes', value: propinasMes, sub: '(no incluidas en saldo)' },
    ];

    return (
        <div className="ms-home-mesero mx-auto max-w-7xl">
            <style>{`:where(.ms-home-mesero) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Panel del mesero</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Hola, {nombre}</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Gestiona tus mesas y pedidos rápidamente desde aquí</p>
                </div>
                <Link className={`${btnPrimary} no-underline`} to="/mesero/mesas">Ir a Mesas <HiOutlineArrowRight className="h-4 w-4" /></Link>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineTableCells} value={mesasHoy} label="Mesas atendidas hoy" />
                <MetricCard icon={HiOutlineBanknotes} value={fmtCOP(ventasHoy)} label="Ventas de hoy" />
                <MetricCard icon={HiOutlineCreditCard} value={fmtCOP(propinasHoy)} label="Propinas de hoy" />
            </motion.div>

            {/* Panel de turno */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
            >
                <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${enTurno ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <HiOutlineClock className="h-5 w-5" />
                    </span>
                    <div>
                        <p className={`m-0 text-base font-extrabold ${enTurno ? 'text-emerald-600' : 'text-slate-700'}`}>{enTurno ? 'En turno' : 'Fuera de turno'}</p>
                        {enTurno && turnoInicio && (
                            <p className="m-0 text-sm text-slate-400">Trabajando {formatTurnoDuration(turnoInicio)} · inicio {new Date(turnoInicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                    </div>
                </div>
                {enTurno ? (
                    <button className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60" disabled={turnoLoading} onClick={handleCheckout}>
                        <HiOutlineClock className="h-4 w-4" />
                        {turnoLoading ? 'Finalizando…' : 'Finalizar turno'}
                    </button>
                ) : (
                    <button className={btnPrimary} disabled={turnoLoading} onClick={handleCheckin}>{turnoLoading ? 'Iniciando…' : 'Iniciar turno'}</button>
                )}
            </motion.div>

            {/* Atajos + Perfil */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3"
            >
                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-2`}>
                    <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Atajos rápidos</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                            { to: '/mesero/mesas', label: 'Gestionar Mesas', icon: HiOutlineTableCells },
                            { to: '/mesero/meseros', label: 'Compañeros', icon: HiOutlineUserGroup },
                        ].map(s => (
                            <Link key={s.to} to={s.to} className="group flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3.5 no-underline ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:bg-white hover:ring-orange-200">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                                    <s.icon className="h-5 w-5" />
                                </span>
                                <span className="text-sm font-bold text-slate-700">{s.label}</span>
                                <HiOutlineArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-orange-500" />
                            </Link>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemUp} className={`${cardBase} lg:col-span-1`}>
                    <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Mi perfil</h3>
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-lg font-extrabold text-white shadow-sm shadow-orange-500/30">
                            {iniciales || (nombre?.[0] || 'M')}
                        </span>
                        <div className="min-w-0">
                            <p className="m-0 truncate text-sm font-extrabold text-slate-900">{nombre} {apellido}</p>
                            <p className="m-0 text-xs capitalize text-slate-400">{rol || 'mesero'}{usuario ? ` · ${usuario}` : ''}</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
                        {telefono && <div className="flex items-center gap-2 text-slate-500"><HiOutlinePhone className="h-4 w-4 text-slate-400" /> {telefono}</div>}
                        {correo && <div className="flex items-center gap-2 text-slate-500"><HiOutlineEnvelope className="h-4 w-4 text-slate-400" /> <span className="truncate">{correo}</span></div>}
                        {documento && <div className="flex items-center gap-2 text-slate-500"><HiOutlineIdentification className="h-4 w-4 text-slate-400" /> {documento}</div>}
                        {!telefono && !correo && !documento && <p className="m-0 text-sm text-slate-400">Sin datos de contacto.</p>}
                    </div>
                </motion.div>
            </motion.div>

            {/* Mis mesas + Nómina */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2"
            >
                {/* Mis mesas */}
                <motion.div variants={itemUp} className={cardBase}>
                    <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Mis mesas</h3>
                    {misMesas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineTableCells className="h-5 w-5" /></span>
                            <p className="m-0 text-sm text-slate-400">Aún no tienes mesas asignadas. <Link to="/mesero/mesas" className="font-semibold text-orange-600 no-underline hover:underline">Ir a Mesas</Link></p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {misMesas.map(m => (
                                <div key={m.id} onClick={() => abrirPedido(m)} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100 transition-colors hover:bg-white hover:ring-orange-200">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ESTADO_DOT[m.estado] || 'bg-slate-300'}`} />
                                    <div className="min-w-0">
                                        <p className="m-0 text-sm font-bold text-slate-900">Mesa {m.numero}</p>
                                        <p className="m-0 text-xs text-slate-400">{ESTADO_LABEL[m.estado] || m.estado}</p>
                                    </div>
                                    {m.totalPedido > 0 && (
                                        <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${m.pendiente > 0 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}`}>
                                            {m.pendiente > 0 ? `Pendiente ${fmtCOP(m.pendiente)}` : 'Saldado'}
                                        </span>
                                    )}
                                    <span className={`text-sm font-extrabold text-slate-900 ${m.totalPedido > 0 ? '' : 'ml-auto'}`}>{fmtCOP(m.totalPedido)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Nómina */}
                <motion.div variants={itemUp} className={cardBase}>
                    <h3 className="m-0 mb-4 text-base font-extrabold tracking-tight text-slate-900">Nómina <span className="font-medium text-slate-400">(mes actual)</span></h3>
                    <div className="divide-y divide-slate-100">
                        {nominaRows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between gap-2 py-2.5">
                                <span className="text-sm text-slate-600">
                                    {r.label}
                                    {r.sub && <span className="ml-1.5 text-xs text-slate-400">{r.sub}</span>}
                                </span>
                                <span className={`text-sm ${r.strong ? 'font-extrabold text-orange-600' : r.neg ? 'font-semibold text-red-600' : 'font-extrabold text-slate-900'}`}>
                                    {r.neg ? `-${fmtCOP(Math.abs(r.value))}` : fmtCOP(r.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="m-0 mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">La nómina se calcula desde los movimientos registrados en el sistema.</p>
                </motion.div>
            </motion.div>

            {/* Modal pedido (solo lectura) */}
            {pedidoModal.mesa && (
                <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="ms-home-mesero flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">Pedido Mesa {pedidoModal.mesa.numero}</h3>
                            <button onClick={cerrarPedido} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"><HiXMark className="h-5 w-5" /></button>
                        </div>
                        <div className="overflow-y-auto px-5 py-4">
                            <p className="m-0 mb-3 text-sm text-slate-500">Vista de solo lectura. Para gestionar pedidos, ve a la pantalla de Mesas.</p>
                            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-100">
                                            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Producto</th>
                                            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-400">Cant.</th>
                                            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-400">Precio</th>
                                            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-400">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(pedidoPorMesa[pedidoModal.mesa.id]?.items || []).map((it, idx) => (
                                            <tr key={idx} className="border-b border-slate-50 last:border-0">
                                                <td className="px-3 py-2.5 text-sm text-slate-700">{it.nombre || it.producto_nombre || '—'}</td>
                                                <td className="px-3 py-2.5 text-right text-sm text-slate-700">{it.cantidad}</td>
                                                <td className="px-3 py-2.5 text-right text-sm text-slate-700">{fmtCOP(it.precio)}</td>
                                                <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900">{fmtCOP(it.subtotal || ((it.cantidad || 0) * (it.precio || 0)))}</td>
                                            </tr>
                                        ))}
                                        {(pedidoPorMesa[pedidoModal.mesa.id]?.items || []).length === 0 && (
                                            <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-400">Sin productos.</td></tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50">
                                            <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-bold text-slate-700">Total</td>
                                            <td className="px-3 py-2.5 text-right text-sm font-extrabold text-orange-600">{fmtCOP(pedidoPorMesa[pedidoModal.mesa.id]?.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
                            <button className={btnGhost} onClick={cerrarPedido}>Cerrar</button>
                            <Link className={`${btnPrimary} no-underline`} to="/mesero/mesas">Gestionar en Mesas</Link>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* PIN Modal (apertura de turno) */}
            {pinModalOpen && (
                <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="ms-home-mesero w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-100"
                    >
                        <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">Apertura de turno</h3>
                        <p className="m-0 mt-1 text-sm text-slate-400">Ingresa el PIN de 4 dígitos para comenzar.</p>
                        <div className="mt-4 flex justify-center gap-2">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`flex h-12 w-11 items-center justify-center rounded-xl text-2xl font-extrabold text-slate-900 ring-2 transition-colors ${i < pinInput.length ? 'bg-orange-50 ring-orange-400' : 'bg-slate-50 ring-slate-200'}`}>
                                    {i < pinInput.length ? '●' : ''}
                                </div>
                            ))}
                        </div>
                        {pinError && <p className="m-0 mt-2 text-sm font-semibold text-red-600">{pinError}</p>}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={k === ''}
                                    onClick={() => {
                                        if (k === '⌫') { setPinInput(p => p.slice(0, -1)); setPinError(''); }
                                        else if (typeof k === 'number' && pinInput.length < 4) { setPinInput(pinInput + String(k)); setPinError(''); }
                                    }}
                                    className={`rounded-xl py-3 text-xl font-bold transition-colors ${k === '' ? 'pointer-events-none' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                                >
                                    {k === '⌫' ? <HiOutlineBackspace className="mx-auto h-5 w-5" /> : k}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-center gap-2">
                            <button type="button" className={btnGhost} onClick={() => { setPinModalOpen(false); setPinInput(''); setPinError(''); }}>Cancelar</button>
                            <button type="button" className={btnPrimary} onClick={confirmarPIN}>Confirmar</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Home;
