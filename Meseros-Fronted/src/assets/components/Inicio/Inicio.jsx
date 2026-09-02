import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../ui/button';
import '../../css/landing-tailwind.css';
import {
    HiOutlineCalendarDays,
    HiOutlineWrenchScrewdriver,
    HiOutlineRocketLaunch,
    HiOutlineCloud,
    HiOutlineClock,
    HiOutlineCheckBadge,
    HiOutlinePlayCircle,
    HiOutlineClipboardDocumentList,
    HiOutlineCube,
    HiOutlineUsers,
    HiOutlineChartBar,
    HiOutlineComputerDesktop,
    HiOutlinePuzzlePiece,
    HiArrowRight,
} from 'react-icons/hi2';

const trust = [
    { icon: HiOutlineCheckBadge, label: 'Listo en minutos' },
    { icon: HiOutlineCloud, label: '100% en la nube' },
    { icon: HiOutlineClock, label: 'Soporte 24/7' },
];

const tipos = ['Restaurantes', 'Pizzerías', 'Cafeterías', 'Bares', 'Food trucks', 'Panaderías', 'Comida rápida'];

const features = [
    { icon: HiOutlineComputerDesktop, title: 'Punto de venta', desc: 'Cobra desde el computador, la tablet o el celular. Sin instalar nada.' },
    { icon: HiOutlineClipboardDocumentList, title: 'Pedidos y mesas', desc: 'La comanda llega directo a cocina. Salón, domicilio y para llevar en la misma vista.' },
    { icon: HiOutlineCube, title: 'Inventario', desc: 'Descuento automático por venta y alertas cuando un insumo se está acabando.' },
    { icon: HiOutlineChartBar, title: 'Reportes', desc: 'Ventas del día, productos más vendidos y cierre de caja sin cuadrar a mano.' },
    { icon: HiOutlineUsers, title: 'Equipo y roles', desc: 'Cada quien ve lo que le toca: mesero, cajero y administrador.' },
    { icon: HiOutlinePuzzlePiece, title: 'Menú digital', desc: 'Carta pública con QR que actualizas desde el mismo panel.' },
];

const pasos = [
    {
        numero: '01',
        icon: HiOutlineCalendarDays,
        title: 'Agenda tu demo',
        desc: 'Nos cuentas cómo opera tu negocio hoy y te mostramos Mesoft funcionando con tu caso.',
    },
    {
        numero: '02',
        icon: HiOutlineWrenchScrewdriver,
        title: 'Lo configuramos contigo',
        desc: 'Cargamos tu menú, tus mesas y tu equipo. No te dejamos solo con un manual.',
    },
    {
        numero: '03',
        icon: HiOutlineRocketLaunch,
        title: 'Tu equipo empieza a usarlo',
        desc: 'En pocos días el restaurante ya opera con Mesoft y tú ves todo desde el panel.',
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09 } },
};

// Encabezado de sección: antetítulo + título alineados a la izquierda
const SectionHeading = ({ eyebrow, title, desc }) => (
    <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
    >
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">{eyebrow}</span>
        <h2 className="mt-3 text-3xl font-bold leading-[1.15] tracking-[-0.025em] text-slate-900 sm:text-[2.5rem]">
            {title}
        </h2>
        {desc && <p className="mt-4 text-base leading-relaxed text-slate-600">{desc}</p>}
    </motion.div>
);

const Inicio = () => {
    const navigate = useNavigate();

    const scrollToComoFunciona = () => {
        const section = document.getElementById('como-funciona');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    };

    // Permite llegar con un ancla (#features, #como-funciona, #contacto) desde otra página
    useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.slice(1);
            const el = document.getElementById(id);
            if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, []);

    return (
        <div className="overflow-x-clip bg-white">
            {/* ───────────────────────────  HERO  ─────────────────────────── */}
            <section className="relative overflow-hidden border-b border-slate-200/70">
                {/* Retícula de fondo, desvanecida hacia los bordes */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_62%_58%_at_50%_18%,black,transparent)]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(15,23,42,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.055) 1px, transparent 1px)',
                        backgroundSize: '56px 56px',
                    }}
                />
                <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 lg:px-8">
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.span variants={fadeUp} className="flex items-center justify-center gap-2.5">
                            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                                Software para restaurantes
                            </span>
                        </motion.span>
                        <motion.h1
                            variants={fadeUp}
                            className="mt-6 text-[2.75rem] font-bold leading-[1.03] tracking-[-0.038em] text-slate-900 sm:text-6xl"
                        >
                            Todo tu restaurante en{' '}
                            <span className="text-orange-500">una sola pantalla.</span>
                        </motion.h1>
                        <motion.p
                            variants={fadeUp}
                            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
                        >
                            Mesoft reúne ventas, pedidos, mesas, inventario y reportes en un panel que tu
                            equipo entiende desde el primer día.
                        </motion.p>
                        <motion.div
                            variants={fadeUp}
                            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
                        >
                            <Button size="lg" onClick={() => navigate('/solicitar')} className="w-full sm:w-auto">
                                Solicitar demo gratuita
                                <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={scrollToComoFunciona}
                                className="w-full shadow-none hover:translate-y-0 hover:shadow-none sm:w-auto"
                            >
                                <HiOutlinePlayCircle className="h-5 w-5 text-orange-500" />
                                Ver cómo funciona
                            </Button>
                        </motion.div>
                        <motion.ul
                            variants={fadeUp}
                            className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5"
                        >
                            {trust.map(({ icon: Icon, label }) => (
                                <li key={label} className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 shrink-0 text-orange-500" />
                                    <span className="text-sm font-medium text-slate-600">{label}</span>
                                </li>
                            ))}
                        </motion.ul>
                    </motion.div>
                </div>
            </section>

            {/* ────────────────────  FRANJA: TIPOS DE NEGOCIO  ──────────────────── */}
            <section className="border-b border-slate-200/70 bg-slate-50/60">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-2 px-6 py-6 lg:px-8">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Pensado para</span>
                    {tipos.map((tipo) => (
                        <span key={tipo} className="text-sm font-medium text-slate-600">
                            {tipo}
                        </span>
                    ))}
                </div>
            </section>

            {/* ─────────────────────────  FUNCIONES  ───────────────────────── */}
            <section id="features" className="border-b border-slate-200/70">
                <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:px-8">
                    <SectionHeading
                        eyebrow="Qué incluye"
                        title="Una sola herramienta para toda la operación"
                        desc="Sin hojas de cálculo sueltas, sin cuadernos y sin tres programas que no se hablan entre sí."
                    />
                    <div className="mt-12 grid grid-cols-1 border-t border-l border-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map(({ icon: Icon, title, desc }, idx) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.45, delay: (idx % 3) * 0.08, ease: 'easeOut' }}
                                className="border-b border-r border-slate-200 p-7 transition-colors duration-200 hover:bg-slate-50/80"
                            >
                                <Icon className="h-6 w-6 text-orange-500" />
                                <h3 className="mt-5 text-base font-bold tracking-tight text-slate-900">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-10">
                        <Link
                            to="/funciones"
                            className="group inline-flex items-center gap-2 text-sm font-bold text-orange-600 no-underline transition-colors hover:text-orange-700"
                        >
                            Ver todas las funciones en detalle
                            <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ────────────────────────  CÓMO EMPEZAMOS  ──────────────────────── */}
            <section id="como-funciona" className="relative overflow-hidden border-b border-slate-200/70 bg-slate-50">
                {/* Textura de puntos, desvanecida hacia los bordes */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_65%_60%_at_50%_45%,black,transparent)]"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(15,23,42,0.10) 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                    }}
                />
                <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:px-8">
                    <SectionHeading
                        eyebrow="Cómo empezamos"
                        title="De la demo a tu primer servicio, acompañado"
                        desc="No te vendemos una licencia y te decimos suerte. Montamos Mesoft contigo."
                    />
                    <div className="relative mt-16">
                        {/* Línea de tiempo que se dibuja al entrar en pantalla */}
                        <motion.span
                            aria-hidden="true"
                            className="absolute left-7 right-0 top-7 hidden h-px origin-left bg-gradient-to-r from-orange-500 via-orange-400/70 to-transparent sm:block"
                            initial={{ scaleX: 0, opacity: 0 }}
                            whileInView={{ scaleX: 1, opacity: 1 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        />
                        <ol className="relative m-0 grid list-none gap-10 p-0 sm:grid-cols-3 sm:gap-7">
                            {pasos.map(({ numero, title, desc, icon: Icon }, idx) => (
                                <motion.li
                                    key={numero}
                                    className="group relative list-none"
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{ duration: 0.55, delay: 0.25 + idx * 0.18, ease: [0.22, 1, 0.36, 1] }}
                                >

                                    {/* Nodo numerado sobre la línea */}
                                    <div className="relative z-10 flex items-center gap-4">
                                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold tabular-nums text-white ring-8 ring-slate-50 transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-orange-500 group-hover:shadow-[0_18px_35px_-15px_rgba(249,115,22,0.95)]">
                                            {numero}
                                        </span>
                                        <span aria-hidden="true" className="h-px flex-1 bg-slate-200 sm:hidden" />
                                    </div>

                                    {/* Tarjeta del paso */}
                                    <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-orange-200 group-hover:shadow-[0_28px_55px_-32px_rgba(15,23,42,0.55)]">
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute -top-5 right-0 select-none text-[5.5rem] font-bold leading-none tracking-tighter text-slate-100 transition-colors duration-300 group-hover:text-orange-50"
                                        >
                                            {numero}
                                        </span>
                                        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ring-1 ring-orange-100 transition-transform duration-300 group-hover:scale-110">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <h3 className="relative mt-5 text-lg font-bold tracking-tight text-slate-900">{title}</h3>
                                        <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                                        {/* Barra que se llena al pasar el mouse */}
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-orange-500 to-orange-300 transition-transform duration-500 ease-out group-hover:scale-x-100"
                                        />
                                    </div>
                                </motion.li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────  CTA  ───────────────────────────── */}
            <section id="contacto" className="relative">
                {/* Degradado gris muy sutil, sin adornos */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, #fbfbfc 0%, #f4f5f7 100%)' }}
                />
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="relative mx-auto max-w-2xl px-6 py-24 text-center sm:py-32 lg:px-8"
                >
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-900/5">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        Empieza hoy
                    </span>
                    <h2 className="mt-6 bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold leading-[1.15] tracking-[-0.03em] text-transparent sm:text-4xl">
                        Agenda una demo y mira Mesoft con los datos de tu restaurante.
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
                        Media hora, sin compromiso. Si no te sirve, te lo decimos nosotros mismos.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button variant="outline" onClick={() => navigate('/funciones')} className="w-full sm:w-auto">
                            Ver funciones
                        </Button>
                        <Button onClick={() => navigate('/solicitar')} className="w-full sm:w-auto">
                            Solicitar demo gratuita
                            <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Button>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default Inicio;
