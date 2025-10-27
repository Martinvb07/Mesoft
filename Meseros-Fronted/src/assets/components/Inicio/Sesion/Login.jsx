import React from 'react';
import { FiUser, FiLock } from 'react-icons/fi';
import { CgMail } from "react-icons/cg";

import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import NavbarInicio from '../NavbarInicio';
import '../../../css/Navbar/Sesion/Login.css';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

const Login = () => {
    const navigate = useNavigate();
    const handleEspecialidades = () => {
        navigate('/');
        setTimeout(() => {
            const section = document.querySelector('.inicio-especialidades-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };
    const handleContactanos = () => {
        navigate('/solicitar');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const correo = document.getElementById('usuario').value.trim();
        const contrasena = document.getElementById('password').value;
        if(!correo || !contrasena){
            Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Ingresa correo y contraseña.' });
            return;
        }
        let res;
        try {
            res = await fetch(`${API_BASE}/usuarios/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena }),
            });
        } catch (networkErr){
            Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo contactar al servidor (network error).' });
            return;
        }
        let data;
        try { data = await res.json(); } catch { data = {}; }
        if(!res.ok){
            const msg = data.error || (res.status === 0 ? 'Error desconocido' : `Error ${res.status}`);
            Swal.fire({ icon: 'error', title: 'Error de acceso', text: msg });
            return;
        }
        if (data.success) {
            try {
                const rid = data.restaurantId || data.usuario?.restaurantId || data.usuario?.restaurant_id;
                if (rid) localStorage.setItem('restaurant_id', String(rid));
                if (data.usuario?.restaurante) localStorage.setItem('restaurant_name', data.usuario.restaurante);
                // Persistir info de usuario para menú de mesero y otros módulos
                localStorage.setItem('currentUser', JSON.stringify(data.usuario));
                localStorage.setItem('auth:user', JSON.stringify(data.usuario));
                if (data.usuario?.rol) localStorage.setItem('auth:role', String(data.usuario.rol));
                localStorage.setItem('auth:loginAt', String(Date.now()));
            } catch {}
            Swal.fire({
                icon: 'success',
                title: `Bienvenid@ ${data.usuario.nombre}`,
                text: data.usuario?.restaurante ? `A tu plataforma: ${data.usuario.restaurante}` : 'Ingreso exitoso'
            }).then(() => {
                if (data.usuario?.rol === 'admin') navigate('/admin/home');
                else if (data.usuario?.rol === 'mesero') navigate('/mesero/home');
                else navigate('/');
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Credenciales', text: data.error || 'Credenciales incorrectas.' });
        }
    };
    return (
        <>
            <NavbarInicio />
            <div className="login-hero-section">
                <div className="login-hero-left">
                    <h1 className="login-hero-title">Iniciar Sesión</h1>
                    <p className="login-hero-desc">
                        Ingresa tus credenciales para acceder al sistema y gestionar tu restaurante de forma profesional.
                    </p>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div style={{ width: '100%', marginBottom: '1.2rem' }}>
                            <label htmlFor="usuario" style={{ display: 'block', fontWeight: 600, color: '#333', marginBottom: '0.5rem', textAlign: 'left' }}>Correo</label>
                            <div className="login-input-icon-container">
                                <CgMail className="login-input-icon" />
                                <input id="usuario" type="text" placeholder="Ingresa tu correo" className="login-input with-icon" autoComplete="username" />
                            </div>
                        </div>
                        <div style={{ width: '100%', marginBottom: '1.2rem' }}>
                            <label htmlFor="password" style={{ display: 'block', fontWeight: 600, color: '#333', marginBottom: '0.5rem', textAlign: 'left' }}>Contraseña</label>
                            <div className="login-input-icon-container">
                                <FiLock className="login-input-icon" />
                                <input id="password" type="password" placeholder="Ingresa tu contraseña" className="login-input with-icon" autoComplete="current-password" />
                            </div>
                        </div>
                        <button type="submit" className="login-btn-main" style={{ width: '100%', marginTop: '0.5rem', fontSize: '1.1rem' }}>Ingresar</button>
                    </form>
                    <div className="login-info-extra" style={{ marginTop: '1.5rem' }}>
                        <span>¿No tienes cuenta? <Link to="/solicitar" className="login-link">Solicita tu permiso aquí</Link></span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
