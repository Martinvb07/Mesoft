import React, { useState } from 'react';
import '../../css/Navbar/Navbar.css';
import { Link } from 'react-router-dom';

const NavbarInicio = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-logo">Mesoft</div>

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
                <li><Link to="/" onClick={closeMenu}>Inicio</Link></li>
                <li><Link to="/quienes-somos" onClick={closeMenu}>¿Quiénes somos?</Link></li>
                <li><Link to="/solicitar" onClick={closeMenu}>Solicitar</Link></li>
                <li><Link to="/login" onClick={closeMenu}>Inicia sesión</Link></li>
            </ul>
        </nav>
    );
};

export default NavbarInicio;
