import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../../../api/client';
import { logAudit } from '../../../../utils/audit';

const COMBOS_KEY = 'mesoft_combos_v1';

function loadCombos() {
    try { return JSON.parse(localStorage.getItem(COMBOS_KEY) || '[]'); } catch { return []; }
}
function saveCombos(list) {
    try { localStorage.setItem(COMBOS_KEY, JSON.stringify(list)); } catch {}
}

const emptyForm = { nombre: '', descripcion: '', precio_combo: '', productos_ids: [] };

export function getCombosFromStorage() { return loadCombos(); }

function Combos() {
    const [combos, setCombos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formMsg, setFormMsg] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        setCombos(loadCombos());
        api.getProductos().then(r => {
            const arr = Array.isArray(r?.items) ? r.items : (Array.isArray(r) ? r : []);
            setProductos(arr);
        }).catch(() => {});
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return combos;
        return combos.filter(c =>
            c.nombre.toLowerCase().includes(q) || (c.descripcion || '').toLowerCase().includes(q)
        );
    }, [combos, search]);

    const abrirCrear = () => {
        setForm(emptyForm);
        setFormMode('create');
        setEditId(null);
        setFormMsg('');
        setFormOpen(true);
    };

    const abrirEditar = (combo) => {
        setForm({
            nombre: combo.nombre,
            descripcion: combo.descripcion || '',
            precio_combo: String(combo.precio_combo || ''),
            productos_ids: combo.productos_ids || [],
        });
        setFormMode('edit');
        setEditId(combo.id);
        setFormMsg('');
        setFormOpen(true);
    };

    const cerrar = () => setFormOpen(false);

    const guardar = () => {
        if (!form.nombre.trim()) { setFormMsg('El nombre es obligatorio.'); return; }
        const precio = Number(form.precio_combo);
        if (!precio || precio <= 0) { setFormMsg('El precio debe ser mayor que 0.'); return; }
        if (!form.productos_ids.length) { setFormMsg('Selecciona al menos un producto.'); return; }

        const list = loadCombos();
        if (formMode === 'create') {
            const nuevo = {
                id: Date.now(),
                nombre: form.nombre.trim(),
                descripcion: form.descripcion.trim(),
                precio_combo: precio,
                productos_ids: form.productos_ids,
                created_at: new Date().toISOString(),
            };
            const updated = [...list, nuevo];
            saveCombos(updated);
            setCombos(updated);
            logAudit(null, 'crear_combo', `${nuevo.nombre} — $${precio}`);
        } else {
            const updated = list.map(c => c.id === editId
                ? { ...c, nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precio_combo: precio, productos_ids: form.productos_ids }
                : c
            );
            saveCombos(updated);
            setCombos(updated);
            logAudit(null, 'editar_combo', form.nombre.trim());
        }
        cerrar();
    };

    const eliminar = (combo) => {
        if (!window.confirm(`Eliminar combo "${combo.nombre}"?`)) return;
        const updated = loadCombos().filter(c => c.id !== combo.id);
        saveCombos(updated);
        setCombos(updated);
        logAudit(null, 'eliminar_combo', combo.nombre);
    };

    const toggleProducto = (prodId) => {
        setForm(prev => {
            const ids = prev.productos_ids.includes(prodId)
                ? prev.productos_ids.filter(id => id !== prodId)
                : [...prev.productos_ids, prodId];
            return { ...prev, productos_ids: ids };
        });
    };

    const getProductoNombres = (ids) => {
        return ids.map(id => {
            const p = productos.find(p => p.id === id || String(p.id) === String(id));
            return p ? p.nombre : `#${id}`;
        }).join(', ') || 'Sin productos';
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Combos / Menu del dia</h1>
                    <p style={{ margin: '.25rem 0 0', color: '#6b7280' }}>Agrupa productos en combos con precio especial.</p>
                </div>
                <button className="btn primary" onClick={abrirCrear}>+ Nuevo combo</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Buscar combos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: '.5rem .85rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', width: '100%', maxWidth: 360, outline: 'none' }}
                />
            </div>

            {filtered.length === 0 && (
                <div style={{ background: '#fff', border: '1px solid #eef2f6', borderRadius: 16, padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    {combos.length === 0 ? 'No hay combos creados aun. Crea el primero.' : 'Sin resultados para la busqueda.'}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {filtered.map(combo => (
                    <div key={combo.id} style={{ background: '#fff', border: '1px solid #eef2f6', borderRadius: 14, padding: '1.25rem', boxShadow: '0 2px 10px rgba(44,62,80,.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1f2937' }}>{combo.nombre}</div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ff6633' }}>
                                ${Number(combo.precio_combo || 0).toLocaleString('es-CO')}
                            </div>
                        </div>
                        {combo.descripcion && (
                            <p style={{ margin: '0 0 .5rem', color: '#6b7280', fontSize: '.875rem' }}>{combo.descripcion}</p>
                        )}
                        <div style={{ fontSize: '.8rem', color: '#9ca3af', marginBottom: '.75rem' }}>
                            Productos: {getProductoNombres(combo.productos_ids)}
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                            <button className="btn ghost" style={{ flex: 1, fontSize: '.85rem' }} onClick={() => abrirEditar(combo)}>Editar</button>
                            <button className="btn ghost" style={{ flex: 1, fontSize: '.85rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => eliminar(combo)}>Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal crear/editar */}
            {formOpen && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card" style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h3>{formMode === 'create' ? 'Nuevo combo' : 'Editar combo'}</h3>
                            <button className="close-btn" onClick={cerrar} aria-label="Cerrar">x</button>
                        </div>
                        <div className="modal-body">
                            {formMsg && (
                                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.5rem .75rem', color: '#b91c1c', fontSize: '.875rem', marginBottom: '.75rem' }}>
                                    {formMsg}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.9rem', fontWeight: 600, color: '#374151' }}>
                                    Nombre del combo
                                    <input
                                        type="text"
                                        value={form.nombre}
                                        onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                                        placeholder="Ej: Combo Almuerzo"
                                        style={{ padding: '.45rem .75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', fontWeight: 400 }}
                                    />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.9rem', fontWeight: 600, color: '#374151' }}>
                                    Descripcion (opcional)
                                    <textarea
                                        value={form.descripcion}
                                        onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                                        placeholder="Descripcion del combo..."
                                        rows={2}
                                        style={{ padding: '.45rem .75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', fontWeight: 400, resize: 'vertical' }}
                                    />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.9rem', fontWeight: 600, color: '#374151' }}>
                                    Precio del combo
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.precio_combo}
                                        onChange={e => setForm(p => ({ ...p, precio_combo: e.target.value }))}
                                        placeholder="Precio especial del combo"
                                        style={{ padding: '.45rem .75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '.95rem', fontWeight: 400 }}
                                    />
                                </label>
                                <div style={{ fontSize: '.9rem', fontWeight: 600, color: '#374151', marginBottom: '.25rem' }}>
                                    Productos incluidos
                                </div>
                                {productos.length === 0 && (
                                    <div style={{ color: '#9ca3af', fontSize: '.875rem' }}>No hay productos disponibles.</div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.4rem', maxHeight: 220, overflowY: 'auto', padding: '.25rem' }}>
                                    {productos.map(p => {
                                        const selected = form.productos_ids.includes(p.id) || form.productos_ids.includes(String(p.id));
                                        return (
                                            <label key={p.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '.4rem',
                                                padding: '.4rem .6rem', borderRadius: 8,
                                                border: `1px solid ${selected ? '#ff6633' : '#e5e7eb'}`,
                                                background: selected ? '#fff7f3' : '#f9fafb',
                                                cursor: 'pointer', fontSize: '.85rem', fontWeight: selected ? 700 : 400,
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => toggleProducto(p.id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                {p.nombre}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn primary" onClick={guardar}>
                                {formMode === 'create' ? 'Crear combo' : 'Guardar cambios'}
                            </button>
                            <button className="btn ghost" onClick={cerrar}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Combos;
