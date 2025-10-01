import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import NavbarInicio from '../NavbarInicio';
import '../../../css/Navbar/Inicio/Solicitar/Solicitar.css';

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
	const [status, setStatus] = useState(null);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.id]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setStatus(null);
		try {
			const res = await fetch('http://localhost:3001/solicitud', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			const data = await res.json();
			if (data.success) {
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
					text: data.error || 'Intenta de nuevo.'
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
		<>
			<NavbarInicio />
			<div className="solicitar-hero-section">
				<div className="solicitar-hero-left">
					<h1 className="solicitar-hero-title">Solicitar acceso</h1>
					<p className="solicitar-hero-desc">
						Completa el formulario para que podamos validar tu información y se te otorgue acceso.
					</p>
					<form className="solicitar-form" onSubmit={handleSubmit}>
						<div className="solicitar-form-row">
							<div>
								<label htmlFor="nombre" className="solicitar-label">Nombre</label>
								<input id="nombre" type="text" placeholder="Nombre" className="solicitar-input" required value={form.nombre} onChange={handleChange} />
							</div>
							<div>
								<label htmlFor="apellido" className="solicitar-label">Apellido</label>
								<input id="apellido" type="text" placeholder="Apellido" className="solicitar-input" required value={form.apellido} onChange={handleChange} />
							</div>
						</div>
						<div className="solicitar-form-row">
							<div>
								<label htmlFor="correo" className="solicitar-label">Correo electrónico</label>
								<input id="correo" type="email" placeholder="Correo electrónico" className="solicitar-input" required value={form.correo} onChange={handleChange} />
							</div>
							<div>
								<label htmlFor="empresa" className="solicitar-label">Nombre de la empresa</label>
								<input id="empresa" type="text" placeholder="Nombre de la empresa" className="solicitar-input" required value={form.empresa} onChange={handleChange} />
							</div>
						</div>
						<div className="solicitar-form-row">
							<div>
								<label htmlFor="cargo" className="solicitar-label">Cargo o rol</label>
								<input id="cargo" type="text" placeholder="Cargo o rol" className="solicitar-input" required value={form.cargo} onChange={handleChange} />
							</div>
							<div>
								<label htmlFor="nit" className="solicitar-label">NIT de la empresa</label>
								<input id="nit" type="text" placeholder="NIT de la empresa" className="solicitar-input" required value={form.nit} onChange={handleChange} />
							</div>
						</div>
						<div>
							<label htmlFor="mensaje" className="solicitar-label">Mensaje adicional</label>
							<textarea id="mensaje" placeholder="Más información de la empresa, redes sociales, etc." className="solicitar-textarea" rows={3} value={form.mensaje} onChange={handleChange} />
						</div>
						<button type="submit" className="solicitar-btn-main">Enviar solicitud</button>
					</form>
					{/* SweetAlert2 muestra los mensajes, no es necesario el div de status */}
				</div>
			</div>
		</>
	);
};

export default Solicitar;
