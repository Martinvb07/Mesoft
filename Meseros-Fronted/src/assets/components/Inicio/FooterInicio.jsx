import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiMail, FiMapPin } from 'react-icons/fi';
import '../../css/landing-tailwind.css';

const columnas = [
    {
        titulo: 'Producto',
        links: [
            { to: '/', label: 'Inicio' },
            { to: '/funciones', label: 'Funciones' },
            { to: '/precios', label: 'Precios' },
        ],
    },
    {
        titulo: 'Empresa',
        links: [
            { to: '/quienes-somos', label: '¿Quiénes somos?' },
            { to: '/solicitar', label: 'Solicitar acceso' },
        ],
    },
    {
        titulo: 'Cuenta',
        links: [
            { to: '/login', label: 'Iniciar sesión' },
            { to: '/solicitar', label: 'Solicitar demo' },
        ],
    },
];

const redes = [
    { icon: FiInstagram, label: 'Instagram', href: 'https://instagram.com' },
    { icon: FiFacebook, label: 'Facebook', href: 'https://facebook.com' },
    { icon: FiMail, label: 'Correo', href: 'mailto:martindavidvb@gmail.com' },
];

const FooterInicio = () => {
    const año = new Date().getFullYear();

    return (
        <footer className="relative overflow-hidden bg-slate-950">
            <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-16">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                    <div>
                        <Link to="/" className="flex items-center gap-2 text-white no-underline">
                            <img src="/logopngmesoft.png" alt="Mesoft" className="h-9 w-9 rounded-lg object-contain" />
                            <span className="text-xl font-extrabold tracking-tight">Mesoft</span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                            Software de gestión para restaurantes: ventas, pedidos, inventario y reportes en un solo lugar.
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
                            <FiMapPin className="h-4 w-4 text-orange-400" />
                            Colombia
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                            {redes.map(({ icon: Icon, label, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={label}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-orange-500 hover:text-white hover:ring-orange-500"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                    {columnas.map((col) => (
                        <div key={col.titulo}>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">{col.titulo}</h3>
                            <ul className="mt-4 list-none space-y-3 m-0 p-0">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-slate-400 no-underline transition hover:text-orange-400"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
                    <p className="text-xs text-slate-500">© {año} Mesoft. Todos los derechos reservados.</p>
                    <p className="text-xs text-slate-500">
                        Un producto de <span className="font-bold text-slate-300">Llano Studio</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default FooterInicio;
