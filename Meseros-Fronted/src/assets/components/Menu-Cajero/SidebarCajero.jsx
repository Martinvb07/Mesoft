import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  HiOutlineBanknotes, HiOutlineArrowRightOnRectangle, HiBars3, HiXMark,
  HiChevronLeft, HiChevronRight, HiOutlineMoon, HiOutlineSun,
} from 'react-icons/hi2';
import { getTheme, toggleTheme } from '../../../lib/theme';

function getUser() {
  try {
    for (const k of ['currentUser', 'usuario', 'user', 'auth_user']) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const u = JSON.parse(raw);
        const r = u?.rol || u?.role || u?.usuario?.rol || 'cajero';
        const n = u?.nombre || u?.name || u?.usuario?.nombre || '';
        if (n || r) return { rol: r, nombre: n || 'Cajero' };
      }
    }
  } catch {}
  return { rol: 'cajero', nombre: 'Cajero' };
}

const LINKS = [
  { to: '/cajero/caja', label: 'Caja', icon: HiOutlineBanknotes },
];

const navContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } } };
const navItem = { hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

function ActiveBar() {
  return (
    <motion.span
      layoutId="cajero-sidebar-active-bar"
      className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-to-b from-orange-500 to-orange-600"
      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
    />
  );
}

function SidebarLink({ to, label, icon: Icon, collapsed, onClick }) {
  const loc = useLocation();
  const active = loc.pathname === to || loc.pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl text-sm font-semibold no-underline transition-colors ${
        collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
      } ${active ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      {active && <ActiveBar />}
      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? 'text-orange-500' : 'group-hover:scale-110'}`} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div className="my-1.5 mx-auto h-px w-6 bg-slate-200" />;
  return <p className="m-0 mb-0.5 mt-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{children}</p>;
}

function Logo({ collapsed }) {
  return (
    <Link to="/cajero/caja" className="flex items-center gap-2.5 text-slate-900 no-underline">
      <motion.img
        src="/logopngmesoft.png"
        alt="Mesoft"
        className="h-9 w-9 shrink-0 object-contain"
        whileHover={{ scale: 1.08, rotate: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden whitespace-nowrap text-xl font-extrabold tracking-tight"
          >
            Mesoft
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

function ThemeToggle({ collapsed }) {
  const [theme, setThemeState] = useState(() => getTheme());
  const dark = theme === 'dark';
  const onClick = () => setThemeState(toggleTheme());
  return (
    <button
      onClick={onClick}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${collapsed ? 'justify-center px-0' : ''}`}
    >
      {dark
        ? <HiOutlineSun className="h-[18px] w-[18px] shrink-0 text-amber-500 transition-transform duration-200 group-hover:rotate-45" />
        : <HiOutlineMoon className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:-rotate-12" />}
      {!collapsed && (dark ? 'Modo claro' : 'Modo oscuro')}
    </button>
  );
}

const SidebarCajero = ({ collapsed = false, onToggleCollapse = () => {} }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();
  const { rol, nombre } = getUser();

  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  const handleSalir = (e) => {
    e.preventDefault();
    Swal.fire({
      title: '¿Cerrar sesión?', icon: 'question',
      showCancelButton: true, confirmButtonText: 'Sí, salir', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#FF6633',
    }).then(r => {
      if (r.isConfirmed) {
        try {
          ['currentUser', 'auth:user', 'auth:role', 'auth:loginAt', 'auth_token', 'restaurant_id', 'restaurant_name'].forEach(k => localStorage.removeItem(k));
        } catch {}
        navigate('/login');
      }
    });
  };

  return (
    <>
      <style>{`
        :where(.ms-sidebar) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}
        .ms-scroll{scrollbar-width:thin;scrollbar-color:#fdba74 transparent;}
        .ms-scroll::-webkit-scrollbar{width:7px;height:7px;}
        .ms-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#fdba74,#fb923c);border-radius:9999px;border:2px solid transparent;background-clip:padding-box;}
      `}</style>

      {/* Sidebar desktop */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`ms-sidebar fixed left-0 top-0 z-[1000] hidden h-screen flex-col border-r border-slate-100 bg-white shadow-sm shadow-slate-200/40 transition-[width] duration-200 lg:flex ${collapsed ? 'w-[78px]' : 'w-64'}`}
      >
        <div className={`flex h-[64px] shrink-0 items-center border-b border-slate-100 ${collapsed ? 'justify-center' : 'px-4'}`}>
          <Logo collapsed={collapsed} />
        </div>

        <motion.nav
          variants={navContainer}
          initial="hidden"
          animate="visible"
          className="ms-scroll flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 py-4"
        >
          <SectionLabel collapsed={collapsed}>Principal</SectionLabel>
          {LINKS.map(it => (
            <motion.div key={it.to} variants={navItem}>
              <SidebarLink {...it} collapsed={collapsed} />
            </motion.div>
          ))}
        </motion.nav>

        {/* Footer: tema + perfil + logout + colapsar */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="mb-1">
            <ThemeToggle collapsed={collapsed} />
          </div>
          {!collapsed && (
            <div className="mb-1 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-sm font-bold text-white shadow-sm shadow-orange-500/30">
                {nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-semibold text-slate-900">{nombre}</p>
                <p className="m-0 truncate text-xs capitalize text-slate-400">{rol || 'cajero'}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSalir}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <HiOutlineArrowRightOnRectangle className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            {!collapsed && 'Cerrar sesión'}
          </button>
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir' : 'Contraer'}
            className={`group mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            {collapsed
              ? <HiChevronRight className="h-[18px] w-[18px] shrink-0" />
              : <><HiChevronLeft className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" /> Contraer</>}
          </button>
        </div>
      </motion.aside>

      {/* Topbar mobile */}
      <div className="ms-sidebar fixed top-0 left-0 z-[1000] flex h-[60px] w-full items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md lg:hidden">
        <Logo collapsed={false} />
        <button
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(v => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600"
        >
          {mobileOpen ? <HiXMark className="h-6 w-6" /> : <HiBars3 className="h-6 w-6" />}
        </button>
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-[60px] z-[998] bg-slate-900/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="ms-sidebar ms-scroll fixed inset-x-0 top-[60px] z-[999] flex max-h-[calc(100vh-60px)] flex-col gap-0.5 overflow-y-auto border-b border-slate-100 bg-white p-3 shadow-xl lg:hidden"
            >
              <p className="m-0 mb-0.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Principal</p>
              {LINKS.map(({ to, label, icon: Icon }) => {
                const active = loc.pathname === to || loc.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-base no-underline transition-colors ${
                      active ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </Link>
                );
              })}
              <div className="my-1.5 h-px bg-slate-100" />
              <ThemeToggle collapsed={false} />
              <button
                onClick={handleSalir}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-base font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                <HiOutlineArrowRightOnRectangle className="h-[19px] w-[19px]" /> Cerrar sesión
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SidebarCajero;
