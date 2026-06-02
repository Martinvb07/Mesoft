import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../../css/Navbar/Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../../../api/client';
import { logAudit } from '../../../utils/audit';

const NavbarAdmin = () => {
    const [openFinanzas, setOpenFinanzas] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const finanzasRef = useRef(null);

    // Global search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ mesas: [], productos: [], meseros: [] });
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchTimer = useRef(null);

    useEffect(() => {
        const onClickAway = (e) => {
            if (!finanzasRef.current) return;
            if (!finanzasRef.current.contains(e.target)) setOpenFinanzas(false);
        };
        document.addEventListener('click', onClickAway);
        return () => document.removeEventListener('click', onClickAway);
    }, []);

    // Close search on outside click
    useEffect(() => {
        const onClickAway = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
                setSearchQuery('');
                setSearchResults({ mesas: [], productos: [], meseros: [] });
            }
        };
        document.addEventListener('mousedown', onClickAway);
        return () => document.removeEventListener('mousedown', onClickAway);
    }, []);

    const navigate = useNavigate();

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const closeMenu = () => setMenuOpen(false);

    const handleSalirClick = (e) => {
        e.preventDefault();
        Swal.fire({
            title: '¿Seguro que quieres salir?',
            text: 'Se cerrará tu sesión actual.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                logAudit(null, 'logout', 'Cierre de sesión desde NavbarAdmin');
                navigate('/login');
            }
        });
    };

    const runSearch = useCallback(async (q) => {
        const term = q.trim().toLowerCase();
        if (!term) {
            setSearchResults({ mesas: [], productos: [], meseros: [] });
            return;
        }
        setSearchLoading(true);
        try {
            const [mesasAll, productosAll, meserosAll] = await Promise.allSettled([
                api.getMesas(),
                api.getProductos(),
                api.getMeseros(),
            ]);
            const mesas = mesasAll.status === 'fulfilled'
                ? (Array.isArray(mesasAll.value) ? mesasAll.value : [])
                    .filter(m => String(m.numero).includes(term) || (m.estado||'').toLowerCase().includes(term))
                    .slice(0, 3)
                : [];
            const rawProductos = productosAll.status === 'fulfilled'
                ? (Array.isArray(productosAll.value?.items) ? productosAll.value.items : Array.isArray(productosAll.value) ? productosAll.value : [])
                : [];
            const productos = rawProductos
                .filter(p => (p.nombre||'').toLowerCase().includes(term) || (p.sku||'').toLowerCase().includes(term) || (p.categoria||'').toLowerCase().includes(term))
                .slice(0, 3);
            const meseros = meserosAll.status === 'fulfilled'
                ? (Array.isArray(meserosAll.value) ? meserosAll.value : [])
                    .filter(m => (m.nombre||'').toLowerCase().includes(term) || (m.correo||'').toLowerCase().includes(term))
                    .slice(0, 3)
                : [];
            setSearchResults({ mesas, productos, meseros });
        } catch {
            setSearchResults({ mesas: [], productos: [], meseros: [] });
        } finally {
            setSearchLoading(false);
        }
    }, []);

    const handleSearchChange = (e) => {
        const q = e.target.value;
        setSearchQuery(q);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => runSearch(q), 350);
    };

    const openSearch = () => {
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
    };

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults({ mesas: [], productos: [], meseros: [] });
    };

    const goTo = (path) => {
        closeSearch();
        navigate(path);
    };

    const hasResults = searchResults.mesas.length > 0 || searchResults.productos.length > 0 || searchResults.meseros.length > 0;

    // Role-based visibility
    let userRol = '';
    try {
        const keys = ['currentUser', 'usuario', 'user', 'auth_user'];
        for (const k of keys) {
            const raw = localStorage.getItem(k);
            if (raw) { const u = JSON.parse(raw); userRol = u?.rol || u?.role || u?.usuario?.rol || ''; if (userRol) break; }
        }
    } catch {}
    const isCocinero = userRol === 'cocinero';

    return (
        <nav className="navbar">
        <div className="navbar-logo">Admin</div>

        {/* Global Search */}
        <div ref={searchRef} style={{ position: 'relative', marginLeft: 'auto', marginRight: '1rem' }}>
            {!searchOpen ? (
                <button
                    type="button"
                    onClick={openSearch}
                    style={{ background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '1.1rem', padding: '.3rem .5rem', borderRadius: 6 }}
                    title="Buscar"
                    aria-label="Abrir búsqueda"
                >
                    🔍
                </button>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Buscar mesas, productos, meseros..."
                        style={{
                            background: '#374151', border: '1px solid #4b5563', color: '#f9fafb',
                            borderRadius: 8, padding: '.35rem .65rem', fontSize: '.9rem', width: 220,
                            outline: 'none',
                        }}
                    />
                    <button type="button" onClick={closeSearch} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
                </div>
            )}
            {/* Dropdown results */}
            {searchOpen && searchQuery.trim() && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    minWidth: 300, background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, boxShadow: '0 10px 32px rgba(0,0,0,.3)',
                    zIndex: 2000, padding: '.5rem',
                }}>
                    {searchLoading && <div style={{ color: '#9ca3af', padding: '.5rem', fontSize: '.875rem' }}>Buscando…</div>}
                    {!searchLoading && !hasResults && <div style={{ color: '#9ca3af', padding: '.5rem', fontSize: '.875rem' }}>Sin resultados para "{searchQuery}"</div>}
                    {!searchLoading && searchResults.mesas.length > 0 && (
                        <div>
                            <div style={{ color: '#6b7280', fontSize: '.75rem', fontWeight: 700, padding: '.25rem .5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Mesas</div>
                            {searchResults.mesas.map(m => (
                                <button key={m.id} type="button" onClick={() => goTo('/admin/mesas')}
                                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#e2e8f0', padding: '.4rem .6rem', borderRadius: 6, cursor: 'pointer', fontSize: '.9rem' }}
                                    onMouseEnter={e => e.target.style.background='#374151'} onMouseLeave={e => e.target.style.background='transparent'}
                                >
                                    Mesa {m.numero} — {m.estado}
                                </button>
                            ))}
                        </div>
                    )}
                    {!searchLoading && searchResults.productos.length > 0 && (
                        <div>
                            <div style={{ color: '#6b7280', fontSize: '.75rem', fontWeight: 700, padding: '.25rem .5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Productos</div>
                            {searchResults.productos.map(p => (
                                <button key={p.id} type="button" onClick={() => goTo('/admin/finanzas/inventario')}
                                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#e2e8f0', padding: '.4rem .6rem', borderRadius: 6, cursor: 'pointer', fontSize: '.9rem' }}
                                    onMouseEnter={e => e.target.style.background='#374151'} onMouseLeave={e => e.target.style.background='transparent'}
                                >
                                    {p.nombre} · {p.categoria || 'Sin categoría'}
                                </button>
                            ))}
                        </div>
                    )}
                    {!searchLoading && searchResults.meseros.length > 0 && (
                        <div>
                            <div style={{ color: '#6b7280', fontSize: '.75rem', fontWeight: 700, padding: '.25rem .5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Meseros</div>
                            {searchResults.meseros.map(m => (
                                <button key={m.id} type="button" onClick={() => goTo('/admin/meseros')}
                                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#e2e8f0', padding: '.4rem .6rem', borderRadius: 6, cursor: 'pointer', fontSize: '.9rem' }}
                                    onMouseEnter={e => e.target.style.background='#374151'} onMouseLeave={e => e.target.style.background='transparent'}
                                >
                                    {m.nombre} {m.correo ? `· ${m.correo}` : ''}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        <button
            type="button"
            className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
        >
            <span></span>
            <span></span>
            <span></span>
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            {!isCocinero && <li><Link to="/admin/home" onClick={closeMenu}>Inicio</Link></li>}
            {!isCocinero && <li><Link to="/admin/mesas" onClick={closeMenu}>Mesas</Link></li>}
            {!isCocinero && <li><Link to="/admin/meseros" onClick={closeMenu}>Meseros</Link></li>}
            {!isCocinero && (
            <li className="navbar-item dropdown" ref={finanzasRef}>
                <button
                    type="button"
                    className="dropdown-toggle"
                    aria-haspopup="true"
                    aria-expanded={openFinanzas}
                    onClick={() => setOpenFinanzas(v => !v)}
                >
                    Finanzas ▾
                </button>
                <div className={`dropdown-menu ${openFinanzas ? 'open' : ''}`} role="menu">
                    <Link to="/admin/finanzas/resumen" className="dropdown-item" onClick={() => { setOpenFinanzas(false); closeMenu(); }}>Resumen</Link>
                    <Link to="/admin/finanzas/ingresos" className="dropdown-item" onClick={() => { setOpenFinanzas(false); closeMenu(); }}>Ingresos</Link>
                    <Link to="/admin/finanzas/egresos" className="dropdown-item" onClick={() => { setOpenFinanzas(false); closeMenu(); }}>Egresos</Link>
                    <Link to="/admin/finanzas/reportes" className="dropdown-item" onClick={() => { setOpenFinanzas(false); closeMenu(); }}>Reportes</Link>
                    <Link to="/admin/finanzas/cierre" className="dropdown-item" onClick={() => { setOpenFinanzas(false); closeMenu(); }}>Cierre de caja</Link>
                    <Link to="/admin/finanzas/inventario" className="dropdown-item" onClick={() => { setOpenFinanzas(false); closeMenu(); }}>Inventario</Link>
                    <Link to="/admin/finanzas/nominas" className="dropdown-item" onClick={() => { setOpenFinanzas(false); closeMenu(); }}>Nóminas</Link>
                </div>
            </li>
            )}
            <li><Link to="/admin/cocina" onClick={closeMenu}>Cocina</Link></li>
            {!isCocinero && <li><Link to="/admin/combos" onClick={closeMenu}>Combos</Link></li>}
            {!isCocinero && <li><Link to="/admin/clientes" onClick={closeMenu}>Clientes</Link></li>}
            {!isCocinero && <li><Link to="/admin/proveedores" onClick={closeMenu}>Proveedores</Link></li>}
            {!isCocinero && <li><Link to="/admin/horarios" onClick={closeMenu}>Horarios</Link></li>}
            {!isCocinero && <li><Link to="/admin/configuracion" onClick={closeMenu}>Configuración</Link></li>}
            {!isCocinero && <li><Link to="/admin/auditoria" onClick={closeMenu}>Auditoría</Link></li>}
            <li><Link to="/" onClick={(e) => { handleSalirClick(e); closeMenu(); }}>Salir</Link></li>
        </ul>
        </nav>
    );
};

export default NavbarAdmin;
