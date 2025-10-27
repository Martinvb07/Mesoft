import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Meseros/Meseros/Meseros.css';
import { HiUsers, HiMagnifyingGlass, HiAdjustmentsHorizontal, HiClock, HiUser, HiPhone, HiClipboard } from 'react-icons/hi2';
import { api } from '../../../../api/client';

const Meseros = () => {
    const copyToClipboard = (text) => {
        try {
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(String(text || ''));
            } else {
                const ta = document.createElement('textarea');
                ta.value = String(text || '');
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                try { document.execCommand('copy'); } catch {}
                document.body.removeChild(ta);
            }
        } catch {}
    };
    // Carga meseros solo desde API
    const [meseros, setMeseros] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getMeseros();
                const mapped = (Array.isArray(data) ? data : []).map(x => ({
                    id: x.id,
                    nombre: x.nombre,
                    apellido: '',
                    rol: 'mesero',
                    activo: (x.estado || 'activo') === 'activo',
                    estado: x.estado || 'activo',
                    correo: x.correo || '',
                    telefono: '',
                    updatedAt: Date.now(),
                    usuario_id: x.usuario_id ?? null,
                }));
                setMeseros(mapped);
            } catch (e) {
                // fallback ya está en estado inicial
            }
        };
        load();
    }, []);

    const refresh = async () => {
        try {
            const data = await api.getMeseros();
            const mapped = (Array.isArray(data) ? data : []).map(x => ({
                id: x.id,
                nombre: x.nombre,
                apellido: '',
                rol: 'mesero',
                activo: (x.estado || 'activo') === 'activo',
                estado: x.estado || 'activo',
                correo: x.correo || '',
                telefono: '',
                updatedAt: Date.now(),
                usuario_id: x.usuario_id ?? null,
            }));
            setMeseros(mapped);
        } catch {}
    };

    const otros = useMemo(() => meseros, [meseros]);

    // Filtros y búsqueda
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos'); // todos | en-turno | activos | inactivos

    const turnoById = useMemo(() => new Map(), []);

    const compas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return otros
            .filter(u => {
                if (filtroEstado === 'todos') return true;
                if (filtroEstado === 'en-turno') return !!turnoById.get(Number(u.id))?.enTurno;
                const isActivo = (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo');
                if (filtroEstado === 'activos') return isActivo;
                if (filtroEstado === 'inactivos') return !isActivo;
                return true;
            })
            .filter(u => {
                if (!q) return true;
                const full = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
                const mail = `${u.correo || u.email || ''}`.toLowerCase();
                return full.includes(q) || mail.includes(q);
            })
            .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
    }, [otros, busqueda, filtroEstado, turnoById]);

    const total = compas.length;
    const enTurno = 0;
    const activos = compas.filter(u => (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo')).length;
    const inactivos = total - activos;

    const pillFor = (u) => {
        const t = turnoById.get(Number(u.id));
        if (t?.enTurno) return { label: 'En turno', color: 'occ' };
        const isActivo = (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo');
        if (isActivo) return { label: 'Activo', color: 'res' };
        return { label: 'Inactivo', color: 'clean' };
    };

    const avatarOf = (u) => String(`${u.nombre || ''}`.trim().charAt(0) || '?').toUpperCase();

    return (
        <div className="mesas-page">{/* Reutilizamos layout visual */}
            <div className="mesas-header">
                <div>
                    <h1>Compañeros</h1>
                    <p className="muted">Consulta el equipo y su disponibilidad.</p>
                </div>
                <div className="header-actions">
                    <button className="btn ghost" onClick={refresh}>Recargar</button>
                </div>
            </div>

            <div className="mesas-metrics">
                <div className="metric-card">
                    <div className="metric-icon"><HiUsers /></div>
                    <div className="metric-info">
                        <div className="metric-value">{total}</div>
                        <div className="metric-label">Meseros</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiClock /></div>
                    <div className="metric-info">
                        <div className="metric-value">{enTurno}</div>
                        <div className="metric-label">En turno</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiUser /></div>
                    <div className="metric-info">
                        <div className="metric-duo"><span className="big">{activos}</span><span className="den">/ {total}</span></div>
                        <div className="metric-label">Activos</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiUser /></div>
                    <div className="metric-info">
                        <div className="metric-value">{inactivos}</div>
                        <div className="metric-label">Inactivos</div>
                    </div>
                </div>
            </div>

            <div className="mesas-toolbar">
                <div className="search">
                    <HiMagnifyingGlass />
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o correo..." />
                </div>
                <div className="filters">
                    <div className="filter">
                        <HiAdjustmentsHorizontal />
                        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="en-turno">En turno</option>
                            <option value="activos">Activos</option>
                            <option value="inactivos">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="mesas-grid">
                {compas.map(u => {
                    const pill = pillFor(u);
                    const t = turnoById.get(Number(u.id));
                    return (
                        <div key={u.id} className={`mesa-card`}>
                            <div className="mesa-top">
                                <span className="mesa-number" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                    <span className="avatar" style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff7e6', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{avatarOf(u)}</span>
                                    {u.nombre} {u.apellido}
                                </span>
                                <span className={`status-pill ${pill.color}`}>{pill.label}</span>
                            </div>
                            <div className="mesa-body">
                                <div className="mesero">
                                    <span className="small muted">Teléfono</span>
                                    <span className="inline-actions">
                                        <span className="mono">{u.telefono || '—'}</span>
                                        {u.telefono && (
                                            <button className="btn-mini" title="Copiar" onClick={() => copyToClipboard(u.telefono)}>
                                                <HiClipboard />
                                            </button>
                                        )}
                                    </span>
                                </div>
                                <div className="mesero">
                                    <span className="small muted">Correo</span>
                                    <span>{u.correo || u.email || '—'}</span>
                                </div>
                                <div className="cap">
                                    <HiClock />
                                    <span>Sin datos de turno</span>
                                </div>
                                <div className="cap">
                                    <HiUser />
                                    <span>—</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {compas.length === 0 && (
                    <div className="empty">No hay compañeros que coincidan con tu búsqueda.</div>
                )}
            </div>
        </div>
    );
};

export default Meseros;
