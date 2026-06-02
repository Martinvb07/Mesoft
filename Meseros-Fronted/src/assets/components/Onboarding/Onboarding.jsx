import React, { useState } from 'react';
import { api } from '../../../api/client';

const ONBOARDING_KEY = 'mesoft_onboarding_done';

export function isOnboardingDone() {
    try { return localStorage.getItem(ONBOARDING_KEY) === 'true'; } catch { return true; }
}

export function markOnboardingDone() {
    try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
}

const STEPS = ['Bienvenida', 'Tus mesas', 'Primer producto'];

function StepIndicator({ current }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', marginBottom: '2rem' }}>
            {STEPS.map((label, idx) => (
                <React.Fragment key={idx}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: idx <= current ? '#ff6633' : '#e5e7eb',
                            color: idx <= current ? '#fff' : '#9ca3af',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '.9rem',
                            transition: 'background .2s',
                        }}>
                            {idx < current ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: '.75rem', fontWeight: idx === current ? 700 : 400, color: idx === current ? '#ff6633' : '#9ca3af' }}>{label}</span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div style={{ height: 2, width: 48, background: idx < current ? '#ff6633' : '#e5e7eb', marginBottom: '1.25rem', transition: 'background .2s' }} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

function Step1({ data, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🍽️</div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', textAlign: 'center' }}>
                Bienvenido a Mesoft
            </h2>
            <p style={{ margin: 0, color: '#6b7280', textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
                Vamos a configurar tu restaurante en 3 pasos rapidos.
                Puedes saltar este asistente en cualquier momento.
            </p>
            <label style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '.35rem', fontSize: '.9rem', fontWeight: 600, color: '#374151' }}>
                Nombre de tu restaurante
                <input
                    type="text"
                    value={data.restaurantName}
                    onChange={e => onChange('restaurantName', e.target.value)}
                    placeholder="Ej: La Casa de Mamá"
                    style={{ padding: '.55rem .85rem', borderRadius: 10, border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none' }}
                />
            </label>
        </div>
    );
}

function Step2({ data, onChange, creating, msg }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🪑</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1f2937' }}>Crea tus primeras mesas</h2>
            <p style={{ margin: 0, color: '#6b7280', textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
                Define cuantas mesas tiene tu restaurante. Podras agregar mas despues.
            </p>
            <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#ff6633', minWidth: 24 }}>M{i + 1}</span>
                        <input
                            type="number"
                            min={1}
                            value={data.mesas[i]?.numero || i + 1}
                            onChange={e => {
                                const newMesas = [...data.mesas];
                                newMesas[i] = { ...newMesas[i], numero: Number(e.target.value) };
                                onChange('mesas', newMesas);
                            }}
                            placeholder={`Numero mesa ${i + 1}`}
                            style={{ flex: 1, padding: '.45rem .7rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', outline: 'none' }}
                        />
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={data.mesas[i]?.capacidad || 4}
                            onChange={e => {
                                const newMesas = [...data.mesas];
                                newMesas[i] = { ...newMesas[i], capacidad: Number(e.target.value) };
                                onChange('mesas', newMesas);
                            }}
                            placeholder="Cap."
                            title="Capacidad"
                            style={{ width: 70, padding: '.45rem .5rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', outline: 'none', textAlign: 'center' }}
                        />
                    </div>
                ))}
                {msg && (
                    <div style={{ color: '#dc2626', fontSize: '.85rem', fontWeight: 600 }}>{msg}</div>
                )}
                {creating && (
                    <div style={{ color: '#ff6633', fontSize: '.875rem' }}>Creando mesas...</div>
                )}
            </div>
        </div>
    );
}

function Step3({ data, onChange, creating, msg }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🍕</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1f2937' }}>Crea tu primer producto</h2>
            <p style={{ margin: 0, color: '#6b7280', textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
                Agrega el primer producto de tu menu. Podras agregar mas desde Inventario.
            </p>
            <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                {[
                    { label: 'Nombre del producto', field: 'nombre', type: 'text', placeholder: 'Ej: Bandeja Paisa' },
                    { label: 'Precio', field: 'precio', type: 'number', placeholder: 'Ej: 25000' },
                    { label: 'Categoria', field: 'categoria', type: 'text', placeholder: 'Ej: Platos fuertes' },
                ].map(({ label, field, type, placeholder }) => (
                    <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: '.2rem', fontSize: '.9rem', fontWeight: 600, color: '#374151' }}>
                        {label}
                        <input
                            type={type}
                            value={data.producto[field] || ''}
                            onChange={e => onChange('producto', { ...data.producto, [field]: e.target.value })}
                            placeholder={placeholder}
                            style={{ padding: '.45rem .75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', fontWeight: 400, outline: 'none' }}
                        />
                    </label>
                ))}
                {msg && <div style={{ color: '#dc2626', fontSize: '.85rem', fontWeight: 600 }}>{msg}</div>}
                {creating && <div style={{ color: '#ff6633', fontSize: '.875rem' }}>Creando producto...</div>}
            </div>
        </div>
    );
}

function Onboarding({ onDone }) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        restaurantName: '',
        mesas: [
            { numero: 1, capacidad: 4 },
            { numero: 2, capacidad: 4 },
            { numero: 3, capacidad: 4 },
        ],
        producto: { nombre: '', precio: '', categoria: '' },
    });
    const [creating, setCreating] = useState(false);
    const [stepMsg, setStepMsg] = useState('');

    const handleChange = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
        setStepMsg('');
    };

    const handleSkip = () => {
        markOnboardingDone();
        onDone();
    };

    const handleNext = async () => {
        setStepMsg('');

        if (step === 0) {
            // Save restaurant name to settings
            if (data.restaurantName.trim()) {
                try {
                    const SETTINGS_KEY = 'app_settings_v1';
                    const existing = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
                    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, businessName: data.restaurantName.trim() }));
                } catch {}
            }
            setStep(1);
            return;
        }

        if (step === 1) {
            setCreating(true);
            try {
                for (const m of data.mesas) {
                    if (!m.numero || m.numero < 1) continue;
                    try {
                        await api.createMesa({ numero: m.numero, capacidad: m.capacidad || 4, estado: 'libre' });
                    } catch (e) {
                        // ignore duplicate errors
                    }
                }
            } finally {
                setCreating(false);
            }
            setStep(2);
            return;
        }

        if (step === 2) {
            const { nombre, precio, categoria } = data.producto;
            if (!nombre.trim()) { setStepMsg('El nombre es obligatorio.'); return; }
            if (!precio || Number(precio) <= 0) { setStepMsg('Ingresa un precio valido.'); return; }
            setCreating(true);
            try {
                await api.crearProducto({
                    nombre: nombre.trim(),
                    precio: Number(precio),
                    categoria: categoria.trim() || 'General',
                    disponible: true,
                });
            } catch (e) {
                // If it fails, still complete onboarding
            } finally {
                setCreating(false);
            }
            markOnboardingDone();
            onDone();
        }
    };

    const isLastStep = step === STEPS.length - 1;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(17,24,39,.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
        }}>
            <div style={{
                background: '#fff', borderRadius: 20, padding: '2.5rem 2rem',
                width: '100%', maxWidth: 540,
                boxShadow: '0 20px 60px rgba(0,0,0,.3)',
                position: 'relative',
            }}>
                {/* Skip button */}
                <button
                    onClick={handleSkip}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'transparent', border: 'none', color: '#9ca3af',
                        cursor: 'pointer', fontSize: '.875rem', fontWeight: 600,
                        padding: '.25rem .5rem', borderRadius: 6,
                    }}
                >
                    Omitir
                </button>

                <StepIndicator current={step} />

                {step === 0 && <Step1 data={data} onChange={handleChange} />}
                {step === 1 && <Step2 data={data} onChange={handleChange} creating={creating} msg={stepMsg} />}
                {step === 2 && <Step3 data={data} onChange={handleChange} creating={creating} msg={stepMsg} />}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
                    {step > 0 ? (
                        <button
                            className="btn ghost"
                            onClick={() => { setStep(s => s - 1); setStepMsg(''); }}
                            disabled={creating}
                        >
                            Atras
                        </button>
                    ) : <span />}
                    <button
                        className="btn primary"
                        onClick={handleNext}
                        disabled={creating}
                        style={{ minWidth: 140 }}
                    >
                        {creating ? 'Procesando...' : isLastStep ? 'Finalizar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Onboarding;
