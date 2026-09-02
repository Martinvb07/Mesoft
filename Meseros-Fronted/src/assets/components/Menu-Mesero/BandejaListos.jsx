import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineBellAlert, HiXMark, HiOutlineCheck, HiOutlineClock } from 'react-icons/hi2';
import { api } from '../../../api/client';

/* Bandeja de platos listos que el mesero todavía no recoge.
   El toast se pierde si el mesero está en otra pantalla o con el celular
   guardado; esto queda hasta que alguien lo marque como recogido. */

const haceCuanto = (desde) => {
    if (!desde) return '';
    const min = Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 60000));
    if (min < 1) return 'recién';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    return `hace ${h} h ${min % 60} min`;
};

export default function BandejaListos({ recargarSenal = 0 }) {
    const [items, setItems] = useState([]);
    const [abierta, setAbierta] = useState(false);
    const [ocupado, setOcupado] = useState(null);
    const [, setTick] = useState(0);

    const cargar = useCallback(async () => {
        try {
            const data = await api.misListosPendientes();
            setItems(Array.isArray(data) ? data : []);
        } catch { /* sin conexión: dejamos lo último que se vio */ }
    }, []);

    useEffect(() => { cargar(); }, [cargar, recargarSenal]);

    // Refresca los "hace X min" y sirve de red de seguridad si el socket cae
    useEffect(() => {
        const t = setInterval(() => { setTick(n => n + 1); cargar(); }, 60000);
        return () => clearInterval(t);
    }, [cargar]);

    const recoger = async (it) => {
        setOcupado(it.id);
        try {
            await api.marcarItemEntregado(it.pedido_id, it.id);
            setItems(prev => prev.filter(x => x.id !== it.id));
        } catch { /* si falla, la próxima recarga lo vuelve a mostrar */ }
        finally { setOcupado(null); }
    };

    if (!items.length && !abierta) return null;

    return (
        <>
            <motion.button
                type="button"
                onClick={() => setAbierta(v => !v)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed bottom-5 right-5 z-[1100] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl"
                style={{ backgroundColor: '#f97316', boxShadow: '0 12px 30px -8px rgba(249,115,22,.6)' }}
                aria-label={`${items.length} platos listos por recoger`}
            >
                <HiOutlineBellAlert className="h-6 w-6" />
                {items.length > 0 && (
                    <span
                        className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-extrabold"
                        style={{ backgroundColor: '#0f172a', color: '#fff' }}
                    >
                        {items.length}
                    </span>
                )}
            </motion.button>

            <AnimatePresence>
                {abierta && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setAbierta(false)}
                            className="fixed inset-0 z-[1099] bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed bottom-24 right-5 z-[1100] flex max-h-[70vh] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                <div>
                                    <p className="m-0 text-sm font-extrabold tracking-tight text-slate-900">Listos por recoger</p>
                                    <p className="m-0 text-[11px] text-slate-400">Cocina ya los terminó</p>
                                </div>
                                <button onClick={() => setAbierta(false)} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                                    <HiXMark className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto">
                                {items.length === 0 ? (
                                    <p className="m-0 px-4 py-10 text-center text-sm text-slate-400">Nada pendiente por recoger.</p>
                                ) : (
                                    <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                                        {items.map(it => (
                                            <li key={it.id} className="flex list-none items-center gap-3 px-4 py-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="m-0 truncate text-sm font-bold text-slate-900">
                                                        {it.cantidad > 1 ? `${it.cantidad}× ` : ''}{it.nombre || 'Producto'}
                                                    </p>
                                                    {it.nota && <p className="m-0 truncate text-[11px] italic text-slate-400">{it.nota}</p>}
                                                    <p className="m-0 mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-orange-600">
                                                        Mesa {it.mesa_numero ?? '—'}
                                                        {it.listo_at && (
                                                            <>
                                                                <span className="font-normal text-slate-400">·</span>
                                                                <HiOutlineClock className="h-3 w-3 text-slate-400" />
                                                                <span className="font-normal text-slate-400">{haceCuanto(it.listo_at)}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => recoger(it)}
                                                    disabled={ocupado === it.id}
                                                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                                                    style={{ backgroundColor: '#10b981' }}
                                                >
                                                    <HiOutlineCheck className="h-3.5 w-3.5" /> Recogido
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
