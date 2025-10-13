import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Meseros/Meseros.css';
import Swal from 'sweetalert2';
import {
    HiUsers,
    HiMagnifyingGlass,
    HiAdjustmentsHorizontal,
    HiArrowPath,
    HiCheckCircle,
    HiClock,
    HiUser,
} from 'react-icons/hi2';

// Reutilizamos los estilos y pills de estado existentes de Mesas.css
import { api } from '../../../../api/client';

function Meseros() {
    // Fuente remota (backend)
    const [meseros, setMeseros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const cargar = async () => {
        setLoading(true); setError('');
        try {
            const data = await api.getMeseros();
            setMeseros(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || 'Error al cargar meseros');
        } finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    const [turnos, setTurnos] = useState(() => {
        try {
            const raw = localStorage.getItem('turnos');
            return raw ? (JSON.parse(raw) || []) : [];
        } catch {
            return [];
        }
    });

    // Nota: Turnos aún no está soportado por API, se mantiene en memoria (sin persistir localStorage)

    // Filtros y búsqueda
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos'); // todos | en-turno | activos | inactivos

    // Mapeo de turno por mesero
    const turnoById = useMemo(() => {
        const map = new Map();
        for (const t of Array.isArray(turnos) ? turnos : []) {
            const id = t.meseroId ?? t.userId ?? t.id ?? t.uid;
            if (id == null) continue;
            const en = (() => {
                const estado = `${t.estado || t.state || ''}`.toLowerCase();
                const flag = t.enTurno ?? t.inShift ?? t.onShift;
                return estado === 'en-turno' || estado === 'activo' || flag === true || flag === 1;
            })();
            map.set(Number(id), {
                enTurno: en,
                inicioAt: t.inicioAt || t.startedAt || null,
                mesaId: t.mesaId ?? t.mesa ?? null,
            });
        }
        return map;
    }, [turnos]);

    // Métricas
    const total = meseros.length;
    const activos = meseros.filter(u => (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo')).length;
    const inactivos = total - activos;
    const enTurno = meseros.filter(u => turnoById.get(Number(u.id))?.enTurno).length;

    // Filtrado y búsqueda
    const meserosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return meseros
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
    }, [meseros, busqueda, filtroEstado, turnoById]);

    // Helpers UI
    const pillFor = (u) => {
        const t = turnoById.get(Number(u.id));
        if (t?.enTurno) return { label: 'En turno', color: 'occ' }; // verde
        const isActivo = (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo');
        if (isActivo) return { label: 'Activo', color: 'res' }; // azul
        return { label: 'Inactivo', color: 'clean' }; // naranja
    };

    const refresh = () => { cargar(); };

    const resetMeseros = () => { cargar(); };

        // Admin: crear/editar/eliminar (no controla turnos)
    const [showNuevo, setShowNuevo] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoApellido, setNuevoApellido] = useState('');
    const [nuevoCorreo, setNuevoCorreo] = useState('');
    const [nuevoTelefono, setNuevoTelefono] = useState('');
    const [nuevoPassword, setNuevoPassword] = useState('');
    const [nuevoActivo, setNuevoActivo] = useState(true);

        const [showEditar, setShowEditar] = useState(false);
        const [editId, setEditId] = useState(null);
        const [editNombre, setEditNombre] = useState('');
        const [editApellido, setEditApellido] = useState('');
    const [editCorreo, setEditCorreo] = useState('');
    const [editTelefono, setEditTelefono] = useState('');
    const [editActivo, setEditActivo] = useState(true);
    const [editPassword, setEditPassword] = useState('');
    const [editCorreoConfirm, setEditCorreoConfirm] = useState('');

        const [showEliminar, setShowEliminar] = useState(false);
        const [deleteId, setDeleteId] = useState(null);

        const emailExiste = () => false; // Validación backend pendiente (tabla usuarios)

        const abrirNuevo = () => {
            setNuevoNombre(''); setNuevoApellido(''); setNuevoCorreo(''); setNuevoTelefono(''); setNuevoPassword(''); setNuevoActivo(true); setShowNuevo(true);
        };
        const confirmarNuevo = async () => {
            const nombre = nuevoNombre.trim();
            if (!nombre) return Swal.fire({ icon: 'error', title: 'Nombre requerido' });
            const correo = nuevoCorreo.trim();
            if (!correo) return Swal.fire({ icon: 'error', title: 'Correo requerido' });
            const emailOk = /.+@.+\..+/.test(correo);
            if (!emailOk) return Swal.fire({ icon: 'error', title: 'Correo inválido' });
            // Requerir contraseña mínima siempre para permitir login
            if (!nuevoPassword || nuevoPassword.length < 6) {
                return Swal.fire({ icon: 'error', title: 'Contraseña requerida', text: 'Mínimo 6 caracteres.' });
            }
            try {
                await api.crearMesero({ nombre, estado: nuevoActivo ? 'activo' : 'inactivo', correo, contrasena: nuevoPassword });
                setShowNuevo(false);
                await Swal.fire({ icon: 'success', title: 'Mesero creado', timer: 900, showConfirmButton: false });
                cargar();
            } catch (e) {
                Swal.fire('Error', e.message || 'No se pudo crear', 'error');
            }
        };

        const abrirEditar = () => {
            if (meseros.length === 0) return Swal.fire({ icon: 'info', title: 'No hay meseros para editar' });
            const first = [...meseros].sort((a,b)=> String(a.nombre).localeCompare(String(b.nombre)))[0];
            setEditId(first.id); setEditNombre(first.nombre || ''); setEditApellido(first.apellido || ''); setEditCorreo(first.correo || first.email || ''); setEditTelefono(first.telefono || ''); setEditActivo(first.activo === true || first.activo === 1 || `${first.estado||''}`.toLowerCase() === 'activo'); setEditPassword(''); setEditCorreoConfirm('');
            setShowEditar(true);
        };
        const onChangeEditarSeleccion = (idStr) => {
            const id = Number(idStr);
            setEditId(id);
            const u = meseros.find(x => Number(x.id) === id);
            if (!u) return;
            setEditNombre(u.nombre || ''); setEditApellido(u.apellido || ''); setEditCorreo(u.correo || u.email || ''); setEditTelefono(u.telefono || ''); setEditActivo(u.activo === true || u.activo === 1 || `${u.estado||''}`.toLowerCase() === 'activo'); setEditPassword(''); setEditCorreoConfirm('');
        };
        const confirmarEditar = async () => {
            if (!editId) return setShowEditar(false);
            const nombre = editNombre.trim();
            if (!nombre) return Swal.fire({ icon: 'error', title: 'Nombre requerido' });
            const correo = String(editCorreo || '').trim();
            if (!correo) return Swal.fire({ icon: 'error', title: 'Correo requerido' });
            const emailOk = /.+@.+\..+/.test(correo);
            if (!emailOk) return Swal.fire({ icon: 'error', title: 'Correo inválido' });
            const original = meseros.find(x => Number(x.id) === Number(editId));
            const originalCorreo = original?.correo || original?.email || '';
            const wantsUserChange = (editPassword && editPassword.length > 0) || (correo.toLowerCase() !== String(originalCorreo).toLowerCase());
            if (wantsUserChange) {
                if (!editCorreoConfirm || editCorreoConfirm.trim().toLowerCase() !== correo.toLowerCase()) {
                    return Swal.fire({ icon: 'error', title: 'Confirma tu correo', text: 'Para cambiar el correo o la contraseña debes confirmar el correo.'});
                }
                if (editPassword && editPassword.length > 0 && editPassword.length < 6) {
                    return Swal.fire({ icon: 'error', title: 'Contraseña inválida', text: 'La nueva contraseña debe tener al menos 6 caracteres.'});
                }
            }
            try {
                await api.actualizarMesero(editId, { nombre, estado: editActivo ? 'activo' : 'inactivo', correo, contrasena: editPassword || undefined, confirm_correo: editCorreoConfirm || undefined });
                setShowEditar(false);
                await Swal.fire({ icon: 'success', title: 'Cambios guardados', timer: 900, showConfirmButton: false });
                cargar();
            } catch (e) {
                Swal.fire('Error', e.message || 'No se pudo actualizar', 'error');
            }
        };

        const abrirEliminar = () => {
            if (meseros.length === 0) return Swal.fire({ icon: 'info', title: 'No hay meseros para eliminar' });
            const first = [...meseros].sort((a,b)=> String(a.nombre).localeCompare(String(b.nombre)))[0];
            setDeleteId(first.id); setShowEliminar(true);
        };
        const confirmarEliminar = async () => {
            if (!deleteId) return setShowEliminar(false);
            const u = meseros.find(x => Number(x.id) === Number(deleteId));
            if (!u) return setShowEliminar(false);
            // Bloquea eliminación si está en turno
            if (turnoById.get(Number(u.id))?.enTurno) {
                await Swal.fire({ icon: 'error', title: 'No permitido', text: 'No puedes eliminar un mesero mientras está en turno.' });
                return;
            }
            const res = await Swal.fire({ title: `Eliminar ${u.nombre} ${u.apellido || ''}`.trim(), text: 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, cancelButtonText: 'Cancelar', confirmButtonText: 'Eliminar', confirmButtonColor: '#ef4444' });
            if (!res.isConfirmed) return;
            try {
                await api.eliminarMesero(deleteId);
                setShowEliminar(false);
                await Swal.fire({ icon: 'success', title: 'Mesero eliminado', timer: 900, showConfirmButton: false });
                cargar();
            } catch (e) {
                Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
            }
        };

    const avatarOf = (u) => String(`${u.nombre || ''}`.trim().charAt(0) || '?').toUpperCase();

    return (
        <div className="mesas-page">{/* Reutilizamos layout */}
            <div className="mesas-header">
                <div>
                    <h1>Gestión de Meseros</h1>
                    <p className="muted">Administra disponibilidad, turnos y estados de tu equipo.</p>
                </div>
                        <div className="header-actions">
                            <button className="btn ghost" onClick={refresh}><HiArrowPath /> {loading ? 'Cargando...' : 'Recargar'}</button>
                            <button className="btn" onClick={abrirEditar}>Editar</button>
                            <button className="btn ghost" onClick={abrirEliminar}>Eliminar</button>
                            <button className="btn primary" onClick={abrirNuevo}>Nuevo mesero</button>
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
                    <div className="metric-icon"><HiCheckCircle /></div>
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
                {meserosFiltrados.map(u => {
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
                                    <span className="small muted">Correo</span>
                                    <span>{u.correo || u.email || '—'}</span>
                                </div>
                                <div className="cap">
                                    <HiClock />
                                    <span>{t?.inicioAt ? `Inicio turno: ${new Date(t.inicioAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Fuera de turno'}</span>
                                </div>
                                <div className="cap">
                                    <HiUser />
                                    <span>{t?.mesaId ? `Atendiendo mesa ${t.mesaId}` : 'Sin mesa asignada'}</span>
                                </div>
                            </div>
                                            {/* Sin acciones operativas: el admin no controla turnos; gestión via modales de la cabecera */}
                        </div>
                    );
                })}
                {meserosFiltrados.length === 0 && (
                    <div className="empty">No hay meseros que coincidan con tu búsqueda.</div>
                )}
            </div>

                        {/* Modal Nuevo mesero */}
                        {showNuevo && (
                            <div className="modal-overlay" role="dialog" aria-modal="true">
                                <div className="modal-card lg">
                                    <div className="modal-header">
                                        <h3>Nuevo mesero</h3>
                                        <button className="close-btn" onClick={() => setShowNuevo(false)} aria-label="Cerrar">×</button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="modal-subtitle">Crea un nuevo perfil de mesero.</p>
                                        <div className="modal-grid">
                                            <label>
                                                <span>Nombre</span>
                                                <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Apellido</span>
                                                <input value={nuevoApellido} onChange={e => setNuevoApellido(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Correo</span>
                                                <input type="email" value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Contraseña</span>
                                                <input type="password" value={nuevoPassword} onChange={e => setNuevoPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                                            </label>
                                            <label>
                                                <span>Teléfono</span>
                                                <input value={nuevoTelefono} onChange={e => setNuevoTelefono(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Estado</span>
                                                <select value={nuevoActivo ? '1' : '0'} onChange={e => setNuevoActivo(e.target.value === '1')}>
                                                    <option value="1">Activo</option>
                                                    <option value="0">Inactivo</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn ghost" onClick={() => setShowNuevo(false)}>Cancelar</button>
                                        <button className="btn primary" onClick={confirmarNuevo}>Crear</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Editar mesero */}
                        {showEditar && (
                            <div className="modal-overlay" role="dialog" aria-modal="true">
                                <div className="modal-card lg">
                                    <div className="modal-header">
                                        <h3>Editar mesero</h3>
                                        <button className="close-btn" onClick={() => setShowEditar(false)} aria-label="Cerrar">×</button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="modal-subtitle">Actualiza los datos del mesero.</p>
                                        <div className="modal-grid">
                                            <label>
                                                <span>Seleccione mesero</span>
                                                <select value={editId ?? ''} onChange={e => onChangeEditarSeleccion(e.target.value)}>
                                                    {[...meseros].sort((a,b)=> String(a.nombre).localeCompare(String(b.nombre))).map(m => (
                                                        <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <div className="summary-card">
                                                {(() => { const u = meseros.find(x => Number(x.id) === Number(editId)); if (!u) return null; const pill = pillFor(u); return (
                                                    <div className="summary-row">
                                                        <span><strong>{u.nombre} {u.apellido}</strong></span>
                                                        <span className={`status-pill ${pill.color}`}>{pill.label}</span>
                                                    </div>
                                                ); })()}
                                            </div>
                                            <label>
                                                <span>Nombre</span>
                                                <input value={editNombre} onChange={e => setEditNombre(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Apellido</span>
                                                <input value={editApellido} onChange={e => setEditApellido(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Correo</span>
                                                <input type="email" value={editCorreo} onChange={e => setEditCorreo(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Nueva contraseña</span>
                                                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Dejar vacío para no cambiar" />
                                            </label>
                                            <label>
                                                <span>Confirmar correo</span>
                                                <input type="email" value={editCorreoConfirm} onChange={e => setEditCorreoConfirm(e.target.value)} placeholder="Repite el correo para confirmar" />
                                            </label>
                                            <label>
                                                <span>Teléfono</span>
                                                <input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Estado</span>
                                                <select value={editActivo ? '1' : '0'} onChange={e => setEditActivo(e.target.value === '1')}>
                                                    <option value="1">Activo</option>
                                                    <option value="0">Inactivo</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn ghost" onClick={() => setShowEditar(false)}>Cancelar</button>
                                        <button className="btn primary" onClick={confirmarEditar}>Guardar</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Eliminar mesero */}
                        {showEliminar && (
                            <div className="modal-overlay" role="dialog" aria-modal="true">
                                <div className="modal-card lg">
                                    <div className="modal-header danger">
                                        <h3>Eliminar mesero</h3>
                                        <button className="close-btn" onClick={() => setShowEliminar(false)} aria-label="Cerrar">×</button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="modal-subtitle">Esta acción es permanente.</p>
                                        <div className="modal-grid">
                                            <label>
                                                <span>Seleccione mesero</span>
                                                <select value={deleteId ?? ''} onChange={e => setDeleteId(Number(e.target.value))}>
                                                    {[...meseros].sort((a,b)=> String(a.nombre).localeCompare(String(b.nombre))).map(m => (
                                                        <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <div className="summary-card">
                                                {(() => { const u = meseros.find(x => Number(x.id) === Number(deleteId)); if (!u) return null; const pill = pillFor(u); return (
                                                    <div className="summary-row">
                                                        <span><strong>{u.nombre} {u.apellido}</strong> — {u.correo || u.email || 'sin correo'}</span>
                                                        <span className={`status-pill ${pill.color}`}>{pill.label}</span>
                                                    </div>
                                                ); })()}
                                            </div>
                                        </div>
                                        <div className="divider" />
                                        <div className="danger-zone">
                                            <div className="alert-danger"><span className="icon">!</span><div><strong>Cuidado:</strong> No puedes deshacer esta eliminación.</div></div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn ghost" onClick={() => setShowEliminar(false)}>Cancelar</button>
                                        <button className="btn danger" onClick={confirmarEliminar}>Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        )}
        </div>
    );
}

export default Meseros;
