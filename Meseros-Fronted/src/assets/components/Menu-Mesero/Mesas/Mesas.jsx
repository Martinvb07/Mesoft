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

function crearMesasBase(total = 24) {
    const base = [];
    for (let i = 1; i <= total; i++) {
        base.push({
            id: i,
            numero: i,
            capacidad: i % 6 === 0 ? 6 : i % 4 === 0 ? 4 : 2,
            estado: 'libre',
            meseroId: null,
            meseroNombre: '',
            updatedAt: Date.now(),
        });
    }
    return base;
}

const Mesas = () => {
    const [mesas, setMesas] = useState(() => {
        try {
            const stored = localStorage.getItem('mesas');
            if (stored) return JSON.parse(stored);
        } catch {}
        return crearMesasBase(24);
    });
    const [miNombre, setMiNombre] = useState(() => {
        try {
            const raw = localStorage.getItem('currentUser') || localStorage.getItem('auth:user');
            if (raw) {
                const u = JSON.parse(raw);
                const name = u.nombre || u.name || u.fullName || u.username || 'Mesero';
                return name;
            }
        } catch {}
        return 'Mesero';
    });
    const [miId, setMiId] = useState(() => {
        try {
            const raw = localStorage.getItem('currentUser') || localStorage.getItem('auth:user');
            if (raw) {
                const u = JSON.parse(raw);
                return u.id || u.userId || u.uid || 'mesero1';
            }
        } catch {}
        return 'mesero1';
    });
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

    useEffect(() => {
        localStorage.setItem('mesas', JSON.stringify(mesas));
    }, [mesas]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'mesas') {
                try {
                    const next = JSON.parse(e.newValue);
                    if (Array.isArray(next)) setMesas(next);
                } catch {}
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleAsignar = (mesa) => { setModalMesa(mesa); setModalAccion('asignar'); };
    const handleLiberar = (mesa) => { setModalMesa(mesa); setModalAccion('liberar'); };
    const handleLimpieza = (mesa) => { setModalMesa(mesa); setModalAccion('limpieza'); };
    const handleLimpiezaDone = (mesa) => { setModalMesa(mesa); setModalAccion('limpieza-done'); };

    const confirmarAccion = () => {
        if (!modalMesa) return;
        try {
            const raw = localStorage.getItem('mesas');
            const shared = raw ? JSON.parse(raw) : [];
            const current = shared.find(x => x.id === modalMesa.id) || modalMesa;
            if (modalAccion === 'asignar') {
                if (current.estado !== 'libre') {
                    Swal.fire({ icon: 'info', title: 'Mesa no disponible', text: 'Otro mesero ya tomó esta mesa.' });
                    setModalMesa(null); setModalAccion('');
                    setMesas(shared);
                    return;
                }
                const updated = shared.map(m => m.id === current.id ? { ...m, estado: 'ocupada', meseroId: miId, meseroNombre: miNombre, updatedAt: Date.now() } : m);
                localStorage.setItem('mesas', JSON.stringify(updated));
                setMesas(updated);
            } else if (modalAccion === 'liberar') {
                if (current.meseroId !== miId) {
                    Swal.fire({ icon: 'warning', title: 'No puedes liberar esta mesa', text: 'Solo el mesero asignado puede liberarla.' });
                    setModalMesa(null); setModalAccion('');
                    setMesas(shared);
                    return;
                }
                const updated = shared.map(m => m.id === current.id ? { ...m, estado: 'libre', meseroId: null, meseroNombre: '', updatedAt: Date.now() } : m);
                localStorage.setItem('mesas', JSON.stringify(updated));
                setMesas(updated);
            } else if (modalAccion === 'limpieza') {
                if (current.estado === 'ocupada' && current.meseroId !== miId) {
                    Swal.fire({ icon: 'warning', title: 'No puedes cambiar estado', text: 'Esta mesa está ocupada por otro mesero.' });
                    setModalMesa(null); setModalAccion('');
                    setMesas(shared);
                    return;
                }
                const updated = shared.map(m => m.id === current.id ? { ...m, estado: 'limpieza', meseroId: miId, meseroNombre: miNombre, updatedAt: Date.now() } : m);
                localStorage.setItem('mesas', JSON.stringify(updated));
                setMesas(updated);
            } else if (modalAccion === 'limpieza-done') {
                if (current.estado !== 'limpieza' || current.meseroId !== miId) {
                    Swal.fire({ icon: 'warning', title: 'Acción no permitida', text: 'Solo el mesero que puso la mesa en limpieza puede finalizarla.' });
                    setModalMesa(null); setModalAccion('');
                    setMesas(shared);
                    return;
                }
                const updated = shared.map(m => m.id === current.id ? { ...m, estado: 'libre', meseroId: null, meseroNombre: '', updatedAt: Date.now() } : m);
                localStorage.setItem('mesas', JSON.stringify(updated));
                setMesas(updated);
            }
        } catch {}
        setModalMesa(null);
        setModalAccion('');
    };
    const cancelarAccion = () => { setModalMesa(null); setModalAccion(''); };

    const abrirPedido = (mesa) => {
        if (!mesa) return;
        const keys = [
            `pedidos:mesa:${mesa.id}`,
            `pedidos:mesa:${mesa.numero}`,
            `mesa:${mesa.id}:pedidos`,
            `mesa:${mesa.numero}:pedidos`,
        ];
        let items = [];
        for (const k of keys) {
            try {
                const raw = localStorage.getItem(k);
                if (!raw) continue;
                const data = JSON.parse(raw);
                if (Array.isArray(data)) { items = data; break; }
                if (Array.isArray(data?.items)) { items = data.items; break; }
                if (Array.isArray(data?.pedidos)) { items = data.pedidos; break; }
                if (Array.isArray(data?.ordenes)) { items = data.ordenes; break; }
            } catch {}
        }
        setPedidoItems(items.map(it => ({
            nombre: it.nombre || it.producto || it.name || 'Producto',
            cantidad: Number(it.cantidad ?? it.qty ?? it.quantity ?? 1) || 1,
            precio: Number(it.precio ?? it.price ?? it.unitPrice ?? 0) || 0,
        })));
        const editable = mesa.meseroId === miId && mesa.estado === 'ocupada';
        setPedidoModal({ mesa, editable });
    };
    const cerrarPedido = () => { setPedidoModal({ mesa: null, editable: false }); setNuevoItem({ nombre: '', cantidad: 1, precio: 0 }); };
    const agregarItem = () => {
        if (!pedidoModal.editable) return;
        const nombre = (nuevoItem.nombre || '').trim();
        const cantidad = Number(nuevoItem.cantidad || 1);
        const precio = Number(nuevoItem.precio || 0);
        if (!nombre) return Swal.fire({ icon: 'error', title: 'Ingresa el nombre del producto' });
        if (cantidad <= 0) return Swal.fire({ icon: 'error', title: 'Cantidad inválida' });
        if (precio < 0) return Swal.fire({ icon: 'error', title: 'Precio inválido' });
        setPedidoItems(prev => [...prev, { nombre, cantidad, precio }]);
        setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
    };
    const quitarItem = (idx) => { if (!pedidoModal.editable) return; setPedidoItems(prev => prev.filter((_, i) => i !== idx)); };
    const guardarPedido = () => {
        if (!pedidoModal.mesa) return;
        const key = `pedidos:mesa:${pedidoModal.mesa.id}`;
        localStorage.setItem(key, JSON.stringify(pedidoItems));
        Swal.fire({ icon: 'success', title: 'Pedido guardado', timer: 900, showConfirmButton: false });
    };

    const leerPagosMesa = (mesaId) => {
        try {
            const raw = localStorage.getItem(`pagos:mesa:${mesaId}`);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch { return []; }
    };

    const registrarPago = async () => {
        if (!pedidoModal.mesa) return;
        const mesa = pedidoModal.mesa;
        const total = pedidoItems.reduce((s,it)=> s + (Number(it.cantidad||0)*Number(it.precio||0)), 0);
        const pagos = leerPagosMesa(mesa.id);
        const abonado = pagos.reduce((s,p)=> s + Number(p.monto||0), 0);
        const pendiente = Math.max(0, total - abonado);
        if (pendiente <= 0) {
            return Swal.fire({ icon:'info', title:'Sin saldo pendiente', text:'Esta mesa ya está saldada.' });
        }

        const result = await Swal.fire({
            title: `Registrar pago - Mesa ${mesa.numero}`,
            input: 'number',
            inputLabel: `Pendiente: $${pendiente.toLocaleString('es-CO')} · Puedes ingresar más para propina o cambio`,
            inputPlaceholder: 'Monto en COP',
            inputAttributes: { min: 1, step: 'any' },
            showCancelButton: true,
            confirmButtonText: 'Registrar',
            preConfirm: (value) => {
                const n = Math.round(Number(value));
                if (isNaN(n) || n <= 0) return Swal.showValidationMessage('Ingresa un monto válido');
                return n;
            }
        });

        if (!result.isConfirmed) return;
        const monto = Math.round(Number(result.value));

        let montoAplicado = Math.min(monto, pendiente);
        let excedente = Math.max(0, monto - pendiente);

        if (excedente > 0) {
            // Propina independiente del excedente (puede ser menor o igual al excedente)
            const tipRes = await Swal.fire({
                title: 'Propina (opcional)',
                input: 'number',
                inputLabel: `Pendiente: $${pendiente.toLocaleString('es-CO')} · Recibido: $${monto.toLocaleString('es-CO')} · Excedente: $${excedente.toLocaleString('es-CO')}`,
                inputPlaceholder: `0 - $${excedente.toLocaleString('es-CO')}`,
                inputValue: 0,
                inputAttributes: { min: 0, max: excedente, step: 'any' },
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Sin propina',
                preConfirm: (v) => {
                    const n = Math.round(Number(v));
                    if (isNaN(n) || n < 0) return Swal.showValidationMessage('Ingresa un monto válido');
                    if (n > excedente) return Swal.showValidationMessage('La propina no puede exceder el excedente');
                    return n;
                }
            });

            const propina = tipRes.isDismissed ? 0 : Math.round(Number(tipRes.value || 0));
            const cambio = Math.max(0, excedente - propina);

            // Ingresos: venta por el monto aplicado; propina por el valor ingresado (si > 0)
            try {
                const rawIng = localStorage.getItem('finanzas:ingresos');
                const ingresos = rawIng ? JSON.parse(rawIng) : [];
                ingresos.push({ id: `ing-${Date.now()}`, fecha: todayKey(), monto: pendiente, tipo:'venta', fuente:'mesa', mesaId: mesa.id, mesaNumero: mesa.numero, meseroId: miId, meseroNombre: miNombre, createdAt: Date.now() });
                if (propina > 0) {
                    ingresos.push({ id: `prop-${Date.now()}`, fecha: todayKey(), monto: propina, tipo:'propina', fuente:'mesa', mesaId: mesa.id, mesaNumero: mesa.numero, meseroId: miId, meseroNombre: miNombre, createdAt: Date.now() });
                }
                localStorage.setItem('finanzas:ingresos', JSON.stringify(ingresos));
            } catch {}

            // Registrar pago aplicado a la cuenta (solo pendiente)
            try {
                const pagosArr = leerPagosMesa(mesa.id);
                pagosArr.push({ monto: pendiente, fecha: todayKey(), ts: Date.now() });
                localStorage.setItem(`pagos:mesa:${mesa.id}`, JSON.stringify(pagosArr));
            } catch {}

            // Abrir modal propio con resumen de cambio/propina y opciones
            setResumenPago({
                mesaId: mesa.id,
                mesaNumero: mesa.numero,
                total,
                abonado,
                pendiente,
                recibido: monto,
                propina,
                cambio,
                aplicado: pendiente
            });
            return;
        }

        // Caso normal: monto <= pendiente
        // Persistir en finanzas:ingresos (venta)
        try {
            const rawIng = localStorage.getItem('finanzas:ingresos');
            const ingresos = rawIng ? JSON.parse(rawIng) : [];
            ingresos.push({ id: `ing-${Date.now()}`, fecha: todayKey(), monto: montoAplicado, tipo:'venta', fuente:'mesa', mesaId: mesa.id, mesaNumero: mesa.numero, meseroId: miId, meseroNombre: miNombre, createdAt: Date.now() });
            localStorage.setItem('finanzas:ingresos', JSON.stringify(ingresos));
        } catch {}

        // Registrar pago por mesa (monto aplicado)
        try {
            const pagosArr = leerPagosMesa(mesa.id);
            pagosArr.push({ monto: montoAplicado, fecha: todayKey(), ts: Date.now() });
            localStorage.setItem(`pagos:mesa:${mesa.id}`, JSON.stringify(pagosArr));
        } catch {}

        Swal.fire({ icon:'success', title:'Pago registrado', timer: 900, showConfirmButton:false });

        const nuevoPendiente = pendiente - montoAplicado;
        if (nuevoPendiente <= 0) {
            const ok = await Swal.fire({
                icon:'question',
                title:'Cuenta saldada',
                text:'¿Liberar la mesa y pasar a limpieza? Se vaciará el pedido.',
                showCancelButton:true,
                confirmButtonText:'Sí, liberar',
                cancelButtonText:'No, luego'
            });
            if (ok.isConfirmed) {
                try {
                    // Vaciar pedido
                    localStorage.setItem(`pedidos:mesa:${mesa.id}`, JSON.stringify([]));
                    setPedidoItems([]);
                    // Actualizar mesa a limpieza
                    const raw = localStorage.getItem('mesas');
                    const shared = raw ? JSON.parse(raw) : [];
                    const current = shared.find(x => x.id === mesa.id) || mesa;
                    const updated = shared.map(m => m.id === current.id ? { ...m, estado: 'limpieza', meseroId: miId, meseroNombre: miNombre, updatedAt: Date.now() } : m);
                    localStorage.setItem('mesas', JSON.stringify(updated));
                    setMesas(updated);
                    cerrarPedido();
                } catch {}
            }
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
                    <button className="btn ghost" onClick={() => setMesas(crearMesasBase(24))} title="Resetear a estado base"><HiArrowPath /> Reset</button>
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
                    const puedeTerminarLimpieza = (m.estado === 'limpieza' && esMiMesa);
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
                                    <input value={nuevoItem.nombre} onChange={e=>setNuevoItem(prev=>({...prev, nombre: e.target.value}))} disabled={!pedidoModal.editable} />
                                </label>
                                <label>
                                    <span>Cantidad</span>
                                    <input type="number" min="1" value={nuevoItem.cantidad} onChange={e=>setNuevoItem(prev=>({...prev, cantidad: Number(e.target.value||1)}))} disabled={!pedidoModal.editable} />
                                </label>
                                <label>
                                    <span>Precio</span>
                                    <input type="number" min="0" value={nuevoItem.precio} onChange={e=>setNuevoItem(prev=>({...prev, precio: Number(e.target.value||0)}))} disabled={!pedidoModal.editable} />
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
                                            <td className="td-right" colSpan={pedidoModal.editable ? 2 : 1}><strong>${pedidoItems.reduce((s,it)=>s+it.cantidad*it.precio,0).toLocaleString('es-CO')}</strong></td>
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

            {resumenPago && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Resumen de pago · Mesa {resumenPago.mesaNumero}</h3>
                            <button className="close-btn" onClick={() => setResumenPago(null)} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem'}}>
                                <div><strong>Total:</strong><br/>${resumenPago.total.toLocaleString('es-CO')}</div>
                                <div><strong>Abonado antes:</strong><br/>${resumenPago.abonado.toLocaleString('es-CO')}</div>
                                <div><strong>Aplicado ahora:</strong><br/>${resumenPago.aplicado.toLocaleString('es-CO')}</div>
                                <div><strong>Recibido:</strong><br/>${resumenPago.recibido.toLocaleString('es-CO')}</div>
                                <div><strong>Propina:</strong><br/>${resumenPago.propina.toLocaleString('es-CO')}</div>
                                <div><strong>Cambio:</strong><br/>${resumenPago.cambio.toLocaleString('es-CO')}</div>
                            </div>
                            <div className="empty" style={{marginTop:'1rem'}}>La cuenta quedó saldada.</div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => setResumenPago(null)}>Cerrar</button>
                            <button className="btn primary" onClick={() => {
                                try {
                                    const mesaId = resumenPago.mesaId;
                                    // Vaciar pedido
                                    localStorage.setItem(`pedidos:mesa:${mesaId}`, JSON.stringify([]));
                                    setPedidoItems([]);
                                    // Actualizar mesa a limpieza
                                    const raw = localStorage.getItem('mesas');
                                    const shared = raw ? JSON.parse(raw) : [];
                                    const current = shared.find(x => x.id === mesaId);
                                    if (current) {
                                        const updated = shared.map(m => m.id === current.id ? { ...m, estado: 'limpieza', meseroId: miId, meseroNombre: miNombre, updatedAt: Date.now() } : m);
                                        localStorage.setItem('mesas', JSON.stringify(updated));
                                        setMesas(updated);
                                    }
                                    setResumenPago(null);
                                    cerrarPedido();
                                } catch {}
                            }}>Liberar y limpieza</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mesas;
