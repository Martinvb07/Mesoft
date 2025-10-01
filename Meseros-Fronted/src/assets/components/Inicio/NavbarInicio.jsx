import React from 'react';
import '../../css/Navbar/Navbar.css';
import { Link } from 'react-router-dom';

const NavbarInicio = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">Mesoft</div>
                            <ul className="navbar-links">
                                <li><Link to="/">Inicio</Link></li>
                                <li><Link to="/quienes-somos">¿Quiénes somos?</Link></li>
                                <li><Link to="/solicitar">Solicitar</Link></li>
                                <li><Link to="/login">Inicia sesión</Link></li>
                            </ul>
        </nav>
    );
};

export default NavbarInicio;
