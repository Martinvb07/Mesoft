import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiZap, FiUsers, FiShield } from 'react-icons/fi';
import { HiArrowRight, HiArrowUpRight, HiOutlineFlag, HiOutlineEye, HiOutlineMapPin, HiCheckCircle } from 'react-icons/hi2';
import Button from '../../ui/button';
import '../../../css/landing-tailwind.css';

const valores = [
    { icon: FiHeart, title: 'Compromiso', desc: 'Trabajamos cada día para cumplir con la confianza que los restaurantes depositan en nosotros.', color: 'from-orange-500 to-orange-400' },
    { icon: FiZap, title: 'Innovación', desc: 'Mejoramos Mesoft constantemente, escuchando a quienes lo usan en el día a día.', color: 'from-blue-600 to-blue-500' },
    { icon: FiUsers, title: 'Cercanía', desc: 'Acompañamos a cada negocio con soporte real y humano, no con respuestas automáticas.', color: 'from-emerald-600 to-emerald-500' },
    { icon: FiShield, title: 'Transparencia', desc: 'Actuamos con ética y claridad: sin letra pequeña ni costos ocultos.', color: 'from-violet-600 to-violet-500' },
];

const studioChecks = [
    'Comunicación directa con el equipo que construye Mesoft',
    'Mejoras continuas basadas en el uso real de los restaurantes',
    'Soporte cercano y humano, sin intermediarios',
];

const logros = [
    { valor: 'Colombia', label: 'Hecho aquí, pensado para negocios locales' },
    { valor: '100%', label: 'En la nube, sin instalaciones' },
    { valor: '24/7', label: 'Soporte cuando lo necesitas' },
    { valor: '4', label: 'Módulos: ventas, pedidos, inventario y reportes' },
];

// Subrayado decorativo tipo "marcador" bajo una palabra destacada
const Squiggle = ({ className = '' }) => (
    <svg
        className={`absolute -bottom-1.5 left-0 h-2.5 w-full text-orange-300 ${className}`}
        viewBox="0 0 120 10"
        preserveAspectRatio="none"
        aria-hidden="true"
    >
        <path d="M2 7 C 20 2, 40 9, 60 5 C 80 1, 100 8, 118 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const QuienesSomos = () => {
    const navigate = useNavigate();

    const scrollToTeam = () => {
        const el = document.getElementById('team-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="overflow-x-hidden bg-white">
            {/* HERO */}
            <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white">
                <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />

                <div className="relative mx-auto max-w-4xl px-4 pt-20 pb-16 text-center sm:pt-24 sm:pb-20 lg:pt-28">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                            Hacemos que administrar tu restaurante sea{' '}
                            <span className="relative inline-block text-orange-500">
                                simple
                                <Squiggle />
                            </span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                            Mesoft nació en <b className="text-slate-900">Llano Studio</b> con una idea clara:
                            darles a los restaurantes una herramienta moderna, sencilla y al alcance de cualquier
                            negocio para vender más y operar con tranquilidad.
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                            <Button size="lg" onClick={() => navigate('/solicitar')}>
                                Solicitar demo gratuita
                                <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                            <Button size="lg" variant="outline" onClick={scrollToTeam}>
                                Conoce el estudio
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FRANJA DE DATOS */}
            <section className="border-y border-slate-100 bg-slate-50">
                <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 lg:grid-cols-4">
                    {logros.map(({ valor, label }, idx) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: idx * 0.08 }}
                            className="text-center"
                        >
                            <p className="text-2xl font-extrabold text-orange-500 sm:text-3xl">{valor}</p>
                            <p className="mx-auto mt-2 max-w-[12rem] text-xs leading-relaxed text-slate-500 sm:text-sm">{label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* MISIÓN Y VISIÓN */}
            <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <div className="grid gap-6 lg:grid-cols-2">
                    {[
                        {
                            icon: HiOutlineFlag,
                            label: 'Nuestra misión',
                            text: 'Simplificar la operación diaria de los restaurantes con tecnología accesible: que cualquier negocio, sin importar su tamaño, pueda vender, controlar su inventario y entender sus números sin complicaciones.',
                        },
                        {
                            icon: HiOutlineEye,
                            label: 'Nuestra visión',
                            text: 'Ser la plataforma de gestión preferida por los restaurantes de Colombia y la región, reconocida por ser fácil de usar, confiable y por acompañar de verdad a quienes hacen crecer su negocio con nosotros.',
                        },
                    ].map(({ icon: Icon, label, text }, idx) => (
                        <motion.article
                            key={label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.12 }}
                            className="rounded-3xl bg-white p-7 shadow-lg shadow-slate-200/70 ring-1 ring-slate-100 sm:p-8"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-orange-500 to-orange-600 shadow-md shadow-orange-500/30">
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">{label}</h2>
                            <p className="mt-3 text-base leading-relaxed text-slate-600">{text}</p>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* VALORES */}
            <section className="border-t border-slate-100 bg-slate-50/60">
                <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-500">En lo que creemos</span>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Nuestros{' '}
                            <span className="relative inline-block text-orange-500">
                                valores
                                <Squiggle />
                            </span>
                        </h2>
                    </motion.div>
                    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {valores.map(({ icon: Icon, title, desc, color }, idx) => (
                            <motion.article
                                key={title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.08 }}
                                className="flex flex-col rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-orange-200"
                            >
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{desc}</p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* LLANO STUDIO — el estudio detrás de Mesoft */}
            <section id="team-section" aria-labelledby="studio-title" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                    {/* Copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-500">El estudio detrás de Mesoft</span>
                        <h2 id="studio-title" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Creado por{' '}
                            <span className="relative inline-block text-orange-500">
                                Llano Studio
                                <Squiggle />
                            </span>
                        </h2>
                        <p className="mt-5 text-base leading-relaxed text-slate-600">
                            Mesoft es un producto de <b className="text-slate-900">Llano Studio</b>, un estudio de
                            desarrollo digital de Villavicencio, Meta, especializado en webs, apps y sistemas a
                            medida para negocios que quieren crecer.
                        </p>
                        <ul className="mt-6 space-y-3">
                            {studioChecks.map((c) => (
                                <li key={c} className="flex items-start gap-3">
                                    <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                                    <span className="text-sm leading-relaxed text-slate-700 sm:text-base">{c}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Button
                                size="lg"
                                variant="dark"
                                onClick={() => window.open('https://llanostudio.co', '_blank', 'noopener,noreferrer')}
                            >
                                Conoce Llano Studio
                                <HiArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Button>
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
                                <HiOutlineMapPin className="h-4 w-4 text-orange-500" />
                                Villavicencio, Meta · Colombia
                            </span>
                        </div>
                    </motion.div>

                    {/* Logo del estudio */}
                    <motion.a
                        href="https://llanostudio.co"
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="flex items-center justify-center no-underline"
                    >
                        <img
                            src="/logoLlanoStudio.png"
                            alt="Llano Studio — Diseño Web"
                            className="w-full max-w-xs object-contain transition-transform duration-300 hover:scale-105"
                        />
                    </motion.a>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-slate-900 p-8 text-center sm:p-12"
                >
                    <div aria-hidden="true" className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
                    <h2 className="relative text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        ¿Listo para llevar tu restaurante al siguiente nivel?
                    </h2>
                    <ul className="relative flex flex-col items-start gap-2.5 text-sm text-slate-300 sm:flex-row sm:gap-6">
                        {['Demo gratuita', 'Sin compromiso', 'Implementación guiada'].map((b) => (
                            <li key={b} className="flex items-center gap-2">
                                <HiCheckCircle className="h-5 w-5 shrink-0 text-orange-400" />
                                {b}
                            </li>
                        ))}
                    </ul>
                    <Button size="lg" className="relative" onClick={() => navigate('/solicitar')}>
                        Solicitar demo
                        <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                </motion.div>
            </section>
        </div>
    );
};

export default QuienesSomos;
