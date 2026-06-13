import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiBars3, HiXMark } from 'react-icons/hi2';
import '../../css/landing-tailwind.css';

const links = [
    { to: '/', label: 'Inicio' },
    { to: '/funciones', label: 'Funciones' },
    { to: '/precios', label: 'Precios' },
    { to: '/solicitar', label: 'Solicitar' },
];

const NavbarInicio = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { pathname } = useLocation();

    const closeMenu = () => setMenuOpen(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Cierra el menú móvil al navegar
    useEffect(() => { setMenuOpen(false); }, [pathname]);

    return (
        <nav
            className={`fixed top-0 left-0 w-full h-[60px] z-[1000] flex items-center justify-between gap-4 px-4 backdrop-blur-md transition-all duration-300 sm:px-8 ${
                scrolled
                    ? 'border-b border-slate-200/80 bg-white/95 shadow-md shadow-slate-900/5'
                    : 'border-b border-transparent bg-white/70'
            }`}
        >
            <Link to="/" onClick={closeMenu} className="flex items-center gap-2 text-slate-900 no-underline">
                <img src="/logopngmesoft.png" alt="Mesoft" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-xl font-extrabold tracking-tight">Mesoft</span>
            </Link>

            {/* Links desktop */}
            <ul className="hidden md:flex list-none items-center gap-1 m-0 p-0">
                {links.map((link) => {
                    const active = pathname === link.to;
                    return (
                        <li key={link.label} className="relative">
                            <Link
                                to={link.to}
                                className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold no-underline transition-colors ${
                                    active ? 'text-orange-500' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {link.label}
                            </Link>
                            {active && (
                                <motion.span
                                    layoutId="nav-active-pill"
                                    className="absolute inset-0 -z-10 rounded-full bg-orange-50"
                                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* Acciones desktop */}
            <div className="hidden md:flex items-center gap-2">
                <Link
                    to="/login"
                    className="inline-flex h-9 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                    Iniciar sesión
                </Link>
                <Link
                    to="/solicitar"
                    className="inline-flex h-9 items-center rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-5 text-sm font-semibold text-white no-underline shadow-md shadow-orange-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/40"
                >
                    Solicitar demo
                </Link>
            </div>

            {/* Botón hamburguesa móvil */}
            <button
                type="button"
                aria-label="Abrir menú"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-md border-0 bg-transparent text-slate-700 md:hidden"
            >
                {menuOpen ? <HiXMark className="h-6 w-6" /> : <HiBars3 className="h-6 w-6" />}
            </button>

            {/* Menú móvil */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute left-0 top-[60px] flex w-full flex-col gap-1 border-b border-slate-100 bg-white p-3 shadow-xl md:hidden"
                    >
                        {links.map((link) => (
                            <Link
                                key={link.label}
                                to={link.to}
                                onClick={closeMenu}
                                className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold no-underline ${
                                    pathname === link.to
                                        ? 'bg-orange-50 text-orange-500'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
                            <Link
                                to="/login"
                                onClick={closeMenu}
                                className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50"
                            >
                                Iniciar sesión
                            </Link>
                            <Link
                                to="/solicitar"
                                onClick={closeMenu}
                                className="rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2.5 text-center text-sm font-semibold text-white no-underline shadow-md shadow-orange-500/30"
                            >
                                Solicitar demo
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default NavbarInicio;
