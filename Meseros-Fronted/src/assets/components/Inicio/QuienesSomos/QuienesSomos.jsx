import React from 'react';
import { FiHeart, FiZap, FiUsers, FiShield, FiUser } from 'react-icons/fi';
import '../../../css/Navbar/Inicio/QuienesSomos/QuienesSomos.css';

const QuienesSomos = () => {
        const scrollToValues = () => {
        const el = document.getElementById('values-title');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
        const scrollToTeam = () => {
            const el = document.getElementById('team-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
    return (
        <div className="quienes-main">
            {/* Hero en dos columnas */}
            <div className="quienes-hero-section">
                <div className="quienes-hero-left">
                    <h1>Quiénes somos</h1>
                    <p>
                        Somos una organización comprometida con <b>tu misión</b> —salud, educación,
                        tecnología, etc.— dedicada a ofrecer soluciones innovadoras y confiables.
                        Nuestro objetivo es mejorar la experiencia de nuestros clientes a través
                        de un servicio cercano, profesional y transparente.
                    </p>
                    <div className="hero-actions">
                        <button className="btn btn-primary" type="button" onClick={scrollToValues}>Conócenos más</button>
                        <button className="btn btn-secondary" type="button" onClick={scrollToTeam}>Conoce nuestro equipo</button>
                    </div>
                </div>
                <div className="quienes-hero-right">
                    <section className="values-section" aria-labelledby="values-title">
                        <h2 id="values-title">Nuestros valores</h2>
                        <div className="values-grid">
                            <article className="value-item">
                                <div className="value-icon" aria-hidden>
                                    <FiHeart aria-hidden />
                                </div>
                                <div>
                                    <h3>Compromiso</h3>
                                    <p>Trabajamos día a día para cumplir con la confianza depositada en nosotros.</p>
                                </div>
                            </article>
                            <article className="value-item">
                                <div className="value-icon" aria-hidden>
                                    <FiZap aria-hidden />
                                </div>
                                <div>
                                    <h3>Innovación</h3>
                                    <p>Buscamos constantemente nuevas formas de mejorar.</p>
                                </div>
                            </article>
                            <article className="value-item">
                                <div className="value-icon" aria-hidden>
                                    <FiUsers aria-hidden />
                                </div>
                                <div>
                                    <h3>Trabajo en equipo</h3>
                                    <p>Creemos que la colaboración impulsa mejores resultados.</p>
                                </div>
                            </article>
                            <article className="value-item">
                                <div className="value-icon" aria-hidden>
                                    <FiShield aria-hidden />
                                </div>
                                <div>
                                    <h3>Transparencia</h3>
                                    <p>Actuamos con ética y claridad en cada proceso.</p>
                                </div>
                            </article>
                        </div>
                    </section>
                </div>
            </div>

                    {/* Equipo */}
                    <section className="team-section" id="team-section" aria-labelledby="team-title">
                        <h2 id="team-title">Nuestro equipo</h2>
                        <div className="team-grid">
                            <article className="team-card">
                                <div className="avatar" aria-hidden>
                                    <FiUser />
                                </div>
                                <h3 className="team-name">Martín Valasquez</h3>
                                <p className="team-role">Desarrollador Full‑Stack</p>
                                <p className="team-bio">Enfocado en crear experiencias rápidas y seguras para tu negocio.</p>
                            </article>
                            <article className="team-card">
                                <div className="avatar" aria-hidden>
                                    <FiUser />
                                </div>
                                <h3 className="team-name">Juan Martinez</h3>
                                <p className="team-role">UX/UI</p>
                                <p className="team-bio">Diseño de interfaces claras y accesibles que reflejan la marca.</p>
                            </article>
                            <article className="team-card">
                                <div className="avatar" aria-hidden>
                                    <FiUser />
                                </div>
                                <h3 className="team-name">Maikol Ardila</h3>
                                <p className="team-role">QA & Soporte</p>
                                <p className="team-bio">Garantiza calidad, pruebas y soporte cercano al cliente.</p>
                            </article>
                        </div>
                    </section>
        </div>
    );
};

export default QuienesSomos;