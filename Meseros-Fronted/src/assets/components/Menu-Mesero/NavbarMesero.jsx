import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../../css/Navbar/Navbar.css';

const NavbarMesero = () => {
  const navigate = useNavigate();

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
      <ul className="navbar-links">
        <li><Link to="/mesero/home">Home</Link></li>
        <li><Link to="/mesero/mesas">Mesas</Link></li>
        <li><Link to="/mesero/meseros">Meseros</Link></li>
        <li><Link to="/login" onClick={handleSalirClick}>Salir</Link></li>
      </ul>
    </nav>
  );
};

export default NavbarMesero;
