import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import Button from '../../ui/button';
import '../../../css/landing-tailwind.css';

// Tomar base de API desde variable de entorno (misma convención que login y client.js)
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';

const pasos = [
	{ n: '1', titulo: 'Envías tu solicitud', desc: 'Completa el formulario con los datos de tu negocio.' },
	{ n: '2', titulo: 'Validamos tu información', desc: 'Revisamos los datos para preparar tu plataforma.' },
	{ n: '3', titulo: 'Recibes tu acceso', desc: 'Te contactamos con tus credenciales para empezar.' },
];

const Solicitar = () => {
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'auto' });
	}, []);

	const [form, setForm] = useState({
		nombre: '',
		apellido: '',
		correo: '',
		empresa: '',
		cargo: '',
		nit: '',
		mensaje: ''
	});

	const handleChange = (e) => {
		setForm({ ...form, [e.target.id]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const res = await fetch(`${API_BASE}/solicitud`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			let data = {};
			try { data = await res.json(); } catch { /* ignore parse */ }
			if (res.ok && data.success) {
				Swal.fire({
					icon: 'success',
					title: '¡Solicitud enviada!',
					text: 'Tu solicitud fue enviada correctamente. Te contactaremos pronto.'
				});
				setForm({ nombre: '', apellido: '', correo: '', empresa: '', cargo: '', nit: '', mensaje: '' });
			} else if (data.code === 'RATE_LIMIT') {
				const fecha = data.nextAllowedAt ? new Date(data.nextAllowedAt) : null;
				const fechaTexto = fecha ? fecha.toLocaleString() : null;
				Swal.fire({
					icon: 'info',
					title: 'Solicitud ya enviada',
					html: fechaTexto
						? `<p>${data.message}</p><p><b>Podrás volver a intentarlo:</b><br/>${fechaTexto}</p>`
						: (data.message || 'Ya enviaste una solicitud. Por favor espera hasta 48 horas para volver a intentarlo.')
				});
				setForm({ nombre: '', apellido: '', correo: '', empresa: '', cargo: '', nit: '', mensaje: '' });
			} else {
				Swal.fire({
					icon: 'error',
					title: 'Error al enviar',
					text: data.error || data.message || 'Intenta de nuevo.'
				});
			}
		} catch (err) {
			Swal.fire({
				icon: 'error',
				title: 'Error de conexión',
				text: 'No se pudo conectar al servidor.'
			});
		}
	};

	return (
		<div className="bg-gradient-to-b from-orange-50 via-white to-white">
			<div className="mx-auto max-w-xl px-4 py-16 sm:py-20 lg:max-w-5xl">
				<div className="grid overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-300/40 ring-1 ring-slate-100 lg:grid-cols-[0.85fr_1fr]">
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
								Empieza a digitalizar<br /><span className="text-orange-400">tu restaurante.</span>
							</h2>
							<p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
								Así de fácil es comenzar con Mesoft:
							</p>
							<ol className="mt-8 space-y-6">
								{pasos.map(({ n, titulo, desc }) => (
									<li key={n} className="flex gap-4">
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-400 ring-1 ring-orange-500/30">
											{n}
										</span>
										<div>
											<h3 className="text-sm font-bold text-white">{titulo}</h3>
											<p className="mt-0.5 text-xs leading-relaxed text-slate-400">{desc}</p>
										</div>
									</li>
								))}
							</ol>
						</div>

						<p className="relative text-xs text-slate-500">
							¿Ya tienes cuenta?{' '}
							<Link to="/login" className="font-semibold text-orange-400 hover:text-orange-300">
								Inicia sesión
							</Link>
						</p>
					</div>

					{/* FORMULARIO */}
					<div className="p-6 sm:p-10">
						<Link to="/" className="mb-8 flex items-center justify-center gap-2 text-slate-900 no-underline lg:hidden">
							<img src="/logopngmesoft.png" alt="Mesoft" className="h-9 w-9 rounded-lg object-contain" />
							<span className="text-xl font-extrabold tracking-tight">Mesoft</span>
						</Link>

						<h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
							Solicitar acceso
						</h1>
						<p className="mt-2 text-sm text-slate-500">
							Completa el formulario y validaremos tu información para otorgarte acceso.
						</p>
						<form className="mt-8 space-y-5" onSubmit={handleSubmit}>
						<div className="grid gap-5 sm:grid-cols-2">
							<div>
								<label htmlFor="nombre" className={labelClass}>Nombre</label>
								<input id="nombre" type="text" placeholder="Nombre" className={inputClass} required value={form.nombre} onChange={handleChange} />
							</div>
							<div>
								<label htmlFor="apellido" className={labelClass}>Apellido</label>
								<input id="apellido" type="text" placeholder="Apellido" className={inputClass} required value={form.apellido} onChange={handleChange} />
							</div>
						</div>
						<div className="grid gap-5 sm:grid-cols-2">
							<div>
								<label htmlFor="correo" className={labelClass}>Correo electrónico</label>
								<input id="correo" type="email" placeholder="Correo electrónico" className={inputClass} required value={form.correo} onChange={handleChange} />
							</div>
							<div>
								<label htmlFor="empresa" className={labelClass}>Nombre de la empresa</label>
								<input id="empresa" type="text" placeholder="Nombre de la empresa" className={inputClass} required value={form.empresa} onChange={handleChange} />
							</div>
						</div>
						<div className="grid gap-5 sm:grid-cols-2">
							<div>
								<label htmlFor="cargo" className={labelClass}>Cargo o rol</label>
								<input id="cargo" type="text" placeholder="Cargo o rol" className={inputClass} required value={form.cargo} onChange={handleChange} />
							</div>
							<div>
								<label htmlFor="nit" className={labelClass}>NIT de la empresa</label>
								<input id="nit" type="text" placeholder="NIT de la empresa" className={inputClass} required value={form.nit} onChange={handleChange} />
							</div>
						</div>
						<div>
							<label htmlFor="mensaje" className={labelClass}>Mensaje adicional</label>
							<textarea id="mensaje" placeholder="Más información de la empresa, redes sociales, etc." className={`${inputClass} resize-none`} rows={3} value={form.mensaje} onChange={handleChange} />
						</div>
						<Button type="submit" size="lg" className="w-full">
							Enviar solicitud
							<HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
						</Button>
						<p className="text-center text-xs text-slate-400 lg:hidden">
							¿Ya tienes cuenta?{' '}
							<Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">
								Inicia sesión
							</Link>
						</p>
					</form>
				</div>
				</div>
			</div>
		</div>
	);
};

export default Solicitar;
