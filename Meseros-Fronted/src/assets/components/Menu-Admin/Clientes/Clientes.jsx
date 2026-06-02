import React, { useEffect, useMemo, useState } from 'react';
import { logAudit } from '../../../../utils/audit';

const CLIENTES_KEY = 'mesoft_clientes_v1';

export function loadClientes() {
    try { return JSON.parse(localStorage.getItem(CLIENTES_KEY) || '[]'); } catch { return []; }
}

export function saveClientes(list) {
    try { localStorage.setItem(CLIENTES_KEY, JSON.stringify(list)); } catch {}
}

/**
 * Upsert a cliente by telefono (or nombre if no phone).
 * Returns the updated client.
 */
export function upsertCliente({ nombre, telefono = '', email = '' }) {
    try {
        const list = loadClientes();
        const key = telefono.trim() || nombre.trim().toLowerCase();
        const existing = list.find(c =>
            (telefono.trim() && c.telefono === telefono.trim()) ||
            (!telefono.trim() && c.nombre.toLowerCase() === nombre.trim().toLowerCase())
        );
        const now = new Date().toISOString();
        if (existing) {
            const updated = list.map(c =>
                c.id === existing.id
                    ? { ...c, nombre: nombre || c.nombre, telefono: telefono || c.telefono, email: email || c.email, visitas: (c.visitas || 1) + 1, ultima_visita: now }
                    : c
            );
            saveClientes(updated);
            return updated.find(c => c.id === existing.id);
        } else {
            const nuevo = {
                id: Date.now(),
                nombre: nombre.trim(),
                telefono: telefono.trim(),
                email: email.trim(),
                visitas: 1,
                ultima_visita: now,
                created_at: now,
            };
            saveClientes([...list, nuevo]);
            return nuevo;
        }
    } catch { return null; }
}

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ nombre: '', telefono: '', email: '' });
    const [formMsg, setFormMsg] = useState('');

    const recargar = () => setClientes(loadClientes());

    useEffect(() => { recargar(); }, []);

    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = [...clientes].sort((a, b) => (b.visitas || 0) - (a.visitas || 0));
        if (!q) return list;
        return list.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            (c.telefono || '').includes(q) ||
            (c.email || '').toLowerCase().includes(q)
        );
    }, [clientes, search]);

    const abrirCrear = () => {
        setForm({ nombre: '', telefono: '', email: '' });
        setFormMode('create');
        setEditId(null);
        setFormMsg('');
        setFormOpen(true);
    };

    const abrirEditar = (c) => {
        setForm({ nombre: c.nombre, telefono: c.telefono || '', email: c.email || '' });
        setFormMode('edit');
        setEditId(c.id);
        setFormMsg('');
        setFormOpen(true);
    };

    const cerrar = () => setFormOpen(false);

    const guardar = () => {
        if (!form.nombre.trim()) { setFormMsg('El nombre es obligatorio.'); return; }
        const list = loadClientes();
        const now = new Date().toISOString();
        if (formMode === 'create') {
            const nuevo = {
                id: Date.now(),
                nombre: form.nombre.trim(),
                telefono: form.telefono.trim(),
                email: form.email.trim(),
                visitas: 1,
                ultima_visita: now,
                created_at: now,
            };
            saveClientes([...list, nuevo]);
            logAudit(null, 'crear_cliente', nuevo.nombre);
        } else {
            const updated = list.map(c => c.id === editId
                ? { ...c, nombre: form.nombre.trim(), telefono: form.telefono.trim(), email: form.email.trim() }
                : c
            );
            saveClientes(updated);
            logAudit(null, 'editar_cliente', form.nombre.trim());
        }
        recargar();
        cerrar();
    };

    const eliminar = (c) => {
        if (!window.confirm(`Eliminar cliente "${c.nombre}"?`)) return;
        const updated = loadClientes().filter(x => x.id !== c.id);
        saveClientes(updated);
        logAudit(null, 'eliminar_cliente', c.nombre);
        recargar();
    };

    const fmtFecha = (iso) => {
        if (!iso) return '—';
        try {
            return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' }).format(new Date(iso));
        } catch { return iso; }
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Historial de Clientes</h1>
                    <p style={{ margin: '.25rem 0 0', color: '#6b7280' }}>
                        {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="btn primary" onClick={abrirCrear}>+ Nuevo cliente</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Buscar por nombre, telefono o email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: '.5rem .85rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', width: '100%', maxWidth: 400, outline: 'none' }}
                />
            </div>

            {filtrados.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #eef2f6', borderRadius: 16, padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    {clientes.length === 0
                        ? 'No hay clientes registrados aun. Los clientes se agregan automaticamente al hacer reservas.'
                        : 'Sin resultados para la busqueda.'}
                </div>
            ) : (
                <div style={{ background: '#fff', border: '1px solid #eef2f6', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 18px rgba(44,62,80,.08)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '.65rem .85rem', textAlign: 'left', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Nombre</th>
                                <th style={{ padding: '.65rem .85rem', textAlign: 'left', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Telefono</th>
                                <th style={{ padding: '.65rem .85rem', textAlign: 'left', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Email</th>
                                <th style={{ padding: '.65rem .85rem', textAlign: 'center', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Visitas</th>
                                <th style={{ padding: '.65rem .85rem', textAlign: 'left', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Ultima visita</th>
                                <th style={{ padding: '.65rem .85rem', borderBottom: '1px solid #eef2f6' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((c, idx) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '.55rem .85rem', fontWeight: 700, color: '#1f2937' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff6633', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.875rem', flexShrink: 0 }}>
                                                {(c.nombre || '?').charAt(0).toUpperCase()}
                                            </div>
                                            {c.nombre}
                                        </div>
                                    </td>
                                    <td style={{ padding: '.55rem .85rem', fontSize: '.875rem', color: '#374151' }}>{c.telefono || '—'}</td>
                                    <td style={{ padding: '.55rem .85rem', fontSize: '.875rem', color: '#374151' }}>{c.email || '—'}</td>
                                    <td style={{ padding: '.55rem .85rem', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            minWidth: 28, padding: '.15rem .5rem',
                                            borderRadius: 999,
                                            background: c.visitas >= 5 ? '#dcfce7' : '#f3f4f6',
                                            color: c.visitas >= 5 ? '#15803d' : '#6b7280',
                                            fontSize: '.8rem', fontWeight: 800,
                                        }}>
                                            {c.visitas || 1}
                                        </span>
                                    </td>
                                    <td style={{ padding: '.55rem .85rem', fontSize: '.875rem', color: '#6b7280' }}>{fmtFecha(c.ultima_visita)}</td>
                                    <td style={{ padding: '.55rem .85rem' }}>
                                        <div style={{ display: 'flex', gap: '.35rem' }}>
                                            <button className="btn ghost" style={{ padding: '.25rem .5rem', fontSize: '.8rem' }} onClick={() => abrirEditar(c)}>Editar</button>
                                            <button className="btn ghost" style={{ padding: '.25rem .5rem', fontSize: '.8rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => eliminar(c)}>Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal crear/editar */}
            {formOpen && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card" style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <h3>{formMode === 'create' ? 'Nuevo cliente' : 'Editar cliente'}</h3>
                            <button className="close-btn" onClick={cerrar} aria-label="Cerrar">x</button>
                        </div>
                        <div className="modal-body">
                            {formMsg && (
                                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.5rem .75rem', color: '#b91c1c', fontSize: '.875rem', marginBottom: '.75rem' }}>
                                    {formMsg}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                                {[
                                    { label: 'Nombre', field: 'nombre', type: 'text', placeholder: 'Nombre del cliente', required: true },
                                    { label: 'Telefono', field: 'telefono', type: 'tel', placeholder: '+57 300 000 0000', required: false },
                                    { label: 'Email (opcional)', field: 'email', type: 'email', placeholder: 'correo@ejemplo.com', required: false },
                                ].map(({ label, field, type, placeholder }) => (
                                    <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: '.2rem', fontSize: '.9rem', fontWeight: 600, color: '#374151' }}>
                                        {label}
                                        <input
                                            type={type}
                                            value={form[field]}
                                            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                                            placeholder={placeholder}
                                            style={{ padding: '.45rem .75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', fontWeight: 400 }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn primary" onClick={guardar}>
                                {formMode === 'create' ? 'Crear cliente' : 'Guardar'}
                            </button>
                            <button className="btn ghost" onClick={cerrar}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Clientes;
