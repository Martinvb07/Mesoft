import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  HiOutlineHome, HiOutlineTableCells, HiOutlineUserGroup,
  HiOutlineArrowRightOnRectangle, HiBars3, HiXMark,
} from 'react-icons/hi2';

function getUser() {
  try {
    for (const k of ['currentUser', 'usuario', 'user', 'auth_user']) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const u = JSON.parse(raw);
        const n = u?.nombre || u?.name || u?.usuario?.nombre || '';
        if (n) return n;
      }
    }
  } catch {}
  return 'Mesero';
}

const LINKS = [
  { to: '/mesero/home',    label: 'Inicio',      Icon: HiOutlineHome },
  { to: '/mesero/mesas',   label: 'Mesas',       Icon: HiOutlineTableCells },
  { to: '/mesero/meseros', label: 'Compañeros',  Icon: HiOutlineUserGroup },
];

const NavbarMesero = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();
  const nombre = getUser();

  const handleSalir = (e) => {
    e.preventDefault();
    Swal.fire({
      title: '¿Cerrar sesión?', icon: 'question',
      showCancelButton: true, confirmButtonText: 'Sí, salir', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#FF6633',
    }).then(r => {
      if (r.isConfirmed) {
        try {
          ['currentUser','auth:user','auth:role','auth:loginAt','auth_token','restaurant_id','restaurant_name'].forEach(k => localStorage.removeItem(k));
        } catch {}
        navigate('/login');
      }
    });
  };

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .mesero-nav-links { display: none !important; }
          .mesero-mobile-btn { display: flex !important; }
          .mesero-mobile-drawer.open { display: flex; }
        }
        @media (min-width: 901px) {
          .mesero-mobile-btn { display: none !important; }
          .mesero-mobile-drawer { display: none; }
        }
      `}</style>

      <nav className="navbar" style={{
        background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        boxShadow: '0 1px 16px rgba(0,0,0,.3)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', height: 54, gap: 8,
        fontFamily: "'Inter','Segoe UI',sans-serif",
        justifyContent: 'flex-start',
      }}>

        {/* Logo */}
        <Link to="/mesero/home" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none', marginRight: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'linear-gradient(135deg,#FF6633,#ff9a6c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255,102,51,.4)',
          }}>
            <HiOutlineTableCells size={15} color="#fff" />
          </div>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '.95rem', letterSpacing: -.3 }}>
            Mesoft
          </span>
        </Link>

        {/* Separador */}
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.1)', marginRight: 6 }} />

        {/* Links desktop */}
        <div className="mesero-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {LINKS.map(({ to, label, Icon }) => {
            const active = loc.pathname === to || loc.pathname.startsWith(to);
            return (
              <Link key={to} to={to} style={{
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
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Avatar + salir */}
        <div className="mesero-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg,#FF6633,#ff9a6c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '.8rem', flexShrink: 0,
          }}>
            {nombre.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: '#94a3b8', fontSize: '.875rem' }}>{nombre}</span>
          <button onClick={handleSalir}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none',
              color: '#64748b', cursor: 'pointer',
              padding: '7px 10px', borderRadius: 8, fontSize: '.875rem',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
            title="Cerrar sesión"
          >
            <HiOutlineArrowRightOnRectangle size={18} />
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="mesero-mobile-btn" onClick={() => setMobileOpen(v => !v)}
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, display: 'none' }}
        >
          {mobileOpen ? <HiXMark size={22} /> : <HiBars3 size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`mesero-mobile-drawer ${mobileOpen ? 'open' : ''}`}
        style={{
          position: 'fixed', top: 54, left: 0, right: 0, bottom: 0,
          background: '#0f172a', zIndex: 999, flexDirection: 'column',
          padding: 12, overflowY: 'auto', gap: 2,
        }}
      >
        {LINKS.map(({ to, label, Icon }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                color: active ? '#FF6633' : '#e2e8f0',
                textDecoration: 'none', padding: '11px 14px', borderRadius: 10, fontSize: '1rem',
                background: active ? 'rgba(255,102,51,.1)' : 'transparent',
              }}
            >
              <Icon size={19} style={{ color: active ? '#FF6633' : '#475569', flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
        <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '8px 0' }} />
        <button onClick={handleSalir}
          style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', padding: '11px 14px', borderRadius: 10, fontSize: '1rem' }}
        >
          <HiOutlineArrowRightOnRectangle size={19} /> Cerrar sesión
        </button>
      </div>
    </>
  );
};

export default NavbarMesero;
