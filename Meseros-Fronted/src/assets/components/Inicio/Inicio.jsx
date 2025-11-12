import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarInicio from './NavbarInicio';
import '../../css/Navbar/Inicio/Inicio.css';
// Usamos iconos de Heroicons vía react-icons (ya instalada en el proyecto)
import { HiCog6Tooth, HiShieldCheck, HiLightBulb, HiClock } from 'react-icons/hi2';

const heroCards = [
    {
        icon: HiCog6Tooth,
        title: 'Automatiza tareas',
        desc: 'Asignación automática de meseros y mesas',
        color: '#f97316',
    },
    {
        icon: HiShieldCheck,
        title: 'Seguridad',
        desc: 'Roles y permisos, respaldo y auditoría',
        color: '#2563eb',
    },
    {
        icon: HiLightBulb,
        title: 'Intención',
        desc: 'Ser la mejor herramienta para la gestión de restaurantes',
        color: '#f97316',
    },
];

const especialidades = [
    {
        icon: HiCog6Tooth,
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
        icon: HiShieldCheck,
        title: 'Seguridad y Usuarios',
        items: [
            'Autenticación y auditoría',
            'Gestión de roles y permisos',
            'Respaldo automático y recuperación',
            'Soporte y mantenimiento',
        ],
        color: '#2563eb',
    },
    {
        icon: HiLightBulb,
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
        icon: HiClock,
        title: 'Optimización de tiempos',
        items: [
            'Reducción de espera y flujos de atención más rápidos',
        ],
        color: '#16a34a',
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
                    {heroCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div className="inicio-hero-card" key={idx}>
                                <div
                                    className="inicio-hero-icon"
                                    style={{ background: card.color }}
                                >
                                    <Icon size={28} color="#ffffff" />
                                </div>
                                <div>
                                    <h3 className="inicio-hero-card-title">{card.title}</h3>
                                    <p className="inicio-hero-card-desc">{card.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="inicio-especialidades-section">
                <h2 className="inicio-especialidades-title">
                    Especialidades de Mesoft
                </h2>
                <div className="inicio-especialidades-grid">
                    {especialidades.map((esp, idx) => {
                        const Icon = esp.icon;
                        return (
                            <div className="inicio-especialidad-card" key={idx}>
                                <div
                                    className="inicio-especialidad-icon"
                                    style={{ background: esp.color }}
                                >
                                    <Icon size={28} color="#ffffff" />
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
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Inicio;
