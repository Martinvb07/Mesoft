import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarInicio from './NavbarInicio';
import '../../css/Navbar/Inicio/Inicio.css';

const heroCards = [
	{
		icon: '/src/assets/image/LogoAutomatización.png',
		title: 'Automatiza tareas',
		desc: 'Asignación automática de meseros y mesas',
		color: '#f97316',
	},
	{
		icon: '/src/assets/image/LogoSeguridad.png',
		title: 'Seguridad',
		desc: 'Roles y permisos, respaldo y auditoría',
		color: '#2563eb',
	},
	{
		icon: '/src/assets/image/LogoInovacion.png',
		title: 'Intención',
		desc: 'Pensar podremos',
		color: '#f97316',
	},
];

const especialidades = [
	{
		icon: '/src/assets/image/LogoAutomatización.png',
		title: 'Automatización y Control',
		items: [
			'Control en tiempo real de mesas',
			'Asignación automática de personal',
			'Reportes de productividad y KPIs',
			'Integración con POS y pagos',
		],
		color: '#f97316',
	},
	{
		icon: '/src/assets/image/LogoSeguridad.png',
		title: 'Seguridad y Usuarios',
		items: [
			'Autentización y auditoría',
			'Gestión de roles y permisos',
			'Respaldo automático y recuperación',
			'Soporte y mantenimiento',
		],
		color: '#f97316',
	},
	{
		icon: '/src/assets/image/LogoInovacion.png',
		title: 'Innovación y Equipo',
		items: [
			'Capacitación integrada',
			'Flujos de trabajo personalizables',
			'Panel de desempeño de equipo',
			'Actualizaciones con nuevas funciones',
		],
		color: '#f97316',
	},
	{
		icon: '/src/assets/image/LogoAutomatización.png',
		title: 'Optimización de tiempos',
		items: [
			'Reducción de espera y flujos de atención más rápidos',
		],
		color: '#f97316',
	},
];

const Inicio = () => {
    const navigate = useNavigate();
    const handleContactanos = () => {
        navigate('/solicitar');
    };
    const handleEspecialidades = () => {
        const section = document.querySelector('.inicio-especialidades-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };
    return (
        <>
            <NavbarInicio />
            <div className="inicio-hero-section">
                <div className="inicio-hero-left">
                    <h1 className="inicio-hero-title">
                        Gestiona , Organiza , Optimiza tu restaurante con precisión
                    </h1>
                    <p className="inicio-hero-desc">
                        Gestiona tu restaurante con precisión: optimiza mesas, personal y experiencias con reportes en tiempo real, seguridad en accesos y herramientas de automatización pensadas para cadenas, restaurantes y cafés.
                    </p>
                    <div className="inicio-hero-btns">
                        <button className="inicio-btn-main" onClick={handleEspecialidades}>Ver especialidades</button>
                        <button className="inicio-btn-alt" onClick={handleContactanos}>Contáctanos</button>
                    </div>
                </div>
                <div className="inicio-hero-cards">
                    {heroCards.map((card, idx) => (
                        <div className="inicio-hero-card" key={idx}>
                            <div
                                className="inicio-hero-icon"
                                style={{ background: card.color }}
                            >
                                <img src={card.icon} alt="icon" />
                            </div>
                            <div>
                                <h3 className="inicio-hero-card-title">{card.title}</h3>
                                <p className="inicio-hero-card-desc">{card.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="inicio-especialidades-section">
                <h2 className="inicio-especialidades-title">
                    Especialidades de Mesoft
                </h2>
                <div className="inicio-especialidades-grid">
                    {especialidades.map((esp, idx) => (
                        <div className="inicio-especialidad-card" key={idx}>
                            <div
                                className="inicio-especialidad-icon"
                                style={{ background: esp.color }}
                            >
                                <img src={esp.icon} alt="icon" />
                            </div>
                            <div>
                                <h3 className="inicio-especialidad-title">{esp.title}</h3>
                                <ul className="inicio-especialidad-list">
                                    {esp.items.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Inicio;
