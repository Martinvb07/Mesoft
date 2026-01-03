import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../../css/Navbar/Navbar.css';

const NavbarMesero = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  // Sin precarga en localStorage; cada pantalla hará sus fetch al backend

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
        try {
          localStorage.removeItem('currentUser');
          localStorage.removeItem('auth:user');
          localStorage.removeItem('auth:role');
          localStorage.removeItem('auth:loginAt');
        } catch {}
        navigate('/login');
      }
    });
  };
  return (
    <nav className="navbar">
      <div className="navbar-logo">Mesero</div>

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
        <li><Link to="/mesero/home" onClick={closeMenu}>Home</Link></li>
        <li><Link to="/mesero/mesas" onClick={closeMenu}>Mesas</Link></li>
        <li><Link to="/mesero/meseros" onClick={closeMenu}>Meseros</Link></li>
        <li><Link to="/login" onClick={(e) => { handleSalirClick(e); closeMenu(); }}>Salir</Link></li>
      </ul>
    </nav>
  );
};

export default NavbarMesero;
