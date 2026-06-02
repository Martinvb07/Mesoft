import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { HiTruck, HiMagnifyingGlass, HiXMark, HiPlus } from 'react-icons/hi2';
import { api } from '../../../../api/client';

const emptyForm = () => ({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    productos_ids: [],
});

const Proveedores = () => {
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm());

    const cargar = async () => {
        setLoading(true);
        try {
            const [provRes, prodRes] = await Promise.allSettled([
                api.getProveedores(),
                api.getProductos(),
            ]);
            if (provRes.status === 'fulfilled') setProveedores(Array.isArray(provRes.value) ? provRes.value : []);
            if (prodRes.status === 'fulfilled') {
                const items = Array.isArray(prodRes.value?.items) ? prodRes.value.items : Array.isArray(prodRes.value) ? prodRes.value : [];
                setProductos(items);
            }
        } catch {}
        setLoading(false);
    };

    useEffect(() => { cargar(); }, []);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return proveedores;
        return proveedores.filter(p =>
            (p.nombre || '').toLowerCase().includes(q) ||
            (p.contacto || '').toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q)
        );
    }, [proveedores, busqueda]);

    const abrirNuevo = () => {
        setEditId(null);
        setForm(emptyForm());
        setShowModal(true);
    };

    const abrirEditar = (prov) => {
        setEditId(prov.id);
        setForm({
            nombre: prov.nombre || '',
            contacto: prov.contacto || '',
            telefono: prov.telefono || '',
            email: prov.email || '',
            direccion: prov.direccion || '',
            productos_ids: Array.isArray(prov.productos_ids) ? prov.productos_ids : [],
        });
        setShowModal(true);
    };

    const cerrarModal = () => setShowModal(false);

    const guardar = async () => {
        if (!form.nombre.trim()) return Swal.fire({ icon: 'warning', title: 'Nombre requerido' });
        try {
            if (editId) {
                await api.actualizarProveedor(editId, form);
                setProveedores(prev => prev.map(p => p.id === editId ? { ...p, ...form } : p));
                Swal.fire({ icon: 'success', title: 'Proveedor actualizado', timer: 900, showConfirmButton: false });
            } else {
                const res = await api.crearProveedor(form);
                setProveedores(prev => [{ ...form, id: res?.id || Date.now() }, ...prev]);
                Swal.fire({ icon: 'success', title: 'Proveedor creado', timer: 900, showConfirmButton: false });
            }
            setShowModal(false);
        } catch (e) {
            Swal.fire('Error', e?.message || 'No se pudo guardar', 'error');
        }
    };

    const eliminar = async (prov) => {
        const res = await Swal.fire({
            title: `Eliminar ${prov.nombre}`,
            text: '¿Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
        });
        if (!res.isConfirmed) return;
        try {
            await api.eliminarProveedor(prov.id);
            setProveedores(prev => prev.filter(p => p.id !== prov.id));
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 800, showConfirmButton: false });
        } catch (e) {
            Swal.fire('Error', e?.message || 'No se pudo eliminar', 'error');
        }
    };

    const toggleProducto = (pid) => {
        setForm(prev => {
            const ids = prev.productos_ids || [];
            const exists = ids.includes(pid);
            return { ...prev, productos_ids: exists ? ids.filter(x => x !== pid) : [...ids, pid] };
        });
    };

    return (
        <div className="fin-page">
            <div className="fin-header">
                <div>
                    <h1>Proveedores</h1>
                    <p className="muted">Gestiona tus proveedores y sus productos asociados.</p>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn primary" onClick={abrirNuevo}><HiPlus /> Nuevo proveedor</button>
                </div>
            </div>

            <div className="fin-card">
                <div className="toolbar">
                    <div className="left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '.35rem .65rem' }}>
                            <HiMagnifyingGlass style={{ color: '#9ca3af' }} />
                            <input
                                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '.9rem' }}
                                placeholder="Buscar proveedor..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="empty">Cargando proveedores…</div>
                ) : filtrados.length === 0 ? (
                    <div className="empty">No hay proveedores aún. Crea el primero.</div>
                ) : (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Contacto</th>
                                    <th>Teléfono</th>
                                    <th>Email</th>
                                    <th>Dirección</th>
                                    <th>Productos</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map(prov => (
                                    <tr key={prov.id}>
                                        <td style={{ fontWeight: 600 }}>{prov.nombre}</td>
                                        <td>{prov.contacto || '—'}</td>
                                        <td>{prov.telefono || '—'}</td>
                                        <td>{prov.email || '—'}</td>
                                        <td>{prov.direccion || '—'}</td>
                                        <td>
                                            <span style={{ background: '#f3f4f6', borderRadius: 12, padding: '.15rem .5rem', fontSize: '.82rem' }}>
                                                {(prov.productos_ids || []).length} asociados
                                            </span>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <button className="btn sm" onClick={() => abrirEditar(prov)}>Editar</button>
                                                <button className="btn sm danger" onClick={() => eliminar(prov)}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card lg">
                        <div className="modal-header">
                            <h3>{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
                            <button className="icon-btn" onClick={cerrarModal} aria-label="Cerrar"><HiXMark /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <label>
                                    <span>Nombre *</span>
                                    <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Distribuidora Norte" />
                                </label>
                                <label>
                                    <span>Contacto</span>
                                    <input value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} placeholder="Nombre del contacto" />
                                </label>
                                <label>
                                    <span>Teléfono</span>
                                    <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+57 300 000 0000" />
                                </label>
                                <label>
                                    <span>Email</span>
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="proveedor@empresa.com" />
                                </label>
                                <label style={{ gridColumn: '1/-1' }}>
                                    <span>Dirección</span>
                                    <input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Calle 1 # 2-3, Ciudad" />
                                </label>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <span style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600, fontSize: '.9rem' }}>Productos asociados</span>
                                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: '.5rem' }}>
                                        {productos.length === 0 ? (
                                            <div style={{ color: '#9ca3af', fontSize: '.85rem' }}>No hay productos disponibles.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                                                {productos.map(p => {
                                                    const sel = (form.productos_ids || []).includes(p.id);
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => toggleProducto(p.id)}
                                                            style={{
                                                                padding: '.25rem .6rem', borderRadius: 20, fontSize: '.8rem', cursor: 'pointer',
                                                                background: sel ? '#ff6633' : '#f3f4f6',
                                                                color: sel ? '#fff' : '#374151',
                                                                border: sel ? '1px solid #ff6633' : '1px solid #e5e7eb',
                                                                fontWeight: sel ? 700 : 400,
                                                            }}
                                                        >
                                                            {p.nombre}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={cerrarModal}>Cancelar</button>
                            <button className="btn primary" onClick={guardar}>{editId ? 'Guardar cambios' : 'Crear proveedor'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Proveedores;
