import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HiCheck } from 'react-icons/hi2';
import '../../css/landing-tailwind.css';

export const WIZARD_EASE = [0.22, 1, 0.36, 1];

/**
 * Cabecera con stepper + contenedor animado del paso actual.
 * Quien lo usa se encarga del formulario y de los botones de navegación.
 *
 * steps: [{ title, hint }]  ·  step: índice actual  ·  dir: 1 avanza / -1 retrocede
 * onGoTo: si se pasa, el stepper deja volver a un paso ya completado.
 */
const StepWizard = ({ steps, step, dir, onGoTo, children, className = '' }) => {
    const reduce = useReducedMotion();
    const last = steps.length - 1;

    /* Medimos el paso visible para animar el alto con `height` real: usar `layout`
       deformaría los campos mientras dura la transición. */
    const [boxH, setBoxH] = useState('auto');
    const roRef = useRef(null);
    const measure = useCallback((el) => {
        if (!el) return; // el paso saliente se desmonta después: lo ignoramos
        roRef.current?.disconnect();
        const ro = new ResizeObserver(() => setBoxH(el.offsetHeight));
        ro.observe(el);
        roRef.current = ro;
        setBoxH(el.offsetHeight);
    }, []);
    useEffect(() => () => roRef.current?.disconnect(), []);

    return (
        <div className={className}>
            {/* ── Stepper ─────────────────────────────────────────────── */}
            <div className="mb-8">
                <div className="flex items-center">
                    {steps.map((s, i) => {
                        const done = i < step;
                        const current = i === step;
                        return (
                            <Fragment key={s.title}>
                                <button
                                    type="button"
                                    onClick={() => done && onGoTo?.(i)}
                                    disabled={!done || !onGoTo}
                                    className={`group flex shrink-0 items-center gap-2 border-0 bg-transparent p-0 ${
                                        done && onGoTo ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                                >
                                    <motion.span
                                        animate={{ scale: current ? 1.1 : 1 }}
                                        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 22 }}
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
                                            done
                                                ? 'bg-orange-500 text-white'
                                                : current
                                                  ? 'bg-slate-900 text-white ring-4 ring-slate-900/10'
                                                  : 'border border-slate-200 bg-white text-slate-400'
                                        }`}
                                    >
                                        <AnimatePresence mode="wait" initial={false}>
                                            {done ? (
                                                <motion.span
                                                    key="check"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ duration: 0.18 }}
                                                    className="flex"
                                                >
                                                    <HiCheck className="h-4 w-4" strokeWidth={3} />
                                                </motion.span>
                                            ) : (
                                                <motion.span
                                                    key="num"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ duration: 0.18 }}
                                                >
                                                    {i + 1}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.span>

                                    {/* Las etiquetas solo caben en desktop; en móvil el paso se
                                        identifica con el título grande de abajo */}
                                    <span
                                        className={`hidden whitespace-nowrap text-xs font-bold uppercase tracking-wide transition-colors duration-300 lg:block ${
                                            current
                                                ? 'text-slate-900'
                                                : done
                                                  ? 'text-orange-600 group-hover:text-orange-700'
                                                  : 'text-slate-400'
                                        }`}
                                    >
                                        {s.title}
                                    </span>
                                </button>

                                {i < last && (
                                    <div className="mx-2 h-0.5 min-w-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                                        <motion.div
                                            className="h-full origin-left bg-orange-500"
                                            initial={false}
                                            animate={{ scaleX: done ? 1 : 0 }}
                                            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: WIZARD_EASE }}
                                        />
                                    </div>
                                )}
                            </Fragment>
                        );
                    })}
                </div>

                <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">
                        Paso {step + 1} de {steps.length}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{steps[step].title}</h3>
                    {steps[step].hint && <p className="mt-0.5 text-sm text-slate-500">{steps[step].hint}</p>}
                </div>
            </div>

            {/* ── Paso actual ─────────────────────────────────────────── */}
            <motion.div
                className="relative overflow-hidden"
                initial={false}
                animate={{ height: boxH }}
                transition={reduce ? { duration: 0 } : { duration: 0.3, ease: WIZARD_EASE }}
            >
                {/* popLayout saca del flujo al paso saliente para que no empuje nada */}
                <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                    <motion.div
                        key={step}
                        ref={measure}
                        custom={dir}
                        variants={{
                            enter: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 48 }),
                            center: { opacity: 1, x: 0 },
                            exit: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -48 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: reduce ? 0.12 : 0.3, ease: WIZARD_EASE }}
                        /* El p-1 entra en la medida del alto: deja aire para que el
                           overflow-hidden no recorte el anillo de foco */
                        className="space-y-4 p-1"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default StepWizard;
