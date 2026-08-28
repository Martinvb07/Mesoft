import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HiArrowRight, HiArrowPath, HiChevronLeft, HiChevronRight, HiPencilSquare, HiCheck } from 'react-icons/hi2';
import Button from '../../ui/button';
import StepWizard, { WIZARD_EASE } from '../../ui/StepWizard';
import '../../../css/landing-tailwind.css';

// Tomar base de API desde variable de entorno (misma convención que login y client.js)
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100';
const inputErrorClass = 'border-red-300 focus:border-red-400 focus:ring-red-100';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600';

const VACIO = { nombre: '', apellido: '', correo: '', empresa: '', cargo: '', nit: '', mensaje: '' };

/* `fields` = lo que se valida antes de dejar avanzar */
const STEPS = [
    { title: 'Tus datos', hint: 'Para poder contactarte', fields: ['nombre', 'apellido', 'correo'] },
    { title: 'Tu negocio', hint: 'Datos del restaurante', fields: ['empresa', 'nit', 'cargo'] },
    { title: 'Confirmar', hint: 'Revisa y envía tu solicitud', fields: [] },
];

const LAST = STEPS.length - 1;

const validadores = {
    nombre: (v) => (v.trim().length < 2 ? 'Escribe tu nombre.' : ''),
    apellido: (v) => (v.trim().length < 2 ? 'Escribe tu apellido.' : ''),
    correo: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Escribe un correo válido.' : ''),
    empresa: (v) => (v.trim().length < 2 ? 'Escribe el nombre de tu negocio.' : ''),
    nit: (v) => (v.replace(/\D/g, '').length < 5 ? 'Escribe un NIT válido.' : ''),
    cargo: (v) => (v.trim().length < 2 ? 'Escribe tu cargo o rol.' : ''),
    mensaje: (v) => (v.length > 500 ? 'Máximo 500 caracteres.' : ''),
};

const beneficios = [
    'Ventas, pedidos y mesas en un solo panel',
    'Lo configuramos contigo, sin manuales',
    'En la nube: no instalas nada',
    'Soporte 24/7 y sin permanencia',
];

/* Campo con mensaje de error animado */
const Field = ({ label, htmlFor, error, optional, children }) => (
    <div>
        <label className={labelClass} htmlFor={htmlFor}>
            {label}{' '}
            {optional ? (
                <span className="font-medium normal-case text-slate-400">(opcional)</span>
            ) : (
                <span className="text-red-500">*</span>
            )}
        </label>
        {children}
        <AnimatePresence initial={false}>
            {error && (
                <motion.p
                    className="mt-1 text-xs text-red-500"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                >
                    {error}
                </motion.p>
            )}
        </AnimatePresence>
    </div>
);

const Solicitar = () => {
    const reduce = useReducedMotion();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, []);

    const [form, setForm] = useState(VACIO);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(0);
    /* Dirección del último movimiento: define hacia dónde se desliza el paso */
    const [dir, setDir] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setForm((f) => ({ ...f, [id]: value }));
        // Solo limpiamos el error mientras escribe; no marcamos nuevos hasta validar
        setErrors((prev) => (prev[id] ? { ...prev, [id]: validadores[id](value) } : prev));
    };

    const validar = (campos) => {
        const nuevos = {};
        campos.forEach((c) => {
            const msg = validadores[c](form[c]);
            if (msg) nuevos[c] = msg;
        });
        setErrors((prev) => ({ ...prev, ...Object.fromEntries(campos.map((c) => [c, nuevos[c] || ''])) }));
        return Object.keys(nuevos).length === 0;
    };

    const goTo = (target) => {
        setDir(target > step ? 1 : -1);
        setStep(target);
    };

    const next = () => {
        if (validar(STEPS[step].fields)) goTo(Math.min(step + 1, LAST));
    };

    const enviar = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/solicitud`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            let data = {};
            try { data = await res.json(); } catch { /* ignore parse */ }

            if (res.ok && data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Solicitud enviada!',
                    text: 'Tu solicitud fue enviada correctamente. Te contactaremos pronto.',
                });
                setForm(VACIO);
                setErrors({});
                goTo(0);
            } else if (data.code === 'RATE_LIMIT') {
                const fecha = data.nextAllowedAt ? new Date(data.nextAllowedAt) : null;
                const fechaTexto = fecha ? fecha.toLocaleString() : null;
                Swal.fire({
                    icon: 'info',
                    title: 'Solicitud ya enviada',
                    html: fechaTexto
                        ? `<p>${data.message}</p><p><b>Podrás volver a intentarlo:</b><br/>${fechaTexto}</p>`
                        : (data.message || 'Ya enviaste una solicitud. Por favor espera hasta 48 horas para volver a intentarlo.'),
                });
                setForm(VACIO);
                setErrors({});
                goTo(0);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar',
                    text: data.error || data.message || 'Intenta de nuevo.',
                });
            }
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar al servidor.',
            });
        } finally {
            setLoading(false);
        }
    };

    /* Enter y el botón principal avanzan de paso; solo el último envía */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;
        if (step < LAST) {
            next();
            return;
        }
        // Validación final de todo: si algo falla, volvemos al primer paso con error
        const todos = STEPS.flatMap((s) => s.fields);
        if (!validar([...todos, 'mensaje'])) {
            const malo = STEPS.findIndex((s) => s.fields.some((f) => validadores[f](form[f])));
            if (malo >= 0) goTo(malo);
            return;
        }
        enviar();
    };

    const resumen = [
        { label: 'Nombre', value: `${form.nombre} ${form.apellido}`.trim(), step: 0 },
        { label: 'Correo', value: form.correo, step: 0 },
        { label: 'Negocio', value: form.empresa, step: 1 },
        { label: 'NIT', value: form.nit, step: 1 },
        { label: 'Cargo', value: form.cargo, step: 1 },
    ];

    return (
        <div className="bg-gradient-to-b from-orange-50 via-white to-white">
            <div className="mx-auto max-w-xl px-4 py-16 sm:py-20 lg:max-w-5xl">
                <div className="grid overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-300/40 ring-1 ring-slate-100 lg:grid-cols-[0.85fr_1fr]">

                    {/* PANEL DE MARCA */}
                    <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 lg:flex">
                        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

                        <Link to="/" className="relative flex items-center gap-2.5 text-white no-underline">
                            <img src="/logopngmesoft.png" alt="Mesoft" className="h-9 w-9 rounded-lg object-contain" />
                            <span className="text-xl font-extrabold tracking-tight">Mesoft</span>
                        </Link>

                        <div className="relative">
                            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
                                Empieza a digitalizar<br /><span className="text-orange-400">tu restaurante.</span>
                            </h2>
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
                                Tres pasos cortos y nos ponemos en contacto contigo.
                            </p>

                            <ul className="m-0 mt-8 list-none space-y-4 p-0">
                                {beneficios.map((b) => (
                                    <li key={b} className="flex list-none items-start gap-3">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/15 ring-1 ring-orange-500/30">
                                            <HiCheck className="h-3 w-3 text-orange-400" />
                                        </span>
                                        <span className="text-sm leading-relaxed text-slate-300">{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="relative text-xs text-slate-500">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login" className="font-semibold text-orange-400 hover:text-orange-300">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>

                    {/* FORMULARIO POR PASOS */}
                    <div className="p-6 sm:p-10">
                        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-slate-900 no-underline lg:hidden">
                            <img src="/logopngmesoft.png" alt="Mesoft" className="h-9 w-9 rounded-lg object-contain" />
                            <span className="text-xl font-extrabold tracking-tight">Mesoft</span>
                        </Link>

                        <form onSubmit={handleSubmit} noValidate>
                            <StepWizard steps={STEPS} step={step} dir={dir} onGoTo={goTo}>

                                {/* ── PASO 1: tus datos ─────────────────────── */}
                                {step === 0 && (
                                    <>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Nombre" htmlFor="nombre" error={errors.nombre}>
                                                <input id="nombre" type="text" placeholder="Juan" autoComplete="given-name"
                                                    className={`${inputClass} ${errors.nombre ? inputErrorClass : ''}`}
                                                    value={form.nombre} onChange={handleChange} />
                                            </Field>
                                            <Field label="Apellido" htmlFor="apellido" error={errors.apellido}>
                                                <input id="apellido" type="text" placeholder="Martínez" autoComplete="family-name"
                                                    className={`${inputClass} ${errors.apellido ? inputErrorClass : ''}`}
                                                    value={form.apellido} onChange={handleChange} />
                                            </Field>
                                        </div>
                                        <Field label="Correo electrónico" htmlFor="correo" error={errors.correo}>
                                            <input id="correo" type="email" placeholder="juan@turestaurante.com" autoComplete="email"
                                                className={`${inputClass} ${errors.correo ? inputErrorClass : ''}`}
                                                value={form.correo} onChange={handleChange} />
                                        </Field>
                                    </>
                                )}

                                {/* ── PASO 2: tu negocio ────────────────────── */}
                                {step === 1 && (
                                    <>
                                        <Field label="Nombre del negocio" htmlFor="empresa" error={errors.empresa}>
                                            <input id="empresa" type="text" placeholder="Restaurante El Llano" autoComplete="organization"
                                                className={`${inputClass} ${errors.empresa ? inputErrorClass : ''}`}
                                                value={form.empresa} onChange={handleChange} />
                                        </Field>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="NIT" htmlFor="nit" error={errors.nit}>
                                                <input id="nit" type="text" inputMode="numeric" placeholder="900123456-7"
                                                    className={`${inputClass} ${errors.nit ? inputErrorClass : ''}`}
                                                    value={form.nit} onChange={handleChange} />
                                            </Field>
                                            <Field label="Cargo o rol" htmlFor="cargo" error={errors.cargo}>
                                                <input id="cargo" type="text" placeholder="Administrador" autoComplete="organization-title"
                                                    className={`${inputClass} ${errors.cargo ? inputErrorClass : ''}`}
                                                    value={form.cargo} onChange={handleChange} />
                                            </Field>
                                        </div>
                                    </>
                                )}

                                {/* ── PASO 3: mensaje + resumen ─────────────── */}
                                {step === 2 && (
                                    <>
                                        <Field label="Mensaje adicional" htmlFor="mensaje" error={errors.mensaje} optional>
                                            <textarea id="mensaje" rows={3} placeholder="Más información de la empresa, redes sociales, cuántas mesas tienes, etc."
                                                className={`${inputClass} resize-none ${errors.mensaje ? inputErrorClass : ''}`}
                                                value={form.mensaje} onChange={handleChange} />
                                        </Field>

                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                            <p className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-900">
                                                Resumen de tu solicitud
                                            </p>
                                            <div className="divide-y divide-slate-100">
                                                {resumen.map((r) => (
                                                    <div key={r.label} className="flex items-center gap-3 px-4 py-2.5">
                                                        <span className="w-24 shrink-0 text-xs text-slate-400">{r.label}</span>
                                                        <span className="truncate text-sm font-semibold text-slate-800">{r.value || '—'}</span>
                                                        <button type="button" onClick={() => goTo(r.step)}
                                                            aria-label={`Editar ${r.label}`}
                                                            className="ml-auto shrink-0 cursor-pointer border-0 bg-transparent p-0 text-slate-300 transition-colors hover:text-orange-500">
                                                            <HiPencilSquare className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </StepWizard>

                            {/* ── Navegación ────────────────────────────────── */}
                            <div className="flex items-center gap-3 pt-6">
                                {step > 0 && (
                                    <motion.div
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.25, ease: WIZARD_EASE }}
                                    >
                                        <Button type="button" variant="outline" size="lg" onClick={() => goTo(step - 1)} disabled={loading}>
                                            <HiChevronLeft className="h-4 w-4" />
                                            Atrás
                                        </Button>
                                    </motion.div>
                                )}

                                <Button type="submit" size="lg" disabled={loading} className="flex-1">
                                    {loading ? (
                                        <>
                                            <motion.span className="flex" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                                                <HiArrowPath className="h-5 w-5" />
                                            </motion.span>
                                            Enviando solicitud...
                                        </>
                                    ) : step < LAST ? (
                                        <>
                                            Continuar
                                            <HiChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                                        </>
                                    ) : (
                                        <>
                                            Enviar solicitud
                                            <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                        </>
                                    )}
                                </Button>
                            </div>

                            <AnimatePresence initial={false}>
                                {step === LAST && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25, ease: WIZARD_EASE }}
                                        className="mt-4 text-center text-xs text-slate-400"
                                    >
                                        Al enviar, validamos tu información y te contactamos con tus credenciales.
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
                                ¿Ya tienes cuenta?{' '}
                                <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">
                                    Inicia sesión
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Solicitar;
