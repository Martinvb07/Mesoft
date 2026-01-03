import React, { useState, useEffect, useMemo } from 'react';
import '../../../css/Navbar/Menu-Meseros/Mesas/Mesas.css';
import Swal from 'sweetalert2';
import {
    HiSquares2X2,
    HiUsers,
    HiCheckCircle,
    HiMagnifyingGlass,
    HiAdjustmentsHorizontal,
    HiUser,
    HiArrowPath,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';

const ESTADOS = {
    libre: { key: 'libre', label: 'Libre', color: 'free' },
    ocupada: { key: 'ocupada', label: 'Ocupada', color: 'occ' },
    reservada: { key: 'reservada', label: 'Reservada', color: 'res' },
    limpieza: { key: 'limpieza', label: 'Limpieza', color: 'clean' },
};

function todayKey() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
}

// No seed local; todo viene del backend

const Mesas = () => {
    const [mesas, setMesas] = useState([]);
    const [productos, setProductos] = useState([]);
    // Identidad del mesero actual (desde backend)
    const [miNombre, setMiNombre] = useState('Mesero');
    const [miId, setMiId] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroCapacidad, setFiltroCapacidad] = useState('todas');
    const [modalMesa, setModalMesa] = useState(null);
    const [modalAccion, setModalAccion] = useState('');
    // Pedido modal state
    const [pedidoModal, setPedidoModal] = useState({ mesa: null, editable: false });
    const [pedidoItems, setPedidoItems] = useState([]);
    const [nuevoItem, setNuevoItem] = useState({ nombre: '', cantidad: 1, precio: 0 });
    const [resumenPago, setResumenPago] = useState(null); // { mesaId, mesaNumero, total, abonado, pendiente, recibido, propina, cambio, aplicado }
    const [factura, setFactura] = useState({ visible: false, data: null });

    const getRestaurantName = () => {
        const keys = ['usuario', 'user', 'auth_user', 'currentUser'];
        for (const k of keys) {
            try {
                const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
                if (!raw) continue;
                const obj = JSON.parse(raw);
                const u = obj?.usuario || obj?.user || obj;
                const name = u?.restaurante || u?.nombreRestaurante || u?.nombre_restaurante || u?.empresa || u?.company;
                if (name) return String(name);
            } catch {}
        }
        return 'Mi Restaurante';
    };

    // Todo viene del backend; no persistimos en local

    // Cargar identidad del mesero + mesas y productos desde backend
    useEffect(() => {
        const load = async () => {
            try {
                const [me, ms, prods] = await Promise.all([
                    api.getMiMesero().catch(() => null),
                    api.getMesas(),
                    api.getProductos().then(r => Array.isArray(r?.items) ? r.items : (Array.isArray(r) ? r : [])),
                ]);
                if (me && (me.id || me.mesero_id)) {
                    setMiId(me.id ?? me.mesero_id);
                    setMiNombre(me.nombre || 'Mesero');
                }
                const normalized = (Array.isArray(ms) ? ms : []).map(m => ({
                    id: m.id,
                    numero: m.numero,
                    capacidad: m.capacidad ?? 2,
                    estado: m.estado || 'libre',
                    meseroId: m.mesero_id ?? null,
                    meseroNombre: m.mesero_nombre || '',
                })).sort((a,b)=>a.numero-b.numero);
                setMesas(normalized);
                setProductos(prods);
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'No se pudieron cargar las mesas', text: e?.message || 'Error' });
            }
        };
        load();
    }, []);

    const handleAsignar = (mesa) => { setModalMesa(mesa); setModalAccion('asignar'); };
    const handleLiberar = (mesa) => { setModalMesa(mesa); setModalAccion('liberar'); };
    const handleLimpieza = (mesa) => { setModalMesa(mesa); setModalAccion('limpieza'); };
    const handleLimpiezaDone = (mesa) => { setModalMesa(mesa); setModalAccion('limpieza-done'); };

    const confirmarAccion = async () => {
        if (!modalMesa) return;
        try {
            const id = modalMesa.id;
            if (modalAccion === 'asignar') {
                await api.asignarMesa(id, { mesero_id: miId || undefined });
            } else if (modalAccion === 'liberar') {
                await api.liberarMesa(id);
            } else if (modalAccion === 'limpieza') {
                await api.limpiezaMesa(id);
            } else if (modalAccion === 'limpieza-done') {
                await api.finLimpiezaMesa(id);
            }
            const data = await api.getMesas();
            const normalized = (Array.isArray(data) ? data : []).map(m => ({
                id: m.id,
                numero: m.numero,
                capacidad: m.capacidad ?? 2,
                estado: m.estado || 'libre',
                meseroId: m.mesero_id ?? null,
                meseroNombre: m.mesero_nombre || '',
            })).sort((a,b)=>a.numero-b.numero);
            setMesas(normalized);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo aplicar la acción', text: e?.message || 'Error' });
        } finally {
            setModalMesa(null);
            setModalAccion('');
        }
    };
    const cancelarAccion = () => { setModalMesa(null); setModalAccion(''); };

    const [pedidoActual, setPedidoActual] = useState(null); // { id }
    const abrirPedido = async (mesa) => {
        if (!mesa) return;
        try {
            const pedido = await api.getPedidoAbiertoDeMesa(mesa.id);
            setPedidoActual(pedido);
            let items = [];
            if (pedido?.id) {
                const rows = await api.getPedidoItems(pedido.id);
                items = Array.isArray(rows) ? rows.map(r => ({ id: r.id, nombre: r.nombre, cantidad: Number(r.cantidad||0), precio: Number(r.precio||0), subtotal: Number(r.subtotal||0) })) : [];
            }
            setPedidoItems(items);
            const editable = mesa.estado === 'ocupada';
            setPedidoModal({ mesa, editable });
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo abrir el pedido', text: e?.message || 'Error' });
        }
    };
    const cerrarPedido = () => { setPedidoModal({ mesa: null, editable: false }); setNuevoItem({ nombre: '', cantidad: 1, precio: 0 }); };
    const [productoSel, setProductoSel] = useState('');
    const agregarItem = async () => {
        if (!pedidoModal.editable) return;
        if (!pedidoActual?.id) return Swal.fire({ icon: 'error', title: 'No hay pedido abierto' });
        const pid = pedidoActual.id;
        const cantidad = Number(nuevoItem.cantidad || 1);
        const producto_id = Number(productoSel || 0);
        if (!producto_id) return Swal.fire({ icon: 'error', title: 'Selecciona un producto' });
        if (cantidad <= 0) return Swal.fire({ icon: 'error', title: 'Cantidad inválida' });
        try {
            const resp = await api.addPedidoItem(pid, { producto_id, cantidad });
            const rows = await api.getPedidoItems(pid);
            const items = Array.isArray(rows) ? rows.map(r => ({ id: r.id, nombre: r.nombre, cantidad: Number(r.cantidad||0), precio: Number(r.precio||0), subtotal: Number(r.subtotal||0) })) : [];
            setPedidoItems(items);
            setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
            setProductoSel('');
            // Aviso para mesero: bajo stock
            if (resp?.warnings?.lowStock) {
                const w = resp.warnings;
                Swal.fire({ icon: 'info', title: 'Stock bajo', text: `${w.nombre || 'Producto'}: quedan ${w.restante} (mínimo ${w.min_stock})`, timer: 2000, showConfirmButton: false });
            }
        } catch (e) {
            if (e?.status === 409 && (e?.payload?.code === 'STOCK_INSUFICIENTE' || /Stock insuficiente/i.test(e?.message || ''))) {
                const disponible = e?.payload?.disponible;
                const text = typeof disponible === 'number' ? `Disponible: ${disponible}` : 'No hay inventario suficiente para la cantidad solicitada.';
                Swal.fire({ icon: 'warning', title: 'Stock insuficiente', text });
            } else {
                Swal.fire({ icon: 'error', title: 'No se pudo agregar', text: e?.message || 'Error' });
            }
            // Refrescar productos para ver stocks actuales (si el backend los expone)
            try {
                const prods = await api.getProductos().then(r => Array.isArray(r?.items) ? r.items : (Array.isArray(r) ? r : []));
                setProductos(prods);
            } catch {}
        }
    };
    const quitarItem = async (idx) => {
        if (!pedidoModal.editable) return;
        if (!pedidoActual?.id) return;
        const item = pedidoItems[idx];
        if (!item?.id) return;
        try {
            await api.deletePedidoItem(pedidoActual.id, item.id);
            const rows = await api.getPedidoItems(pedidoActual.id);
            const items = Array.isArray(rows) ? rows.map(r => ({ id: r.id, nombre: r.nombre, cantidad: Number(r.cantidad||0), precio: Number(r.precio||0), subtotal: Number(r.subtotal||0) })) : [];
            setPedidoItems(items);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo quitar', text: e?.message || 'Error' });
        }
    };
    const guardarPedido = () => { /* ya se guarda en el backend por item */ Swal.fire({ icon: 'success', title: 'Actualizado', timer: 700, showConfirmButton: false }); };

    // Pagos se registran vía backend; no se usa almacenamiento local

    const registrarPago = async () => {
        if (!pedidoModal.mesa) return;
        const mesa = pedidoModal.mesa;
        if (!pedidoActual?.id) return Swal.fire({ icon: 'error', title: 'No hay pedido abierto' });
        const pid = pedidoActual.id;

        const result = await Swal.fire({
            title: `Registrar pago - Mesa ${mesa.numero}`,
            input: 'number',
            inputLabel: 'Monto recibido (COP)',
            inputPlaceholder: 'Monto en COP',
            inputAttributes: { min: 1, step: 'any' },
            showCancelButton: true,
            confirmButtonText: 'Registrar',
        });
        if (!result.isConfirmed) return;
        const monto = Math.round(Number(result.value));
        if (!monto || monto <= 0) return Swal.fire({ icon: 'error', title: 'Monto inválido' });

        // Propina opcional
        const tipRes = await Swal.fire({
            title: 'Propina (opcional)',
            input: 'number',
            inputLabel: 'Ingresa la propina (COP)',
            inputPlaceholder: '0',
            inputValue: 0,
            inputAttributes: { min: 0, step: 'any' },
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Sin propina',
        });
        const propina = tipRes.isDismissed ? 0 : Math.max(0, Math.round(Number(tipRes.value || 0)));
        const subtotalCalc = pedidoItems.reduce((s,it)=> s + (it.subtotal ?? it.cantidad*it.precio), 0);
        const totalRequerido = subtotalCalc + propina;
        if (monto < totalRequerido) {
            return Swal.fire({ icon: 'warning', title: 'Monto insuficiente', html: `Total a pagar: <strong>$${totalRequerido.toLocaleString('es-CO')}</strong><br/>Recibido: $${monto.toLocaleString('es-CO')}`, confirmButtonText: 'Entendido' });
        }

        try {
            await api.pagarPedido(pid, { recibido: monto, propina, mesero_id: null });
            // Preparar factura con los items actuales
            const items = [...pedidoItems];
            const subtotal = subtotalCalc;
            const total = subtotal + propina;
            const cambio = Math.max(0, monto - total);
            const waiterName = (pedidoActual && pedidoActual.mesero_nombre) || (pedidoModal.mesa && pedidoModal.mesa.meseroNombre) || '';
            setFactura({
                visible: true,
                data: {
                    restaurante: getRestaurantName(),
                    pedidoId: pid,
                    mesaNumero: mesa.numero,
                    meseroNombre: waiterName,
                    fecha: new Date(),
                    items,
                    subtotal,
                    propina,
                    total,
                    recibido: monto,
                    cambio,
                }
            });
            // Refrescar mesas (la mesa pasa a limpieza)
            try {
                const data = await api.getMesas();
                const normalized = (Array.isArray(data) ? data : []).map(m => ({ id: m.id, numero: m.numero, capacidad: m.capacidad ?? 2, estado: m.estado || 'libre', meseroId: m.mesero_id ?? null, meseroNombre: m.mesero_nombre || ''})).sort((a,b)=>a.numero-b.numero);
                setMesas(normalized);
            } catch {}
            // Mantener abierto hasta cerrar factura
        } catch (e) {
            Swal.fire({ icon:'error', title:'No se pudo registrar el pago', text: e?.message || 'Error' });
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
    const limpieza = mesas.filter(m => m.estado === 'limpieza').length;

    return (
        <div className="mesas-page">
            <div className="mesas-header">
                <div>
                    <h1>Mesas (Mesero)</h1>
                    <p className="muted">Visualiza y gestiona tus mesas asignadas.</p>
                </div>
                <div className="header-actions">
                                        <button className="btn ghost" onClick={async ()=>{
                                                try {
                                                    const data = await api.getMesas();
                                                    const normalized = (Array.isArray(data) ? data : []).map(m => ({ id: m.id, numero: m.numero, capacidad: m.capacidad ?? 2, estado: m.estado || 'libre', meseroId: m.mesero_id ?? null, meseroNombre: m.mesero_nombre || ''})).sort((a,b)=>a.numero-b.numero);
                                                    setMesas(normalized);
                                                } catch {}
                                            }} title="Refrescar desde servidor"><HiArrowPath /> Refrescar</button>
                </div>
            </div>

            <div className="mesas-metrics">
                <div className="metric-card">
                    <div className="metric-icon"><HiSquares2X2 /></div>
                    <div className="metric-info">
                        <div className="metric-duo"><span className="big">{libres}</span><span className="den">/ {total}</span></div>
                        <div className="metric-label">Libres</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiCheckCircle /></div>
                    <div className="metric-info">
                        <div className="metric-value">{ocupadas}</div>
                        <div className="metric-label">Ocupadas</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiUsers /></div>
                    <div className="metric-info">
                        <div className="metric-value">{limpieza}</div>
                        <div className="metric-label">Limpieza</div>
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
                {mesasFiltradas.map(m => {
                    const esMiMesa = m.meseroId === miId;
                    const puedeAsignar = m.estado === 'libre';
                    const puedeLiberar = m.estado === 'ocupada' && esMiMesa;
                    const puedeLimpieza = (m.estado === 'libre') || (m.estado === 'ocupada' && esMiMesa);
                    // Permitir finalizar limpieza a cualquier mesero, ya que en este estado no siempre hay asignación
                    const puedeTerminarLimpieza = (m.estado === 'limpieza');
                    return (
                    <div key={m.id} className={`mesa-card ${ESTADOS[m.estado]?.color || ''}`} onClick={() => abrirPedido(m)}>
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
                        </div>
                        <div className="mesa-actions" onClick={(e) => e.stopPropagation()}>
                            {puedeAsignar && (
                                <button className="btn primary" onClick={() => handleAsignar(m)}>Asignar</button>
                            )}
                            {puedeLiberar && (
                                <button className="btn ghost" onClick={() => handleLiberar(m)}>Liberar</button>
                            )}
                            {puedeLimpieza && (
                                <button className="btn" onClick={() => handleLimpieza(m)}>Limpieza</button>
                            )}
                            {puedeTerminarLimpieza && (
                                <button className="btn" onClick={() => handleLimpiezaDone(m)}>Finalizar limpieza</button>
                            )}
                            {esMiMesa && m.estado === 'ocupada' && (
                                <button className="btn" onClick={() => abrirPedido(m)}>Pedido</button>
                            )}
                        </div>
                    </div>
                );})}
                {mesasFiltradas.length === 0 && (
                    <div className="empty">
                        <p>No hay mesas disponibles.</p>
                    </div>
                )}
            </div>

            {modalMesa && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>
                                {modalAccion === 'asignar' && 'Asignar mesa'}
                                {modalAccion === 'liberar' && 'Liberar mesa'}
                                {modalAccion === 'limpieza' && 'Marcar limpieza'}
                                {modalAccion === 'limpieza-done' && 'Finalizar limpieza'}
                            </h3>
                            <button className="close-btn" onClick={() => { setModalMesa(null); setModalAccion(''); }} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            <p>Mesa {modalMesa.numero} - Capacidad {modalMesa.capacidad}</p>
                            {modalAccion === 'asignar' && <p>¿Quieres asignarte esta mesa?</p>}
                            {modalAccion === 'liberar' && <p>¿Seguro que quieres liberar esta mesa?</p>}
                            {modalAccion === 'limpieza' && <p>¿Marcar esta mesa como limpieza?</p>}
                            {modalAccion === 'limpieza-done' && <p>¿Marcar la limpieza como terminada y dejar la mesa libre?</p>}
                        </div>
                        <div className="modal-footer">
                            <button className="btn ghost" onClick={() => { setModalMesa(null); setModalAccion(''); }}>Cancelar</button>
                            <button className="btn primary" onClick={confirmarAccion}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {pedidoModal.mesa && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card lg">
                        <div className="modal-header">
                            <h3>Pedido Mesa {pedidoModal.mesa.numero}</h3>
                            <button className="close-btn" onClick={cerrarPedido} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            {!pedidoModal.editable && (
                                <p className="muted" style={{marginTop:0}}>Solo lectura: esta mesa no está asignada a ti.</p>
                            )}
                            <div className="modal-grid">
                                <label>
                                    <span>Producto</span>
                                    <select value={productoSel} onChange={e=>setProductoSel(e.target.value)} disabled={!pedidoModal.editable}>
                                        <option value="">Selecciona un producto</option>
                                        {productos.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre} · ${Number(p.precio||0).toLocaleString('es-CO')}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    <span>Cantidad</span>
                                    <div className="qty-input">
                                        <button
                                            type="button"
                                            className="qty-btn"
                                            onClick={() => setNuevoItem(prev => ({
                                                ...prev,
                                                cantidad: Math.max(1, Number(prev.cantidad || 1) - 1),
                                            }))}
                                            disabled={!pedidoModal.editable}
                                        >
                                            −
                                        </button>
                                        <input
                                            className="qty-field"
                                            type="number"
                                            min="1"
                                            value={nuevoItem.cantidad}
                                            onChange={e => setNuevoItem(prev => ({
                                                ...prev,
                                                cantidad: Math.max(1, Number(e.target.value || 1)),
                                            }))}
                                            disabled={!pedidoModal.editable}
                                        />
                                        <button
                                            type="button"
                                            className="qty-btn"
                                            onClick={() => setNuevoItem(prev => ({
                                                ...prev,
                                                cantidad: Number(prev.cantidad || 1) + 1,
                                            }))}
                                            disabled={!pedidoModal.editable}
                                        >
                                            +
                                        </button>
                                    </div>
                                </label>
                                <div style={{alignSelf:'end'}}>
                                    <button className="btn" onClick={agregarItem} disabled={!pedidoModal.editable}>Agregar</button>
                                </div>
                            </div>
                            <div className="consumos-wrap" style={{marginTop:'1rem'}}>
                                <table className="table-consumos">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cant.</th>
                                            <th>Precio</th>
                                            <th>Subtotal</th>
                                            {pedidoModal.editable && <th></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidoItems.map((it, idx) => (
                                            <tr key={idx}>
                                                <td>{it.nombre}</td>
                                                <td className="td-right">{it.cantidad}</td>
                                                <td className="td-right">${it.precio.toLocaleString('es-CO')}</td>
                                                <td className="td-right">${(it.cantidad*it.precio).toLocaleString('es-CO')}</td>
                                                {pedidoModal.editable && (
                                                    <td className="td-right"><button className="btn ghost" onClick={() => quitarItem(idx)}>Quitar</button></td>
                                                )}
                                            </tr>
                                        ))}
                                        {pedidoItems.length === 0 && (
                                            <tr>
                                                <td colSpan={pedidoModal.editable ? 5 : 4}><div className="empty" style={{margin:0}}>Sin productos.</div></td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="td-right"><strong>Total</strong></td>
                                            <td className="td-right" colSpan={pedidoModal.editable ? 2 : 1}><strong>${pedidoItems.reduce((s,it)=>s+(it.subtotal ?? it.cantidad*it.precio),0).toLocaleString('es-CO')}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={cerrarPedido}>Cerrar</button>
                            {pedidoModal.editable && <button className="btn" onClick={registrarPago}>Registrar pago</button>}
                            {pedidoModal.editable && <button className="btn primary" onClick={guardarPedido}>Guardar</button>}
                        </div>
                    </div>
                </div>
            )}

            {/* Factura modal */}
            {factura.visible && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card invoice">
                        <div className="modal-header">
                            <h3>Factura</h3>
                            <button className="close-btn" aria-label="Cerrar" onClick={()=>{
                                setFactura({ visible:false, data:null });
                                setPedidoItems([]);
                                setPedidoActual(null);
                                cerrarPedido();
                            }}>×</button>
                        </div>
                        <div className="modal-body">
                            {factura.data && (
                                <div id="invoice-content" style={{fontFamily:'ui-sans-serif, system-ui', color:'#2b2b2b'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.75rem'}}>
                                        <div>
                                            <div style={{fontSize:'1.25rem', fontWeight:700}}>{factura.data.restaurante}</div>
                                            <div style={{fontSize:'.85rem', color:'#6b7280'}}>Factura #{factura.data.pedidoId}</div>
                                            {factura.data.meseroNombre && (
                                                <div style={{fontSize:'.85rem', color:'#374151'}}>Mesero: {factura.data.meseroNombre}</div>
                                            )}
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                            <div style={{fontSize:'.9rem'}}>Mesa {factura.data.mesaNumero}</div>
                                            <div style={{fontSize:'.85rem', color:'#6b7280'}}>{new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }).format(new Date(factura.data.fecha))}</div>
                                        </div>
                                    </div>
                                    <table className="table" style={{width:'100%', borderCollapse:'collapse'}}>
                                        <thead>
                                            <tr style={{background:'#f3f4f6'}}>
                                                <th style={{textAlign:'left', padding:'.5rem'}}>Producto</th>
                                                <th style={{textAlign:'right', padding:'.5rem'}}>Cant.</th>
                                                <th style={{textAlign:'right', padding:'.5rem'}}>Precio</th>
                                                <th style={{textAlign:'right', padding:'.5rem'}}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {factura.data.items.map((it, idx)=> (
                                                <tr key={idx}>
                                                    <td style={{padding:'.5rem', borderTop:'1px solid #e5e7eb'}}>{it.nombre}</td>
                                                    <td style={{padding:'.5rem', borderTop:'1px solid #e5e7eb', textAlign:'right'}}>{it.cantidad}</td>
                                                    <td style={{padding:'.5rem', borderTop:'1px solid #e5e7eb', textAlign:'right'}}>${Number(it.precio||0).toLocaleString('es-CO')}</td>
                                                    <td style={{padding:'.5rem', borderTop:'1px solid #e5e7eb', textAlign:'right'}}>${Number(it.subtotal ?? (it.cantidad*it.precio)).toLocaleString('es-CO')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3" style={{padding:'.5rem', textAlign:'right'}}>Subtotal</td>
                                                <td style={{padding:'.5rem', textAlign:'right'}}>${Number(factura.data.subtotal).toLocaleString('es-CO')}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" style={{padding:'.5rem', textAlign:'right'}}>Propina</td>
                                                <td style={{padding:'.5rem', textAlign:'right'}}>${Number(factura.data.propina).toLocaleString('es-CO')}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" style={{padding:'.5rem', textAlign:'right'}}><strong>Total</strong></td>
                                                <td style={{padding:'.5rem', textAlign:'right'}}><strong>${Number(factura.data.total).toLocaleString('es-CO')}</strong></td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" style={{padding:'.5rem', textAlign:'right'}}>Recibido</td>
                                                <td style={{padding:'.5rem', textAlign:'right'}}>${Number(factura.data.recibido).toLocaleString('es-CO')}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" style={{padding:'.5rem', textAlign:'right'}}>Cambio</td>
                                                <td style={{padding:'.5rem', textAlign:'right'}}>${Number(factura.data.cambio).toLocaleString('es-CO')}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                    <div style={{marginTop:'.75rem', fontSize:'.85rem', color:'#6b7280'}}>Gracias por su compra.</div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={()=>{
                                const el = document.getElementById('invoice-content');
                                if (!el) return window.print();
                                const w = window.open('', 'PRINT', 'width=800,height=900');
                                if (!w) return;
                                w.document.write('<!doctype html><html><head><title>Factura</title>');
                                w.document.write('<style>body{font-family:ui-sans-serif,system-ui;margin:24px;background:#fff;color:#111;} table{width:100%;border-collapse:collapse;} th,td{font-size:12px;} th{text-align:left;background:#f3f4f6;color:#374151;} td,th{border-top:1px solid #e5e7eb;padding:6px;} tfoot td{border-top:none;} h3{margin:0 0 12px 0;}</style>');
                                w.document.write('</head><body>');
                                w.document.write(el.outerHTML);
                                w.document.write('</body></html>');
                                w.document.close();
                                w.onload = () => { w.focus(); w.print(); };
                            }}>Imprimir</button>
                            <button className="btn primary" onClick={()=>{
                                setFactura({ visible:false, data:null });
                                setPedidoItems([]);
                                setPedidoActual(null);
                                cerrarPedido();
                            }}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mesas;
