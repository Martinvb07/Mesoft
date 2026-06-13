import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../ui/button';
import { HiCheckCircle, HiArrowRight, HiChevronDown } from 'react-icons/hi2';

const planes = [
    {
        nombre: 'Básico',
        precio: '$59.000',
        periodo: '/mes',
        desc: 'Ideal para negocios pequeños que están empezando a digitalizar su operación.',
        destacado: false,
        items: [
            'Punto de venta (POS)',
            'Gestión de pedidos en mesa',
            'Hasta 2 usuarios',
            'Menú digital con código QR',
            'Soporte por correo',
        ],
    },
    {
        nombre: 'Profesional',
        precio: '$119.000',
        periodo: '/mes',
        desc: 'La opción más completa para restaurantes en crecimiento.',
        destacado: true,
        items: [
            'Todo lo del plan Básico',
            'Pedidos a domicilio y para llevar',
            'Inventario en tiempo real',
            'Hasta 10 usuarios y roles personalizados',
            'Reportes y cierre de caja',
            'Soporte prioritario 24/7',
        ],
    },
    {
        nombre: 'Empresarial',
        precio: 'Personalizado',
        periodo: '',
        desc: 'Para cadenas y restaurantes con múltiples sucursales.',
        destacado: false,
        items: [
            'Todo lo del plan Profesional',
            'Usuarios y sucursales ilimitadas',
            'Nómina y reportes avanzados',
            'Integraciones a medida',
            'Implementación y acompañamiento dedicado',
        ],
    },
];

const faqs = [
    {
        q: '¿Necesito instalar algo para usar Mesoft?',
        a: 'No. Mesoft funciona 100% en la nube, así que puedes acceder desde cualquier computador, tablet o celular con internet.',
    },
    {
        q: '¿Puedo cambiar de plan más adelante?',
        a: 'Sí, puedes subir o bajar de plan cuando lo necesites, sin penalizaciones ni contratos forzosos.',
    },
    {
        q: '¿Ofrecen periodo de prueba?',
        a: 'Sí, agenda una demo gratuita y nuestro equipo te ayudará a configurar Mesoft para tu negocio antes de decidir.',
    },
    {
        q: '¿Qué pasa si tengo varias sucursales?',
        a: 'El plan Empresarial está pensado justamente para cadenas y negocios con múltiples sucursales, con precios a medida.',
    },
];

const Precios = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <div className="bg-white">
            {/* HERO */}
            <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white">
                <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />
                <motion.div
                    className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-20"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Planes simples, <span className="text-orange-500">sin sorpresas</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                        Elige el plan que mejor se adapte a tu restaurante. Todos incluyen soporte y
                        actualizaciones constantes.
                    </p>
                </motion.div>
            </section>

            {/* PLANES */}
            <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <div className="grid gap-6 lg:grid-cols-3">
                    {planes.map(({ nombre, precio, periodo, desc, destacado, items }, idx) => (
                        <motion.article
                            key={nombre}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.12 }}
                            className={`flex flex-col rounded-3xl p-6 shadow-lg ring-1 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:p-8 ${
                                destacado
                                    ? 'bg-slate-900 shadow-slate-900/30 ring-slate-900 lg:-translate-y-2 lg:scale-[1.03]'
                                    : 'bg-white shadow-slate-200/70 ring-slate-100 hover:ring-orange-200'
                            }`}
                        >
                            {destacado && (
                                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                                    Más popular
                                </span>
                            )}
                            <h2 className={`text-lg font-bold ${destacado ? 'text-white' : 'text-slate-900'}`}>
                                {nombre}
                            </h2>
                            <p className={`mt-2 text-sm ${destacado ? 'text-slate-300' : 'text-slate-500'}`}>
                                {desc}
                            </p>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className={`text-3xl font-extrabold ${destacado ? 'text-white' : 'text-slate-900'}`}>
                                    {precio}
                                </span>
                                {periodo && (
                                    <span className={`text-sm ${destacado ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {periodo}
                                    </span>
                                )}
                            </div>
                            <ul className="mt-6 flex-1 space-y-2.5">
                                {items.map((item) => (
                                    <li
                                        key={item}
                                        className={`flex items-start gap-2.5 text-sm ${destacado ? 'text-slate-300' : 'text-slate-600'}`}
                                    >
                                        <HiCheckCircle className={`mt-0.5 h-4 w-4 shrink-0 ${destacado ? 'text-orange-400' : 'text-orange-500'}`} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                variant={destacado ? 'default' : 'dark'}
                                size="lg"
                                className="mt-8 w-full"
                                onClick={() => navigate('/solicitar')}
                            >
                                Solicitar demo
                                <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                        </motion.article>
                    ))}
                </div>
                <p className="mt-8 text-center text-sm text-slate-500">
                    Precios de referencia en pesos colombianos (COP). El plan final se ajusta según el tamaño y
                    necesidades de tu negocio.
                </p>
            </section>

            {/* FAQ */}
            <section className="border-t border-slate-100 bg-slate-50">
                <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
                    <span className="block text-center text-xs font-bold uppercase tracking-wider text-orange-500">
                        ¿Tienes dudas?
                    </span>
                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-900">
                        Preguntas frecuentes
                    </h2>
                    <div className="mt-10 space-y-3">
                        {faqs.map(({ q, a }, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <motion.div
                                    key={q}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                                    className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                                        isOpen
                                            ? 'border-orange-200 shadow-lg shadow-orange-500/5'
                                            : 'border-slate-200/80 shadow-sm hover:border-orange-200 hover:shadow-md'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center justify-between gap-4 border-0 bg-transparent px-5 py-5 text-left focus-visible:outline-none sm:px-6 sm:py-6"
                                    >
                                        <span className={`text-base font-semibold transition-colors duration-200 ${isOpen ? 'text-orange-600' : 'text-slate-900 group-hover:text-orange-600'}`}>
                                            {q}
                                        </span>
                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500'}`}>
                                            <HiChevronDown
                                                className="h-4 w-4 transition-transform duration-300"
                                                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            />
                                        </span>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mx-5 border-t border-slate-100 pb-5 pt-4 sm:mx-6">
                                                    <p className="text-sm leading-relaxed text-slate-600">
                                                        {a}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-slate-900 p-8 text-center sm:p-12"
                >
                    <div aria-hidden="true" className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
                    <h2 className="relative text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        ¿Aún tienes dudas sobre qué plan elegir?
                    </h2>
                    <p className="relative max-w-md text-sm text-slate-300 sm:text-base">
                        Cuéntanos sobre tu negocio y te recomendamos el plan ideal para ti.
                    </p>
                    <Button size="lg" className="relative" onClick={() => navigate('/solicitar')}>
                        Contáctanos
                        <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                </motion.div>
            </section>
        </div>
    );
};

export default Precios;
