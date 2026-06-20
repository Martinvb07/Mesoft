import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeadphones } from 'react-icons/fi';
import Button from '../ui/button';
import '../../css/landing-tailwind.css';
import {
    HiCheckCircle,
    HiOutlineCloud,
    HiOutlineClock,
    HiOutlineCheckBadge,
    HiOutlinePlayCircle,
    HiOutlineSquares2X2,
    HiOutlineShoppingCart,
    HiOutlineClipboardDocumentList,
    HiOutlineBookOpen,
    HiOutlineCube,
    HiOutlineUsers,
    HiOutlineChartBar,
    HiOutlineCog6Tooth,
    HiOutlineComputerDesktop,
    HiOutlinePuzzlePiece,
    HiArrowRight,
    HiSparkles,
    HiOutlineCalendarDays,
    HiOutlineWrenchScrewdriver,
    HiOutlineRocketLaunch,
} from 'react-icons/hi2';

const trust = [
    { icon: HiOutlineCheckBadge, title: 'Fácil de usar', desc: 'En minutos estás listo' },
    { icon: HiOutlineCloud, title: 'En la nube', desc: 'Accede desde cualquier lugar' },
    { icon: HiOutlineClock, title: 'Soporte 24/7', desc: 'Siempre estamos contigo' },
];

const sidebarItems = [
    { icon: HiOutlineSquares2X2, label: 'Dashboard', active: true },
    { icon: HiOutlineShoppingCart, label: 'Ventas' },
    { icon: HiOutlineClipboardDocumentList, label: 'Pedidos' },
    { icon: HiOutlineBookOpen, label: 'Menú' },
    { icon: HiOutlineCube, label: 'Inventario' },
    { icon: HiOutlineUsers, label: 'Clientes' },
    { icon: HiOutlineChartBar, label: 'Reportes' },
    { icon: HiOutlineCog6Tooth, label: 'Configuración' },
];

const tipos = ['Restaurantes', 'Pizzerías', 'Cafeterías', 'Food trucks', 'Bares', 'Heladerías', 'Panaderías', 'Comida rápida'];

// Cards con fotografía por tipo de negocio (estilo Toast)
const negocios = [
    {
        nombre: 'Restaurantes',
        desc: 'Servicio completo en salón',
        img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
    {
        nombre: 'Cafeterías',
        desc: 'Atención rápida en barra',
        img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    },
    {
        nombre: 'Bares',
        desc: 'Cuentas abiertas y turnos nocturnos',
        img: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    },
    {
        nombre: 'Pizzerías y comida rápida',
        desc: 'Domicilios y para llevar',
        img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    },
];

const features = [
    { icon: HiOutlineComputerDesktop, title: 'Punto de venta (POS)', desc: 'Vende rápido y fácil desde cualquier dispositivo.' },
    { icon: HiOutlineClipboardDocumentList, title: 'Gestión de pedidos', desc: 'Controla pedidos en salón, domicilio y para llevar.' },
    { icon: HiOutlineCube, title: 'Inventario inteligente', desc: 'Controla tu inventario en tiempo real y evita pérdidas.' },
    { icon: HiOutlineChartBar, title: 'Reportes avanzados', desc: 'Toma mejores decisiones con datos claros y útiles.' },
    { icon: HiOutlineUsers, title: 'Gestión de clientes', desc: 'Conoce a tus clientes y fidelízalos.' },
    { icon: HiOutlinePuzzlePiece, title: 'Integraciones', desc: 'Conecta Mesoft con las herramientas que ya usas.' },
];

// Pasos de implementación (estilo "How it works" de Toast/Square)
const pasos = [
    {
        icon: HiOutlineCalendarDays,
        numero: '01',
        title: 'Solicita tu demo',
        desc: 'Cuéntanos sobre tu negocio y agenda una demo gratuita con nuestro equipo.',
    },
    {
        icon: HiOutlineWrenchScrewdriver,
        numero: '02',
        title: 'Configuramos contigo',
        desc: 'Cargamos tu menú, mesas y equipo. Te acompañamos durante toda la implementación.',
    },
    {
        icon: HiOutlineRocketLaunch,
        numero: '03',
        title: 'Empieza a vender',
        desc: 'En pocos días tu restaurante opera con Mesoft y tú tienes el control total.',
    },
];

// Filas producto alternadas (estilo Square/Lightspeed)
const productRows = [
    {
        title: 'Vende más rápido en el salón',
        desc: 'Tus meseros toman pedidos desde el celular o tablet y la comanda llega directo a cocina. Menos errores, mesas que rotan más rápido y clientes más satisfechos.',
        img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
        alt: 'Pago rápido en punto de venta',
        bullets: ['Comandas directas a cocina', 'División de cuentas sin enredos', 'Funciona en cualquier dispositivo'],
    },
    {
        title: 'Controla tu negocio desde donde estés',
        desc: 'Ventas en vivo, inventario y rendimiento de tu equipo en un solo panel. Toma decisiones con datos reales, no con corazonadas.',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
        alt: 'Panel de reportes y análisis',
        bullets: ['Reportes en tiempo real', 'Alertas de inventario bajo', 'Cierre de caja en minutos'],
    },
];

const beneficios = [
    'Control total de mesas, pedidos y personal en un solo lugar',
    'Reportes en tiempo real para decisiones más rápidas',
    'Roles y permisos para mantener todo bajo control',
    'Implementación guiada para tu equipo',
];

const testimonios = [
    {
        nombre: 'Carolina Méndez',
        negocio: 'Restaurante La Toscana',
        iniciales: 'CM',
        color: 'bg-orange-100 text-orange-600',
        texto: 'Desde que usamos Mesoft los pedidos llegan a cocina sin errores y el cierre de caja pasó de una hora a diez minutos.',
    },
    {
        nombre: 'Andrés Rojas',
        negocio: 'Pizzería Don Pepe',
        iniciales: 'AR',
        color: 'bg-blue-100 text-blue-600',
        texto: 'El inventario en tiempo real nos salvó. Ya no se nos agota nada a mitad de servicio y las compras son mucho más precisas.',
    },
    {
        nombre: 'Laura Gutiérrez',
        negocio: 'Café Aroma',
        iniciales: 'LG',
        color: 'bg-emerald-100 text-emerald-600',
        texto: 'Lo que más me gusta son los reportes: por fin sé qué productos dejan más margen y en qué horarios vendemos más.',
    },
];

// Variantes compartidas para entradas con stagger
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
};

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

const Inicio = () => {
    const navigate = useNavigate();
    const handleEspecialidades = () => {
        const section = document.getElementById('como-funciona');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    };

    // Permite llegar con un ancla (#features, #precios) desde otra página
    useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.slice(1);
            const el = document.getElementById(id);
            if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, []);

    return (
        <div className="overflow-x-hidden bg-white">
            {/* HERO */}
            <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white">
                {/* Blobs decorativos */}
                <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-amber-100/50 blur-3xl" />

                <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pt-20 pb-16 sm:pt-24 sm:pb-20 lg:grid-cols-[minmax(0,490px)_1fr] lg:items-center lg:gap-10 lg:pt-28 lg:pb-24">
                    {/* Columna texto */}
                    <motion.div variants={stagger} initial="hidden" animate="visible" className="min-w-0">
                        <motion.div variants={fadeUp}>
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-orange-100/80 px-3.5 py-1.5 text-xs font-bold text-orange-600 ring-1 ring-orange-200">
                                <HiSparkles className="h-3.5 w-3.5 shrink-0" />
                                <span className="min-w-0">Software de gestión para restaurantes</span>
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeUp}
                            className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl"
                        >
                            Gestiona tu restaurante.
                            <br />
                            Simplifica tu{' '}
                            <span className="relative inline-block text-orange-500">
                                éxito.
                                <Squiggle />
                            </span>
                        </motion.h1>

                        <motion.p variants={fadeUp} className="mt-6 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
                            Mesoft centraliza tus operaciones, aumenta tus ventas y mejora la experiencia
                            de tus clientes.
                        </motion.p>

                        <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                            <Button size="lg" onClick={() => navigate('/solicitar')}>
                                Solicitar demo gratuita
                                <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                            <Button size="lg" variant="outline" onClick={handleEspecialidades}>
                                <HiOutlinePlayCircle className="h-5 w-5 text-orange-500" />
                                Ver cómo funciona
                            </Button>
                        </motion.div>

                        <motion.div variants={fadeUp} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {trust.map(({ icon: Icon, title, desc }) => (
                                <div key={title}>
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 ring-1 ring-orange-200/60">
                                            <Icon className="h-4 w-4 text-orange-500" />
                                        </span>
                                        <p className="text-sm font-bold text-slate-900">{title}</p>
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-500">{desc}</p>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Mockup del dashboard */}
                    <motion.div
                        className="relative min-w-0"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                    >
                        {/* Foto de restaurante asomando detrás del dashboard */}
                        <div aria-hidden="true" className="absolute -top-8 -right-8 hidden h-56 w-72 overflow-hidden rounded-3xl shadow-xl lg:block">
                            <img
                                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=700&q=80"
                                alt=""
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-orange-500/10" />
                        </div>
                        <div className="relative rounded-2xl bg-white shadow-2xl shadow-orange-100 ring-1 ring-slate-100 overflow-hidden">
                            <div className="flex">
                                {/* Sidebar */}
                                <div className="hidden w-36 shrink-0 flex-col gap-1 border-r border-slate-100 bg-slate-50/80 p-3 sm:flex">
                                    <div className="mb-3 flex items-center gap-2 px-1">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500 text-[11px] font-extrabold text-white">M</span>
                                        <span className="text-xs font-extrabold tracking-tight text-slate-900">Mesoft</span>
                                    </div>
                                    {sidebarItems.map(({ icon: Icon, label, active }) => (
                                        <div
                                            key={label}
                                            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                                                active ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'text-slate-500'
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {label}
                                        </div>
                                    ))}
                                </div>

                                {/* Contenido principal */}
                                <div className="min-w-0 flex-1 p-4 sm:p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">¡Hola, Juan! 👋</p>
                                            <p className="text-xs text-slate-400">Aquí tienes un resumen de tu restaurante</p>
                                        </div>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">JM</div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                                        <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 sm:p-3">
                                            <p className="text-[10px] text-slate-500">Ventas del día</p>
                                            <p className="mt-1 text-sm font-bold text-slate-900 sm:text-base">$8.420.000</p>
                                            <p className="text-[10px] font-semibold text-emerald-500">↑ 18.5%</p>
                                        </div>
                                        <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 sm:p-3">
                                            <p className="text-[10px] text-slate-500">Pedidos del día</p>
                                            <p className="mt-1 text-sm font-bold text-slate-900 sm:text-base">128</p>
                                            <p className="text-[10px] font-semibold text-emerald-500">↑ 12.3%</p>
                                        </div>
                                        <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 sm:p-3">
                                            <p className="text-[10px] text-slate-500">Ticket promedio</p>
                                            <p className="mt-1 text-sm font-bold text-slate-900 sm:text-base">$65.800</p>
                                            <p className="text-[10px] font-semibold text-emerald-500">↑ 8.1%</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-[11px] font-semibold text-slate-600">Ventas de los últimos 7 días</p>
                                            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-2 h-20 w-full">
                                                <defs>
                                                    <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#fb923c" stopOpacity="0.35" />
                                                        <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <polygon points="0,30 16,24 33,27 50,14 66,19 83,8 100,12 100,40 0,40" fill="url(#ventasGradient)" />
                                                <polyline points="0,30 16,24 33,27 50,14 66,19 83,8 100,12" fill="none" stroke="#f97316" strokeWidth="2" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-3">
                                            <div
                                                className="relative h-16 w-16 rounded-full sm:h-20 sm:w-20"
                                                style={{ background: 'conic-gradient(#f97316 0% 45%, #3b82f6 45% 70%, #10b981 70% 88%, #a855f7 88% 100%)' }}
                                            >
                                                <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700">
                                                    $8.42M
                                                </div>
                                            </div>
                                            <p className="mt-2 text-[10px] text-slate-400">Ventas por categoría</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notificación flotante */}
                        <motion.div
                            className="absolute -right-3 top-6 hidden items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-slate-200/80 ring-1 ring-slate-100 sm:flex lg:-right-6"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: [16, 0, -6, 0] }}
                            transition={{
                                opacity: { duration: 0.5, delay: 0.9 },
                                y: { delay: 0.9, duration: 4, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' },
                            }}
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                                <HiCheckCircle className="h-5 w-5 text-emerald-500" />
                            </span>
                            <div>
                                <p className="text-xs font-bold text-slate-900">Nuevo pedido — Mesa 4</p>
                                <p className="text-[11px] text-slate-400">Hace un momento · $86.000</p>
                            </div>
                        </motion.div>

                    </motion.div>
                </div>
            </section>

            {/* TIPOS DE NEGOCIO — marquee infinito */}
            <section className="border-y border-slate-100 bg-slate-50">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <p className="text-center text-sm font-semibold text-slate-500">
                        Pensado para negocios como el tuyo
                    </p>
                    <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
                        <div className="landing-marquee flex w-max items-center gap-3">
                            {[...tipos, ...tipos].map((tipo, idx) => (
                                <span
                                    key={`${tipo}-${idx}`}
                                    className="whitespace-nowrap rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:text-orange-500 hover:ring-orange-300"
                                >
                                    {tipo}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* POR TIPO DE NEGOCIO — cards con fotografía (estilo Toast) */}
            <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Para cada tipo de negocio</span>
                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Mesoft se adapta a{' '}
                        <span className="relative inline-block text-orange-500">
                            tu negocio
                            <Squiggle />
                        </span>
                    </h2>
                </motion.div>
                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {negocios.map(({ nombre, desc, img }, idx) => (
                        <motion.div
                            key={nombre}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.08 }}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-lg shadow-slate-200/70"
                            onClick={() => navigate('/funciones')}
                        >
                            <img
                                src={img}
                                alt={nombre}
                                loading="lazy"
                                className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-5">
                                <h3 className="text-lg font-extrabold text-white">{nombre}</h3>
                                <p className="mt-0.5 text-sm text-slate-200">{desc}</p>
                                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-orange-400 opacity-0 transition-all duration-300 group-hover:opacity-100">
                                    Saber más <HiArrowRight className="h-4 w-4" />
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="inicio-especialidades-section mx-auto max-w-6xl bg-transparent px-4 pb-16 pt-0 sm:pb-20">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Todo lo que necesitas</span>
                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Una solución completa para{' '}
                        <span className="relative inline-block text-orange-500">
                            tu restaurante
                            <Squiggle />
                        </span>
                    </h2>
                </motion.div>
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map(({ icon: Icon, title, desc }, idx) => (
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                            className="group rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-orange-200"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                                <Icon className="h-6 w-6 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                            <p className="mt-2 text-sm text-slate-500">{desc}</p>
                            <Link to="/funciones" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-orange-500 no-underline transition hover:text-orange-600">
                                Saber más <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FILAS PRODUCTO ALTERNADAS (estilo Square/Lightspeed) */}
            <section className="border-t border-slate-100 bg-slate-50/60">
                <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:space-y-24 sm:py-24">
                    {productRows.map(({ title, desc, img, alt, bullets }, idx) => (
                        <div
                            key={title}
                            className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                                idx % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                            }`}
                        >
                            <motion.div
                                initial={{ opacity: 0, x: idx % 2 === 1 ? 32 : -32 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="relative"
                            >
                                <div aria-hidden="true" className={`absolute -inset-4 rounded-3xl bg-gradient-to-br ${idx % 2 === 0 ? 'from-orange-100' : 'from-blue-50'} to-transparent`} />
                                <img
                                    src={img}
                                    alt={alt}
                                    loading="lazy"
                                    className="relative h-72 w-full rounded-2xl object-cover shadow-xl shadow-slate-200 ring-1 ring-slate-100 sm:h-80"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.15 }}
                            >
                                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h3>
                                <p className="mt-4 text-base leading-relaxed text-slate-600">{desc}</p>
                                <ul className="mt-6 space-y-3">
                                    {bullets.map((b) => (
                                        <li key={b} className="flex items-start gap-3">
                                            <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                                            <span className="text-sm font-medium text-slate-700 sm:text-base">{b}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/funciones"
                                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-orange-500 no-underline transition hover:gap-2.5 hover:text-orange-600"
                                >
                                    Ver todas las funciones <HiArrowRight className="h-4 w-4" />
                                </Link>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CÓMO FUNCIONA — 3 pasos */}
            <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Cómo funciona</span>
                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Empieza a usar Mesoft en{' '}
                        <span className="relative inline-block text-orange-500">
                            3 pasos
                            <Squiggle />
                        </span>
                    </h2>
                </motion.div>
                <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
                    {/* Línea conectora */}
                    <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-7 hidden border-t-2 border-dashed border-orange-200 sm:block" />
                    {pasos.map(({ icon: Icon, numero, title, desc }, idx) => (
                        <motion.div
                            key={numero}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.15 }}
                            className="relative flex flex-col items-center text-center"
                        >
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                                <Icon className="h-7 w-7 text-white" />
                                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-extrabold text-white ring-2 ring-white">
                                    {idx + 1}
                                </span>
                            </div>
                            <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{desc}</p>
                        </motion.div>
                    ))}
                </div>
                <motion.div
                    className="mt-12 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Button size="lg" onClick={() => navigate('/solicitar')}>
                        Empezar ahora
                        <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                    <p className="mt-3 text-xs font-medium text-slate-400">
                        Demo gratuita · Sin compromiso · Implementación guiada
                    </p>
                </motion.div>
            </section>

            {/* BANNER OSCURO */}
            <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-20">
                <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                            Hecho para restaurantes como el tuyo
                        </span>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Más control, más ventas, mejores{' '}
                            <span className="relative inline-block text-orange-400">
                                experiencias.
                                <Squiggle className="text-orange-500/40" />
                            </span>
                        </h2>
                        <ul className="mt-8 space-y-4">
                            {beneficios.map((b) => (
                                <li key={b} className="flex items-start gap-3">
                                    <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                                    <span className="text-sm text-slate-300 sm:text-base">{b}</span>
                                </li>
                            ))}
                        </ul>
                        <Button size="lg" className="mt-8" onClick={() => navigate('/funciones')}>
                            Conoce todas las funciones
                            <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Button>
                    </motion.div>

                    {/* Panel de resultados */}
                    <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-4">
                        {[
                            { valor: '+40%', label: 'Más ventas con reportes claros' },
                            { valor: '-30%', label: 'Menos tiempo de espera por mesa' },
                            { valor: '24/7', label: 'Soporte siempre disponible' },
                            { valor: '100%', label: 'Control de inventario y personal' },
                        ].map(({ valor, label }, idx) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="rounded-2xl bg-slate-800/80 p-5 ring-1 ring-white/10 backdrop-blur transition duration-300 hover:-translate-y-1 hover:ring-orange-400/40"
                            >
                                <p className="text-3xl font-extrabold text-orange-400">{valor}</p>
                                <p className="mt-2 text-sm text-slate-300">{label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIOS */}
            <section className="bg-gradient-to-b from-white to-orange-50/40">
                <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Testimonios</span>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Restaurantes que ya{' '}
                            <span className="relative inline-block text-orange-500">
                                confían en Mesoft
                                <Squiggle />
                            </span>
                        </h2>
                    </motion.div>
                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {testimonios.map(({ nombre, negocio, iniciales, color, texto }, idx) => (
                            <motion.figure
                                key={nombre}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="m-0 flex flex-col rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-orange-200"
                            >
                                <div className="flex gap-0.5 text-orange-400" aria-label="5 estrellas">
                                    {'★★★★★'.split('').map((s, i) => (
                                        <span key={i} className="text-base">{s}</span>
                                    ))}
                                </div>
                                <blockquote className="m-0 mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                                    “{texto}”
                                </blockquote>
                                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${color}`}>
                                        {iniciales}
                                    </span>
                                    <div>
                                        <p className="m-0 text-sm font-bold text-slate-900">{nombre}</p>
                                        <p className="m-0 text-xs text-slate-400">{negocio}</p>
                                    </div>
                                </figcaption>
                            </motion.figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section id="precios" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between"
                >
                    <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-orange-700/30 blur-3xl" />
                    <div className="relative text-center lg:text-left">
                        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                            ¿Tienes dudas?
                        </h2>
                        <p className="mt-3 max-w-sm text-sm text-orange-50 sm:text-base">
                            Contáctanos y te ayudaremos con todo el proceso de implementación, sin compromiso.
                        </p>
                        <Button
                            size="lg"
                            className="mt-6 bg-white from-white to-white text-orange-600 shadow-lg shadow-orange-700/30 hover:bg-orange-50 hover:shadow-orange-700/40"
                            onClick={() => navigate('/solicitar')}
                        >
                            Contáctanos
                            <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Button>
                    </div>
                    <motion.div
                        className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <FiHeadphones className="h-14 w-14 text-white" />
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
};

export default Inicio;
