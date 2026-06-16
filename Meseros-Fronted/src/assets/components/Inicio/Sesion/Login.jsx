import React, { useState } from 'react';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { CgMail } from "react-icons/cg";
import { HiCheckCircle, HiArrowRight } from 'react-icons/hi2';

import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../ui/button';
import '../../../css/landing-tailwind.css';
import { logAudit } from '../../../../utils/audit';

const beneficios = [
    'Punto de venta y pedidos en mesa',
    'Inventario en tiempo real',
    'Reportes y cierre de caja',
    'Soporte cuando lo necesites',
];

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';

const Login = () => {
    const navigate = useNavigate();
    const [showPwd, setShowPwd] = useState(false);
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
            if (res.status === 429) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Demasiados intentos',
                    text: 'Has intentado iniciar sesión muchas veces seguidas. Espera un momento (alrededor de 1 minuto) y vuelve a intentarlo.',
                });
                return;
            }
            const msg = data.error || (res.status === 0 ? 'Error desconocido' : `Error ${res.status}`);
            Swal.fire({ icon: 'error', title: 'Error de acceso', text: msg });
            return;
        }
        if (data.success) {
            try {
                if (data.token) localStorage.setItem('auth_token', data.token);
                const rid = data.restaurantId || data.usuario?.restaurantId || data.usuario?.restaurant_id;
                if (rid) localStorage.setItem('restaurant_id', String(rid));
                if (data.usuario?.restaurante) localStorage.setItem('restaurant_name', data.usuario.restaurante);
                // Persistir info de usuario para menú de mesero y otros módulos
                localStorage.setItem('currentUser', JSON.stringify(data.usuario));
                localStorage.setItem('auth:user', JSON.stringify(data.usuario));
                if (data.usuario?.rol) localStorage.setItem('auth:role', String(data.usuario.rol));
                localStorage.setItem('auth:loginAt', String(Date.now()));
            } catch {}
            logAudit(data.usuario?.nombre || data.usuario?.correo || 'usuario', 'login', `Rol: ${data.usuario?.rol || '?'}`);
            Swal.fire({
                icon: 'success',
                title: `Bienvenid@ ${data.usuario.nombre}`,
                text: data.usuario?.restaurante ? `A tu plataforma: ${data.usuario.restaurante}` : 'Ingreso exitoso'
            }).then(() => {
                if (data.usuario?.rol === 'admin') navigate('/admin/home');
                else if (data.usuario?.rol === 'cocinero') navigate('/cocinero/cocina');
                else if (data.usuario?.rol === 'cajero') navigate('/cajero/caja');
                else if (data.usuario?.rol === 'mesero') navigate('/mesero/home');
                else navigate('/');
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Credenciales', text: data.error || 'Credenciales incorrectas.' });
        }
    };
    return (
        <div className="bg-gradient-to-b from-orange-50 via-white to-white">
            <div className="mx-auto flex min-h-[calc(100vh-60px)] max-w-md items-center px-4 py-12 lg:max-w-5xl">
                <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-300/40 ring-1 ring-slate-100 lg:grid-cols-2">
                    {/* PANEL DE MARCA */}
                    <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 lg:flex">
                        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

                        <Link to="/" className="relative flex items-center gap-2.5 text-white no-underline">
                            <img src="/logopngmesoft.png" alt="Mesoft" className="h-9 w-9 rounded-lg object-contain" />
                            <span className="text-xl font-extrabold tracking-tight">Mesoft</span>
                        </Link>

                        <div className="relative">
                            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
                                Tu restaurante,<br /><span className="text-orange-400">bajo control.</span>
                            </h2>
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
                                Todo lo que necesitas para administrar tu negocio en un solo lugar.
                            </p>
                            <ul className="mt-8 space-y-3.5">
                                {beneficios.map((b) => (
                                    <li key={b} className="flex items-center gap-3 text-sm text-slate-200">
                                        <HiCheckCircle className="h-5 w-5 shrink-0 text-orange-400" />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="relative text-xs text-slate-500">
                            © {new Date().getFullYear()} Mesoft · Llano Studio
                        </p>
                    </div>

                    {/* FORMULARIO */}
                    <div className="flex flex-col justify-center p-8 sm:p-12">
                        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-slate-900 no-underline lg:hidden">
                            <img src="/logopngmesoft.png" alt="Mesoft" className="h-9 w-9 rounded-lg object-contain" />
                            <span className="text-xl font-extrabold tracking-tight">Mesoft</span>
                        </Link>

                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                            Iniciar sesión
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Ingresa tus credenciales para acceder a tu plataforma.
                        </p>

                        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="usuario" className={labelClass}>Correo</label>
                                <div className="relative">
                                    <CgMail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input id="usuario" type="text" placeholder="Ingresa tu correo" className={inputClass} autoComplete="username" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className={labelClass}>Contraseña</label>
                                <div className="relative">
                                    <FiLock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input id="password" type={showPwd ? 'text' : 'password'} placeholder="Ingresa tu contraseña" className={inputClass.replace('pr-4', 'pr-11')} autoComplete="current-password" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(v => !v)}
                                        aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        title={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        style={{ appearance: 'none', WebkitAppearance: 'none', border: 0, background: 'transparent', padding: 0 }}
                                        className="absolute right-3.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-slate-400 outline-none transition-colors hover:text-orange-500"
                                    >
                                        {showPwd ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" size="lg" className="w-full">
                                Ingresar
                                <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-600">
                            ¿No tienes cuenta?{' '}
                            <Link to="/solicitar" className="font-semibold text-orange-500 hover:text-orange-600">
                                Solicita tu acceso
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
