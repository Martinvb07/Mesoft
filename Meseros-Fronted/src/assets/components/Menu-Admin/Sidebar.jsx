
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  HiOutlineHome, HiOutlineTableCells, HiOutlineUserGroup,
  HiOutlineCog6Tooth, HiOutlineCurrencyDollar, HiOutlineFire,
  HiOutlineSquaresPlus, HiOutlineCalendarDays, HiOutlineUsers,
  HiOutlineTruck, HiOutlineChartBar, HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown, HiOutlineDocumentText, HiOutlineLockClosed,
  HiOutlineArchiveBox, HiOutlineCreditCard, HiOutlineClipboardDocumentList,
  HiOutlineArrowRightOnRectangle, HiOutlineMagnifyingGlass, HiBars3,
  HiXMark, HiChevronDown, HiChevronLeft, HiChevronRight, HiOutlineShieldCheck,
  HiOutlineMoon, HiOutlineSun,
} from 'react-icons/hi2';
import { api } from '../../../api/client';
import { logAudit } from '../../../utils/audit';
import { getTheme, toggleTheme } from '../../../lib/theme';

/* ─── Botón de tema claro/oscuro ─── */
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

/* ─── helpers ─── */
function getUser() {
  try {
    for (const k of ['currentUser', 'usuario', 'user', 'auth_user']) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const u = JSON.parse(raw);
        const r = u?.rol || u?.role || u?.usuario?.rol || '';
        const n = u?.nombre || u?.name || u?.usuario?.nombre || '';
        if (n || r) return { rol: r, nombre: n };
      }
    }
  } catch {}
  return { rol: '', nombre: 'Admin' };
}

const OPERACIONES_ITEMS = [
  { to: '/admin/combos',      label: 'Combos',       icon: HiOutlineSquaresPlus },
  { to: '/admin/horarios',    label: 'Horarios',     icon: HiOutlineCalendarDays },
  { to: '/admin/clientes',    label: 'Clientes',     icon: HiOutlineUsers },
  { to: '/admin/proveedores', label: 'Proveedores',  icon: HiOutlineTruck },
];

const FINANZAS_ITEMS = [
  { to: '/admin/finanzas/resumen',    label: 'Resumen',        icon: HiOutlineChartBar },
  { to: '/admin/finanzas/ingresos',   label: 'Ingresos',       icon: HiOutlineArrowTrendingUp },
  { to: '/admin/finanzas/egresos',    label: 'Egresos',        icon: HiOutlineArrowTrendingDown },
  { to: '/admin/finanzas/reportes',   label: 'Reportes',       icon: HiOutlineDocumentText },
  { to: '/admin/finanzas/cierre',     label: 'Cierre de caja', icon: HiOutlineLockClosed },
  { to: '/admin/finanzas/inventario', label: 'Inventario',     icon: HiOutlineArchiveBox },
  { to: '/admin/finanzas/nominas',    label: 'Nóminas',        icon: HiOutlineCreditCard },
];

const SISTEMA_ITEMS = [
  { to: '/admin/configuracion', label: 'Configuración', icon: HiOutlineCog6Tooth },
  { to: '/admin/auditoria',     label: 'Auditoría',      icon: HiOutlineClipboardDocumentList },
];

const PRINCIPAL_ITEMS = [
  { to: '/admin/home',    label: 'Inicio',  icon: HiOutlineHome },
  { to: '/admin/mesas',   label: 'Mesas',   icon: HiOutlineTableCells },
  { to: '/admin/meseros', label: 'Personal', icon: HiOutlineUserGroup },
];

/* Variantes para la entrada con stagger */
const navContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
};
const navItem = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ─── Barra activa (pill animado compartido) ─── */
function ActiveBar() {
  return (
    <motion.span
      layoutId="sidebar-active-bar"
      className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-to-b from-orange-500 to-orange-600"
      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
    />
  );
}

/* ─── Link de primer nivel ─── */
function SidebarLink({ to, label, icon: Icon, collapsed, onClick, indent = false }) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== '/admin/home' && loc.pathname.startsWith(to));
  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl text-sm font-semibold no-underline transition-colors ${
        collapsed ? 'justify-center px-0 py-2.5' : indent ? 'px-3 py-2' : 'px-3 py-2.5'
      } ${
        active ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {active && <ActiveBar />}
      <Icon
        className={`${indent ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 transition-transform duration-200 ${
          active ? 'text-orange-500' : 'group-hover:scale-110'
        }`}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

/* ─── Grupo colapsable ─── */
function SidebarGroup({ label, icon: Icon, items, collapsed, paths, onExpand }) {
  const loc = useLocation();
  const isActiveGroup = paths.some(p => loc.pathname.startsWith(p));
  const [open, setOpen] = useState(isActiveGroup);

  useEffect(() => { if (isActiveGroup) setOpen(true); }, [isActiveGroup]);

  if (collapsed) {
    return (
      <button
        title={label}
        onClick={() => { onExpand(); setOpen(true); }}
        className={`group relative flex w-full items-center justify-center rounded-xl px-0 py-2.5 transition-colors ${
          isActiveGroup ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {isActiveGroup && <ActiveBar />}
        <Icon className={`h-5 w-5 transition-transform duration-200 ${isActiveGroup ? 'text-orange-500' : 'group-hover:scale-110'}`} />
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActiveGroup ? 'text-orange-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActiveGroup ? 'text-orange-500' : 'group-hover:scale-110'}`} />
        <span className="flex-1 truncate text-left">{label}</span>
        <HiChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 pl-2.5">
              {items.map(it => <SidebarLink key={it.to} {...it} collapsed={false} indent />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Grupo colapsable (drawer móvil) ─── */
function MobileGroup({ label, icon: Icon, items, paths, onNavigate }) {
  const loc = useLocation();
  const isActiveGroup = paths.some(p => loc.pathname.startsWith(p));
  const [open, setOpen] = useState(isActiveGroup);

  useEffect(() => { if (isActiveGroup) setOpen(true); }, [isActiveGroup]);

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors ${
          isActiveGroup ? 'text-orange-600' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActiveGroup ? 'text-orange-500' : ''}`} />
        <span className="flex-1 text-left">{label}</span>
        <HiChevronDown className={`h-4 w-4 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="ml-[26px] mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 pl-2.5">
              {items.map(({ to, label: lbl, icon: ItemIcon }) => {
                const active = loc.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm no-underline transition-colors ${
                      active ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <ItemIcon className="h-[15px] w-[15px] shrink-0" />
                    {lbl}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Encabezado de sección ─── */
function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div className="my-1.5 mx-auto h-px w-6 bg-slate-200" />;
  return (
    <p className="m-0 mb-0.5 mt-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

/* ─── Buscador ─── */
function SearchBar({ collapsed, onExpand }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [res, setRes] = useState({ mesas: [], productos: [], meseros: [] });
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const timer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const search = useCallback(async (term) => {
    if (!term.trim()) { setRes({ mesas: [], productos: [], meseros: [] }); return; }
    setLoading(true);
    try {
      const [m, p, me] = await Promise.allSettled([api.getMesas(), api.getProductos(), api.getMeseros()]);
      const t = term.toLowerCase();
      setRes({
        mesas: (m.value || []).filter(x => String(x.numero).includes(t) || x.estado?.includes(t)).slice(0, 3),
        productos: ((p.value?.items || p.value) || []).filter(x => x.nombre?.toLowerCase().includes(t) || x.sku?.toLowerCase().includes(t)).slice(0, 3),
        meseros: (me.value || []).filter(x => x.nombre?.toLowerCase().includes(t)).slice(0, 3),
      });
    } catch { setRes({ mesas: [], productos: [], meseros: [] }); }
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    setQ(e.target.value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(e.target.value), 300);
  };

  const hasResults = res.mesas.length + res.productos.length + res.meseros.length > 0;

  const openSearch = () => {
    if (collapsed) onExpand?.();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (collapsed && !open) {
    return (
      <button
        title="Buscar"
        onClick={openSearch}
        className="group flex w-full items-center justify-center rounded-xl px-0 py-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <HiOutlineMagnifyingGlass className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      {!open ? (
        <button
          onClick={openSearch}
          className="flex w-full items-center gap-2.5 rounded-xl border border-solid border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
        >
          <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0" />
          Buscar…
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            value={q}
            onChange={handleChange}
            placeholder="Buscar…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
          <button
            onClick={() => { setOpen(false); setQ(''); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </div>
      )}
      <AnimatePresence>
        {open && q.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-[calc(100%+6px)] z-[9999] w-72 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/80"
          >
            {loading && <p className="m-0 px-2.5 py-1.5 text-sm text-slate-400">Buscando…</p>}
            {!loading && !hasResults && q && <p className="m-0 px-2.5 py-1.5 text-sm text-slate-400">Sin resultados</p>}
            {[
              { key: 'mesas', label: 'Mesas', path: '/admin/mesas', Icon: HiOutlineTableCells, render: m => `Mesa ${m.numero} — ${m.estado}` },
              { key: 'productos', label: 'Productos', path: '/admin/finanzas/inventario', Icon: HiOutlineArchiveBox, render: p => `${p.nombre}${p.categoria ? ` · ${p.categoria}` : ''}` },
              { key: 'meseros', label: 'Meseros', path: '/admin/meseros', Icon: HiOutlineUserGroup, render: m => m.nombre },
            ].map(({ key, label, path, Icon, render }) => res[key]?.length > 0 && (
              <div key={key}>
                <p className="m-0 flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Icon className="h-[11px] w-[11px]" /> {label}
                </p>
                {res[key].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { navigate(path); setOpen(false); setQ(''); }}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-500"
                  >
                    {render(item)}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Logo ─── */
function Logo({ collapsed, to }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 text-slate-900 no-underline">
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

/* ─── Sidebar ─── */
const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();
  const { rol, nombre } = getUser();
  const isCocinero = rol === 'cocinero';

  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  const expandSidebar = () => { if (collapsed) onToggleCollapse(); };

  const handleSalir = (e) => {
    e.preventDefault();
    Swal.fire({
      title: '¿Cerrar sesión?', icon: 'question',
      showCancelButton: true, confirmButtonText: 'Sí, salir', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#FF6633',
    }).then(r => {
      if (r.isConfirmed) {
        logAudit(nombre, 'logout', 'Cierre de sesión');
        try {
          ['currentUser','auth:user','auth:role','auth:loginAt','auth_token','restaurant_id','restaurant_name'].forEach(k => localStorage.removeItem(k));
        } catch {}
        navigate('/login');
      }
    });
  };

  return (
    <>
      {/* Reset de botones nativos (Tailwind se importa sin preflight, por eso
          los <button> mostraban borde y fondo gris del navegador). :where()
          mantiene 0 de especificidad para que las clases de Tailwind ganen. */}
      <style>{`
        :where(.ms-sidebar) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}
        .ms-scroll{scrollbar-width:thin;scrollbar-color:#fdba74 transparent;}
        .ms-scroll::-webkit-scrollbar{width:7px;height:7px;}
        .ms-scroll::-webkit-scrollbar-track{background:transparent;margin:4px 0;}
        .ms-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#fdba74,#fb923c);border-radius:9999px;border:2px solid transparent;background-clip:padding-box;}
        .ms-scroll::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#fb923c,#f97316);background-clip:padding-box;}
      `}</style>

      {/* Sidebar desktop */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`ms-sidebar fixed left-0 top-0 z-[1000] hidden h-screen flex-col border-r border-slate-100 bg-white shadow-sm shadow-slate-200/40 transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-[78px]' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`flex h-[64px] shrink-0 items-center border-b border-slate-100 ${collapsed ? 'justify-center' : 'px-4'}`}>
          <Logo collapsed={collapsed} to={isCocinero ? '/admin/cocina' : '/admin/home'} />
        </div>

        {/* Nav */}
        <motion.nav
          variants={navContainer}
          initial="hidden"
          animate="visible"
          className="ms-scroll flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 py-4"
        >
          {!isCocinero && (
            <motion.div variants={navItem} className="mb-2">
              <SearchBar collapsed={collapsed} onExpand={expandSidebar} />
            </motion.div>
          )}

          {isCocinero ? (
            <motion.div variants={navItem}>
              <SidebarLink to="/admin/cocina" label="Cocina" icon={HiOutlineFire} collapsed={collapsed} />
            </motion.div>
          ) : (
            <>
              <SectionLabel collapsed={collapsed}>Principal</SectionLabel>
              <motion.div variants={navItem}><SidebarLink to="/admin/home"    label="Inicio"   icon={HiOutlineHome} collapsed={collapsed} /></motion.div>
              <motion.div variants={navItem}><SidebarLink to="/admin/mesas"   label="Mesas"    icon={HiOutlineTableCells} collapsed={collapsed} /></motion.div>
              <motion.div variants={navItem}><SidebarLink to="/admin/meseros" label="Personal"  icon={HiOutlineUserGroup} collapsed={collapsed} /></motion.div>

              <SectionLabel collapsed={collapsed}>Operaciones</SectionLabel>
              <motion.div variants={navItem}>
                <SidebarGroup
                  label="Operaciones" icon={HiOutlineCog6Tooth} collapsed={collapsed} onExpand={expandSidebar}
                  paths={['/admin/combos','/admin/horarios','/admin/clientes','/admin/proveedores']}
                  items={OPERACIONES_ITEMS}
                />
              </motion.div>
              <motion.div variants={navItem}>
                <SidebarGroup
                  label="Finanzas" icon={HiOutlineCurrencyDollar} collapsed={collapsed} onExpand={expandSidebar}
                  paths={['/admin/finanzas']}
                  items={FINANZAS_ITEMS}
                />
              </motion.div>

              <SectionLabel collapsed={collapsed}>Sistema</SectionLabel>
              <motion.div variants={navItem}>
                <SidebarGroup
                  label="Sistema" icon={HiOutlineShieldCheck} collapsed={collapsed} onExpand={expandSidebar}
                  paths={['/admin/configuracion','/admin/auditoria']}
                  items={SISTEMA_ITEMS}
                />
              </motion.div>
            </>
          )}
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
                <p className="m-0 truncate text-xs capitalize text-slate-400">{rol || 'Admin'}</p>
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
        <Logo collapsed={false} to={isCocinero ? '/admin/cocina' : '/admin/home'} />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-[60px] z-[998] bg-slate-900/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="ms-sidebar ms-scroll fixed inset-x-0 top-[60px] z-[999] flex max-h-[calc(100vh-60px)] flex-col gap-0.5 overflow-y-auto border-b border-slate-100 bg-white p-3 shadow-xl lg:hidden"
            >
              {isCocinero ? (
                <Link
                  to="/admin/cocina"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-base no-underline transition-colors ${
                    loc.pathname.startsWith('/admin/cocina') ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <HiOutlineFire className="h-[18px] w-[18px]" /> Cocina
                </Link>
              ) : (
                <>
                  <p className="m-0 mb-0.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Principal</p>
                  {PRINCIPAL_ITEMS.map(({ to, label, icon: Icon }) => {
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

                  <MobileGroup
                    label="Operaciones" icon={HiOutlineCog6Tooth}
                    paths={['/admin/combos','/admin/horarios','/admin/clientes','/admin/proveedores']}
                    items={OPERACIONES_ITEMS} onNavigate={() => setMobileOpen(false)}
                  />
                  <MobileGroup
                    label="Finanzas" icon={HiOutlineCurrencyDollar}
                    paths={['/admin/finanzas']}
                    items={FINANZAS_ITEMS} onNavigate={() => setMobileOpen(false)}
                  />
                  <MobileGroup
                    label="Sistema" icon={HiOutlineShieldCheck}
                    paths={['/admin/configuracion','/admin/auditoria']}
                    items={SISTEMA_ITEMS} onNavigate={() => setMobileOpen(false)}
                  />
                </>
              )}
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

export default Sidebar;
