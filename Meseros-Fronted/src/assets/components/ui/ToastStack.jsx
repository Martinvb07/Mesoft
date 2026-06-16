import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCheckCircle, HiOutlineBanknotes, HiOutlineBell } from 'react-icons/hi2';

/**
 * Pila de notificaciones tipo toast, animadas y con estilo consistente.
 * Cada toast: { id, title, msg, tone } — tone: 'listo' | 'caja' | 'info'.
 */
const TONES = {
    listo: { bar: 'from-emerald-400 to-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600', Icon: HiOutlineCheckCircle },
    caja: { bar: 'from-orange-400 to-orange-600', iconBg: 'bg-orange-50 text-orange-600', Icon: HiOutlineBanknotes },
    info: { bar: 'from-sky-400 to-sky-600', iconBg: 'bg-sky-50 text-sky-600', Icon: HiOutlineBell },
};

export default function ToastStack({ toasts = [] }) {
    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[3000] flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
                {toasts.map((t) => {
                    const tone = TONES[t.tone] || TONES.info;
                    const Icon = tone.Icon;
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: 48, scale: 0.92 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 48, scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="pointer-events-auto relative flex w-[290px] max-w-[88vw] items-start gap-3 overflow-hidden rounded-2xl bg-white p-3.5 pl-4 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-100"
                        >
                            <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${tone.bar}`} />
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.iconBg}`}>
                                <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                {t.title && <p className="m-0 text-sm font-extrabold leading-tight text-slate-900">{t.title}</p>}
                                {t.msg && <p className="m-0 mt-0.5 text-[13px] leading-snug text-slate-500">{t.msg}</p>}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
