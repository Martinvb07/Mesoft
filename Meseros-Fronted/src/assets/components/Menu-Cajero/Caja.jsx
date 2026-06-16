import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineBanknotes, HiOutlineTableCells, HiOutlineUser, HiOutlineClock,
    HiOutlineArrowPath, HiXMark, HiOutlineCreditCard, HiOutlinePrinter,
    HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';
import { api } from '../../../api/client';
import { useSocket } from '../../../hooks/useSocket';

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia', 'Mixto'];
const POLL = 20_000;

/* ─── helpers de presentación (alineados con el panel) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';

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
            <p className="mt-4 text-2xl font-extrabold text-slate-900">{value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{label}</p>
        </motion.div>
    );
}

function Modal({ title, onClose, children, footer, maxW = 'max-w-lg' }) {
    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`ms-caja flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
            >
                <style>{`:where(.ms-caja) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">{title}</h3>
                    <button onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"><HiXMark className="h-5 w-5" /></button>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
            </motion.div>
        </div>
    );
}

const Th = ({ children, right }) => (
    <th className={`px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 ${right ? 'text-right' : 'text-left'}`}>{children}</th>
);

const getRestaurantName = () => {
    for (const k of ['usuario', 'user', 'auth_user', 'currentUser']) {
        try {
            const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
            if (!raw) continue;
            const obj = JSON.parse(raw);
            const u = obj?.usuario || obj?.user || obj;
            const name = u?.restaurante || u?.nombreRestaurante || u?.nombre_restaurante || u?.empresa || u?.company;
            if (name) return String(name);
        } catch {}
    }
    return 'Mi Restaurante';
};

const Caja = () => {
    const [pedidos, setPedidos] = useState([]); // [{...pedido, items}]
    const [loading, setLoading] = useState(true);
    const [cobro, setCobro] = useState({ open: false, pedido: null });
    const [pagoForm, setPagoForm] = useState({ metodoPago: 'Efectivo', propina: '0', monto: '' });
    const [factura, setFactura] = useState({ visible: false, data: null });
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState([]);

    const pushToast = useCallback((msg) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev.slice(-3), { id, msg }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
    }, []);

    const restaurantId = (() => { try { return localStorage.getItem('restaurant_id') || null; } catch { return null; } })();

    const cargar = useCallback(async () => {
        try {
            const r = await api.pedidosPorCobrar();
            const arr = Array.isArray(r?.pedidos) ? r.pedidos : [];
            const enriched = await Promise.all(arr.map(async (p) => {
                try { const items = await api.getPedidoItems(p.id); return { ...p, items: Array.isArray(items) ? items : [] }; }
                catch { return { ...p, items: [] }; }
            }));
            setPedidos(enriched);
        } catch {
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        const t = setInterval(cargar, POLL);
        return () => clearInterval(t);
    }, [cargar]);

    // Tiempo real: refrescar cuando un mesero envía a caja o se cierra un pago
    useSocket(restaurantId, useCallback((event, data) => {
        if (event === 'pedido_por_cobrar') {
            const mesa = data?.mesa_numero ?? data?.mesa_id ?? '';
            const total = data?.total != null ? ` · ${fmtCOP(data.total)}` : '';
            pushToast(`Nuevo pedido por cobrar${mesa ? ` — Mesa ${mesa}` : ''}${total}`);
            cargar();
        } else if (event === 'pedido_cerrado') {
            cargar();
        }
    }, [cargar, pushToast]));

    const totalPorCobrar = useMemo(() => pedidos.reduce((s, p) => s + Number(p.total || 0), 0), [pedidos]);

    const abrirCobro = (pedido) => {
        setPagoForm({ metodoPago: 'Efectivo', propina: '0', monto: String(Number(pedido.total || 0)) });
        setCobro({ open: true, pedido });
    };
    const cerrarCobro = () => setCobro({ open: false, pedido: null });

    const subtotal = Number(cobro.pedido?.total || 0);
    const propina = Math.max(0, Number(pagoForm.propina || 0));
    const totalCobro = subtotal + propina;
    const recibido = Number(pagoForm.monto || 0);
    const cambio = Math.max(0, recibido - totalCobro);

    const confirmarCobro = async () => {
        const pedido = cobro.pedido;
        if (!pedido) return;
        const monto = Math.round(recibido);
        if (!monto || monto <= 0) return Swal.fire({ icon: 'error', title: 'Monto inválido' });
        if (monto < totalCobro) {
            return Swal.fire({ icon: 'warning', title: 'Monto insuficiente', html: `Total a pagar: <strong>${fmtCOP(totalCobro)}</strong><br/>Recibido: ${fmtCOP(monto)}` });
        }
        setSaving(true);
        try {
            const resp = await api.pagarPedido(pedido.id, { recibido: monto, propina: Math.round(propina), metodo_pago: pagoForm.metodoPago });
            cerrarCobro();
            setFactura({
                visible: true,
                data: {
                    restaurante: getRestaurantName(),
                    pedidoId: pedido.id,
                    mesaNumero: pedido.mesa_numero ?? pedido.mesa_id,
                    meseroNombre: pedido.mesero_nombre || '',
                    fecha: new Date(),
                    items: pedido.items || [],
                    subtotal,
                    propina: Math.round(propina),
                    total: totalCobro,
                    recibido: monto,
                    cambio,
                    metodoPago: pagoForm.metodoPago,
                    wompi_link: resp?.wompi_link || null,
                    bold_link: resp?.bold_link || null,
                },
            });
            cargar();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo registrar el cobro', text: e?.message || 'Error' });
        } finally {
            setSaving(false);
        }
    };

    const fechaHora = (iso) => {
        if (!iso) return '—';
        try { return new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)); } catch { return ''; }
    };

    return (
        <div className="ms-caja mx-auto max-w-7xl">
            {/* Toasts de notificación (nuevo pedido por cobrar) */}
            <div className="fixed bottom-4 right-4 z-[2000] flex flex-col gap-2">
                {toasts.map(t => (
                    <div key={t.id} className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-xl ring-1 ring-slate-100">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600"><HiOutlineBanknotes className="h-4 w-4" /></span>
                        {t.msg}
                    </div>
                ))}
            </div>
            <style>{`:where(.ms-caja) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Punto de cobro</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Caja</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Cuentas enviadas por los meseros, listas para cobrar</p>
                </div>
                <button className={btnGhost} onClick={() => { setLoading(true); cargar(); }}><HiOutlineArrowPath className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar</button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
                <MetricCard icon={HiOutlineClipboardDocumentList} value={pedidos.length} label="Cuentas por cobrar" />
                <MetricCard icon={HiOutlineBanknotes} value={fmtCOP(totalPorCobrar)} label="Total por cobrar" />
            </motion.div>

            {/* Cola de caja */}
            {loading ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`${cardBase} animate-pulse`}>
                            <div className="h-5 w-24 rounded bg-slate-200" />
                            <div className="mt-4 h-8 w-full rounded bg-slate-100" />
                            <div className="mt-2 h-8 w-2/3 rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
            ) : pedidos.length === 0 ? (
                <div className={`mt-6 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500"><HiOutlineBanknotes className="h-7 w-7" /></span>
                        <p className="m-0 text-base font-extrabold text-slate-900">No hay cuentas por cobrar</p>
                        <p className="m-0 text-sm text-slate-400">Cuando un mesero envíe una cuenta a caja, aparecerá aquí.</p>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    animate="visible"
                    className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {pedidos.map((p) => {
                        const items = Array.isArray(p.items) ? p.items : [];
                        const resumen = items.map(it => `${it.cantidad}× ${it.nombre}`).join(', ');
                        return (
                            <motion.div key={p.id} variants={itemUp} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200">
                                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><HiOutlineTableCells className="h-5 w-5" /></span>
                                        <div>
                                            <p className="m-0 text-base font-extrabold tracking-tight text-slate-900">Mesa {p.mesa_numero ?? p.mesa_id}</p>
                                            <p className="m-0 text-xs text-slate-400">#{p.id} · {fechaHora(p.fecha_hora)}</p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-sm font-extrabold text-orange-600">{fmtCOP(p.total)}</span>
                                </div>

                                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                                    {p.mesero_nombre && <div className="flex items-center gap-2 text-slate-500"><HiOutlineUser className="h-4 w-4 text-slate-400" /> {p.mesero_nombre}</div>}
                                    <div className="flex items-start gap-2 text-slate-500"><HiOutlineClipboardDocumentList className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> <span className="line-clamp-2">{resumen || 'Sin ítems'}</span></div>
                                </div>

                                <button className={`${btnPrimary} mt-4 w-full`} onClick={() => abrirCobro(p)}><HiOutlineCreditCard className="h-4 w-4" /> Cobrar</button>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Modal de cobro */}
            {cobro.open && cobro.pedido && (
                <Modal
                    title={`Cobrar — Mesa ${cobro.pedido.mesa_numero ?? cobro.pedido.mesa_id}`}
                    onClose={cerrarCobro}
                    footer={
                        <>
                            <button className={btnGhost} onClick={cerrarCobro} disabled={saving}>Cancelar</button>
                            <button className={btnPrimary} onClick={confirmarCobro} disabled={saving}>{saving ? 'Cobrando…' : 'Confirmar cobro'}</button>
                        </>
                    }
                >
                    {/* Items */}
                    <div className="mb-4 overflow-x-auto rounded-xl ring-1 ring-slate-100">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50"><tr className="border-b border-slate-100"><Th>Producto</Th><Th right>Cant.</Th><Th right>Subtotal</Th></tr></thead>
                            <tbody>
                                {(cobro.pedido.items || []).map((it, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 last:border-0">
                                        <td className="px-3 py-2.5 text-sm text-slate-700">{it.nombre}</td>
                                        <td className="px-3 py-2.5 text-right text-sm text-slate-700">{it.cantidad}</td>
                                        <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900">{fmtCOP(it.subtotal ?? (it.cantidad * it.precio))}</td>
                                    </tr>
                                ))}
                                {(cobro.pedido.items || []).length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-400">Sin ítems.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* Método de pago */}
                    <div className="mb-4">
                        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Método de pago</p>
                        <div className="flex flex-wrap gap-2">
                            {METODOS_PAGO.map(m => (
                                <button key={m} type="button" onClick={() => setPagoForm(f => ({ ...f, metodoPago: m }))} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${pagoForm.metodoPago === m ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{m}</button>
                            ))}
                        </div>
                    </div>

                    {/* Propina + Monto */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Propina (COP)</label>
                            <input type="number" min="0" className={inputCls} value={pagoForm.propina} onChange={e => setPagoForm(f => ({ ...f, propina: e.target.value }))} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Monto recibido (COP)</label>
                            <input type="number" min="1" className={inputCls} value={pagoForm.monto} onChange={e => setPagoForm(f => ({ ...f, monto: e.target.value }))} />
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-sm ring-1 ring-slate-100">
                        <div className="flex justify-between py-0.5"><span className="text-slate-500">Subtotal</span><span className="font-semibold text-slate-900">{fmtCOP(subtotal)}</span></div>
                        {propina > 0 && <div className="flex justify-between py-0.5"><span className="text-slate-500">Propina</span><span className="font-semibold text-slate-900">{fmtCOP(propina)}</span></div>}
                        <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold"><span className="text-slate-700">Total</span><span className="text-orange-600">{fmtCOP(totalCobro)}</span></div>
                        <div className="flex justify-between py-0.5 text-xs text-slate-400"><span>Cambio</span><span>{fmtCOP(cambio)}</span></div>
                    </div>
                </Modal>
            )}

            {/* Modal factura */}
            {factura.visible && factura.data && (
                <Modal
                    title="Factura"
                    onClose={() => setFactura({ visible: false, data: null })}
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => {
                                const el = document.getElementById('caja-invoice');
                                if (!el) return window.print();
                                const w = window.open('', 'PRINT', 'width=800,height=900');
                                if (!w) return;
                                w.document.write('<!doctype html><html><head><title>Factura</title><style>body{font-family:ui-sans-serif,system-ui;margin:24px;color:#111;} table{width:100%;border-collapse:collapse;} th,td{font-size:12px;padding:6px;} th{text-align:left;background:#f3f4f6;} td,th{border-top:1px solid #e5e7eb;} h3{margin:0 0 12px 0;}</style></head><body>');
                                w.document.write(`<h3>Factura #${factura.data.pedidoId}</h3>`);
                                w.document.write(el.innerHTML);
                                w.document.write('</body></html>');
                                w.document.close(); w.focus(); w.print(); w.close();
                            }}><HiOutlinePrinter className="h-4 w-4" /> Imprimir</button>
                            {factura.data.wompi_link && <a href={factura.data.wompi_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#00c8a0] px-4 py-2 text-sm font-semibold text-white no-underline">Wompi</a>}
                            {factura.data.bold_link && <a href={factura.data.bold_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-semibold text-white no-underline">Bold</a>}
                            <button className={btnPrimary} onClick={() => setFactura({ visible: false, data: null })}>Cerrar</button>
                        </>
                    }
                >
                    <div id="caja-invoice">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="m-0 text-lg font-extrabold text-slate-900">{factura.data.restaurante}</p>
                                <p className="m-0 text-xs text-slate-400">Factura #{factura.data.pedidoId}</p>
                                {factura.data.meseroNombre && <p className="m-0 text-xs text-slate-500">Mesero: {factura.data.meseroNombre}</p>}
                            </div>
                            <div className="text-right">
                                <p className="m-0 text-sm font-semibold text-slate-700">Mesa {factura.data.mesaNumero}</p>
                                <p className="m-0 text-xs text-slate-400">{new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }).format(new Date(factura.data.fecha))}</p>
                                <p className="m-0 text-xs text-slate-500">Método: {factura.data.metodoPago}</p>
                            </div>
                        </div>
                        <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-100">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50"><tr className="border-b border-slate-100"><Th>Producto</Th><Th right>Cant.</Th><Th right>Precio</Th><Th right>Subtotal</Th></tr></thead>
                                <tbody>
                                    {factura.data.items.map((it, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0">
                                            <td className="px-3 py-2.5 text-sm text-slate-700">{it.nombre}</td>
                                            <td className="px-3 py-2.5 text-right text-sm text-slate-700">{it.cantidad}</td>
                                            <td className="px-3 py-2.5 text-right text-sm text-slate-700">{fmtCOP(it.precio)}</td>
                                            <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900">{fmtCOP(it.subtotal ?? (it.cantidad * it.precio))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr><td colSpan={3} className="px-3 py-1.5 text-right text-sm text-slate-500">Subtotal</td><td className="px-3 py-1.5 text-right text-sm text-slate-700">{fmtCOP(factura.data.subtotal)}</td></tr>
                                    <tr><td colSpan={3} className="px-3 py-1.5 text-right text-sm text-slate-500">Propina</td><td className="px-3 py-1.5 text-right text-sm text-slate-700">{fmtCOP(factura.data.propina)}</td></tr>
                                    <tr><td colSpan={3} className="px-3 py-1.5 text-right text-sm font-extrabold text-slate-900">Total</td><td className="px-3 py-1.5 text-right text-sm font-extrabold text-orange-600">{fmtCOP(factura.data.total)}</td></tr>
                                    <tr><td colSpan={3} className="px-3 py-1.5 text-right text-sm text-slate-500">Recibido</td><td className="px-3 py-1.5 text-right text-sm text-slate-700">{fmtCOP(factura.data.recibido)}</td></tr>
                                    <tr><td colSpan={3} className="px-3 py-1.5 text-right text-sm text-slate-500">Cambio</td><td className="px-3 py-1.5 text-right text-sm text-slate-700">{fmtCOP(factura.data.cambio)}</td></tr>
                                </tfoot>
                            </table>
                        </div>
                        <p className="m-0 mt-3 text-center text-xs text-slate-400">Gracias por su compra.</p>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Caja;
