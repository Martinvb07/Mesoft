import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  HiOutlineHome, HiOutlineTableCells, HiOutlineUserGroup,
  HiOutlineCog6Tooth, HiOutlineCurrencyDollar, HiOutlineFire,
  HiOutlineSquaresPlus, HiOutlineCalendarDays, HiOutlineUsers,
  HiOutlineTruck, HiOutlineChartBar, HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown, HiOutlineDocumentText, HiOutlineLockClosed,
  HiOutlineArchiveBox, HiOutlineCreditCard, HiOutlineClipboardDocumentList,
  HiOutlineArrowRightOnRectangle, HiOutlineMagnifyingGlass, HiBars3,
  HiXMark, HiChevronDown,
} from 'react-icons/hi2';
import { api } from '../../../api/client';
import { logAudit } from '../../../utils/audit';

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

/* ─── Dropdown ─── */
function Dropdown({ label, icon: Icon, children, active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const bg = open || active ? 'rgba(255,102,51,.15)' : 'transparent';
  const color = open || active ? '#FF6633' : '#cbd5e1';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: bg, border: 'none', color, cursor: 'pointer',
        padding: '7px 12px', borderRadius: 8, fontSize: '.875rem',
        fontWeight: 500, transition: 'all .15s', whiteSpace: 'nowrap',
      }}
        onMouseEnter={e => { if (!open && !active) e.currentTarget.style.background = 'rgba(255,255,255,.07)'; }}
        onMouseLeave={e => { if (!open && !active) e.currentTarget.style.background = 'transparent'; }}
      >
        {Icon && <Icon size={16} />}
        {label}
        <HiChevronDown size={12} style={{ opacity: .7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: 210, background: '#1e293b',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,.45)',
          zIndex: 9999, padding: 6,
          animation: 'fadeInDown .12s ease',
        }}>
          {React.Children.map(children, child =>
            child ? React.cloneElement(child, { onClose: () => setOpen(false) }) : null
          )}
        </div>
      )}
    </div>
  );
}

function DropItem({ to, icon: Icon, label, onClose }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => { navigate(to); onClose?.(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', background: 'transparent', border: 'none',
        color: '#94a3b8', cursor: 'pointer', padding: '8px 12px',
        borderRadius: 8, fontSize: '.875rem', textAlign: 'left',
        transition: 'background .1s, color .1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,102,51,.1)'; e.currentTarget.style.color = '#FF6633'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
    >
      {Icon && <Icon size={15} style={{ flexShrink: 0 }} />}
      {label}
    </button>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 6px' }} />;
}

/* ─── NavLink ─── */
function NavLink({ to, label, icon: Icon }) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== '/admin/home' && loc.pathname.startsWith(to));
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      color: active ? '#FF6633' : '#cbd5e1',
      textDecoration: 'none', fontSize: '.875rem', fontWeight: 500,
      padding: '7px 12px', borderRadius: 8,
      background: active ? 'rgba(255,102,51,.12)' : 'transparent',
      transition: 'all .15s', whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.07)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {Icon && <Icon size={16} />}
      {label}
    </Link>
  );
}

/* ─── Search ─── */
function SearchBar() {
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {!open ? (
        <button onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.08)',
            color: '#64748b', cursor: 'pointer', borderRadius: 8,
            padding: '7px 12px', fontSize: '.875rem', transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = '#64748b'; }}
          title="Buscar"
        >
          <HiOutlineMagnifyingGlass size={16} />
          <span style={{ display: 'none' }}>Buscar</span>
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input ref={inputRef} value={q} onChange={handleChange} placeholder="Buscar…"
            style={{
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
              color: '#f1f5f9', borderRadius: 8, padding: '7px 12px',
              fontSize: '.875rem', width: 240, outline: 'none',
            }}
          />
          <button onClick={() => { setOpen(false); setQ(''); }}
            style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', lineHeight: 1, padding: 2 }}>
            <HiXMark size={16} />
          </button>
        </div>
      )}
      {open && q.trim() && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          minWidth: 290, background: '#1e293b',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,.45)',
          zIndex: 9999, padding: 8,
        }}>
          {loading && <p style={{ color: '#475569', fontSize: '.85rem', padding: '6px 10px', margin: 0 }}>Buscando…</p>}
          {!loading && !hasResults && q && <p style={{ color: '#475569', fontSize: '.85rem', padding: '6px 10px', margin: 0 }}>Sin resultados</p>}
          {[
            { key: 'mesas', label: 'Mesas', path: '/admin/mesas', Icon: HiOutlineTableCells, render: m => `Mesa ${m.numero} — ${m.estado}` },
            { key: 'productos', label: 'Productos', path: '/admin/finanzas/inventario', Icon: HiOutlineArchiveBox, render: p => `${p.nombre}${p.categoria ? ` · ${p.categoria}` : ''}` },
            { key: 'meseros', label: 'Meseros', path: '/admin/meseros', Icon: HiOutlineUserGroup, render: m => m.nombre },
          ].map(({ key, label, path, Icon, render }) => res[key]?.length > 0 && (
            <div key={key}>
              <p style={{ color: '#334155', fontSize: '.7rem', fontWeight: 700, margin: '4px 0 2px', padding: '0 8px', textTransform: 'uppercase', letterSpacing: .8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={11} /> {label}
              </p>
              {res[key].map((item, i) => (
                <button key={i} onClick={() => { navigate(path); setOpen(false); setQ(''); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#94a3b8', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '.875rem' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,102,51,.1)'; e.currentTarget.style.color = '#FF6633'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                >{render(item)}</button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── NavbarAdmin ─── */
const NavbarAdmin = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();
  const { rol, nombre } = getUser();
  const isCocinero = rol === 'cocinero';

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

  const mobileLinks = [
    { to: '/admin/home',                  label: 'Inicio',          Icon: HiOutlineHome,                    group: null },
    { to: '/admin/mesas',                 label: 'Mesas',           Icon: HiOutlineTableCells,              group: null },
    { to: '/admin/meseros',               label: 'Meseros',         Icon: HiOutlineUserGroup,               group: null },
    // Operaciones
    { label: 'OPERACIONES', group: 'header' },
    { to: '/admin/cocina',                label: 'Cocina / KDS',    Icon: HiOutlineFire,                    group: 'sub' },
    { to: '/admin/combos',                label: 'Combos',          Icon: HiOutlineSquaresPlus,             group: 'sub' },
    { to: '/admin/horarios',              label: 'Horarios',        Icon: HiOutlineCalendarDays,            group: 'sub' },
    { to: '/admin/clientes',              label: 'Clientes',        Icon: HiOutlineUsers,                   group: 'sub' },
    { to: '/admin/proveedores',           label: 'Proveedores',     Icon: HiOutlineTruck,                   group: 'sub' },
    // Finanzas
    { label: 'FINANZAS', group: 'header' },
    { to: '/admin/finanzas/resumen',      label: 'Resumen',         Icon: HiOutlineChartBar,                group: 'sub' },
    { to: '/admin/finanzas/ingresos',     label: 'Ingresos',        Icon: HiOutlineArrowTrendingUp,         group: 'sub' },
    { to: '/admin/finanzas/egresos',      label: 'Egresos',         Icon: HiOutlineArrowTrendingDown,       group: 'sub' },
    { to: '/admin/finanzas/reportes',     label: 'Reportes',        Icon: HiOutlineDocumentText,            group: 'sub' },
    { to: '/admin/finanzas/cierre',       label: 'Cierre de caja',  Icon: HiOutlineLockClosed,              group: 'sub' },
    { to: '/admin/finanzas/inventario',   label: 'Inventario',      Icon: HiOutlineArchiveBox,              group: 'sub' },
    { to: '/admin/finanzas/nominas',      label: 'Nóminas',         Icon: HiOutlineCreditCard,              group: 'sub' },
    // Config
    { label: 'SISTEMA', group: 'header' },
    { to: '/admin/configuracion',         label: 'Configuración',   Icon: HiOutlineCog6Tooth,               group: 'sub' },
    { to: '/admin/auditoria',             label: 'Auditoría',       Icon: HiOutlineClipboardDocumentList,   group: 'sub' },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from { opacity:0; transform:translateY(-5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .nav-mobile-drawer { display:none; }
        @media (max-width:900px) {
          .nav-desktop-items { display:none !important; }
          .nav-mobile-btn    { display:flex !important; }
          .nav-mobile-drawer.open { display:flex; }
        }
        @media (min-width:901px) { .nav-mobile-btn { display:none !important; } }
      `}</style>

      <nav className="navbar" style={{
        background: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        boxShadow: '0 1px 16px rgba(0,0,0,.35)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', height: 54, gap: 4,
        fontFamily: "'Inter','Segoe UI',sans-serif",
        justifyContent: 'flex-start',
      }}>

        {/* Logo */}
        <Link to={isCocinero ? '/admin/cocina' : '/admin/home'} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none', marginRight: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'linear-gradient(135deg,#FF6633,#ff9a6c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255,102,51,.4)',
          }}>
            <HiOutlineFire size={16} color="#fff" />
          </div>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '.95rem', letterSpacing: -.3 }}>Mesoft</span>
        </Link>

        {/* Separador */}
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.08)', marginRight: 6 }} />

        {/* Nav desktop */}
        <div className="nav-desktop-items" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {isCocinero ? (
            <NavLink to="/admin/cocina" label="Cocina" icon={HiOutlineFire} />
          ) : (
            <>
              <NavLink to="/admin/home"    label="Inicio"   icon={HiOutlineHome} />
              <NavLink to="/admin/mesas"   label="Mesas"    icon={HiOutlineTableCells} />
              <NavLink to="/admin/meseros" label="Meseros"  icon={HiOutlineUserGroup} />

              <Dropdown label="Operaciones" icon={HiOutlineCog6Tooth}
                active={['/admin/cocina','/admin/combos','/admin/horarios','/admin/clientes','/admin/proveedores'].some(p => loc.pathname.startsWith(p))}
              >
                <DropItem to="/admin/cocina"      icon={HiOutlineFire}           label="Cocina / KDS" />
                <DropItem to="/admin/combos"      icon={HiOutlineSquaresPlus}    label="Combos" />
                <DropItem to="/admin/horarios"    icon={HiOutlineCalendarDays}   label="Horarios" />
                <Divider />
                <DropItem to="/admin/clientes"    icon={HiOutlineUsers}          label="Clientes" />
                <DropItem to="/admin/proveedores" icon={HiOutlineTruck}          label="Proveedores" />
              </Dropdown>

              <Dropdown label="Finanzas" icon={HiOutlineCurrencyDollar}
                active={loc.pathname.startsWith('/admin/finanzas')}
              >
                <DropItem to="/admin/finanzas/resumen"    icon={HiOutlineChartBar}            label="Resumen" />
                <DropItem to="/admin/finanzas/ingresos"   icon={HiOutlineArrowTrendingUp}     label="Ingresos" />
                <DropItem to="/admin/finanzas/egresos"    icon={HiOutlineArrowTrendingDown}   label="Egresos" />
                <DropItem to="/admin/finanzas/reportes"   icon={HiOutlineDocumentText}        label="Reportes" />
                <DropItem to="/admin/finanzas/cierre"     icon={HiOutlineLockClosed}          label="Cierre de caja" />
                <Divider />
                <DropItem to="/admin/finanzas/inventario" icon={HiOutlineArchiveBox}          label="Inventario" />
                <DropItem to="/admin/finanzas/nominas"    icon={HiOutlineCreditCard}          label="Nóminas" />
              </Dropdown>
            </>
          )}
        </div>

        {/* Derecha */}
        <div className="nav-desktop-items" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isCocinero && <SearchBar />}

          <Dropdown
            label=""
            icon={() => (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#FF6633,#ff9a6c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '.8rem', flexShrink: 0,
              }}>
                {nombre.charAt(0).toUpperCase()}
              </div>
            )}
            active={false}
          >
            <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 4 }}>
              <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 600, fontSize: '.875rem' }}>{nombre}</p>
              <p style={{ margin: 0, color: '#334155', fontSize: '.75rem', textTransform: 'capitalize' }}>{rol || 'Admin'}</p>
            </div>
            {!isCocinero && <DropItem to="/admin/configuracion" icon={HiOutlineCog6Tooth}             label="Configuración" />}
            {!isCocinero && <DropItem to="/admin/auditoria"     icon={HiOutlineClipboardDocumentList} label="Auditoría" />}
            <Divider />
            <button onClick={handleSalir}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, fontSize: '.875rem', textAlign: 'left', transition: 'background .1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <HiOutlineArrowRightOnRectangle size={15} /> Cerrar sesión
            </button>
          </Dropdown>
        </div>

        {/* Mobile toggle */}
        <button className="nav-mobile-btn" onClick={() => setMobileOpen(v => !v)}
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, display: 'none' }}
        >
          {mobileOpen ? <HiXMark size={22} /> : <HiBars3 size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer ${mobileOpen ? 'open' : ''}`}
        style={{
          position: 'fixed', top: 54, left: 0, right: 0, bottom: 0,
          background: '#0f172a', zIndex: 999, flexDirection: 'column',
          padding: 12, overflowY: 'auto', gap: 2,
        }}
      >
        {(isCocinero
          ? [{ to: '/admin/cocina', label: 'Cocina', Icon: HiOutlineFire, group: null }]
          : mobileLinks
        ).map((item, i) => {
          if (item.group === 'header') {
            return (
              <p key={i} style={{ margin: '12px 0 4px 14px', fontSize: '.68rem', fontWeight: 700, color: '#334155', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {item.label}
              </p>
            );
          }
          const { to, label, Icon, group } = item;
          const active = loc.pathname.startsWith(to);
          return (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                color: active ? '#FF6633' : '#cbd5e1',
                textDecoration: 'none',
                padding: group === 'sub' ? '9px 14px 9px 28px' : '11px 14px',
                borderRadius: 8, fontSize: group === 'sub' ? '.875rem' : '1rem',
                background: active ? 'rgba(255,102,51,.1)' : 'transparent',
              }}
            >
              {Icon && <Icon size={group === 'sub' ? 15 : 18} style={{ color: active ? '#FF6633' : '#475569', flexShrink: 0 }} />}
              {label}
            </Link>
          );
        })}
        <button onClick={handleSalir}
          style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', padding: '11px 14px', borderRadius: 10, fontSize: '1rem', marginTop: 8 }}
        >
          <HiOutlineArrowRightOnRectangle size={19} /> Cerrar sesión
        </button>
      </div>
    </>
  );
};

export default NavbarAdmin;
