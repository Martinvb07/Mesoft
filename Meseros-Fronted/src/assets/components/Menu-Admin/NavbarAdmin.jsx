import React, { useEffect, useRef, useState } from 'react';
import '../../css/Navbar/Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const NavbarAdmin = () => {
    const [openFinanzas, setOpenFinanzas] = useState(false);
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
        <ul className="navbar-links">
            <li><Link to="/admin/home">Inicio</Link></li>
            <li><Link to="/admin/mesas">Mesas</Link></li>
            <li><Link to="/admin/meseros">Meseros</Link></li>
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
                    <Link to="/admin/finanzas/resumen" className="dropdown-item" onClick={() => setOpenFinanzas(false)}>Resumen</Link>
                    <Link to="/admin/finanzas/ingresos" className="dropdown-item" onClick={() => setOpenFinanzas(false)}>Ingresos</Link>
                    <Link to="/admin/finanzas/egresos" className="dropdown-item" onClick={() => setOpenFinanzas(false)}>Egresos</Link>
                    <Link to="/admin/finanzas/reportes" className="dropdown-item" onClick={() => setOpenFinanzas(false)}>Reportes</Link>
                    <Link to="/admin/finanzas/cierre" className="dropdown-item" onClick={() => setOpenFinanzas(false)}>Cierre de caja</Link>
                    <Link to="/admin/finanzas/inventario" className="dropdown-item" onClick={() => setOpenFinanzas(false)}>Inventario</Link>
                    <Link to="/admin/finanzas/nominas" className="dropdown-item" onClick={() => setOpenFinanzas(false)}>Nóminas</Link>
                </div>
            </li>
            <li><Link to="/admin/configuracion">Configuración</Link></li>
            <li><Link to="/" onClick={handleSalirClick}>Salir</Link></li>
        </ul>
        </nav>
    );
};

export default NavbarAdmin;
