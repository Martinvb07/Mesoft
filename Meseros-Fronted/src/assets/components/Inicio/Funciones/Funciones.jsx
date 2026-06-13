import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../ui/button';
import {
    HiOutlineComputerDesktop,
    HiOutlineClipboardDocumentList,
    HiOutlineCube,
    HiOutlineChartBar,
    HiOutlineUsers,
    HiOutlineCog6Tooth,
    HiCheckCircle,
    HiArrowRight,
} from 'react-icons/hi2';

const categorias = [
    {
        icon: HiOutlineComputerDesktop,
        title: 'Ventas y pedidos',
        desc: 'Toma y gestiona pedidos desde cualquier dispositivo, sin filas ni confusiones.',
        items: [
            'Punto de venta (POS) rápido y fácil de usar',
            'Pedidos en mesa, para llevar y a domicilio',
            'Envío automático de comandas a cocina',
            'División de cuentas y propinas',
        ],
    },
    {
        icon: HiOutlineCube,
        title: 'Inventario y compras',
        desc: 'Controla tu stock en tiempo real y evita pérdidas o quiebres de inventario.',
        items: [
            'Inventario actualizado en tiempo real',
            'Alertas de stock bajo',
            'Gestión de proveedores y compras',
            'Control de costos por producto',
        ],
    },
    {
        icon: HiOutlineUsers,
        title: 'Equipo y clientes',
        desc: 'Organiza a tu personal y conoce mejor a tus clientes para fidelizarlos.',
        items: [
            'Roles y permisos por usuario (admin, mesero, cajero, cocina)',
            'Gestión de meseros y turnos',
            'Base de datos de clientes',
            'Historial de pedidos y preferencias',
        ],
    },
    {
        icon: HiOutlineChartBar,
        title: 'Finanzas y reportes',
        desc: 'Toma mejores decisiones con información clara de tu negocio, al instante.',
        items: [
            'Reportes de ventas, ingresos y egresos',
            'Cierre de caja diario',
            'Nómina de empleados',
            'Reportes avanzados y exportables',
        ],
    },
    {
        icon: HiOutlineCog6Tooth,
        title: 'Configuración y extras',
        desc: 'Adapta Mesoft a la forma en que ya trabaja tu restaurante.',
        items: [
            'Horarios de atención y disponibilidad',
            'Combos y promociones personalizadas',
            'Menú digital público con código QR',
            'Auditoría de cambios y seguridad',
        ],
    },
    {
        icon: HiOutlineClipboardDocumentList,
        title: 'En la nube, siempre disponible',
        desc: 'Accede a tu negocio desde donde estés, sin instalar nada.',
        items: [
            'Acceso desde cualquier dispositivo con internet',
            'Datos respaldados automáticamente',
            'Actualizaciones sin interrupciones',
            'Soporte 24/7',
        ],
    },
];

const Funciones = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white">
            {/* HERO */}
            <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white">
                <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />
                <motion.div
                    className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-20"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Todo lo que necesitas para{' '}
                        <span className="text-orange-500">gestionar tu restaurante</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                        Desde la toma de pedidos hasta los reportes financieros, Mesoft centraliza cada parte
                        de la operación de tu negocio en una sola plataforma.
                    </p>
                    <Button size="lg" className="mt-8" onClick={() => navigate('/solicitar')}>
                        Solicitar demo gratuita
                        <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                </motion.div>
            </section>

            {/* CATEGORÍAS */}
            <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categorias.map(({ icon: Icon, title, desc, items }, idx) => (
                        <motion.article
                            key={title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                            className="group flex flex-col rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-orange-200"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                                <Icon className="h-6 w-6 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
                            <p className="mt-2 text-sm text-slate-500">{desc}</p>
                            <ul className="mt-4 space-y-2.5">
                                {items.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                                        <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.article>
                    ))}
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
                    <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
                    <h2 className="relative text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        ¿Listo para ver Mesoft en acción?
                    </h2>
                    <p className="relative max-w-md text-sm text-slate-300 sm:text-base">
                        Agenda una demo gratuita y te mostramos cómo Mesoft se adapta a tu restaurante.
                    </p>
                    <Button size="lg" className="relative" onClick={() => navigate('/solicitar')}>
                        Solicitar demo gratuita
                        <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                </motion.div>
            </section>
        </div>
    );
};

export default Funciones;
