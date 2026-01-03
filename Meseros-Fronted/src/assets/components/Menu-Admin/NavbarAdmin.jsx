import React, { useEffect, useRef, useState } from 'react';
import '../../css/Navbar/Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const NavbarAdmin = () => {
    const [openFinanzas, setOpenFinanzas] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const finanzasRef = useRef(null);

    useEffect(() => {
        const onClickAway = (e) => {
            if (!finanzasRef.current) return;
            if (!finanzasRef.current.contains(e.target)) setOpenFinanzas(false);
        };
        document.addEventListener('click', onClickAway);
        return () => document.removeEventListener('click', onClickAway);
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
                navigate('/login');
            }
        });
    };

    return (
        <nav className="navbar">
        <div className="navbar-logo">Admin</div>

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
            <li><Link to="/admin/home" onClick={closeMenu}>Inicio</Link></li>
            <li><Link to="/admin/mesas" onClick={closeMenu}>Mesas</Link></li>
            <li><Link to="/admin/meseros" onClick={closeMenu}>Meseros</Link></li>
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
            <li><Link to="/admin/configuracion" onClick={closeMenu}>Configuración</Link></li>
            <li><Link to="/" onClick={(e) => { handleSalirClick(e); closeMenu(); }}>Salir</Link></li>
        </ul>
        </nav>
    );
};

export default NavbarAdmin;
