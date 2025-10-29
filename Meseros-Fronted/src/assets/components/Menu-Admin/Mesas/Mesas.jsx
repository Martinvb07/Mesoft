import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Mesas/Mesas.css';
import { api } from '../../../../api/client';
import {
    HiSquares2X2,
    HiUsers,
    HiCheckCircle,
    HiClock,
    HiMagnifyingGlass,
    HiAdjustmentsHorizontal,
    HiUser,
    HiArrowPath,
    HiPlus,
    HiOutlineXCircle,
    HiTrash,
    HiPencilSquare,
} from 'react-icons/hi2';

const ESTADOS = {
    libre: { key: 'libre', label: 'Libre', color: 'free' },
    ocupada: { key: 'ocupada', label: 'Ocupada', color: 'occ' },
    reservada: { key: 'reservada', label: 'Reservada', color: 'res' },
    limpieza: { key: 'limpieza', label: 'Limpieza', color: 'clean' },
};

function formatDuration(ms) {
    if (!ms || ms < 0) return '—';
    const sec = Math.floor(ms / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function Mesas() {
    const [mesas, setMesas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroCapacidad, setFiltroCapacidad] = useState('todas');
    const [meserosActivosCount, setMeserosActivosCount] = useState(0);
    const [showMeserosModal, setShowMeserosModal] = useState(false);
    const [meserosEnTurno, setMeserosEnTurno] = useState([]);
    const [showReservadasModal, setShowReservadasModal] = useState(false);
    const [reservasLista, setReservasLista] = useState([]);
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [detalleMesa, setDetalleMesa] = useState(null);
    // Modal de reserva
    const [reservaOpen, setReservaOpen] = useState(false);
    const [reservaForm, setReservaForm] = useState({ fecha: '', hora: '', nombre: '', telefono: '' });
    const [reservaMsg, setReservaMsg] = useState('');
    // Modal propio crear/editar
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [formMesaId, setFormMesaId] = useState(null);
    const [formData, setFormData] = useState({ numero: '', capacidad: 4, estado: 'libre' });
    const [formMsg, setFormMsg] = useState('');

    const normalizar = (row) => ({
        id: row.id,
        numero: row.numero,
        capacidad: row.capacidad,
        estado: row.estado,
        meseroId: row.mesero_id ?? null,
        meseroNombre: row.mesero_nombre ?? '',
        reservaAt: row.reserva_at ?? null,
        updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    });

    const cargarMesas = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getMesas();
            const list = Array.isArray(data) ? data.map(normalizar) : [];
            setMesas(list);
        } catch (e) {
            setError(e.message || 'No se pudo cargar mesas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarMesas();
    }, []);

    useEffect(() => {
        try {
            const rawTurnos = localStorage.getItem('turnos');
            if (rawTurnos) {
                const turnos = JSON.parse(rawTurnos);
                const enTurno = Array.isArray(turnos)
                    ? turnos.filter(t => {
                        const estado = `${t.estado || t.state || ''}`.toLowerCase();
                        const flag = t.enTurno ?? t.inShift ?? t.onShift;
                        return estado === 'en-turno' || estado === 'activo' || flag === true || flag === 1;
                    })
                    : [];
                setMeserosActivosCount(enTurno.length);
                return;
            }
            const keys = ['usuarios', 'users', 'app:usuarios'];
            let data = null;
            for (const k of keys) {
                const raw = localStorage.getItem(k);
                if (raw) { data = JSON.parse(raw); break; }
            }
            const arr = Array.isArray(data) ? data : [];
            const isMesero = (u = {}) => `${u.rol || u.role || ''}`.toLowerCase().includes('mesero');
            const isActivo = (u = {}) => {
                const a = u.activo;
                const estado = `${u.estado || u.status || ''}`.toLowerCase();
                if (a === 1 || a === true) return true;
                if (estado === 'activo' || estado === 'active') return true;
                if (a === 0 || a === false || estado === 'inactivo' || estado === 'inactive') return false;
                return true;
            };
            const count = arr.filter(isMesero).filter(isActivo).length;
            setMeserosActivosCount(count);
        } catch {
            setMeserosActivosCount(0);
        }
    }, []);

    // Crear / Editar / Eliminar mesas (modal propio)
    const abrirCrearModal = () => {
        setFormMode('create');
        setFormMesaId(null);
        setFormData({ numero: '', capacidad: 4, estado: 'libre' });
        setFormMsg('');
        setFormOpen(true);
    };
    const abrirEditarModal = (mesa) => {
        setFormMode('edit');
        setFormMesaId(mesa.id);
        setFormData({ numero: mesa.numero, capacidad: mesa.capacidad, estado: mesa.estado });
        setFormMsg('');
        setFormOpen(true);
    };
    const cerrarFormModal = () => setFormOpen(false);
    const guardarForm = async () => {
        const num = Number(formData.numero);
        const cap = Number(formData.capacidad);
        if (!num || num < 1) { setFormMsg('Número inválido'); return; }
        if (!cap || cap < 1) { setFormMsg('Capacidad inválida'); return; }
        try {
            if (formMode === 'create') {
                await api.createMesa({ numero: num, capacidad: cap, estado: formData.estado });
            } else {
                await api.updateMesa(formMesaId, { numero: num, capacidad: cap, estado: formData.estado });
            }
            await cargarMesas();
            cerrarFormModal();
        } catch (e) {
            setFormMsg(String(e.message || e));
        }
    };
    const eliminarMesa = async (mesa) => {
        const ok = window.confirm(`Eliminar mesa ${mesa.numero}?`);
        if (!ok) return;
        try {
            await api.deleteMesa(mesa.id);
            await cargarMesas();
        } catch (e) {
            alert(`Error al eliminar: ${String(e.message || e)}`);
        }
    };

    const cargarMeserosEnTurno = () => {
        try {
            const rawTurnos = localStorage.getItem('turnos');
            const turnos = rawTurnos ? JSON.parse(rawTurnos) : [];
            const enTurno = Array.isArray(turnos)
                ? turnos.filter(t => {
                    const estado = `${t.estado || t.state || ''}`.toLowerCase();
                    const flag = t.enTurno ?? t.inShift ?? t.onShift;
                    return estado === 'en-turno' || estado === 'activo' || flag === true || flag === 1;
                })
                : [];
            const lista = enTurno.map(t => {
                const id = t.meseroId ?? t.id ?? t.userId ?? t.uid;
                const nombre = t.nombre || t.name || t.fullName || `Mesero ${id ?? ''}`;
                const mesaId = t.mesaId ?? t.mesa ?? null;
                let mesa = null;
                if (mesaId) {
                    mesa = mesas.find(m => m.id === mesaId) || null;
                } else if (id != null) {
                    mesa = mesas.find(m => m.meseroId === id) || null;
                }
                return {
                    id,
                    nombre,
                    mesaNumero: mesa ? mesa.numero : null,
                    mesaEstado: mesa ? mesa.estado : null,
                    inicioAt: t.inicioAt || t.startedAt || null,
                };
            });
            setMeserosEnTurno(lista);
        } catch {
            setMeserosEnTurno([]);
        }
    };
    const abrirMeserosModal = () => { cargarMeserosEnTurno(); setShowMeserosModal(true); };
    const cerrarMeserosModal = () => setShowMeserosModal(false);

    const cargarReservas = () => {
        const lista = mesas
            .filter(m => m.estado === 'reservada')
            .map(m => ({ id: m.id, numero: m.numero, capacidad: m.capacidad, reservaAt: m.reservaAt }))
            .sort((a, b) => (a.reservaAt || 0) - (b.reservaAt || 0));
        setReservasLista(lista);
    };
    const abrirReservadasModal = () => { cargarReservas(); setShowReservadasModal(true); };
    const cerrarReservadasModal = () => setShowReservadasModal(false);

    const abrirDetalleMesa = async (mesa) => {
        // Priorizar el mismo nombre que mostramos en la tarjeta para evitar inconsistencias
        let meseroNombre = mesa.meseroNombre || '—';
        let asignadaAt = null;
        try {
            // Solo usar storages locales si no vino desde backend
            if ((meseroNombre === '—' || !meseroNombre)) {
                const rawTurnos = localStorage.getItem('turnos');
                if (rawTurnos) {
                    const turnos = JSON.parse(rawTurnos) || [];
                    const t = turnos.find(tu => {
                        const mesaMatch = (tu.mesaId ?? tu.mesa ?? tu.tableId ?? tu.mesaNumero ?? tu.tableNumber) === mesa.id || (tu.mesaNumero ?? tu.tableNumber) === mesa.numero;
                        const meseroMatch = (tu.meseroId ?? tu.id ?? tu.userId ?? tu.uid) === mesa.meseroId;
                        return mesaMatch || meseroMatch;
                    });
                    if (t) {
                        meseroNombre = t.nombre || t.name || t.fullName || t.usuario || t.username || t.correo || meseroNombre;
                        asignadaAt = t.asignadaAt || t.assignedAt || t.inicioMesaAt || t.startedTableAt || t.inicioAt || t.startedAt || null;
                    }
                }
                if ((meseroNombre === '—' || !meseroNombre) && mesa.meseroId != null) {
                    const keys = ['usuarios', 'users', 'app:usuarios'];
                    for (const k of keys) {
                        const raw = localStorage.getItem(k);
                        if (!raw) continue;
                        const arr = JSON.parse(raw) || [];
                        const u = arr.find(x => (x.id ?? x.userId ?? x.uid) === mesa.meseroId);
                        if (u) { meseroNombre = `${u.nombre || u.name || ''} ${u.apellido || ''}`.trim() || meseroNombre; break; }
                    }
                }
            }
        } catch {}

        // Intentar obtener consumos desde el backend (pedido abierto)
        let consumos = [];
        let total = 0;
        try {
            const pedido = await api.getPedidoAbiertoDeMesa(mesa.id).catch(() => null);
            if (pedido?.id) {
                const rows = await api.getPedidoItems(pedido.id).catch(() => []);
                consumos = Array.isArray(rows)
                    ? rows.map(r => ({
                        nombre: r.nombre,
                        cantidad: Number(r.cantidad || 0),
                        precio: Number(r.precio || 0),
                        subtotal: Number(r.subtotal || (Number(r.cantidad||0)*Number(r.precio||0)))
                    }))
                    : [];
                // Preferir total del pedido si existe, si no sumar subtotales
                total = Number(pedido.total || 0);
                if (!total) total = consumos.reduce((s, it) => s + Number(it.subtotal || 0), 0);
                // Si el backend del pedido trae mesero_nombre, úsalo como fuente de verdad
                if (pedido.mesero_nombre) {
                    meseroNombre = pedido.mesero_nombre;
                }
            }
        } catch {}
        // Fallback a storages locales si backend no devolvió items
        if (!consumos.length) {
            try {
                const keys = ['pedidos', 'ordenes', 'orders', 'consumos'];
                const dynamicKeys = [
                    `pedidos:mesa:${mesa.id}`,
                    `pedidos:mesa:${mesa.numero}`,
                    `mesa:${mesa.id}:pedidos`,
                    `mesa:${mesa.numero}:pedidos`,
                    `orders:table:${mesa.id}`,
                    `orders:table:${mesa.numero}`,
                ];
                const allKeys = [...keys, ...dynamicKeys];
                for (const k of allKeys) {
                    const raw = localStorage.getItem(k);
                    if (!raw) continue;
                    const data = JSON.parse(raw);
                    const arr = Array.isArray(data) ? data : (Array.isArray(data?.pedidos) ? data.pedidos : Array.isArray(data?.ordenes) ? data.ordenes : Array.isArray(data?.orders) ? data.orders : []);
                    const matches = arr.filter(p => {
                        const mid = (p.mesaId ?? p.mesa ?? p.tableId ?? p.mesaNumero ?? p.tableNumber);
                        return mid === mesa.id || mid === mesa.numero;
                    });
                    const items = matches.flatMap(p => {
                        const it = Array.isArray(p.items) ? p.items : (Array.isArray(p.detalles) ? p.detalles : Array.isArray(p.productos) ? p.productos : Array.isArray(p.lines) ? p.lines : Array.isArray(p.cart) ? p.cart : []);
                        return it;
                    });
                    for (const it of items) {
                        const nombre = it.nombre || it.producto || it.name || it.title || 'Producto';
                        const cant = Number(it.cantidad ?? it.qty ?? it.quantity ?? 1) || 1;
                        const precio = Number(it.precio ?? it.price ?? it.unitPrice ?? it.valor ?? 0) || 0;
                        const subtotal = Number(it.subtotal ?? it.total ?? cant * precio) || cant * precio;
                        total += subtotal;
                        consumos.push({ nombre, cantidad: cant, precio, subtotal });
                    }
                    if (consumos.length) break;
                }
            } catch {}
        }

        setDetalleMesa({ ...mesa, meseroNombre, consumos, total, asignadaAt });
        setShowDetalleModal(true);
    };
    const cerrarDetalleMesa = () => { setShowDetalleModal(false); setDetalleMesa(null); };

    const abrirReservarModal = (mesa) => {
        const target = mesa || detalleMesa;
        if (!target) return;
        // precargar: hoy + 1h
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setReservaForm({
            fecha: `${y}-${m}-${d}`,
            hora: `${hh}:${mm}`,
            nombre: target.reservadoPor || '',
            telefono: target.telefono || '',
        });
        setReservaMsg('');
        setReservaOpen(true);
    };

    const cerrarReservarModal = () => setReservaOpen(false);

    const confirmarReserva = async () => {
        if (!detalleMesa) return;
        const { fecha, hora, nombre, telefono } = reservaForm;
        if (!fecha || !hora) { setReservaMsg('Elige fecha y hora'); return; }
        const reserva_at = `${fecha} ${hora}:00`;
        try {
            await api.reservarMesa(detalleMesa.id, { reserva_at, reservado_por: nombre || null, telefono: telefono || null });
            await cargarMesas();
            setReservaOpen(false);
            // refrescar detalle
            const updated = (await api.getMesas()).find(m => m.id === detalleMesa.id);
            if (updated) abrirDetalleMesa(updated);
        } catch (e) {
            setReservaMsg(String(e.message || e));
        }
    };

    const cancelarReserva = async (mesa) => {
        const target = mesa || detalleMesa;
        if (!target) return;
        const ok = window.confirm('¿Cancelar la reserva de esta mesa?');
        if (!ok) return;
        try {
            await api.cancelarReservaMesa(target.id);
            await cargarMesas();
            if (detalleMesa && target.id === detalleMesa.id) abrirDetalleMesa(target);
        } catch (e) {
            alert(String(e.message || e));
        }
    };

    const mesasFiltradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return mesas
            .filter(m => (filtroEstado === 'todos' ? true : m.estado === filtroEstado))
            .filter(m => (filtroCapacidad === 'todas' ? true : m.capacidad === Number(filtroCapacidad)))
            .filter(m => !q || String(m.numero).includes(q))
            .sort((a, b) => a.numero - b.numero);
    }, [mesas, busqueda, filtroEstado, filtroCapacidad]);

    const total = mesas.length;
    const libres = mesas.filter(m => m.estado === 'libre').length;
    const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
    const reservadas = mesas.filter(m => m.estado === 'reservada').length;

    return (
        <div className="mesas-page">
            <div className="mesas-header">
                <div>
                    <h1>Gestión de Mesas</h1>
                    <p className="muted">Visualiza disponibilidad y estados en tiempo real.</p>
                </div>
                <div className="header-actions">
                    <button className="btn ghost" onClick={cargarMesas} title="Actualizar listado"><HiArrowPath /> Actualizar</button>
                    <button className="btn" onClick={async () => {
                        const mesa = mesasFiltradas[0];
                        if (!mesa) { alert('Selecciona una mesa (doble clic) o filtra para editar.'); return; }
                        abrirEditarModal(mesa);
                    }} title="Editar primera mesa filtrada"><HiPencilSquare /> Editar mesa</button>
                    <button className="btn ghost" onClick={async () => {
                        const mesa = mesasFiltradas[0];
                        if (!mesa) { alert('Selecciona una mesa o filtra para eliminar.'); return; }
                        await eliminarMesa(mesa);
                    }} title="Eliminar primera mesa filtrada"><HiTrash /> Eliminar mesa</button>
                    <button className="btn primary" onClick={abrirCrearModal}><HiPlus /> Nueva mesa</button>
                </div>
            </div>

            <div className="mesas-metrics">
                <div className="metric-card">
                    <div className="metric-icon"><HiSquares2X2 /></div>
                    <div className="metric-info">
                        <div className="metric-duo"><span className="big">{libres}</span><span className="den">/ {total}</span></div>
                        <div className="metric-label">Mesas disponibles</div>
                    </div>
                </div>
                <div className="metric-card clickable" onClick={abrirMeserosModal} title="Ver meseros en turno">
                    <div className="metric-icon"><HiUsers /></div>
                    <div className="metric-info">
                        <div className="metric-value">{meserosActivosCount}</div>
                        <div className="metric-label">Meseros activos</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiCheckCircle /></div>
                    <div className="metric-info">
                        <div className="metric-value">{ocupadas}</div>
                        <div className="metric-label">Ocupadas</div>
                    </div>
                </div>
                <div className="metric-card clickable" onClick={abrirReservadasModal} title="Ver mesas reservadas">
                    <div className="metric-icon"><HiClock /></div>
                    <div className="metric-info">
                        <div className="metric-value">{reservadas}</div>
                        <div className="metric-label">Reservadas</div>
                    </div>
                </div>
            </div>

            <div className="mesas-toolbar">
                <div className="search">
                    <HiMagnifyingGlass />
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por número..." />
                </div>
                <div className="filters">
                    <div className="filter">
                        <HiAdjustmentsHorizontal />
                        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="libre">Libres</option>
                            <option value="ocupada">Ocupadas</option>
                            <option value="reservada">Reservadas</option>
                            <option value="limpieza">Limpieza</option>
                        </select>
                    </div>
                    <div className="filter">
                        <HiUser />
                        <select value={filtroCapacidad} onChange={e => setFiltroCapacidad(e.target.value)}>
                            <option value="todas">Capacidad: Todas</option>
                            <option value="2">2</option>
                            <option value="4">4</option>
                            <option value="6">6</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="mesas-grid">
                {loading && (
                    <div className="empty"><p>Cargando mesas...</p></div>
                )}
                {!loading && error && (
                    <div className="empty"><p>Error: {error}</p></div>
                )}
                {!loading && !error && mesasFiltradas.map(m => (
                    <div key={m.id} className={`mesa-card ${ESTADOS[m.estado]?.color || ''}`} onClick={() => abrirDetalleMesa(m)} onDoubleClick={() => abrirEditarModal(m)}>
                        <div className="mesa-top">
                            <span className="mesa-number">Mesa {m.numero}</span>
                            <span className={`status-pill ${ESTADOS[m.estado]?.color || ''}`}>{ESTADOS[m.estado]?.label || m.estado}</span>
                        </div>

                        <div className="mesa-body">
                            <div className="cap">
                                <HiUsers />
                                <span>Capacidad {m.capacidad}</span>
                            </div>
                            {m.meseroNombre && (
                                <div className="cap">
                                    <HiUser />
                                    <span>Mesero: {m.meseroNombre}</span>
                                </div>
                            )}
                            {m.estado === 'reservada' && m.reservaAt && (
                                <div className="reserva">
                                    <HiClock />
                                    <span>Reservada: {new Date(m.reservaAt).toLocaleDateString()} {new Date(m.reservaAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {!loading && !error && mesasFiltradas.length === 0 && (
                    <div className="empty">
                        <p>No se encontraron mesas con los filtros aplicados.</p>
                    </div>
                )}
            </div>

            {/* Modal Detalle de mesa */}
            {showDetalleModal && detalleMesa && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Detalle Mesa {detalleMesa.numero}</h3>
                            <button className="close-btn" onClick={cerrarDetalleMesa} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            <ul className="detail-list">
                                <li><strong>Mesero:</strong> {detalleMesa.meseroNombre || '—'}</li>
                                {detalleMesa.asignadaAt && (
                                    <li><strong>Tiempo en mesa:</strong> {formatDuration(Date.now() - Number(detalleMesa.asignadaAt))}</li>
                                )}
                                <li><strong>Consumos:</strong></li>
                            </ul>
                            {(!detalleMesa.consumos || detalleMesa.consumos.length === 0) && (
                                <div className="empty" style={{ margin: 0 }}>Sin consumos registrados.</div>
                            )}
                            {detalleMesa.consumos && detalleMesa.consumos.length > 0 && (
                                <div className="consumos-wrap">
                                    <table className="table-consumos">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cant.</th>
                                                <th>Precio</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detalleMesa.consumos.map((c, idx) => (
                                                <tr key={idx}>
                                                    <td>{c.nombre}</td>
                                                    <td className="td-right">{c.cantidad}</td>
                                                    <td className="td-right">${c.precio.toLocaleString('es-CO')}</td>
                                                    <td className="td-right">${c.subtotal.toLocaleString('es-CO')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan={3} className="td-right"><strong>Total</strong></td>
                                                <td className="td-right"><strong>${(detalleMesa.total || 0).toLocaleString('es-CO')}</strong></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => abrirDetalleMesa(mesas.find(mm => mm.id === detalleMesa.id) || detalleMesa)}>Recargar</button>
                            {detalleMesa.estado !== 'reservada' ? (
                                <button className="btn primary" onClick={() => abrirReservarModal(detalleMesa)}>Reservar</button>
                            ) : (
                                <button className="btn ghost" onClick={() => cancelarReserva(detalleMesa)}>Cancelar reserva</button>
                            )}
                            <button className="btn" onClick={cerrarDetalleMesa}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Meseros en turno */}
            {showMeserosModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Meseros en turno</h3>
                            <button className="close-btn" onClick={cerrarMeserosModal} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            {meserosEnTurno.length === 0 && (
                                <div className="empty" style={{ margin: 0 }}>No hay meseros en turno.</div>
                            )}
                            {meserosEnTurno.length > 0 && (
                                <ul className="staff-modal-list">
                                    {meserosEnTurno.map((s) => (
                                        <li key={s.id} className="staff-row">
                                            <div className="avatar">{String(s.nombre || '?').charAt(0).toUpperCase()}</div>
                                            <div className="staff-main">
                                                <div className="staff-name">{s.nombre}</div>
                                                <div className="staff-sub small">
                                                    {s.inicioAt ? `Inicio de turno: ${new Date(s.inicioAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'En turno'}
                                                </div>
                                            </div>
                                            <div className="staff-right">
                                                {s.mesaNumero ? (
                                                    <span className={`status-pill ${s.mesaEstado === 'ocupada' ? 'occ' : s.mesaEstado === 'reservada' ? 'res' : 'free'}`}>
                                                        Mesa {s.mesaNumero}
                                                    </span>
                                                ) : (
                                                    <span className="status-pill free">Sin mesa</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={cerrarMeserosModal}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Mesas reservadas */}
            {showReservadasModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Mesas reservadas</h3>
                            <button className="close-btn" onClick={cerrarReservadasModal} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            {reservasLista.length === 0 && (
                                <div className="empty" style={{ margin: 0 }}>No hay mesas reservadas.</div>
                            )}
                            {reservasLista.length > 0 && (
                                <ul className="staff-modal-list">
                                    {reservasLista.map(r => (
                                        <li key={r.id} className="staff-row">
                                            <div className="avatar">{String(r.numero).charAt(0)}</div>
                                            <div className="staff-main">
                                                <div className="staff-name">Mesa {r.numero}</div>
                                                <div className="staff-sub small">Capacidad {r.capacidad}</div>
                                            </div>
                                            <div className="staff-right">
                                                {r.reservaAt ? (
                                                    <span className="status-pill res">
                                                        {new Date(r.reservaAt).toLocaleDateString()} {new Date(r.reservaAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                ) : (
                                                    <span className="status-pill res">Programada</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={cerrarReservadasModal}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Crear/Editar mesa */}
            {formOpen && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card" style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3>{formMode === 'create' ? 'Nueva mesa' : `Editar mesa ${formData.numero}`}</h3>
                            <button className="close-btn" onClick={cerrarFormModal} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            {formMsg && <div className="empty" style={{ margin: 0 }}>{formMsg}</div>}
                            <div className="form-grid">
                                <div className="form-row">
                                    <label>Número</label>
                                    <input type="number" min={1} value={formData.numero}
                                        onChange={e=>setFormData({ ...formData, numero: e.target.value })}
                                        placeholder="Número de mesa" />
                                </div>
                                <div className="form-row">
                                    <label>Capacidad</label>
                                    <input type="number" min={1} value={formData.capacidad}
                                        onChange={e=>setFormData({ ...formData, capacidad: e.target.value })}
                                        placeholder="Capacidad" />
                                </div>
                                <div className="form-row">
                                    <label>Estado</label>
                                    <select value={formData.estado} onChange={e=>setFormData({ ...formData, estado: e.target.value })}>
                                        <option value="libre">Libre</option>
                                        <option value="ocupada">Ocupada</option>
                                        <option value="reservada">Reservada</option>
                                        <option value="limpieza">Limpieza</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={guardarForm}>{formMode === 'create' ? 'Crear' : 'Guardar'}</button>
                            <button className="btn ghost" onClick={cerrarFormModal}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Reservar mesa */}
            {reservaOpen && detalleMesa && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card" style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3>Reservar mesa {detalleMesa.numero}</h3>
                            <button className="close-btn" onClick={cerrarReservarModal} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            {reservaMsg && <div className="empty" style={{ margin: 0 }}>{reservaMsg}</div>}
                            <div className="form-grid">
                                <div className="form-row">
                                    <label>Fecha</label>
                                    <input type="date" value={reservaForm.fecha} onChange={e=>setReservaForm({ ...reservaForm, fecha: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <label>Hora</label>
                                    <input type="time" value={reservaForm.hora} onChange={e=>setReservaForm({ ...reservaForm, hora: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <label>Nombre</label>
                                    <input type="text" value={reservaForm.nombre} onChange={e=>setReservaForm({ ...reservaForm, nombre: e.target.value })} placeholder="Nombre del cliente" />
                                </div>
                                <div className="form-row">
                                    <label>Teléfono</label>
                                    <input type="tel" value={reservaForm.telefono} onChange={e=>setReservaForm({ ...reservaForm, telefono: e.target.value })} placeholder="Teléfono de contacto" />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={confirmarReserva}>Confirmar</button>
                            <button className="btn ghost" onClick={cerrarReservarModal}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Mesas;

