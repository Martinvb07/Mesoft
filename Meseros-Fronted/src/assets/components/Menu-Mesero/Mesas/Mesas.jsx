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
import { getCombosFromStorage } from '../../Menu-Admin/Combos/Combos';

const ESTADOS = {
    libre: { key: 'libre', label: 'Libre', color: 'free' },
    ocupada: { key: 'ocupada', label: 'Ocupada', color: 'occ' },
    reservada: { key: 'reservada', label: 'Reservada', color: 'res' },
    limpieza: { key: 'limpieza', label: 'Limpieza', color: 'clean' },
};

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia', 'Mixto'];

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
    // Nota/modificador por item al agregar
    const [notaItem, setNotaItem] = useState('');
    const [resumenPago, setResumenPago] = useState(null);
    const [factura, setFactura] = useState({ visible: false, data: null, wompi_link: null, bold_link: null });

    // Pago modal state
    const [pagoModal, setPagoModal] = useState({ visible: false });
    const [pagoForm, setPagoForm] = useState({
        monto: '',
        propina: '0',
        metodoPago: 'Efectivo',
        descuentoTipo: 'pct',   // 'pct' | 'fijo'
        descuentoValor: '0',
        dividirPersonas: 1,
    });

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

    const [pedidoTab, setPedidoTab] = useState('productos'); // 'productos' | 'combos'
    const [combos, setCombos] = useState([]);
    const [pedidoActual, setPedidoActual] = useState(null); // { id }
    const abrirPedido = async (mesa) => {
        if (!mesa) return;
        try {
            const pedido = await api.getPedidoAbiertoDeMesa(mesa.id);
            setPedidoActual(pedido);
            let items = [];
            if (pedido?.id) {
                const rows = await api.getPedidoItems(pedido.id);
                items = Array.isArray(rows) ? rows.map(r => ({
                    id: r.id,
                    nombre: r.nombre,
                    cantidad: Number(r.cantidad||0),
                    precio: Number(r.precio||0),
                    subtotal: Number(r.subtotal||0),
                    nota: r.nota || '',
                })) : [];
            }
            setPedidoItems(items);
            const editable = mesa.estado === 'ocupada';
            setPedidoModal({ mesa, editable });
            setPedidoTab('productos');
            setCombos(getCombosFromStorage());
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo abrir el pedido', text: e?.message || 'Error' });
        }
    };
    const cerrarPedido = () => {
        setPedidoModal({ mesa: null, editable: false });
        setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
        setNotaItem('');
    };
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
            const body = { producto_id, cantidad };
            if (notaItem.trim()) body.nota = notaItem.trim();
            const resp = await api.addPedidoItem(pid, body);
            const rows = await api.getPedidoItems(pid);
            const items = Array.isArray(rows) ? rows.map(r => ({
                id: r.id,
                nombre: r.nombre,
                cantidad: Number(r.cantidad||0),
                precio: Number(r.precio||0),
                subtotal: Number(r.subtotal||0),
                nota: r.nota || '',
            })) : [];
            setPedidoItems(items);
            setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
            setProductoSel('');
            setNotaItem('');
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
            const items = Array.isArray(rows) ? rows.map(r => ({
                id: r.id,
                nombre: r.nombre,
                cantidad: Number(r.cantidad||0),
                precio: Number(r.precio||0),
                subtotal: Number(r.subtotal||0),
                nota: r.nota || '',
            })) : [];
            setPedidoItems(items);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'No se pudo quitar', text: e?.message || 'Error' });
        }
    };
    const guardarPedido = () => { Swal.fire({ icon: 'success', title: 'Actualizado', timer: 700, showConfirmButton: false }); };

    // Calcular descuento
    const calcDescuento = (subtotal, tipo, valor) => {
        const v = Math.max(0, Number(valor) || 0);
        if (tipo === 'pct') return Math.round(subtotal * (Math.min(v, 100) / 100));
        return Math.min(v, subtotal);
    };

    const abrirPagoModal = () => {
        const subtotal = pedidoItems.reduce((s,it) => s + (it.subtotal ?? it.cantidad*it.precio), 0);
        setPagoForm({
            monto: String(subtotal),
            propina: '0',
            metodoPago: 'Efectivo',
            descuentoTipo: 'pct',
            descuentoValor: '0',
            dividirPersonas: 1,
        });
        setPagoModal({ visible: true });
    };

    const registrarPago = async () => {
        if (!pedidoModal.mesa) return;
        const mesa = pedidoModal.mesa;
        if (!pedidoActual?.id) return Swal.fire({ icon: 'error', title: 'No hay pedido abierto' });
        const pid = pedidoActual.id;

        const monto = Math.round(Number(pagoForm.monto));
        const propina = Math.max(0, Math.round(Number(pagoForm.propina || 0)));
        const descuento = calcDescuento(
            pedidoItems.reduce((s,it) => s + (it.subtotal ?? it.cantidad*it.precio), 0),
            pagoForm.descuentoTipo,
            pagoForm.descuentoValor
        );
        const subtotalCalc = pedidoItems.reduce((s,it) => s + (it.subtotal ?? it.cantidad*it.precio), 0);
        const totalRequerido = subtotalCalc - descuento + propina;

        if (!monto || monto <= 0) return Swal.fire({ icon: 'error', title: 'Monto inválido' });
        if (monto < totalRequerido) {
            return Swal.fire({
                icon: 'warning',
                title: 'Monto insuficiente',
                html: `Total a pagar: <strong>$${totalRequerido.toLocaleString('es-CO')}</strong><br/>Recibido: $${monto.toLocaleString('es-CO')}`,
                confirmButtonText: 'Entendido',
            });
        }

        try {
            const pagoResp = await api.pagarPedido(pid, {
                recibido: monto,
                propina,
                mesero_id: null,
                descuento,
                metodo_pago: pagoForm.metodoPago,
            });
            const items = [...pedidoItems];
            const subtotal = subtotalCalc;
            const total = subtotal - descuento + propina;
            const cambio = Math.max(0, monto - total);
            const waiterName = (pedidoActual && pedidoActual.mesero_nombre) || (pedidoModal.mesa && pedidoModal.mesa.meseroNombre) || '';
            setPagoModal({ visible: false });
            setFactura({
                visible: true,
                wompi_link: pagoResp?.wompi_link || null,
                bold_link: pagoResp?.bold_link || null,
                data: {
                    restaurante: getRestaurantName(),
                    pedidoId: pid,
                    mesaNumero: mesa.numero,
                    meseroNombre: waiterName,
                    fecha: new Date(),
                    items,
                    subtotal,
                    descuento,
                    propina,
                    total,
                    recibido: monto,
                    cambio,
                    metodoPago: pagoForm.metodoPago,
                }
            });
            try {
                const data = await api.getMesas();
                const normalized = (Array.isArray(data) ? data : []).map(m => ({
                    id: m.id, numero: m.numero, capacidad: m.capacidad ?? 2,
                    estado: m.estado || 'libre', meseroId: m.mesero_id ?? null, meseroNombre: m.mesero_nombre || '',
                })).sort((a,b)=>a.numero-b.numero);
                setMesas(normalized);
            } catch {}
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

    // Derived pago calculations for display
    const pagoSubtotal = pedidoItems.reduce((s,it) => s + (it.subtotal ?? it.cantidad*it.precio), 0);
    const pagoDescuento = calcDescuento(pagoSubtotal, pagoForm.descuentoTipo, pagoForm.descuentoValor);
    const pagoPropina = Math.max(0, Number(pagoForm.propina || 0));
    const pagoTotal = pagoSubtotal - pagoDescuento + pagoPropina;
    const pagoPorPersona = pagoForm.dividirPersonas > 1 ? Math.ceil(pagoTotal / pagoForm.dividirPersonas) : null;

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
                            const normalized = (Array.isArray(data) ? data : []).map(m => ({
                                id: m.id, numero: m.numero, capacidad: m.capacidad ?? 2,
                                estado: m.estado || 'libre', meseroId: m.mesero_id ?? null, meseroNombre: m.mesero_nombre || '',
                            })).sort((a,b)=>a.numero-b.numero);
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

            {/* Modal acción de mesa */}
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

            {/* Modal pedido */}
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
                            {/* Tab selector: Productos | Combos */}
                            <div style={{display:'flex', gap:'.25rem', borderBottom:'2px solid #e5e7eb', marginBottom:'.75rem'}}>
                                <button
                                    className={`btn${pedidoTab === 'productos' ? ' primary' : ' ghost'}`}
                                    style={{borderRadius:'6px 6px 0 0', padding:'.3rem .85rem', fontSize:'.875rem'}}
                                    onClick={() => setPedidoTab('productos')}
                                >
                                    Productos
                                </button>
                                <button
                                    className={`btn${pedidoTab === 'combos' ? ' primary' : ' ghost'}`}
                                    style={{borderRadius:'6px 6px 0 0', padding:'.3rem .85rem', fontSize:'.875rem'}}
                                    onClick={() => { setPedidoTab('combos'); setCombos(getCombosFromStorage()); }}
                                >
                                    Combos ({combos.length})
                                </button>
                            </div>

                            {/* Combos tab */}
                            {pedidoTab === 'combos' && (
                                <div style={{marginBottom:'1rem'}}>
                                    {combos.length === 0 ? (
                                        <div className="empty" style={{margin:0}}>No hay combos creados. Ve a Admin → Combos.</div>
                                    ) : (
                                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'.5rem'}}>
                                            {combos.map(combo => (
                                                <div key={combo.id} style={{
                                                    background:'#fff7f3', border:'1px solid #fed7aa', borderRadius:10, padding:'.75rem',
                                                    display:'flex', flexDirection:'column', gap:'.35rem',
                                                }}>
                                                    <div style={{fontWeight:800, fontSize:'.95rem', color:'#1f2937'}}>{combo.nombre}</div>
                                                    {combo.descripcion && <div style={{fontSize:'.8rem', color:'#6b7280'}}>{combo.descripcion}</div>}
                                                    <div style={{fontWeight:800, color:'#ff6633', fontSize:'1rem'}}>
                                                        ${Number(combo.precio_combo||0).toLocaleString('es-CO')}
                                                    </div>
                                                    {pedidoModal.editable && (
                                                        <button
                                                            className="btn primary"
                                                            style={{fontSize:'.8rem', padding:'.25rem .5rem', marginTop:'.25rem'}}
                                                            onClick={async () => {
                                                                if (!pedidoActual?.id) return Swal.fire({ icon:'error', title:'No hay pedido abierto' });
                                                                // Add each product in the combo to the pedido
                                                                const prodIds = combo.productos_ids || [];
                                                                if (!prodIds.length) return;
                                                                for (const pid of prodIds) {
                                                                    try {
                                                                        await api.addPedidoItem(pedidoActual.id, { producto_id: Number(pid), cantidad: 1 });
                                                                    } catch {}
                                                                }
                                                                const rows = await api.getPedidoItems(pedidoActual.id).catch(() => []);
                                                                const items = Array.isArray(rows) ? rows.map(r => ({
                                                                    id: r.id, nombre: r.nombre, cantidad: Number(r.cantidad||0),
                                                                    precio: Number(r.precio||0), subtotal: Number(r.subtotal||0), nota: r.nota||'',
                                                                })) : [];
                                                                setPedidoItems(items);
                                                                Swal.fire({ icon:'success', title:`Combo "${combo.nombre}" agregado`, timer:800, showConfirmButton:false });
                                                            }}
                                                        >
                                                            Agregar combo
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Productos tab */}
                            {pedidoTab === 'productos' && <div>
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
                            {/* Nota / modificador para el item a agregar */}
                            {pedidoModal.editable && (
                                <div style={{marginTop:'.5rem'}}>
                                    <label style={{display:'flex', flexDirection:'column', gap:'.25rem'}}>
                                        <span style={{fontSize:'.85rem', color:'#6b7280'}}>Nota / modificador (opcional)</span>
                                        <input
                                            type="text"
                                            value={notaItem}
                                            onChange={e => setNotaItem(e.target.value)}
                                            placeholder="Ej: sin cebolla, término medio..."
                                            style={{padding:'.4rem .6rem', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'.875rem'}}
                                        />
                                    </label>
                                </div>
                            )}
                            </div>}
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
                                                <td>
                                                    <div>{it.nombre}</div>
                                                    {it.nota && (
                                                        <div style={{fontSize:'.8rem', fontStyle:'italic', color:'#6b7280', marginTop:'.1rem'}}>
                                                            {it.nota}
                                                        </div>
                                                    )}
                                                </td>
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
                                            <td className="td-right" colSpan={pedidoModal.editable ? 2 : 1}>
                                                <strong>${pedidoItems.reduce((s,it)=>s+(it.subtotal ?? it.cantidad*it.precio),0).toLocaleString('es-CO')}</strong>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={cerrarPedido}>Cerrar</button>
                            {pedidoModal.editable && <button className="btn" onClick={abrirPagoModal}>Registrar pago</button>}
                            {pedidoModal.editable && <button className="btn primary" onClick={guardarPedido}>Guardar</button>}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de pago (métodos, descuento, dividir) */}
            {pagoModal.visible && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card" style={{maxWidth:480}}>
                        <div className="modal-header">
                            <h3>Registrar pago — Mesa {pedidoModal.mesa?.numero}</h3>
                            <button className="close-btn" onClick={() => setPagoModal({ visible: false })} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body" style={{display:'flex', flexDirection:'column', gap:'.85rem'}}>
                            {/* Método de pago */}
                            <div>
                                <div style={{fontSize:'.85rem', fontWeight:600, marginBottom:'.35rem'}}>Método de pago</div>
                                <div style={{display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
                                    {METODOS_PAGO.map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            className={`btn${pagoForm.metodoPago === m ? ' primary' : ' ghost'}`}
                                            style={{padding:'.35rem .8rem', fontSize:'.875rem'}}
                                            onClick={() => setPagoForm(f => ({ ...f, metodoPago: m }))}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Descuento */}
                            <div>
                                <div style={{fontSize:'.85rem', fontWeight:600, marginBottom:'.35rem'}}>Descuento</div>
                                <div style={{display:'flex', gap:'.5rem', alignItems:'center'}}>
                                    <select
                                        value={pagoForm.descuentoTipo}
                                        onChange={e => setPagoForm(f => ({ ...f, descuentoTipo: e.target.value }))}
                                        style={{padding:'.35rem .5rem', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'.875rem'}}
                                    >
                                        <option value="pct">Porcentaje (%)</option>
                                        <option value="fijo">Monto fijo ($)</option>
                                    </select>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pagoForm.descuentoValor}
                                        onChange={e => setPagoForm(f => ({ ...f, descuentoValor: e.target.value }))}
                                        style={{padding:'.35rem .6rem', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'.875rem', width:'90px'}}
                                    />
                                    {pagoDescuento > 0 && (
                                        <span style={{fontSize:'.85rem', color:'#16a34a'}}>
                                            − ${pagoDescuento.toLocaleString('es-CO')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Propina */}
                            <label style={{display:'flex', flexDirection:'column', gap:'.25rem'}}>
                                <span style={{fontSize:'.85rem', fontWeight:600}}>Propina (COP)</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={pagoForm.propina}
                                    onChange={e => setPagoForm(f => ({ ...f, propina: e.target.value }))}
                                    style={{padding:'.4rem .6rem', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'.875rem'}}
                                />
                            </label>

                            {/* Monto recibido */}
                            <label style={{display:'flex', flexDirection:'column', gap:'.25rem'}}>
                                <span style={{fontSize:'.85rem', fontWeight:600}}>Monto recibido (COP)</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={pagoForm.monto}
                                    onChange={e => setPagoForm(f => ({ ...f, monto: e.target.value }))}
                                    style={{padding:'.4rem .6rem', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'.875rem'}}
                                />
                            </label>

                            {/* Dividir cuenta */}
                            <div>
                                <div style={{fontSize:'.85rem', fontWeight:600, marginBottom:'.35rem'}}>Dividir entre personas</div>
                                <div style={{display:'flex', gap:'.4rem', alignItems:'center'}}>
                                    {[1,2,3,4,5,6].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            className={`btn${pagoForm.dividirPersonas === n ? ' primary' : ' ghost'}`}
                                            style={{padding:'.3rem .6rem', fontSize:'.875rem', minWidth:'36px'}}
                                            onClick={() => setPagoForm(f => ({ ...f, dividirPersonas: n }))}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                {pagoPorPersona !== null && (
                                    <div style={{marginTop:'.35rem', fontSize:'.875rem', color:'#374151'}}>
                                        Cada persona paga: <strong>${pagoPorPersona.toLocaleString('es-CO')}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Resumen */}
                            <div style={{background:'#f9fafb', borderRadius:'8px', padding:'.75rem', fontSize:'.875rem', display:'flex', flexDirection:'column', gap:'.25rem'}}>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                    <span>Subtotal</span><span>${pagoSubtotal.toLocaleString('es-CO')}</span>
                                </div>
                                {pagoDescuento > 0 && (
                                    <div style={{display:'flex', justifyContent:'space-between', color:'#16a34a'}}>
                                        <span>Descuento</span><span>− ${pagoDescuento.toLocaleString('es-CO')}</span>
                                    </div>
                                )}
                                {pagoPropina > 0 && (
                                    <div style={{display:'flex', justifyContent:'space-between'}}>
                                        <span>Propina</span><span>${pagoPropina.toLocaleString('es-CO')}</span>
                                    </div>
                                )}
                                <div style={{display:'flex', justifyContent:'space-between', fontWeight:700, borderTop:'1px solid #e5e7eb', paddingTop:'.25rem'}}>
                                    <span>Total</span><span>${pagoTotal.toLocaleString('es-CO')}</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', color:'#6b7280'}}>
                                    <span>Método</span><span>{pagoForm.metodoPago}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn ghost" onClick={() => setPagoModal({ visible: false })}>Cancelar</button>
                            <button className="btn primary" onClick={registrarPago}>Confirmar pago</button>
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
                                setFactura({ visible:false, data:null, wompi_link:null, bold_link:null });
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
                                            <div style={{fontSize:'.85rem', color:'#374151'}}>Método: {factura.data.metodoPago}</div>
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
                                                    <td style={{padding:'.5rem', borderTop:'1px solid #e5e7eb'}}>
                                                        <div>{it.nombre}</div>
                                                        {it.nota && (
                                                            <div style={{fontSize:'.78rem', fontStyle:'italic', color:'#6b7280'}}>{it.nota}</div>
                                                        )}
                                                    </td>
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
                                            {factura.data.descuento > 0 && (
                                                <tr>
                                                    <td colSpan="3" style={{padding:'.5rem', textAlign:'right', color:'#16a34a'}}>Descuento</td>
                                                    <td style={{padding:'.5rem', textAlign:'right', color:'#16a34a'}}>− ${Number(factura.data.descuento).toLocaleString('es-CO')}</td>
                                                </tr>
                                            )}
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
                            {factura.wompi_link && (
                                <a
                                    href={factura.wompi_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn"
                                    style={{ background: '#00c8a0', color: '#fff', textDecoration: 'none' }}
                                >
                                    Pagar con Wompi
                                </a>
                            )}
                            {factura.bold_link && (
                                <a
                                    href={factura.bold_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn"
                                    style={{ background: '#1a1a2e', color: '#fff', textDecoration: 'none' }}
                                >
                                    Pagar con Bold
                                </a>
                            )}
                            <button className="btn primary" onClick={()=>{
                                setFactura({ visible:false, data:null, wompi_link:null, bold_link:null });
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
